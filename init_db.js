// Standalone database initialization script
// Imports all 4 open datasets into sql.js SQLite database
// Run: node init_db.js

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(__dirname, 'data', 'zhongkao.db');
const CMMLU_DIR = path.join(DATA_DIR, 'datasets', 'cmmlu', 'test');
const CEVAL_DIR = path.join(DATA_DIR, 'datasets', 'ceval_json');
const RACE_DIR = path.join(DATA_DIR, 'datasets', 'race_json');
const HISTORY_PATH = path.join(DATA_DIR, 'history_std.json');

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ============ SCHEMA ============
function initSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL,
      total_score INTEGER NOT NULL, is_open_book INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS knowledge_points (
      id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL,
      parent_id INTEGER, name TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 1,
      exam_frequency TEXT NOT NULL DEFAULT 'medium',
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (parent_id) REFERENCES knowledge_points(id)
    );
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL,
      kp_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('single_choice', 'multiple_choice', 'fill_blank')),
      difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      content TEXT NOT NULL, options TEXT, answer TEXT NOT NULL,
      analysis TEXT, year INTEGER, source TEXT DEFAULT 'simulated',
      exam_frequency TEXT NOT NULL DEFAULT 'medium',
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (kp_id) REFERENCES knowledge_points(id)
    );
    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, mode TEXT NOT NULL,
      subjects TEXT NOT NULL, total_score REAL DEFAULT 0,
      max_score REAL DEFAULT 0, duration_seconds INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS assessment_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, assessment_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL, student_answer TEXT,
      is_correct INTEGER, duration_seconds INTEGER,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );
    CREATE TABLE IF NOT EXISTS student_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id INTEGER NOT NULL,
      kp_id INTEGER NOT NULL, total_attempts INTEGER DEFAULT 0,
      correct_attempts INTEGER DEFAULT 0, mastery_level REAL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (kp_id) REFERENCES knowledge_points(id),
      UNIQUE(subject_id, kp_id)
    );
  `);
}

// ============ SUBJECTS & KNOWLEDGE POINTS ============
function seedStructure(db) {
  const subjects = [
    [1, '语文', 120, 0], [2, '数学', 120, 0], [3, '英语', 120, 0],
    [4, '物理', 100, 0], [5, '化学', 100, 0], [6, '历史', 100, 1],
    [7, '道德与法治', 100, 1],
  ];
  const insSub = db.prepare('INSERT INTO subjects VALUES (?,?,?,?)');
  for (const s of subjects) { insSub.bind(s); insSub.step(); insSub.reset(); }
  insSub.free();

  const kps = [
    [2001,2,null,'数与式',3,'high'],[2002,2,2001,'实数运算',2,'high'],[2003,2,2001,'代数式与因式分解',2,'high'],
    [2004,2,null,'方程与不等式',3,'high'],[2005,2,2004,'一元二次方程',2,'high'],[2006,2,2004,'不等式与不等式组',2,'medium'],
    [2007,2,null,'函数',3,'high'],[2008,2,2007,'一次函数',2,'high'],[2009,2,2007,'二次函数',3,'high'],[2010,2,2007,'反比例函数',2,'medium'],
    [2011,2,null,'几何图形',3,'high'],[2012,2,2011,'三角形',2,'high'],[2013,2,2011,'四边形',2,'high'],[2014,2,2011,'圆',3,'high'],[2015,2,null,'统计与概率',1,'medium'],
    [1001,1,null,'基础知识',2,'high'],[1002,1,1001,'字音字形',1,'high'],[1003,1,1001,'词语成语运用',1,'medium'],
    [1004,1,1001,'病句辨析',1,'high'],[1005,1,null,'古诗文',3,'high'],[1006,1,1005,'古诗默写',2,'high'],
    [1007,1,1005,'古诗词鉴赏',2,'high'],[1008,1,null,'文言文阅读',2,'high'],[1009,1,null,'现代文阅读',3,'high'],
    [1010,1,null,'名著阅读',1,'medium'],[1011,1,null,'作文',3,'high'],
    [3001,3,null,'单项选择',2,'high'],[3002,3,null,'完形填空',2,'high'],[3003,3,null,'阅读理解',3,'high'],
    [3004,3,null,'补全对话',1,'medium'],[3005,3,null,'书面表达',2,'high'],[3006,3,null,'听力理解',2,'high'],
    [4001,4,null,'力学',3,'high'],[4002,4,4001,'运动和力',2,'high'],[4003,4,4001,'压强与浮力',2,'high'],
    [4004,4,4001,'功和机械能',2,'medium'],[4005,4,null,'电学',3,'high'],[4006,4,4005,'电路基础',2,'high'],
    [4007,4,4005,'欧姆定律与电功率',2,'high'],[4008,4,null,'光学',1,'medium'],[4009,4,null,'热学',1,'medium'],
    [5001,5,null,'物质构成',2,'high'],[5002,5,null,'化学方程式',3,'high'],[5003,5,null,'溶液',2,'medium'],
    [5004,5,null,'酸碱盐',3,'high'],[5005,5,null,'金属与材料',2,'medium'],[5006,5,null,'化学实验',2,'high'],
    [6001,6,null,'中国古代史',2,'high'],[6002,6,null,'中国近代史',3,'high'],[6003,6,null,'中国现代史',2,'high'],[6004,6,null,'世界史',2,'medium'],
    [7001,7,null,'道德',2,'high'],[7002,7,null,'法律',3,'high'],[7003,7,null,'国情',3,'high'],
  ];
  const insKp = db.prepare('INSERT INTO knowledge_points VALUES (?,?,?,?,?,?)');
  for (const k of kps) { insKp.bind(k); insKp.step(); insKp.reset(); }
  insKp.free();
}

// ============ HELPERS ============
const insQ = (db) => db.prepare(
  'INSERT INTO questions (subject_id,kp_id,type,difficulty,content,options,answer,analysis,year,source,exam_frequency) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
);

function bindAndInsert(stmt, params) {
  try { stmt.bind(params); stmt.step(); stmt.reset(); return true; }
  catch { stmt.reset(); return false; }
}

// ============ 1. INTERNLM-HISTORY ============
function importHistory(db) {
  console.log('[1/4] Importing InternLM-History (历史)...');
  if (!fs.existsSync(HISTORY_PATH)) { console.log('  SKIP: file not found'); return 0; }

  const dataset = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
  const stmt = insQ(db);
  let count = 0;

  for (const q of (dataset.test || [])) {
    // Map InternLM subject_id to our KP
    let kpId = 6002; // default 中国近代史
    if (q.subject_id <= 6) kpId = 6001;
    else if (q.subject_id <= 16) kpId = 6002;
    else if (q.subject_id <= 19) kpId = 6003;
    else kpId = 6004;

    let qType = 'fill_blank';
    let options = null;
    let answer = '';

    if (q.type === 0 && q.choices && q.choices.length >= 2) {
      qType = 'single_choice';
      options = JSON.stringify(q.choices.map((c, i) => `${OPTION_LABELS[i]}. ${c}`));
      const ansIdx = typeof q.ans === 'number' ? q.ans : parseInt(String(q.ans), 10);
      answer = OPTION_LABELS[ansIdx] || String(q.ans);
    } else {
      answer = String(q.ans);
    }

    const content = (q.content || '').replace(/##n##/g, '____').trim();
    if (content.length < 5) continue;

    const diff = (content + (q.analysis || '')).includes('综合') ? 'hard' :
      (content + (q.analysis || '')).includes('标志') ? 'easy' : 'medium';

    const yearMatch = (q.origin || '').match(/(20\d{2})/);
    const year = yearMatch ? Number(yearMatch[1]) : 2022;

    if (bindAndInsert(stmt, [6, kpId, qType, diff, content, options, answer, q.analysis || null, year, q.origin, 'high']))
      count++;
  }
  stmt.free();
  console.log(`  Imported ${count} history questions`);
  return count;
}

// ============ 2. CMMLU ============
const CMMLU_MAP = [
  { sid: 1, kp: 1001, file: 'elementary_chinese' },
  { sid: 1, kp: 1008, file: 'ancient_chinese' },
  { sid: 1, kp: 1010, file: 'chinese_literature' },
  { sid: 1, kp: 1009, file: 'modern_chinese' },
  { sid: 2, kp: 2001, file: 'elementary_mathematics' },
  { sid: 2, kp: 2004, file: 'high_school_mathematics' },
  { sid: 4, kp: 4001, file: 'conceptual_physics' },
  { sid: 4, kp: 4005, file: 'high_school_physics' },
  { sid: 5, kp: 5001, file: 'high_school_chemistry' },
  { sid: 6, kp: 6002, file: 'chinese_history' },
  { sid: 7, kp: 7003, file: 'high_school_politics' },
];

function parseCSVLine(line) {
  const result = [];
  let current = '', inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function importCMMLU(db) {
  console.log('[2/4] Importing CMMLU (语文/数学/物理/化学/历史/政治)...');
  if (!fs.existsSync(CMMLU_DIR)) { console.log('  SKIP: dir not found'); return 0; }

  const stmt = insQ(db);
  let count = 0;

  for (const m of CMMLU_MAP) {
    const csvPath = path.join(CMMLU_DIR, `${m.file}.csv`);
    if (!fs.existsSync(csvPath)) continue;

    const lines = fs.readFileSync(csvPath, 'utf-8').split(/\r?\n/).filter(l => l.trim());
    let fileCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 7) continue;
      const [, question, optA, optB, optC, optD, answer] = fields;
      if (!question || question.length < 5) continue;
      const ans = (answer || '').trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(ans)) continue;

      const options = JSON.stringify([
        `A. ${(optA || '').trim()}`,
        `B. ${(optB || '').trim()}`,
        `C. ${(optC || '').trim()}`,
        `D. ${(optD || '').trim()}`
      ]);

      const diff = m.sid === 1
        ? (question.length < 30 ? 'easy' : question.length > 80 ? 'hard' : 'medium')
        : (question.includes('综合') || question.includes('证明') ? 'hard' : question.includes('属于') ? 'easy' : 'medium');

      if (bindAndInsert(stmt, [m.sid, m.kp, 'single_choice', diff, question.trim(), options, ans, null, 2023, `CMMLU/${m.file}`, 'medium']))
        { count++; fileCount++; }
    }
  }
  stmt.free();
  console.log(`  Imported ${count} questions`);
  return count;
}

// ============ 3. CEVAL ============
const CEVAL_MAP = [
  { sid: 2, file: 'middle_school_mathematics', kpKw: [['方程',2004],['函数',2007],['几何',2011],['统计',2015]], defKp: 2001 },
  { sid: 4, file: 'middle_school_physics', kpKw: [['运动',4002],['力',4002],['压强',4003],['浮力',4003],['电路',4006],['电压',4006],['欧姆',4007],['电功率',4007],['光',4008],['热',4009],['功',4004]], defKp: 4001 },
  { sid: 5, file: 'middle_school_chemistry', kpKw: [['化学式',5002],['方程式',5002],['反应',5002],['溶液',5003],['酸',5004],['碱',5004],['盐',5004],['金属',5005],['实验',5006]], defKp: 5001 },
  { sid: 7, file: 'middle_school_politics', kpKw: [['道德',7001],['诚信',7001],['法律',7002],['权利',7002],['宪法',7002]], defKp: 7003 },
  { sid: 1, file: 'high_school_chinese', kpKw: [['字音',1002],['字形',1002],['成语',1003],['病句',1004],['语病',1004],['古诗',1007],['诗词',1007],['文言',1008],['现代文',1009]], defKp: 1004 },
];

function importCEval(db) {
  console.log('[3/4] Importing CEval (数学/物理/化学/政治/语文)...');
  if (!fs.existsSync(CEVAL_DIR)) { console.log('  SKIP: dir not found'); return 0; }

  const stmt = insQ(db);
  let count = 0;

  for (const m of CEVAL_MAP) {
    for (const split of ['test', 'val', 'dev']) {
      const jsonPath = path.join(CEVAL_DIR, `${m.file}_${split}-00000-of-00001.json`);
      if (!fs.existsSync(jsonPath)) continue;

      let records;
      try { records = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')); }
      catch { continue; }

      for (const q of records) {
        if (!q.question || q.question.length < 5) continue;
        if (!['A','B','C','D'].includes((q.answer || '').toUpperCase())) continue;

        // Match KP
        let kpId = m.defKp;
        for (const [kw, kid] of m.kpKw) {
          if (q.question.includes(kw)) { kpId = kid; break; }
        }

        const options = JSON.stringify([
          `A. ${(q.A || '').trim()}`, `B. ${(q.B || '').trim()}`,
          `C. ${(q.C || '').trim()}`, `D. ${(q.D || '').trim()}`
        ]);

        const fullText = q.question + (q.explanation || '');
        const diff = fullText.includes('综合') || fullText.includes('证明') ? 'hard'
          : (fullText.includes('属于') && q.question.length < 40) ? 'easy' : 'medium';

        if (bindAndInsert(stmt, [m.sid, kpId, 'single_choice', diff, q.question.trim(), options, q.answer.toUpperCase(), q.explanation || null, 2023, `CEval/${m.file}`, 'high']))
          count++;
      }
    }
  }
  stmt.free();
  console.log(`  Imported ${count} questions`);
  return count;
}

// ============ 4. RACE ============
function importRACE(db) {
  console.log('[4/4] Importing RACE (英语阅读理解)...');
  if (!fs.existsSync(RACE_DIR)) { console.log('  SKIP: dir not found'); return 0; }

  const stmt = insQ(db);
  let count = 0;

  const files = fs.readdirSync(RACE_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const jsonPath = path.join(RACE_DIR, file);
    console.log(`  Reading ${file}...`);
    let records;
    try { records = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')); }
    catch (e) { console.log(`  Parse error: ${e.message}`); continue; }

    console.log(`  Processing ${records.length} records...`);
    let fileCount = 0;
    const batchSize = 500;
    let batch = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r.article || !r.question || !r.options || r.options.length < 2 || !r.answer) continue;

      const ans = (r.answer || '').trim().toUpperCase();
      if (OPTION_LABELS.indexOf(ans) < 0 || ans.length !== 1) continue;

      const content = r.article.trim() + '\n\n' + r.question.trim();
      if (content.length < 20) continue;

      const options = JSON.stringify(r.options.map((o, j) => `${OPTION_LABELS[j]}. ${o.trim()}`));
      const totalLen = r.article.length + r.question.length;
      const diff = totalLen > 2000 ? 'hard' : totalLen < 500 ? 'easy' : 'medium';

      // Batch insert for performance
      try {
        stmt.bind([3, 3003, 'single_choice', diff, content, options, ans, null, 2020, `RACE/middle/${r.example_id}`, 'high']);
        stmt.step();
        stmt.reset();
        count++; fileCount++;
      } catch { stmt.reset(); }

      if ((i + 1) % 5000 === 0) {
        console.log(`    ${i + 1}/${records.length} processed, ${fileCount} inserted`);
      }
    }
    console.log(`  ${file}: ${fileCount} inserted`);
  }
  stmt.free();
  console.log(`  Total imported: ${count} English questions`);
  return count;
}

// ============ MAIN ============
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   天津中考题库 — 数据初始化              ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  console.log('Initializing schema...');
  initSchema(db);

  console.log('Seeding subjects and knowledge points...');
  seedStructure(db);

  console.log('\n--- Importing Open Datasets ---\n');

  const t0 = Date.now();
  const counts = {};

  counts.history = importHistory(db);
  counts.cmmlu = importCMMLU(db);
  counts.ceval = importCEval(db);
  counts.race = importRACE(db);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // ============ REPORT ============
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   导入完成 — 统计报告                    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`  InternLM-History (MIT):      ${counts.history.toLocaleString()} 题 (历史)`);
  console.log(`  CMMLU (Apache 2.0):          ${counts.cmmlu.toLocaleString()} 题 (语/数/物/化/史/政)`);
  console.log(`  CEval (CC BY-NC-SA 4.0):     ${counts.ceval.toLocaleString()} 题 (数/物/化/政/语)`);
  console.log(`  RACE (Apache 2.0):           ${counts.race.toLocaleString()} 题 (英语)`);
  console.log(`  ─────────────────────────────`);
  console.log(`  TOTAL:                       ${total.toLocaleString()} 题`);
  console.log(`  Time:                        ${elapsed}s`);

  // Questions by subject
  const subjectNames = {1:'语文',2:'数学',3:'英语',4:'物理',5:'化学',6:'历史',7:'道德与法治'};
  console.log('\n  按科目统计:');
  for (const [sid, name] of Object.entries(subjectNames)) {
    const stmt = db.prepare('SELECT COUNT(*) FROM questions WHERE subject_id = ?');
    stmt.bind([Number(sid)]);
    if (stmt.step()) {
      const cnt = stmt.getAsObject()['COUNT(*)'];
      console.log(`    ${name}: ${cnt.toLocaleString()} 题`);
    }
    stmt.free();
  }

  // Save database
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
  console.log(`\n  Database saved: ${DB_PATH} (${sizeMB} MB)`);

  db.close();
  console.log('\n✓ 初始化完成！启动 Electron 应用即可使用。\n');
}

main().catch(e => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(1); });
