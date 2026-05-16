import type { Database as SqlJsDatabase } from 'sql.js'
import { importHistoryData } from './import-real-data'
import { importCMMLUData } from './import-cmmlu'
import { importCEvalData } from './import-ceval'
import { importRACEData } from './import-race'
import { seedDevQuestions } from './seed-dev-questions'

export function seedDatabase(db: SqlJsDatabase): void {
  // Migration: rename "道德与法治" to "道法" for cleaner display
  db.run("UPDATE subjects SET name = '道法' WHERE name = '道德与法治'")

  const stmt = db.prepare('SELECT COUNT(*) as count FROM subjects')
  stmt.step()
  const count = stmt.getAsObject().count as number
  stmt.free()

  if (count === 0) {

  // ========== 科目 ==========
  const insertSubject = db.prepare(
    'INSERT INTO subjects (id, name, total_score, is_open_book) VALUES (?, ?, ?, ?)'
  )
  const subjects: [number, string, number, number][] = [
    [1, '语文', 120, 0],
    [2, '数学', 120, 0],
    [3, '英语', 120, 0],
    [4, '物理', 100, 0],
    [5, '化学', 100, 0],
    [6, '历史', 100, 1],
    [7, '道法', 100, 1],
  ]
  for (const s of subjects) {
    insertSubject.bind(s)
    insertSubject.step()
    insertSubject.reset()
  }
  insertSubject.free()

  // ========== 知识点 ==========
  const insertKP = db.prepare(
    'INSERT INTO knowledge_points (id, subject_id, parent_id, name, weight, exam_frequency) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const kps: [number, number, number | null, string, number, string][] = [
    // 数学 (subject_id=2)
    [2001, 2, null, '数与式', 3, 'high'],
    [2002, 2, 2001, '实数运算', 2, 'high'],
    [2003, 2, 2001, '代数式与因式分解', 2, 'high'],
    [2004, 2, null, '方程与不等式', 3, 'high'],
    [2005, 2, 2004, '一元二次方程', 2, 'high'],
    [2006, 2, 2004, '不等式与不等式组', 2, 'medium'],
    [2007, 2, null, '函数', 3, 'high'],
    [2008, 2, 2007, '一次函数', 2, 'high'],
    [2009, 2, 2007, '二次函数', 3, 'high'],
    [2010, 2, 2007, '反比例函数', 2, 'medium'],
    [2011, 2, null, '几何图形', 3, 'high'],
    [2012, 2, 2011, '三角形', 2, 'high'],
    [2013, 2, 2011, '四边形', 2, 'high'],
    [2014, 2, 2011, '圆', 3, 'high'],
    [2015, 2, null, '统计与概率', 1, 'medium'],
    // 语文 (subject_id=1)
    [1001, 1, null, '基础知识', 2, 'high'],
    [1002, 1, 1001, '字音字形', 1, 'high'],
    [1003, 1, 1001, '词语成语运用', 1, 'medium'],
    [1004, 1, 1001, '病句辨析', 1, 'high'],
    [1005, 1, null, '古诗文', 3, 'high'],
    [1006, 1, 1005, '古诗默写', 2, 'high'],
    [1007, 1, 1005, '古诗词鉴赏', 2, 'high'],
    [1008, 1, null, '文言文阅读', 2, 'high'],
    [1009, 1, null, '现代文阅读', 3, 'high'],
    [1010, 1, null, '名著阅读', 1, 'medium'],
    [1011, 1, null, '作文', 3, 'high'],
    // 英语 (subject_id=3)
    [3001, 3, null, '单项选择', 2, 'high'],
    [3002, 3, null, '完形填空', 2, 'high'],
    [3003, 3, null, '阅读理解', 3, 'high'],
    [3004, 3, null, '补全对话', 1, 'medium'],
    [3005, 3, null, '书面表达', 2, 'high'],
    [3006, 3, null, '听力理解', 2, 'high'],
    // 物理 (subject_id=4)
    [4001, 4, null, '力学', 3, 'high'],
    [4002, 4, 4001, '运动和力', 2, 'high'],
    [4003, 4, 4001, '压强与浮力', 2, 'high'],
    [4004, 4, 4001, '功和机械能', 2, 'medium'],
    [4005, 4, null, '电学', 3, 'high'],
    [4006, 4, 4005, '电路基础', 2, 'high'],
    [4007, 4, 4005, '欧姆定律与电功率', 2, 'high'],
    [4008, 4, null, '光学', 1, 'medium'],
    [4009, 4, null, '热学', 1, 'medium'],
    // 化学 (subject_id=5)
    [5001, 5, null, '物质构成', 2, 'high'],
    [5002, 5, null, '化学方程式', 3, 'high'],
    [5003, 5, null, '溶液', 2, 'medium'],
    [5004, 5, null, '酸碱盐', 3, 'high'],
    [5005, 5, null, '金属与材料', 2, 'medium'],
    [5006, 5, null, '化学实验', 2, 'high'],
    // 历史 (subject_id=6)
    [6001, 6, null, '中国古代史', 2, 'high'],
    [6002, 6, null, '中国近代史', 3, 'high'],
    [6003, 6, null, '中国现代史', 2, 'high'],
    [6004, 6, null, '世界史', 2, 'medium'],
    // 道法 (subject_id=7)
    [7001, 7, null, '道德', 2, 'high'],
    [7002, 7, null, '法律', 3, 'high'],
    [7003, 7, null, '国情', 3, 'high'],
  ]
  for (const kp of kps) {
    insertKP.bind(kp)
    insertKP.step()
    insertKP.reset()
  }
  insertKP.free()

  // ========== 导入真实真题数据 ==========
  console.log('[seed] Subjects and knowledge points seeded.')
  console.log('[seed] Attempting to import real exam data from open datasets...')

  try {
    const historyCount = importHistoryData(db)
    console.log(`[seed] History: ${historyCount} questions (InternLM-History, MIT)`)
  } catch (err) {
    console.log('[seed] History import failed:', (err as Error).message)
  }

  try {
    const cevalCount = importCEvalData(db)
    console.log(`[seed] CEval: ${cevalCount} questions (CC BY-NC-SA 4.0)`)
  } catch (err) {
    console.log('[seed] CEval import failed:', (err as Error).message)
  }

  try {
    const raceCount = importRACEData(db)
    console.log(`[seed] RACE: ${raceCount} English questions (Apache 2.0)`)
  } catch (err) {
    console.log('[seed] RACE import failed:', (err as Error).message)
  }
  } // end if count === 0 (initial seed)

  // CMMLU: re-import every time so keyword mapping updates apply
  try {
    const cmmluCount = importCMMLUData(db)
    console.log(`[seed] CMMLU: ${cmmluCount} questions (Apache 2.0)`)
  } catch (err) {
    console.log('[seed] CMMLU import failed:', (err as Error).message)
  }

  // Dev questions: fill gaps for all KPs so drill-down always works during development
  // Runs every time to ensure questions are present even on existing databases
  try {
    const devCount = seedDevQuestions(db)
    if (devCount > 0) {
      console.log(`[seed] Dev questions: ${devCount} inserted`)
    }
  } catch (err) {
    console.log('[seed] Dev questions import failed:', (err as Error).message)
  }

  console.log('[seed] Database seeding complete. Use the scraper to fetch more real questions.')
}
