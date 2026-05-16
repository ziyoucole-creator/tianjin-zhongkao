import { create } from 'zustand'

interface AnswerState {
  questionId: number
  studentAnswer: string
  isCorrect: boolean
  correctAnswer: string
}

interface MockExamState {
  // Setup
  selectedSubjectIds: number[]
  examConfig: Record<number, { timeMin: number; questionCount: number }>

  // Exam
  examId: number | null
  questions: Record<number, any[]>
  answers: Record<number, AnswerState>
  currentSubjectIndex: number
  currentQuestionIndex: number

  // Timer per subject (seconds)
  timeRemaining: number
  totalTimeMin: number

  // Flags
  flaggedQuestions: Set<number>

  // Report
  report: any | null

  // UI
  step: 'setup' | 'exam' | 'report'
  loading: boolean

  // Actions
  toggleSubject: (id: number) => void
  loadConfig: () => Promise<void>
  startExam: () => Promise<void>
  submitAnswer: (questionId: number, answer: string) => Promise<void>
  goToNext: () => void
  goToPrev: () => void
  goToQuestion: (sIdx: number, qIdx: number) => void
  toggleFlag: (questionId: number) => void
  tick: () => void
  finishExam: () => Promise<void>
  reset: () => void
}

export const useMockExamStore = create<MockExamState>((set, get) => ({
  selectedSubjectIds: [2, 1, 3],
  examConfig: {},
  examId: null,
  questions: {},
  answers: {},
  currentSubjectIndex: 0,
  currentQuestionIndex: 0,
  timeRemaining: 0,
  totalTimeMin: 0,
  flaggedQuestions: new Set(),
  report: null,
  step: 'setup',
  loading: false,

  toggleSubject: (id) => set((s) => ({
    selectedSubjectIds: s.selectedSubjectIds.includes(id)
      ? s.selectedSubjectIds.filter((x) => x !== id)
      : [...s.selectedSubjectIds, id]
  })),

  loadConfig: async () => {
    const config = await window.api.mockexam.getConfig()
    set({ examConfig: config })
  },

  startExam: async () => {
    const { selectedSubjectIds } = get()
    set({ loading: true, step: 'exam', answers: {}, currentSubjectIndex: 0, currentQuestionIndex: 0, flaggedQuestions: new Set() })

    const questions = await window.api.mockexam.getQuestions(selectedSubjectIds)
    const { examId, totalMaxScore, totalTimeMin } = await window.api.mockexam.create(selectedSubjectIds, questions)

    set({
      questions,
      examId,
      totalTimeMin,
      timeRemaining: totalTimeMin * 60,
      loading: false
    })
  },

  submitAnswer: async (questionId, studentAnswer) => {
    const { examId } = get()
    if (!examId) return

    const result = await window.api.mockexam.submitAnswer(examId, questionId, studentAnswer)
    set((s) => ({
      answers: {
        ...s.answers,
        [questionId]: { questionId, studentAnswer, isCorrect: result.isCorrect, correctAnswer: result.correctAnswer }
      }
    }))
  },

  goToNext: () => {
    const { selectedSubjectIds, questions, currentSubjectIndex, currentQuestionIndex } = get()
    const sid = selectedSubjectIds[currentSubjectIndex]
    const qs = questions[sid] || []
    if (currentQuestionIndex < qs.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 })
    } else if (currentSubjectIndex < selectedSubjectIds.length - 1) {
      set({ currentSubjectIndex: currentSubjectIndex + 1, currentQuestionIndex: 0 })
    }
  },

  goToPrev: () => {
    const { selectedSubjectIds, currentSubjectIndex, currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 })
    } else if (currentSubjectIndex > 0) {
      const prevSid = selectedSubjectIds[currentSubjectIndex - 1]
      const prevQs = get().questions[prevSid] || []
      set({ currentSubjectIndex: currentSubjectIndex - 1, currentQuestionIndex: prevQs.length - 1 })
    }
  },

  goToQuestion: (sIdx, qIdx) => {
    const { selectedSubjectIds, currentSubjectIndex, questions } = get()
    if (sIdx <= currentSubjectIndex) {
      const sid = selectedSubjectIds[sIdx]
      const qs = questions[sid] || []
      if (qIdx >= 0 && qIdx < qs.length) {
        set({ currentSubjectIndex: sIdx, currentQuestionIndex: qIdx })
      }
    }
  },

  toggleFlag: (questionId) => set((s) => {
    const next = new Set(s.flaggedQuestions)
    if (next.has(questionId)) next.delete(questionId)
    else next.add(questionId)
    return { flaggedQuestions: next }
  }),

  tick: () => set((s) => ({
    timeRemaining: Math.max(0, s.timeRemaining - 1)
  })),

  finishExam: async () => {
    const { examId } = get()
    if (!examId) return
    const report = await window.api.mockexam.getReport(examId)
    set({ report, step: 'report' })
  },

  reset: () => set({
    selectedSubjectIds: [2, 1, 3],
    examId: null,
    questions: {},
    answers: {},
    currentSubjectIndex: 0,
    currentQuestionIndex: 0,
    timeRemaining: 0,
    totalTimeMin: 0,
    flaggedQuestions: new Set(),
    report: null,
    step: 'setup',
    loading: false
  })
}))
