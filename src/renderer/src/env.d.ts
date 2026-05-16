/// <reference types="vite/client" />

interface Question {
  id: number
  subject_id: number
  kp_id: number | null
  type: 'single_choice' | 'multiple_choice' | 'fill_blank'
  difficulty: 'easy' | 'medium' | 'hard'
  content: string
  options: string[] | null
  answer: string
  analysis: string | null
  year: number | null
  source: string
  exam_frequency: string
}

interface Subject {
  id: number
  name: string
  total_score: number
  is_open_book: number
}

interface KnowledgePoint {
  id: number
  subject_id: number
  parent_id: number | null
  name: string
  weight: number
  exam_frequency: string
}

interface AssessmentRecord {
  id: number
  mode: string
  subjects: string
  total_score: number
  max_score: number
  duration_seconds: number | null
  created_at: string
}

interface SubjectScore {
  id: number
  name: string
  total_score: number
  is_open_book: number
  total: number
  correct: number
  score: number
  maxScore: number
}

interface KpAnalysis {
  name: string
  total: number
  correct: number
  rate: number
}

interface AssessmentReport {
  assessment: AssessmentRecord
  subjects: SubjectScore[]
  kpAnalysis: Record<number, KpAnalysis[]>
}

interface ScrapeTask {
  id: string
  target: string
  subject: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  total: number
  newCount: number
  skipCount: number
  message: string
}

interface ScrapeSource {
  name: string
  label: string
  description: string
  subjects: string[]
  years: number[]
  enabled: boolean
}

interface Window {
  api: {
    assessment: {
      getQuestions: (subjectIds: number[], questionsPerSubject: number) => Promise<Record<number, Question[]>>
      create: (mode: string, subjectIds: number[], questions: Record<number, Question[]>) => Promise<{
        assessmentId: number
        maxScore: number
        scoreScale: Record<number, number>
      }>
      submitAnswer: (
        assessmentId: number,
        questionId: number,
        studentAnswer: string,
        durationSeconds: number
      ) => Promise<{ isCorrect: boolean; correctAnswer: string }>
      getReport: (assessmentId: number) => Promise<AssessmentReport>
      getHistory: () => Promise<AssessmentRecord[]>
    }
    data: {
      getSubjects: () => Promise<Subject[]>
      getKnowledgePoints: (subjectId: number) => Promise<KnowledgePoint[]>
    }
    scraper: {
      getSources: () => Promise<ScrapeSource[]>
      start: (source: string, subject: string, year: number) => Promise<string>
      getTask: (taskId: string) => Promise<ScrapeTask | null>
      getAllTasks: () => Promise<ScrapeTask[]>
      onProgress: (callback: (task: ScrapeTask) => void) => () => void
    }
    exercise: {
      getQuestions: (params: {
        subjectId: number; year?: number; type?: string
        difficulty?: string; kpId?: number; page?: number; pageSize?: number
      }) => Promise<{ questions: Question[]; total: number; page: number; pageSize: number }>
      getQuestion: (questionId: number) => Promise<Question | null>
      getFilters: (subjectId: number) => Promise<{
        years: number[]; types: string[]; kps: { id: number; name: string; parent_id: number | null }[]
      }>
      getStats: (subjectId: number) => Promise<{
        total: number; byType: { type: string; count: number }[]
        byDifficulty: { difficulty: string; count: number }[]
        byYear: { year: number; count: number }[]
      }>
    }
    errorbook: {
      getWrongQuestions: (params: {
        subjectId?: number; kpId?: number; page?: number; pageSize?: number
      }) => Promise<{ questions: (Question & { assessment_id: number; student_answer: string; assessment_date: string })[]
        total: number; page: number; pageSize: number }>
      getStats: () => Promise<{
        bySubject: { subject_id: number; subject_name: string; count: number }[]
        byKp: { kp_id: number; kp_name: string; subject_name: string; subject_id: number; count: number }[]
        totalWrong: number; totalAttempts: number
      }>
      markMastered: (questionId: number) => Promise<boolean>
      getPracticeSet: (params: { subjectId?: number; limit?: number }) => Promise<Question[]>
      addWrongQuestion: (params: { questionId: number; studentAnswer: string }) =>
        Promise<{ isCorrect: boolean; correctAnswer: string }>
    }
    progress: {
      getOverview: () => Promise<{
        assessmentCount: number
        lastAssessment: { id: number; total_score: number; max_score: number; created_at: string } | null
        totalQuestions: number; correctQuestions: number; overallAccuracy: number
      }>
      getTrend: () => Promise<{ id: number; score: number; maxScore: number; rate: number; date: string }[]>
      getSubjectTrends: () => Promise<{ date: string; [key: string]: any }[]>
      getMastery: () => Promise<{
        subjectId: number; subjectName: string; kpId: number; kpName: string
        totalAttempts: number; correctAttempts: number; masteryLevel: number; updatedAt: string
      }[]>
      getRecommendations: () => Promise<{
        weakKps: { subjectName: string; kpName: string; masteryLevel: number; totalAttempts: number; correctAttempts: number }[]
        needsReview: { subjectName: string; kpName: string; masteryLevel: number; totalAttempts: number }[]
      }>
    }
    mockexam: {
      getQuestions: (subjectIds: number[]) => Promise<Record<number, Question[]>>
      create: (subjectIds: number[], questions: Record<number, Question[]>) =>
        Promise<{ examId: number; totalMaxScore: number; totalTimeMin: number }>
      submitAnswer: (examId: number, questionId: number, studentAnswer: string) =>
        Promise<{ isCorrect: boolean; correctAnswer: string }>
      getReport: (examId: number) => Promise<{
        assessment: { id: number; total_score: number; max_score: number; created_at: string; duration_seconds: number }
        subjects: (SubjectScore & { kpAnalysis: KpAnalysis[] })[]
        totalTimeMin: number
      }>
      getHistory: () => Promise<any[]>
      getConfig: () => Promise<Record<number, { timeMin: number; questionCount: number }>>
    }
    llm: {
      generateSimilar: (params: {
        subject: string; kpName: string; questionContent: string
        questionType: string; questionAnswer: string
        questionAnalysis: string | null; difficulty: string; count?: number
      }) => Promise<{ questions?: GeneratedQuestion[]; error?: string; raw?: string }>
      checkKey: () => Promise<{ hasKey: boolean }>
    }
    curriculum: {
      getKpQuestionCounts: (kpIds: number[]) => Promise<Record<number, number>>
      getQuestionsByKp: (params: { kpId: number; page?: number; pageSize?: number }) => Promise<{
        questions: (Question & { kp_name: string; subject_name: string })[]
        total: number; page: number; pageSize: number
      }>
      getSubjectStats: (subjectId: number) => Promise<{
        kpCounts: { kpId: number; name: string; questionCount: number }[]
        totalQuestions: number
      }>
    }
    update: {
      getVersion: () => Promise<string>
      checkDb: (url: string) => Promise<{
        success: boolean; newQuestions: number; newKps: number; error?: string
      }>
      checkApp: () => Promise<{ hasUpdate: boolean; version: string | null }>
      downloadApp: () => Promise<void>
      install: () => Promise<void>
      onAppState: (callback: (state: AppUpdateState) => void) => () => void
    }
  }
}

interface AppUpdateState {
  state: 'checking' | 'available' | 'up-to-date' | 'downloading' | 'downloaded' | 'error'
  version?: string
  percent?: number
  message?: string
}

interface GeneratedQuestion {
  content: string
  options: string[] | null
  answer: string
  analysis: string
  type: string
  difficulty: string
}
