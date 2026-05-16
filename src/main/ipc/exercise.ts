import { ipcMain } from 'electron'
import type { Database as SqlJsDatabase } from 'sql.js'
import { getDatabase } from '../database/connection'

function all(db: SqlJsDatabase, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function registerExerciseHandlers(): void {
  // 获取题目列表（支持筛选和分页）
  ipcMain.handle('exercise:getQuestions', async (_event, params: {
    subjectId: number
    year?: number
    type?: string
    difficulty?: string
    kpId?: number
    page?: number
    pageSize?: number
  }) => {
    const db = await getDatabase()
    const { subjectId, year, type, difficulty, kpId, page = 1, pageSize = 20 } = params

    const conditions: string[] = ['q.subject_id = ?']
    const values: any[] = [subjectId]

    if (year) {
      conditions.push('q.year = ?')
      values.push(year)
    }
    if (type) {
      conditions.push('q.type = ?')
      values.push(type)
    }
    if (difficulty) {
      conditions.push('q.difficulty = ?')
      values.push(difficulty)
    }
    if (kpId) {
      conditions.push('q.kp_id = ?')
      values.push(kpId)
    }

    const where = conditions.join(' AND ')
    const offset = (page - 1) * pageSize

    const countRow = all(db, `SELECT COUNT(*) as total FROM questions q WHERE ${where}`, values)
    const total = (countRow[0]?.total as number) || 0

    const rows = all(db,
      `SELECT q.*, kp.name as kp_name, s.name as subject_name
       FROM questions q
       LEFT JOIN knowledge_points kp ON q.kp_id = kp.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE ${where}
       ORDER BY q.year DESC, q.exam_frequency DESC
       LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    )

    const questions = rows.map((q: any) => ({
      ...q,
      options: q.options ? JSON.parse(String(q.options)) : null
    }))

    return { questions, total, page, pageSize }
  })

  // 获取单题详情
  ipcMain.handle('exercise:getQuestion', async (_event, questionId: number) => {
    const db = await getDatabase()
    const q = all(db,
      `SELECT q.*, kp.name as kp_name, s.name as subject_name
       FROM questions q
       LEFT JOIN knowledge_points kp ON q.kp_id = kp.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE q.id = ?`,
      [questionId]
    )
    if (q.length === 0) return null
    const row = { ...q[0] }
    row.options = row.options ? JSON.parse(String(row.options)) : null
    return row
  })

  // 获取筛选选项（某科目的所有年份、题型等）
  ipcMain.handle('exercise:getFilters', async (_event, subjectId: number) => {
    const db = await getDatabase()
    const years = all(db,
      'SELECT DISTINCT year FROM questions WHERE subject_id = ? AND year IS NOT NULL ORDER BY year DESC',
      [subjectId]
    ).map((r: any) => r.year)

    const types = all(db,
      'SELECT DISTINCT type FROM questions WHERE subject_id = ?',
      [subjectId]
    ).map((r: any) => r.type)

    const kps = all(db,
      `SELECT kp.id, kp.name, kp.parent_id
       FROM knowledge_points kp
       WHERE kp.subject_id = ?
       ORDER BY kp.id`,
      [subjectId]
    )

    return { years, types, kps }
  })

  // 获取题目统计
  ipcMain.handle('exercise:getStats', async (_event, subjectId: number) => {
    const db = await getDatabase()
    const total = all(db, 'SELECT COUNT(*) as count FROM questions WHERE subject_id = ?', [subjectId])[0]
    const byType = all(db,
      'SELECT type, COUNT(*) as count FROM questions WHERE subject_id = ? GROUP BY type',
      [subjectId]
    )
    const byDifficulty = all(db,
      'SELECT difficulty, COUNT(*) as count FROM questions WHERE subject_id = ? GROUP BY difficulty',
      [subjectId]
    )
    const byYear = all(db,
      'SELECT year, COUNT(*) as count FROM questions WHERE subject_id = ? AND year IS NOT NULL GROUP BY year ORDER BY year DESC',
      [subjectId]
    )
    return {
      total: total?.count || 0,
      byType,
      byDifficulty,
      byYear
    }
  })
}
