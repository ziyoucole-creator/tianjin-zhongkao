import { create } from 'zustand'

interface FilterState {
  subjectId: number
  year: number | undefined
  type: string | undefined
  difficulty: string | undefined
  kpId: number | undefined
}

interface FilterMeta {
  years: number[]
  types: string[]
  kps: { id: number; name: string; parent_id: number | null }[]
}

interface QuestionItem {
  id: number
  subject_id: number
  kp_id: number | null
  type: string
  difficulty: string
  content: string
  options: string[] | null
  answer: string
  analysis: string | null
  year: number | null
  source: string
  exam_frequency: string
  kp_name?: string
  subject_name?: string
}

interface ExerciseState {
  // Filters
  filters: FilterState
  filterMeta: FilterMeta
  subjects: { id: number; name: string }[]

  // Question list
  questions: QuestionItem[]
  total: number
  page: number
  pageSize: number

  // UI state
  loading: boolean
  showAnswer: Record<number, boolean>

  // Actions
  setFilter: (key: keyof FilterState, value: number | string | undefined) => void
  setPage: (page: number) => void
  loadSubjects: () => Promise<void>
  loadFilters: (subjectId: number) => Promise<void>
  loadQuestions: () => Promise<void>
  toggleAnswer: (questionId: number) => void
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  filters: {
    subjectId: 2,
    year: undefined,
    type: undefined,
    difficulty: undefined,
    kpId: undefined
  },
  filterMeta: { years: [], types: [], kps: [] },
  subjects: [],

  questions: [],
  total: 0,
  page: 1,
  pageSize: 20,

  loading: false,
  showAnswer: {},

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value }, page: 1 }))
  },

  setPage: (page) => set({ page }),

  loadSubjects: async () => {
    try {
      const subs = await window.api.data.getSubjects()
      set({ subjects: subs })
    } catch { /* ignore */ }
  },

  loadFilters: async (subjectId) => {
    try {
      const meta = await window.api.exercise.getFilters(subjectId)
      set({ filterMeta: meta })
    } catch { /* ignore */ }
  },

  loadQuestions: async () => {
    const { filters, page, pageSize } = get()
    set({ loading: true })
    try {
      const result = await window.api.exercise.getQuestions({
        ...filters,
        page,
        pageSize
      })
      set({
        questions: result.questions as QuestionItem[],
        total: result.total,
        showAnswer: {}
      })
    } catch { /* ignore */ }
    finally {
      set({ loading: false })
    }
  },

  toggleAnswer: (questionId) => {
    set((s) => ({
      showAnswer: { ...s.showAnswer, [questionId]: !s.showAnswer[questionId] }
    }))
  }
}))
