import { ipcMain } from 'electron'
import type { Database as SqlJsDatabase } from 'sql.js'
import { getDatabase } from '../database/connection'

function all(db: SqlJsDatabase, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

export function registerCurriculumHandlers(): void {
  // 批量获取各KP的真题数量
  ipcMain.handle('curriculum:getKpQuestionCounts', async (_event, kpIds: number[]) => {
    const db = await getDatabase()
    if (kpIds.length === 0) return {}

    const placeholders = kpIds.map(() => '?').join(',')
    const rows = all(db,
      `SELECT kp_id, COUNT(*) as count FROM questions WHERE kp_id IN (${placeholders}) GROUP BY kp_id`,
      kpIds
    )

    const result: Record<number, number> = {}
    for (const row of rows) {
      result[row.kp_id as number] = row.count as number
    }
    return result
  })

  // 分页获取指定KP的真题（钻取）
  ipcMain.handle('curriculum:getQuestionsByKp', async (_event, params: {
    kpId: number; page?: number; pageSize?: number
  }) => {
    const db = await getDatabase()
    const { kpId, page = 1, pageSize = 10 } = params
    const offset = (page - 1) * pageSize

    const countRow = all(db,
      'SELECT COUNT(*) as total FROM questions WHERE kp_id = ?',
      [kpId]
    )
    const total = (countRow[0]?.total as number) || 0

    const rows = all(db,
      `SELECT q.*, kp.name as kp_name, s.name as subject_name
       FROM questions q
       LEFT JOIN knowledge_points kp ON q.kp_id = kp.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE q.kp_id = ?
       ORDER BY q.year DESC, q.exam_frequency DESC
       LIMIT ? OFFSET ?`,
      [kpId, pageSize, offset]
    )

    const questions = rows.map((q: any) => ({
      ...q,
      options: q.options ? JSON.parse(String(q.options)) : null
    }))

    return { questions, total, page, pageSize }
  })

  // 获取某个科目的KP统计概览
  ipcMain.handle('curriculum:getSubjectStats', async (_event, subjectId: number) => {
    const db = await getDatabase()

    const kpCounts = all(db,
      `SELECT kp.id, kp.name, COUNT(q.id) as question_count
       FROM knowledge_points kp
       LEFT JOIN questions q ON q.kp_id = kp.id
       WHERE kp.subject_id = ?
       GROUP BY kp.id
       ORDER BY kp.id`,
      [subjectId]
    )

    const totalQuestions = all(db,
      'SELECT COUNT(*) as count FROM questions WHERE subject_id = ?',
      [subjectId]
    )

    return {
      kpCounts: kpCounts.map((r: any) => ({
        kpId: r.id as number,
        name: r.name as string,
        questionCount: r.question_count as number,
      })),
      totalQuestions: (totalQuestions[0]?.count as number) || 0,
    }
  })
}
