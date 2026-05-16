import { ipcMain } from 'electron'
import type { Database as SqlJsDatabase } from 'sql.js'
import { getDatabase, saveDatabase } from '../database/connection'

// --- sql.js query helpers ---

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

function get(db: SqlJsDatabase, sql: string, params: any[] = []): any | undefined {
  const rows = all(db, sql, params)
  return rows.length > 0 ? rows[0] : undefined
}

function run(db: SqlJsDatabase, sql: string, params: any[] = []): number {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  stmt.step()
  stmt.free()
  const result = db.exec('SELECT last_insert_rowid()')
  return (result[0]?.values?.[0]?.[0] as number) || 0
}

function exec(db: SqlJsDatabase, sql: string): void {
  db.run(sql)
  saveDatabase()
}

// --- Assessment-related params ---

interface GetQuestionsParams {
  subjectIds: number[]
  questionsPerSubject: number
}

export function registerAssessmentHandlers(): void {
  // 获取评估题目（按知识点分层抽取）
  ipcMain.handle('assessment:getQuestions', async (_event, params: GetQuestionsParams) => {
    const db = await getDatabase()
    const { subjectIds, questionsPerSubject } = params
    const result: Record<number, unknown[]> = {}

    for (const subjectId of subjectIds) {
      const highN = Math.ceil(questionsPerSubject * 0.5)
      const midN = Math.ceil(questionsPerSubject * 0.3)
      const lowN = Math.ceil(questionsPerSubject * 0.2)

      const highFreq = all(db,
        `SELECT * FROM questions WHERE subject_id = ? AND exam_frequency = 'high' ORDER BY RANDOM() LIMIT ?`,
        [subjectId, highN]
      )
      const midFreq = all(db,
        `SELECT * FROM questions WHERE subject_id = ? AND exam_frequency = 'medium' ORDER BY RANDOM() LIMIT ?`,
        [subjectId, midN]
      )
      const lowFreq = all(db,
        `SELECT * FROM questions WHERE subject_id = ? AND exam_frequency = 'low' ORDER BY RANDOM() LIMIT ?`,
        [subjectId, lowN]
      )

      const questions = [...highFreq, ...midFreq, ...lowFreq]
        .sort(() => Math.random() - 0.5)
        .slice(0, questionsPerSubject)
        .map((q: any) => ({
          ...q,
          options: q.options ? JSON.parse(String(q.options)) : null
        }))

      result[subjectId] = questions
    }

    return result
  })

  // 创建评估记录
  ipcMain.handle('assessment:create', async (_event, params: {
    mode: string
    subjectIds: number[]
    questions: Record<number, any[]>
  }) => {
    const db = await getDatabase()
    const { mode, subjectIds, questions } = params

    const subjectInfo = all(db,
      `SELECT * FROM subjects WHERE id IN (${subjectIds.map(() => '?').join(',')})`,
      subjectIds
    )
    const maxScore = subjectInfo.reduce((sum: number, s: any) => sum + s.total_score, 0)

    // 每科按比例缩放到满分
    const scoreScale: Record<number, number> = {}
    for (const s of subjectInfo) {
      scoreScale[s.id] = s.total_score / ((questions[s.id] || []).length || 1)
    }

    const assessmentId = run(db,
      'INSERT INTO assessments (mode, subjects, max_score) VALUES (?, ?, ?)',
      [mode, subjectIds.join(','), maxScore]
    )

    // 插入作答明细
    const insertAnswerStmt = db.prepare(
      'INSERT INTO assessment_answers (assessment_id, question_id) VALUES (?, ?)'
    )
    for (const q of Object.values(questions).flat()) {
      insertAnswerStmt.bind([assessmentId, (q as any).id])
      insertAnswerStmt.step()
      insertAnswerStmt.reset()
    }
    insertAnswerStmt.free()
    saveDatabase()

    return { assessmentId, maxScore, scoreScale }
  })

  // 提交单题答案
  ipcMain.handle('assessment:submitAnswer', async (_event, params: {
    assessmentId: number
    questionId: number
    studentAnswer: string
    durationSeconds: number
  }) => {
    const db = await getDatabase()
    const { assessmentId, questionId, studentAnswer, durationSeconds } = params

    const question = get(db, 'SELECT answer FROM questions WHERE id = ?', [questionId])
    if (!question) return { error: 'Question not found' }

    const isCorrect = normalizeAnswer(studentAnswer, String(question.answer)) ? 1 : 0

    run(db,
      `UPDATE assessment_answers
       SET student_answer = ?, is_correct = ?, duration_seconds = ?
       WHERE assessment_id = ? AND question_id = ?`,
      [studentAnswer, isCorrect, durationSeconds, assessmentId, questionId]
    )
    saveDatabase()

    return { isCorrect: !!isCorrect, correctAnswer: String(question.answer) }
  })

  // 获取评估报告
  ipcMain.handle('assessment:getReport', async (_event, assessmentId: number) => {
    const db = await getDatabase()
    const assessment = get(db, 'SELECT * FROM assessments WHERE id = ?', [assessmentId])
    if (!assessment) return { error: 'Assessment not found' }

    const subjectIds = String(assessment.subjects).split(',').map(Number)
    const subjects = all(db,
      `SELECT * FROM subjects WHERE id IN (${subjectIds.map(() => '?').join(',')})`,
      subjectIds
    )

    // 各科得分
    const subjectScores: Record<number, { total: number; correct: number; score: number; maxScore: number }> = {}

    for (const subject of subjects) {
      const answers = all(db, `
        SELECT aa.*, q.subject_id
        FROM assessment_answers aa
        JOIN questions q ON aa.question_id = q.id
        WHERE aa.assessment_id = ? AND q.subject_id = ?
      `, [assessmentId, subject.id])

      const total = answers.length
      const correct = answers.filter((a: any) => a.is_correct === 1).length
      const score = total > 0 ? Math.round((correct / total) * (subject.total_score as number)) : 0

      subjectScores[subject.id] = { total, correct, score, maxScore: subject.total_score as number }
    }

    // 知识点薄弱分析
    const kpAnalysis: Record<number, { name: string; total: number; correct: number; rate: number }[]> = {}
    for (const subjectId of subjectIds) {
      const rows = all(db, `
        SELECT kp.id as kp_id, kp.name as kp_name,
               COUNT(*) as total,
               SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM assessment_answers aa
        JOIN questions q ON aa.question_id = q.id
        JOIN knowledge_points kp ON q.kp_id = kp.id
        WHERE aa.assessment_id = ? AND q.subject_id = ?
        GROUP BY kp.id
        ORDER BY (CAST(SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*)) ASC
      `, [assessmentId, subjectId])

      kpAnalysis[subjectId] = rows.map((r: any) => ({
        name: String(r.kp_name),
        total: r.total as number,
        correct: r.correct as number,
        rate: (r.total as number) > 0 ? Math.round(((r.correct as number) / (r.total as number)) * 100) : 0
      }))
    }

    // 更新总得分
    const totalScore = Object.values(subjectScores).reduce((sum, s) => sum + s.score, 0)
    run(db, 'UPDATE assessments SET total_score = ? WHERE id = ?', [totalScore, assessmentId])

    // 更新学生能力画像
    updateStudentProfile(db, assessmentId)
    saveDatabase()

    return {
      assessment: { ...assessment, total_score: totalScore },
      subjects: subjects.map((s: any) => ({
        ...s,
        ...subjectScores[s.id]
      })),
      kpAnalysis
    }
  })

  // 评估历史
  ipcMain.handle('assessment:getHistory', async () => {
    const db = await getDatabase()
    return all(db, 'SELECT * FROM assessments ORDER BY created_at DESC LIMIT 20')
  })

  // 获取科目
  ipcMain.handle('data:getSubjects', async () => {
    const db = await getDatabase()
    return all(db, 'SELECT * FROM subjects')
  })

  // 获取知识点
  ipcMain.handle('data:getKnowledgePoints', async (_event, subjectId: number) => {
    const db = await getDatabase()
    return all(db, 'SELECT * FROM knowledge_points WHERE subject_id = ? ORDER BY id', [subjectId])
  })
}

function normalizeAnswer(student: string, correct: string): boolean {
  const s = student.trim().replace(/\s+/g, '')
  const c = correct.trim().replace(/\s+/g, '')
  if (s.toLowerCase() === c.toLowerCase()) return true
  const sNum = parseFloat(s)
  const cNum = parseFloat(c)
  if (!isNaN(sNum) && !isNaN(cNum) && sNum === cNum) return true
  return false
}

function updateStudentProfile(db: SqlJsDatabase, assessmentId: number): void {
  const answers = all(db, `
    SELECT q.subject_id, q.kp_id, aa.is_correct
    FROM assessment_answers aa
    JOIN questions q ON aa.question_id = q.id
    WHERE aa.assessment_id = ?
  `, [assessmentId])

  const upsert = db.prepare(`
    INSERT INTO student_profile (subject_id, kp_id, total_attempts, correct_attempts, mastery_level)
    VALUES (?, ?, 1, ?, ?)
    ON CONFLICT(subject_id, kp_id) DO UPDATE SET
      total_attempts = total_attempts + 1,
      correct_attempts = correct_attempts + ?,
      mastery_level = CAST((correct_attempts + ?) AS REAL) / (total_attempts + 1),
      updated_at = datetime('now', 'localtime')
  `)

  for (const a of answers) {
    const isCorrect = (a.is_correct as number) === 1
    upsert.bind([
      a.subject_id, a.kp_id,
      isCorrect ? 1 : 0,
      isCorrect ? 1 : 0,
      isCorrect ? 1 : 0,
      isCorrect ? 1 : 0
    ])
    upsert.step()
    upsert.reset()
  }
  upsert.free()
}
