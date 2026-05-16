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

// 模拟考试配置：科目时间分配（参照天津中考）
const EXAM_CONFIG: Record<number, { timeMin: number; questionCount: number }> = {
  1: { timeMin: 120, questionCount: 25 }, // 语文
  2: { timeMin: 100, questionCount: 25 }, // 数学
  3: { timeMin: 100, questionCount: 25 }, // 英语
  4: { timeMin: 60, questionCount: 20 },  // 物理(合卷120min，单独算60min)
  5: { timeMin: 60, questionCount: 20 },  // 化学(合卷120min，单独算60min)
  6: { timeMin: 50, questionCount: 15 },  // 历史(合卷100min，单独算50min)
  7: { timeMin: 50, questionCount: 15 }   // 道法(合卷100min，单独算50min)
}

export function registerMockExamHandlers(): void {
  // 获取模拟考试题目
  ipcMain.handle('mockexam:getQuestions', async (_event, params: { subjectIds: number[] }) => {
    const db = await getDatabase()
    const { subjectIds } = params
    const result: Record<number, any[]> = {}

    for (const sid of subjectIds) {
      const config = EXAM_CONFIG[sid]
      if (!config) continue

      const questions = all(db,
        `SELECT * FROM questions WHERE subject_id = ? ORDER BY RANDOM() LIMIT ?`,
        [sid, config.questionCount]
      )

      result[sid] = questions.map((q: any) => ({
        ...q,
        options: q.options ? JSON.parse(String(q.options)) : null
      }))
    }

    return result
  })

  // 创建模拟考试记录
  ipcMain.handle('mockexam:create', async (_event, params: {
    subjectIds: number[]; questions: Record<number, any[]>
  }) => {
    const db = await getDatabase()
    const { subjectIds, questions } = params

    let totalMaxScore = 0
    const subjectsInfo = all(db,
      `SELECT * FROM subjects WHERE id IN (${subjectIds.map(() => '?').join(',')})`,
      subjectIds
    )
    for (const s of subjectsInfo) {
      totalMaxScore += (s.total_score as number)
    }

    const totalTimeMin = subjectIds.reduce((sum, sid) => sum + (EXAM_CONFIG[sid]?.timeMin || 0), 0)

    const examId = run(db,
      `INSERT INTO assessments (mode, subjects, max_score, duration_seconds)
       VALUES ('mock', ?, ?, ?)`,
      [subjectIds.join(','), totalMaxScore, totalTimeMin * 60]
    )

    const insertAnswer = db.prepare(
      'INSERT INTO assessment_answers (assessment_id, question_id) VALUES (?, ?)'
    )
    for (const qs of Object.values(questions)) {
      for (const q of qs) {
        insertAnswer.bind([examId, q.id])
        insertAnswer.step()
        insertAnswer.reset()
      }
    }
    insertAnswer.free()
    saveDatabase()

    return { examId, totalMaxScore, totalTimeMin }
  })

  // 提交模拟考试单题答案
  ipcMain.handle('mockexam:submitAnswer', async (_event, params: {
    examId: number; questionId: number; studentAnswer: string
  }) => {
    const db = await getDatabase()
    const { examId, questionId, studentAnswer } = params

    const question = all(db, 'SELECT answer FROM questions WHERE id = ?', [questionId])[0]
    if (!question) return { error: 'Question not found' }

    const isCorrect = normalizeAnswer(studentAnswer, String(question.answer)) ? 1 : 0

    run(db,
      `UPDATE assessment_answers
       SET student_answer = ?, is_correct = ?, duration_seconds = 0
       WHERE assessment_id = ? AND question_id = ?`,
      [studentAnswer, isCorrect, examId, questionId]
    )
    saveDatabase()

    return { isCorrect: !!isCorrect, correctAnswer: String(question.answer) }
  })

  // 获取模拟考试报告
  ipcMain.handle('mockexam:getReport', async (_event, examId: number) => {
    const db = await getDatabase()
    const assessment = all(db, 'SELECT * FROM assessments WHERE id = ?', [examId])[0]
    if (!assessment) return { error: 'Exam not found' }

    const subjectIds = String(assessment.subjects).split(',').map(Number)
    const subjectScores: any[] = []
    let totalScore = 0

    for (const sid of subjectIds) {
      const subject = all(db, 'SELECT * FROM subjects WHERE id = ?', [sid])[0]
      if (!subject) continue

      const answers = all(db, `
        SELECT aa.* FROM assessment_answers aa
        JOIN questions q ON aa.question_id = q.id
        WHERE aa.assessment_id = ? AND q.subject_id = ?
      `, [examId, sid])

      const total = answers.length
      const correct = answers.filter((a: any) => a.is_correct === 1).length
      const score = total > 0 ? Math.round((correct / total) * (subject.total_score as number)) : 0
      totalScore += score

      // 知识点分析
      const kpRows = all(db, `
        SELECT kp.name as kp_name, COUNT(*) as total,
               SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM assessment_answers aa
        JOIN questions q ON aa.question_id = q.id
        JOIN knowledge_points kp ON q.kp_id = kp.id
        WHERE aa.assessment_id = ? AND q.subject_id = ?
        GROUP BY kp.id
      `, [examId, sid])

      subjectScores.push({
        id: sid,
        name: subject.name,
        total_score: subject.total_score,
        is_open_book: subject.is_open_book,
        total,
        correct,
        score,
        maxScore: subject.total_score,
        kpAnalysis: kpRows.map((r: any) => ({
          name: String(r.kp_name),
          total: r.total as number,
          correct: r.correct as number,
          rate: (r.total as number) > 0 ? Math.round(((r.correct as number) / (r.total as number)) * 100) : 0
        }))
      })
    }

    run(db, 'UPDATE assessments SET total_score = ? WHERE id = ?', [totalScore, examId])
    saveDatabase()

    return {
      assessment: { ...assessment, total_score: totalScore },
      subjects: subjectScores,
      totalTimeMin: subjectIds.reduce((sum, sid) => sum + (EXAM_CONFIG[sid]?.timeMin || 0), 0)
    }
  })

  // 获取模拟考试历史
  ipcMain.handle('mockexam:getHistory', async () => {
    const db = await getDatabase()
    return all(db,
      "SELECT * FROM assessments WHERE mode = 'mock' ORDER BY created_at DESC LIMIT 20"
    )
  })

  // 获取考试时间配置
  ipcMain.handle('mockexam:getConfig', async () => {
    return EXAM_CONFIG
  })
}

function normalizeAnswer(student: string, correct: string): boolean {
  const s = student.trim().replace(/\s+/g, '').toLowerCase()
  const c = correct.trim().replace(/\s+/g, '').toLowerCase()
  if (s === c) return true
  const sNum = parseFloat(s)
  const cNum = parseFloat(c)
  if (!isNaN(sNum) && !isNaN(cNum) && sNum === cNum) return true
  return false
}
