import { create } from 'zustand'

interface WrongQuestion {
  id: number; subject_id: number; kp_id: number | null
  type: string; difficulty: string; content: string
  options: string[] | null; answer: string; analysis: string | null
  year: number | null; source: string; exam_frequency: string
  kp_name?: string; subject_name?: string
  assessment_id: number; student_answer: string; assessment_date: string
}

interface ErrorBookState {
  // Filters
  subjectId: number | undefined
  kpId: number | undefined

  // Wrong question list
  questions: WrongQuestion[]
  total: number
  page: number
  pageSize: number

  // Stats
  stats: {
    bySubject: { subject_id: number; subject_name: string; count: number }[]
    byKp: { kp_id: number; kp_name: string; subject_name: string; subject_id: number; count: number }[]
    totalWrong: number
    totalAttempts: number
  } | null

  // Practice mode
  practiceQuestions: any[]
  showAnswer: Record<number, boolean>
  practiceInput: Record<number, string>
  practiceResult: Record<number, { isCorrect: boolean; correctAnswer: string } | null>

  // UI
  loading: boolean
  mode: 'browse' | 'practice'

  // Actions
  setFilter: (key: 'subjectId' | 'kpId', value: number | undefined) => void
  setPage: (page: number) => void
  loadQuestions: () => Promise<void>
  loadStats: () => Promise<void>
  markMastered: (questionId: number) => Promise<void>
  startPractice: (subjectId?: number) => Promise<void>
  toggleAnswer: (questionId: number) => void
  setPracticeInput: (questionId: number, value: string) => void
  submitPracticeAnswer: (questionId: number) => void
  endPractice: () => void
}

export const useErrorBookStore = create<ErrorBookState>((set, get) => ({
  subjectId: undefined,
  kpId: undefined,
  questions: [],
  total: 0,
  page: 1,
  pageSize: 20,
  stats: null,
  practiceQuestions: [],
  showAnswer: {},
  practiceInput: {},
  practiceResult: {},
  loading: false,
  mode: 'browse',

  setFilter: (key, value) => set((s) => ({ [key]: value, page: 1 } as any)),

  setPage: (page) => set({ page }),

  loadQuestions: async () => {
    const { subjectId, kpId, page, pageSize } = get()
    set({ loading: true })
    try {
      const result = await window.api.errorbook.getWrongQuestions({ subjectId, kpId, page, pageSize })
      set({ questions: result.questions as WrongQuestion[], total: result.total, showAnswer: {} })
    } catch { /* ignore */ }
    finally { set({ loading: false }) }
  },

  loadStats: async () => {
    try {
      const stats = await window.api.errorbook.getStats()
      set({ stats })
    } catch { /* ignore */ }
  },

  markMastered: async (questionId) => {
    await window.api.errorbook.markMastered(questionId)
    const { questions, total } = get()
    set({
      questions: questions.filter((q) => q.id !== questionId),
      total: total - 1
    })
  },

  startPractice: async (subjectId) => {
    set({ loading: true, mode: 'practice', showAnswer: {}, practiceInput: {}, practiceResult: {} })
    try {
      const questions = await window.api.errorbook.getPracticeSet({ subjectId, limit: 15 })
      set({ practiceQuestions: questions })
    } catch { /* ignore */ }
    finally { set({ loading: false }) }
  },

  toggleAnswer: (questionId) => {
    set((s) => ({ showAnswer: { ...s.showAnswer, [questionId]: !s.showAnswer[questionId] } }))
  },

  setPracticeInput: (questionId, value) => {
    set((s) => ({ practiceInput: { ...s.practiceInput, [questionId]: value } }))
  },

  submitPracticeAnswer: (questionId) => {
    const { practiceQuestions, practiceInput } = get()
    const q = practiceQuestions.find((q: any) => q.id === questionId)
    if (!q) return

    const studentAnswer = (practiceInput[questionId] || '').trim()
    const s = studentAnswer.replace(/\s+/g, '').toLowerCase()
    const c = (q.answer || '').replace(/\s+/g, '').toLowerCase()
    const isCorrect = s === c

    set((s) => ({
      practiceResult: {
        ...s.practiceResult,
        [questionId]: { isCorrect, correctAnswer: q.answer }
      },
      showAnswer: { ...s.showAnswer, [questionId]: true }
    }))
  },

  endPractice: () => set({ mode: 'browse', practiceQuestions: [], practiceInput: {}, practiceResult: {}, showAnswer: {} })
}))
