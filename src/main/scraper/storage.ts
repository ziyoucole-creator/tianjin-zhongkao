import type { Database as SqlJsDatabase } from 'sql.js'
import { saveDatabase } from '../database/connection'
import type { ScrapedQuestion, ScrapeTask } from './types'

/**
 * 将爬取到的题目存入数据库，自动去重
 */
export function saveQuestions(db: SqlJsDatabase, questions: ScrapedQuestion[]): { inserted: number; skipped: number } {
  let inserted = 0
  let skipped = 0

  const checkStmt = db.prepare(
    'SELECT id FROM questions WHERE content = ? AND year = ? AND subject_id = ? LIMIT 1'
  )
  const insertStmt = db.prepare(`
    INSERT INTO questions (subject_id, kp_id, type, difficulty, content, options, answer, analysis, year, source, exam_frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const q of questions) {
    // 去重：同内容+同年+同科目视为重复
    checkStmt.bind([q.content.substring(0, 200), q.year, q.subject_id])
    const exists = checkStmt.step()
    checkStmt.reset()

    if (exists) {
      skipped++
      continue
    }

    const optionsJson = q.options ? JSON.stringify(q.options) : null
    insertStmt.bind([
      q.subject_id, q.kp_id, q.type, q.difficulty,
      q.content, optionsJson, q.answer, q.analysis,
      q.year, q.source, q.exam_frequency
    ])
    insertStmt.step()
    insertStmt.reset()
    inserted++
  }

  checkStmt.free()
  insertStmt.free()
  saveDatabase()

  return { inserted, skipped }
}

/**
 * 保存爬取任务状态到内存（通过IPC返回给前端）
 */
export function createTask(id: string, target: string, subject: string): ScrapeTask {
  return {
    id,
    target,
    subject,
    status: 'pending',
    progress: 0,
    total: 0,
    newCount: 0,
    skipCount: 0,
    message: '准备中...'
  }
}
