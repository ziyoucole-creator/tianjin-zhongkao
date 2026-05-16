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

export function registerProgressHandlers(): void {
  // 总体学习概览
  ipcMain.handle('progress:getOverview', async () => {
    const db = await getDatabase()

    const assessmentCount = all(db,
      'SELECT COUNT(*) as count FROM assessments'
    )[0]?.count || 0

    const lastAssessment = all(db,
      'SELECT * FROM assessments ORDER BY created_at DESC LIMIT 1'
    )

    const totalQuestions = all(db,
      'SELECT COUNT(*) as count FROM assessment_answers'
    )[0]?.count || 0

    const correctQuestions = all(db,
      'SELECT COUNT(*) as count FROM assessment_answers WHERE is_correct = 1'
    )[0]?.count || 0

    const overallAccuracy = totalQuestions > 0
      ? Math.round((correctQuestions / totalQuestions) * 100)
      : 0

    return {
      assessmentCount,
      lastAssessment: lastAssessment[0] || null,
      totalQuestions,
      correctQuestions,
      overallAccuracy
    }
  })

  // 历次评估得分趋势
  ipcMain.handle('progress:getTrend', async () => {
    const db = await getDatabase()

    const assessments = all(db,
      'SELECT id, mode, subjects, total_score, max_score, created_at FROM assessments ORDER BY created_at ASC'
    )

    return assessments.map((a: any) => ({
      id: a.id,
      mode: a.mode,
      subjects: String(a.subjects),
      score: a.total_score,
      maxScore: a.max_score,
      rate: a.max_score > 0 ? Math.round((a.total_score / a.max_score) * 100) : 0,
      date: String(a.created_at).substring(0, 10)
    }))
  })

  // 各科得分趋势（每次评估各科分数）
  ipcMain.handle('progress:getSubjectTrends', async () => {
    const db = await getDatabase()

    const assessments = all(db,
      'SELECT id, subjects, created_at FROM assessments ORDER BY created_at ASC'
    )

    const result: { date: string; [key: string]: any }[] = []

    for (const a of assessments) {
      const subjectIds = String(a.subjects).split(',').map(Number)
      const entry: { date: string; [key: string]: any } = {
        date: String(a.created_at).substring(0, 10)
      }

      for (const sid of subjectIds) {
        const subject = all(db, 'SELECT id, name FROM subjects WHERE id = ?', [sid])[0]
        if (!subject) continue

        const answers = all(db, `
          SELECT aa.is_correct, q.subject_id
          FROM assessment_answers aa
          JOIN questions q ON aa.question_id = q.id
          WHERE aa.assessment_id = ? AND q.subject_id = ?
        `, [a.id, sid])

        const total = answers.length
        const correct = answers.filter((r: any) => r.is_correct === 1).length
        const rate = total > 0 ? Math.round((correct / total) * 100) : 0

        entry[String(subject.name)] = rate
      }

      result.push(entry)
    }

    return result
  })

  // 知识点掌握度变化（来自 student_profile）
  ipcMain.handle('progress:getMastery', async () => {
    const db = await getDatabase()

    const rows = all(db, `
      SELECT sp.*, kp.name as kp_name, s.name as subject_name
      FROM student_profile sp
      JOIN knowledge_points kp ON sp.kp_id = kp.id
      JOIN subjects s ON sp.subject_id = s.id
      ORDER BY sp.mastery_level ASC
    `)

    return rows.map((r: any) => ({
      subjectId: r.subject_id,
      subjectName: String(r.subject_name),
      kpId: r.kp_id,
      kpName: String(r.kp_name),
      totalAttempts: r.total_attempts,
      correctAttempts: r.correct_attempts,
      masteryLevel: Math.round((r.mastery_level as number) * 100),
      updatedAt: String(r.updated_at)
    }))
  })

  // 学习建议（基于掌握度数据）
  ipcMain.handle('progress:getRecommendations', async () => {
    const db = await getDatabase()

    // 最薄弱的知识点
    const weakKps = all(db, `
      SELECT sp.*, kp.name as kp_name, s.name as subject_name, s.total_score
      FROM student_profile sp
      JOIN knowledge_points kp ON sp.kp_id = kp.id
      JOIN subjects s ON sp.subject_id = s.id
      WHERE sp.total_attempts >= 2 AND sp.mastery_level < 0.6
      ORDER BY sp.mastery_level ASC
      LIMIT 10
    `)

    // 需要复习的知识点（attempts > 0 but below threshold）
    const needsReview = all(db, `
      SELECT sp.*, kp.name as kp_name, s.name as subject_name
      FROM student_profile sp
      JOIN knowledge_points kp ON sp.kp_id = kp.id
      JOIN subjects s ON sp.subject_id = s.id
      WHERE sp.total_attempts = 0
         OR (sp.total_attempts >= 1 AND sp.mastery_level < 0.7)
      ORDER BY sp.mastery_level ASC
      LIMIT 15
    `)

    return {
      weakKps: weakKps.map((r: any) => ({
        subjectName: String(r.subject_name),
        kpName: String(r.kp_name),
        masteryLevel: Math.round((r.mastery_level as number) * 100),
        totalAttempts: r.total_attempts,
        correctAttempts: r.correct_attempts
      })),
      needsReview: needsReview.map((r: any) => ({
        subjectName: String(r.subject_name),
        kpName: String(r.kp_name),
        masteryLevel: Math.round((r.mastery_level as number) * 100),
        totalAttempts: r.total_attempts
      }))
    }
  })
}
