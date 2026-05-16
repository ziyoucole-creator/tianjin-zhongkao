import * as fs from 'fs'
import * as path from 'path'
import type { Database as SqlJsDatabase } from 'sql.js'

interface HistoryQuestion {
  analysis: string
  ans: number | string
  choices?: string[]
  content: string
  origin: string
  subject_id: number
  tid: number
  topic_id: number
  type: number // 0=选择, 1=填空, 2=综合
}

interface HistoryDataset {
  subjects: string[]
  topics: string[]
  test: HistoryQuestion[]
}

// Map InternLM-History subject_id to our knowledge_points
// InternLM-History uses 31 fine-grained subject IDs → mapped to 4 broad KPs
// Preserving the original topic IDs for future refinement
const HISTORY_SUBJECT_TO_KP: Record<number, number> = {
  // 中国古代史 (subject_id 1-6) → KP 6001
  1: 6001, 2: 6001, 3: 6001, 4: 6001, 5: 6001, 6: 6001,
  // 中国近代史 (subject_id 7-16) → KP 6002
  7: 6002, 8: 6002, 9: 6002, 10: 6002, 11: 6002, 12: 6002,
  13: 6002, 14: 6002, 15: 6002, 16: 6002,
  // 中国现代史 (subject_id 17-19) → KP 6003
  17: 6003, 18: 6003, 19: 6003,
  // 世界史 (subject_id 20-31) → KP 6004
  20: 6004, 21: 6004, 22: 6004, 23: 6004, 24: 6004,
  25: 6004, 26: 6004, 27: 6004, 28: 6004, 29: 6004, 30: 6004, 31: 6004,
}

function mapToKpId(subjectId: number): number {
  return HISTORY_SUBJECT_TO_KP[subjectId] || 6004
}

// Topic labels for each subject_id (preserving original granularity in source field)
const TOPIC_LABELS: Record<number, string> = {
  1: '中国远古文明', 2: '夏商周', 3: '春秋战国', 4: '秦汉', 5: '魏晋南北朝', 6: '隋唐五代',
  7: '宋辽夏金', 8: '元朝', 9: '明朝(前期)', 10: '明朝(后期)', 11: '清朝(前期)',
  12: '清朝(后期)', 13: '鸦片战争', 14: '太平天国', 15: '洋务运动与民族工业',
  16: '戊戌变法与辛亥革命',
  17: '民国初期', 18: '新民主主义革命', 19: '抗日战争与解放战争',
  20: '世界上古史', 21: '世界中古史', 22: '世界近代史(上)', 23: '世界近代史(下)',
  24: '一战与二战', 25: '冷战时期', 26: '当代世界', 27: '英国史', 28: '法国史',
  29: '美国史', 30: '日本史', 31: '国际关系',
}

function inferDifficulty(content: string, analysis: string): 'easy' | 'medium' | 'hard' {
  const text = content + analysis
  const len = text.length

  // Content length is a strong signal
  if (len > 300) return 'hard'
  if (len < 80) return 'easy'

  // Keyword-based refinement
  if (text.includes('综合') || text.includes('归纳') || text.includes('概括') || text.includes('分析') || text.includes('比较')) return 'hard'
  if (text.includes('直接') || text.includes('属于') || text.includes('标志') || text.includes('定义') || text.includes('最基本')) return 'easy'

  return 'medium'
}

function extractYear(origin: string): number {
  const match = origin.match(/(20\d{2})/)
  return match ? Number(match[1]) : 2022
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function importHistoryData(db: SqlJsDatabase): number {
  // Try to find the data file in several locations
  const possiblePaths = [
    path.join(process.resourcesPath || '', 'data', 'history_std.json'),
    path.join(__dirname, '..', '..', '..', 'data', 'history_std.json'),
    path.join(process.cwd(), 'data', 'history_std.json'),
    // Development path
    path.join(__dirname, '..', '..', '..', '..', '..', 'temp_data', 'history_std.json'),
  ]

  let rawData: string | null = null
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        rawData = fs.readFileSync(p, 'utf-8')
        break
      }
    } catch { /* continue */ }
  }

  if (!rawData) {
    console.log('[import] History data file not found, skipping history import')
    return 0
  }

  let dataset: HistoryDataset
  try {
    dataset = JSON.parse(rawData)
  } catch {
    console.log('[import] Failed to parse history data')
    return 0
  }

  // Check if history questions already imported — use subject + year for precise detection
  const countStmt = db.prepare(
    "SELECT COUNT(*) as cnt FROM questions WHERE subject_id = 6 AND year = 2022 AND source LIKE '%2022年%'"
  )
  countStmt.step()
  const existingCount = countStmt.getAsObject().cnt as number
  countStmt.free()
  if (existingCount > 500) {
    console.log(`[import] ${existingCount} History questions already imported, skipping`)
    return 0
  }

  const insertStmt = db.prepare(`
    INSERT INTO questions (subject_id, kp_id, type, difficulty, content, options, answer, analysis, year, source, exam_frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let imported = 0
  for (const q of dataset.test) {
    const kpId = mapToKpId(q.subject_id)
    let questionType: 'single_choice' | 'fill_blank'
    let options: string | null = null
    let answer: string

    if (q.type === 0 && q.choices && q.choices.length >= 2) {
      // Multiple choice
      questionType = 'single_choice'
      const labeledOptions = q.choices.map((c, i) => `${OPTION_LABELS[i]}. ${c}`)
      options = JSON.stringify(labeledOptions)
      const ansIdx = typeof q.ans === 'number' ? q.ans : parseInt(q.ans as string, 10)
      answer = OPTION_LABELS[ansIdx] || q.ans.toString()
    } else {
      // Fill blank / comprehensive
      questionType = 'fill_blank'
      answer = typeof q.ans === 'string' ? q.ans : q.ans.toString()
    }

    // Clean content: replace ##n## with ____ for blanks
    const content = q.content.replace(/##n##/g, '____').trim()
    if (content.length < 5) continue

    const difficulty = inferDifficulty(content, q.analysis || '')
    const year = extractYear(q.origin)

    // Preserve original topic granularity in source field
    const topicLabel = TOPIC_LABELS[q.subject_id] || ''
    const enrichedSource = topicLabel ? `${q.origin} [${topicLabel}]` : q.origin

    try {
      insertStmt.bind([
        6, // subject_id for 历史
        kpId,
        questionType,
        difficulty,
        content,
        options,
        answer,
        q.analysis || null,
        year,
        enrichedSource,
        'high'
      ])
      insertStmt.step()
      insertStmt.reset()
      imported++
    } catch {
      insertStmt.reset()
    }
  }

  insertStmt.free()
  console.log(`[import] Imported ${imported} real history exam questions from InternLM-History dataset`)
  return imported
}
