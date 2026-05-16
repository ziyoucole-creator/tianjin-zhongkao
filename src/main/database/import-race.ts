import * as fs from 'fs'
import * as path from 'path'
import type { Database as SqlJsDatabase } from 'sql.js'

interface RACERecord {
  example_id: string
  article: string
  question: string
  options: string[]
  answer: string
}

function findRACEDir(): string | null {
  const possiblePaths = [
    path.join(__dirname, '..', '..', '..', 'data', 'datasets', 'race_json'),
    path.join(process.cwd(), 'data', 'datasets', 'race_json'),
    path.join(process.resourcesPath || '', 'data', 'datasets', 'race_json'),
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(path.resolve(p))) return path.resolve(p)
  }
  return null
}

function inferDifficulty(article: string, question: string): 'easy' | 'medium' | 'hard' {
  const totalLen = article.length + question.length
  // Longer articles with more complex vocabulary tend to be harder
  if (totalLen > 2000) return 'hard'
  if (totalLen < 500) return 'easy'
  return 'medium'
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function importRACEData(db: SqlJsDatabase): number {
  const jsonDir = findRACEDir()
  if (!jsonDir) {
    console.log('[import-race] RACE data directory not found, skipping')
    return 0
  }

  // Check if already imported
  const checkStmt = db.prepare("SELECT COUNT(*) as cnt FROM questions WHERE source LIKE 'RACE%'")
  checkStmt.step()
  const existing = checkStmt.getAsObject().cnt as number
  checkStmt.free()
  if (existing > 100) {
    console.log(`[import-race] ${existing} RACE questions already imported, skipping`)
    return 0
  }

  const insertStmt = db.prepare(`
    INSERT INTO questions (subject_id, kp_id, type, difficulty, content, options, answer, analysis, year, source, exam_frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let imported = 0
  const splits = ['test', 'validation', 'train']

  for (const split of splits) {
    const jsonPath = path.join(jsonDir, `middle_${split}-00000-of-00001.json`)
    if (!fs.existsSync(jsonPath)) {
      console.log(`[import-race] File not found: ${jsonPath}`)
      continue
    }

    console.log(`[import-race] Reading RACE ${split} set...`)
    let records: RACERecord[]
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8')
      records = JSON.parse(raw)
      console.log(`[import-race]   ${records.length} records loaded`)
    } catch (err) {
      console.log(`[import-race] Failed to parse ${split}:`, (err as Error).message)
      continue
    }

    for (const r of records) {
      if (!r.article || !r.question) continue
      if (!r.options || r.options.length < 2) continue
      if (!r.answer) continue

      const answerLetter = r.answer.trim().toUpperCase()
      // Validate answer
      if (OPTION_LABELS.indexOf(answerLetter) < 0 || answerLetter.length !== 1) continue

      const content = r.article.trim() + '\n\n' + r.question.trim()
      if (content.length < 20) continue

      const labeledOptions = r.options.map((opt: string, i: number) =>
        `${OPTION_LABELS[i]}. ${opt.trim()}`
      )
      const options = JSON.stringify(labeledOptions)
      const difficulty = inferDifficulty(r.article, r.question)

      try {
        insertStmt.bind([
          3, // subject_id for 英语
          3003, // kp_id for 阅读理解
          'single_choice',
          difficulty,
          content,
          options,
          answerLetter,
          null, // no analysis
          2020, // approximate year for RACE dataset
          `RACE/middle/${r.example_id}`,
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

  insertStmt.free()
  console.log(`[import-race] Imported ${imported} English questions from RACE dataset (Apache 2.0)`)
  return imported
}
