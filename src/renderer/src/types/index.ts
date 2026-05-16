export interface Subject {
  id: number
  name: string
  total_score: number
  is_open_book: number
}

export interface KnowledgePoint {
  id: number
  subject_id: number
  parent_id: number | null
  name: string
  weight: number
  exam_frequency: 'high' | 'medium' | 'low'
}

export interface Question {
  id: number
  subject_id: number
  kp_id: number
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

export interface AssessmentRecord {
  id: number
  mode: 'quick' | 'full'
  subjects: string
  total_score: number
  max_score: number
  duration_seconds: number | null
  created_at: string
}

export interface SubjectScore {
  id: number
  name: string
  total_score: number
  is_open_book: number
  total: number
  correct: number
  score: number
  maxScore: number
}

export interface KpAnalysis {
  name: string
  total: number
  correct: number
  rate: number
}

export interface AssessmentReport {
  assessment: AssessmentRecord
  subjects: SubjectScore[]
  kpAnalysis: Record<number, KpAnalysis[]>
}

export type AssessmentMode = 'quick' | 'full'

export interface AnswerState {
  questionId: number
  studentAnswer: string
  isCorrect: boolean | null
  correctAnswer: string | null
}
