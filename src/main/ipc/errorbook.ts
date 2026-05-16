import { ipcMain } from 'electron'
import type { Database as SqlJsDatabase } from 'sql.js'
import { getDatabase, saveDatabase } from '../database/connection'

function all(db: SqlJsDatabase, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function run(db: SqlJsDatabase, sql: string, params: any[] = []): number {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  stmt.step()
  stmt.free()
  const result = db.exec('SELECT last_insert_rowid()')
  return (result[0]?.values?.[0]?.[0] as number) || 0
}

export function registerErrorBookHandlers(): void {
  // 获取错题列表（可筛选科目和知识点）
  ipcMain.handle('errorbook:getWrongQuestions', async (_event, params: {
    subjectId?: number; kpId?: number; page?: number; pageSize?: number
  }) => {
    const db = await getDatabase()
    const { subjectId, kpId, page = 1, pageSize = 20 } = params

    const conditions: string[] = ['aa.is_correct = 0']
    const values: any[] = []

    if (subjectId) {
      conditions.push('q.subject_id = ?')
      values.push(subjectId)
    }
    if (kpId) {
      conditions.push('q.kp_id = ?')
      values.push(kpId)
    }

    const where = conditions.join(' AND ')
    const offset = (page - 1) * pageSize

    const countRow = all(db,
      `SELECT COUNT(*) as total FROM assessment_answers aa
       JOIN questions q ON aa.question_id = q.id WHERE ${where}`,
      values
    )
    const total = (countRow[0]?.total as number) || 0

    const rows = all(db,
      `SELECT DISTINCT q.*, kp.name as kp_name, s.name as subject_name,
              aa.assessment_id, aa.student_answer, a.created_at as assessment_date
       FROM assessment_answers aa
       JOIN questions q ON aa.question_id = q.id
       LEFT JOIN knowledge_points kp ON q.kp_id = kp.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       LEFT JOIN assessments a ON aa.assessment_id = a.id
       WHERE ${where}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    )

    const questions = rows.map((q: any) => ({
      ...q,
      options: q.options ? JSON.parse(String(q.options)) : null
    }))

    return { questions, total, page, pageSize }
  })

  // 错题统计（按科目和知识点汇总）
  ipcMain.handle('errorbook:getStats', async () => {
    const db = await getDatabase()

    const bySubject = all(db,
      `SELECT q.subject_id, s.name as subject_name, COUNT(*) as count
       FROM assessment_answers aa
       JOIN questions q ON aa.question_id = q.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE aa.is_correct = 0
       GROUP BY q.subject_id ORDER BY count DESC`
    )

    const byKp = all(db,
      `SELECT q.kp_id, kp.name as kp_name, s.name as subject_name, q.subject_id, COUNT(*) as count
       FROM assessment_answers aa
       JOIN questions q ON aa.question_id = q.id
       LEFT JOIN knowledge_points kp ON q.kp_id = kp.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE aa.is_correct = 0
       GROUP BY q.kp_id ORDER BY count DESC`
    )

    const totalWrong = all(db,
      'SELECT COUNT(*) as count FROM assessment_answers WHERE is_correct = 0'
    )[0]?.count || 0

    const totalAttempts = all(db,
      'SELECT COUNT(*) as count FROM assessment_answers'
    )[0]?.count || 0

    return { bySubject, byKp, totalWrong, totalAttempts }
  })

  // 钻取模式：记录单道错题（无评估会话，assessment_id=0）
  ipcMain.handle('errorbook:addWrongQuestion', async (_event, params: {
    questionId: number; studentAnswer: string
  }) => {
    const db = await getDatabase()
    const { questionId, studentAnswer } = params

    // Get the correct answer
    const qRow = all(db, 'SELECT answer FROM questions WHERE id = ?', [questionId])
    if (!qRow[0]) return { isCorrect: false, error: 'Question not found' }

    const correctAnswer = (qRow[0].answer as string) || ''
    const normalize = (s: string) =>
      s.trim()
       .replace(/[''']/g, "'")
       .replace(/["""]/g, '"')
       .replace(/\s+/g, '')
       .replace(/[.。,，!！?？;；:：]+$/g, '')
       .toLowerCase()
    const s = normalize(studentAnswer)
    const c = normalize(correctAnswer)
    const isCorrect = s === c

    if (!isCorrect) {
      // Check if already recorded as wrong in standalone mode
      const dupCheck = all(db,
        'SELECT COUNT(*) as cnt FROM assessment_answers WHERE question_id = ? AND assessment_id = 0',
        [questionId]
      )
      const alreadyExists = (dupCheck[0]?.cnt as number) > 0

      if (!alreadyExists) {
        run(db,
          `INSERT INTO assessment_answers (assessment_id, question_id, student_answer, is_correct, duration_seconds)
           VALUES (0, ?, ?, 0, 0)`,
          [questionId, studentAnswer]
        )
        saveDatabase()
      }
    }

    return { isCorrect, correctAnswer }
  })

  // 标记错题已掌握（从错题本移除）
  ipcMain.handle('errorbook:markMastered', async (_event, questionId: number) => {
    const db = await getDatabase()
    run(db,
      `UPDATE assessment_answers SET is_correct = 1
       WHERE question_id = ? AND is_correct = 0`,
      [questionId]
    )
    saveDatabase()
    return true
  })

  // 错题重练——获取错题作为练习集
  ipcMain.handle('errorbook:getPracticeSet', async (_event, params: {
    subjectId?: number; limit?: number
  }) => {
    const db = await getDatabase()
    const { subjectId, limit = 10 } = params

    const conditions = ['aa.is_correct = 0']
    const values: any[] = []
    if (subjectId) {
      conditions.push('q.subject_id = ?')
      values.push(subjectId)
    }

    const where = conditions.join(' AND ')
    const rows = all(db,
      `SELECT DISTINCT q.*
       FROM assessment_answers aa
       JOIN questions q ON aa.question_id = q.id
       WHERE ${where}
       ORDER BY RANDOM()
       LIMIT ?`,
      [...values, limit]
    )

    return rows.map((q: any) => ({
      ...q,
      options: q.options ? JSON.parse(String(q.options)) : null
    }))
  })
}
