import * as fs from 'fs'
import * as path from 'path'
import type { Database as SqlJsDatabase } from 'sql.js'

interface CMMLUMapping {
  subject_id: number
  kp_id: number
  csv_file: string
  kp_keywords?: [string, number][]
}

const CMMLU_MAPPINGS: CMMLUMapping[] = [
  { subject_id: 1, kp_id: 1001, csv_file: 'elementary_chinese' },
  { subject_id: 1, kp_id: 1008, csv_file: 'ancient_chinese' },
  { subject_id: 1, kp_id: 1010, csv_file: 'chinese_literature' },
  { subject_id: 1, kp_id: 1009, csv_file: 'modern_chinese' },
  { subject_id: 2, kp_id: 2001, csv_file: 'elementary_mathematics' },
  { subject_id: 2, kp_id: 2004, csv_file: 'high_school_mathematics' },
  { subject_id: 4, kp_id: 4001, csv_file: 'conceptual_physics' },
  { subject_id: 4, kp_id: 4005, csv_file: 'high_school_physics' },
  { subject_id: 5, kp_id: 5001, csv_file: 'high_school_chemistry' },
  { subject_id: 6, kp_id: 6002, csv_file: 'chinese_history' },
  {
    subject_id: 7, kp_id: 7003, csv_file: 'high_school_politics',
    kp_keywords: [
      ['道德', 7001], ['诚信', 7001], ['责任', 7001], ['荣辱', 7001],
      ['核心价值观', 7001], ['群众路线', 7001], ['最美', 7001],
      ['法律', 7002], ['权利', 7002], ['义务', 7002], ['宪法', 7002],
      ['物权法', 7002], ['刑法', 7002], ['诉讼', 7002], ['法治', 7002],
      ['法制', 7002], ['产权', 7002], ['条例', 7002], ['合同', 7002],
    ],
  },
]

const CMMLU_CN_LABELS: Record<string, string> = {
  elementary_chinese: '语文基础',
  ancient_chinese: '古代汉语',
  chinese_literature: '中国文学',
  modern_chinese: '现代汉语',
  elementary_mathematics: '数学基础',
  high_school_mathematics: '高中数学',
  conceptual_physics: '概念物理',
  high_school_physics: '高中物理',
  high_school_chemistry: '高中化学',
  chinese_history: '中国历史',
  high_school_politics: '高中政治',
}

function findCMMLUDir(): string | null {
  const possiblePaths = [
    path.join(__dirname, '..', '..', '..', 'data', 'datasets', 'cmmlu', 'test'),
    path.join(process.cwd(), 'data', 'datasets', 'cmmlu', 'test'),
    path.join(process.resourcesPath || '', 'data', 'datasets', 'cmmlu', 'test'),
  ]
  for (const p of possiblePaths) {
    const normalized = path.resolve(p)
    if (fs.existsSync(normalized)) return normalized
  }
  return null
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function matchKpId(question: string, mapping: CMMLUMapping): number {
  if (mapping.kp_keywords) {
    for (const [keyword, kpId] of mapping.kp_keywords) {
      if (question.includes(keyword)) return kpId
    }
  }
  return mapping.kp_id
}

function inferDifficultyChinese(question: string): 'easy' | 'medium' | 'hard' {
  const len = question.length
  if (len < 30) return 'easy'
  if (len > 80) return 'hard'
  return 'medium'
}

function inferDifficultyDefault(question: string): 'easy' | 'medium' | 'hard' {
  const len = question.length
  if (len > 150) return 'hard'
  if (len < 40) return 'easy'
  if (question.includes('综合') || question.includes('计算') || question.includes('证明')) return 'hard'
  if (question.includes('属于') || question.includes('是') || question.includes('定义')) return 'easy'
  return 'medium'
}

// Generate basic analysis for CMMLU questions (replaces null)
function generateAnalysis(question: string, answerLetter: string, answerText: string, subjectName: string): string {
  const keywords = question.slice(0, 12).replace(/[^一-龥]/g, '')
  const subjectLabels: Record<string, string> = {
    '语文': '语文基础知识', '数学': '数学运算与推理',
    '物理': '物理概念与原理', '化学': '化学基础知识',
    '历史': '历史事实与理解', '政治': '政治常识与理论',
  }
  const label = subjectLabels[subjectName] || '基础知识'
  return `本题考查${label}。正确答案为${answerLetter}，${answerText ? `选项内容为"${answerText}"。` : ''}建议结合相关知识体系进行系统复习。`
}

// Map subject_id to Chinese name for analysis
function getSubjectName(subjectId: number): string {
  const names: Record<number, string> = {
    1: '语文', 2: '数学', 4: '物理', 5: '化学', 6: '历史', 7: '政治',
  }
  return names[subjectId] || '学科'
}

export function importCMMLUData(db: SqlJsDatabase): number {
  const csvDir = findCMMLUDir()
  if (!csvDir) {
    console.log('[import-cmmlu] CMMLU data directory not found, skipping')
    return 0
  }

  // Delete old CMMLU questions and re-import (ensures keyword mapping updates apply)
  db.run("DELETE FROM assessment_answers WHERE question_id IN (SELECT id FROM questions WHERE source LIKE 'CMMLU%')")
  db.run("DELETE FROM questions WHERE source LIKE 'CMMLU%'")
  console.log('[import-cmmlu] Cleared old CMMLU questions, re-importing...')

  const insertStmt = db.prepare(`
    INSERT INTO questions (subject_id, kp_id, type, difficulty, content, options, answer, analysis, year, source, exam_frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let imported = 0
  for (const mapping of CMMLU_MAPPINGS) {
    const csvPath = path.join(csvDir, `${mapping.csv_file}.csv`)
    if (!fs.existsSync(csvPath)) continue

    const raw = fs.readFileSync(csvPath, 'utf-8')
    const lines = raw.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) continue

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i])
      // Expected: id, question, A, B, C, D, answer
      if (fields.length < 7) continue

      const [/* id */, question, optA, optB, optC, optD, answer] = fields
      if (!question || question.length < 5) continue
      if (!answer || answer.length > 10) continue

      const content = question.trim()
      const options = JSON.stringify([
        `A. ${optA.trim()}`,
        `B. ${optB.trim()}`,
        `C. ${optC.trim()}`,
        `D. ${optD.trim()}`
      ])
      const answerLetter = answer.trim().toUpperCase()
      // Validate answer is A-D
      if (!['A', 'B', 'C', 'D'].includes(answerLetter)) continue

      const difficulty = mapping.subject_id === 1
        ? inferDifficultyChinese(content)
        : inferDifficultyDefault(content)

      const answerText = [optA, optB, optC, optD][['A', 'B', 'C', 'D'].indexOf(answerLetter)]?.trim() || ''
      const analysis = generateAnalysis(content, answerLetter, answerText, getSubjectName(mapping.subject_id))

      try {
        insertStmt.bind([
          mapping.subject_id,
          matchKpId(content, mapping),
          'single_choice',
          difficulty,
          content,
          options,
          answerLetter,
          analysis,
          2023, // approximate year
          `CMMLU/${CMMLU_CN_LABELS[mapping.csv_file] || mapping.csv_file}`,
          'medium'
        ])
        insertStmt.step()
        insertStmt.reset()
        imported++
      } catch {
        insertStmt.reset()
      }
    }
  }

  insertStmt.free()
  console.log(`[import-cmmlu] Imported ${imported} questions from CMMLU dataset (Apache 2.0)`)
  return imported
}
