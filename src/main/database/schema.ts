import type { Database as SqlJsDatabase } from 'sql.js'

export function initDatabase(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      is_open_book INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS knowledge_points (
      id INTEGER PRIMARY KEY,
      subject_id INTEGER NOT NULL,
      parent_id INTEGER,
      name TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 1,
      exam_frequency TEXT NOT NULL DEFAULT 'medium',
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (parent_id) REFERENCES knowledge_points(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      subject_id INTEGER NOT NULL,
      kp_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('single_choice', 'multiple_choice', 'fill_blank')),
      difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      content TEXT NOT NULL,
      options TEXT,
      answer TEXT NOT NULL,
      analysis TEXT,
      year INTEGER,
      source TEXT DEFAULT 'simulated',
      exam_frequency TEXT NOT NULL DEFAULT 'medium',
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (kp_id) REFERENCES knowledge_points(id)
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL CHECK(mode IN ('quick', 'full', 'mock')),
      subjects TEXT NOT NULL,
      total_score REAL DEFAULT 0,
      max_score REAL DEFAULT 0,
      duration_seconds INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS assessment_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      student_answer TEXT,
      is_correct INTEGER,
      duration_seconds INTEGER,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS student_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      kp_id INTEGER NOT NULL,
      total_attempts INTEGER DEFAULT 0,
      correct_attempts INTEGER DEFAULT 0,
      mastery_level REAL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (kp_id) REFERENCES knowledge_points(id),
      UNIQUE(subject_id, kp_id)
    );
  `)
}
