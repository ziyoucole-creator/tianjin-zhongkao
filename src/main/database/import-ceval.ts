import * as fs from 'fs'
import * as path from 'path'
import type { Database as SqlJsDatabase } from 'sql.js'

interface CEvalQuestion {
  id: number
  question: string
  A: string
  B: string
  C: string
  D: string
  answer: string
  explanation: string | null
}

interface CEvalMapping {
  subject_id: number
  file_prefix: string
  kp_keywords: [string, number][] // keyword -> kp_id mapping
  default_kp_id: number
}

const CEVAL_MAPPINGS: CEvalMapping[] = [
  {
    subject_id: 2, file_prefix: 'middle_school_mathematics', default_kp_id: 2001,
    kp_keywords: [
      ['方程', 2004], ['不等式', 2006], ['函数', 2007],
      ['三角形', 2012], ['四边形', 2013], ['圆', 2014],
      ['几何', 2011], ['统计', 2015], ['概率', 2015],
      ['代数', 2001], ['数', 2001], ['根', 2001],
    ]
  },
  {
    subject_id: 4, file_prefix: 'middle_school_physics', default_kp_id: 4001,
    kp_keywords: [
      ['运动', 4002], ['力', 4002], ['压强', 4003], ['浮力', 4003],
      ['电路', 4006], ['电压', 4006], ['电流', 4006], ['电阻', 4006],
      ['欧姆', 4007], ['电功率', 4007], ['电能', 4007],
      ['光', 4008], ['折射', 4008], ['反射', 4008], ['透镜', 4008],
      ['热', 4009], ['温度', 4009], ['内能', 4009],
      ['功', 4004], ['机械', 4004],
    ]
  },
  {
    subject_id: 5, file_prefix: 'middle_school_chemistry', default_kp_id: 5001,
    kp_keywords: [
      ['化学式', 5002], ['化学方程式', 5002], ['反应', 5002],
      ['溶液', 5003], ['溶解度', 5003],
      ['酸', 5004], ['碱', 5004], ['盐', 5004],
      ['金属', 5005], ['材料', 5005],
      ['实验', 5006], ['操作', 5006],
    ]
  },
  {
    subject_id: 7, file_prefix: 'middle_school_politics', default_kp_id: 7003,
    kp_keywords: [
      ['道德', 7001], ['诚信', 7001], ['责任', 7001],
      ['法律', 7002], ['权利', 7002], ['义务', 7002], ['宪法', 7002],
    ]
  },
  {
    subject_id: 1, file_prefix: 'high_school_chinese', default_kp_id: 1004,
    kp_keywords: [
      ['字音', 1002], ['字形', 1002], ['读音', 1002],
      ['成语', 1003], ['词语', 1003],
      ['病句', 1004], ['语病', 1004],
      ['古诗', 1007], ['诗词', 1007], ['诗', 1007],
      ['文言', 1008], ['古文', 1008],
      ['现代文', 1009], ['阅读', 1009],
    ]
  },
]

function findCEvalDir(): string | null {
  const possiblePaths = [
    path.join(__dirname, '..', '..', '..', 'data', 'datasets', 'ceval_json'),
    path.join(process.cwd(), 'data', 'datasets', 'ceval_json'),
    path.join(process.resourcesPath || '', 'data', 'datasets', 'ceval_json'),
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(path.resolve(p))) return path.resolve(p)
  }
  return null
}

function matchKpId(question: string, mapping: CEvalMapping): number {
  for (const [keyword, kpId] of mapping.kp_keywords) {
    if (question.includes(keyword)) return kpId
  }
  return mapping.default_kp_id
}

function inferDifficulty(question: string, explanation: string | null): 'easy' | 'medium' | 'hard' {
  const text = question + (explanation || '')
  if (text.includes('综合') || text.includes('证明') || text.includes('归纳')) return 'hard'
  if (text.includes('属于') || text.includes('定义') || text.includes('是') && question.length < 40) return 'easy'
  return 'medium'
}

export function importCEvalData(db: SqlJsDatabase): number {
  const jsonDir = findCEvalDir()
  if (!jsonDir) {
    console.log('[import-ceval] CEval data directory not found, skipping')
    return 0
  }

  // Check if already imported
  const checkStmt = db.prepare("SELECT COUNT(*) as cnt FROM questions WHERE source LIKE 'CEval%'")
  checkStmt.step()
  const existing = checkStmt.getAsObject().cnt as number
  checkStmt.free()
  if (existing > 100) {
    console.log(`[import-ceval] ${existing} CEval questions already imported, skipping`)
    return 0
  }

  const insertStmt = db.prepare(`
    INSERT INTO questions (subject_id, kp_id, type, difficulty, content, options, answer, analysis, year, source, exam_frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let imported = 0

  for (const mapping of CEVAL_MAPPINGS) {
    // Read test, val, dev files
    for (const split of ['test', 'val', 'dev']) {
      const jsonPath = path.join(jsonDir, `${mapping.file_prefix}_${split}-00000-of-00001.json`)
      if (!fs.existsSync(jsonPath)) continue

      let records: CEvalQuestion[]
      try {
        records = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      } catch {
        continue
      }

      for (const q of records) {
        if (!q.question || q.question.length < 5) continue
        if (!q.answer || !['A', 'B', 'C', 'D'].includes(q.answer.toUpperCase())) continue

        const content = q.question.trim()
        const options = JSON.stringify([
          `A. ${(q.A || '').trim()}`,
          `B. ${(q.B || '').trim()}`,
          `C. ${(q.C || '').trim()}`,
          `D. ${(q.D || '').trim()}`
        ])
        const answer = q.answer.toUpperCase()
        const kpId = matchKpId(content, mapping)
        const difficulty = inferDifficulty(content, q.explanation)

        try {
          insertStmt.bind([
            mapping.subject_id,
            kpId,
            'single_choice',
            difficulty,
            content,
            options,
            answer,
            q.explanation || null,
            2023,
            `CEval/${mapping.file_prefix}`,
            'high'
          ])
          insertStmt.step()
          insertStmt.reset()
          imported++
        } catch {
          insertStmt.reset()
        }
      }
    }
  }

  insertStmt.free()
  console.log(`[import-ceval] Imported ${imported} questions from CEval dataset (CC BY-NC-SA 4.0)`)
  return imported
}
