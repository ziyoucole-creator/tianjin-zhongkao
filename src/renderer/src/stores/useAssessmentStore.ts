import { create } from 'zustand'
import type { Question, AssessmentMode, AnswerState, AssessmentReport } from '../types'

interface AssessmentState {
  // 评估设置
  mode: AssessmentMode
  selectedSubjectIds: number[]
  questionsPerSubject: number

  // 评估过程
  assessmentId: number | null
  questions: Record<number, Question[]>  // subjectId -> questions
  currentSubjectIndex: number
  currentQuestionIndex: number
  answers: Record<number, AnswerState>  // questionId -> answer state
  startTime: number | null
  flaggedQuestions: Set<number>

  // 报告
  report: AssessmentReport | null

  // 历史
  history: { id: number; mode: string; total_score: number; max_score: number; created_at: string }[]

  // 状态
  step: 'setup' | 'exam' | 'report'

  // Actions
  setMode: (mode: AssessmentMode) => void
  toggleSubject: (subjectId: number) => void
  setQuestionsPerSubject: (n: number) => void
  startAssessment: () => Promise<void>
  submitAnswer: (questionId: number, answer: string) => Promise<void>
  goToNext: () => void
  goToPrev: () => void
  goToQuestion: (subjectIndex: number, questionIndex: number) => void
  toggleFlag: (questionId: number) => void
  finishAssessment: () => Promise<void>
  loadHistory: () => Promise<void>
  reset: () => void
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  mode: 'quick',
  selectedSubjectIds: [],
  questionsPerSubject: 15,
  assessmentId: null,
  questions: {},
  currentSubjectIndex: 0,
  currentQuestionIndex: 0,
  answers: {},
  startTime: null,
  flaggedQuestions: new Set(),
  report: null,
  history: [],
  step: 'setup',

  setMode: (mode) => set({ mode }),
  toggleSubject: (subjectId) => set((s) => ({
    selectedSubjectIds: s.selectedSubjectIds.includes(subjectId)
      ? s.selectedSubjectIds.filter((id) => id !== subjectId)
      : [...s.selectedSubjectIds, subjectId]
  })),
  setQuestionsPerSubject: (n) => set({ questionsPerSubject: n }),

  startAssessment: async () => {
    const { mode, selectedSubjectIds, questionsPerSubject } = get()
    set({
      step: 'exam', answers: {}, currentSubjectIndex: 0, currentQuestionIndex: 0,
      startTime: Date.now(), flaggedQuestions: new Set()
    })

    const questions = await window.api.assessment.getQuestions(selectedSubjectIds, questionsPerSubject)
    const { assessmentId } = await window.api.assessment.create(mode, selectedSubjectIds, questions)

    set({ questions, assessmentId })
  },

  submitAnswer: async (questionId, studentAnswer) => {
    const { assessmentId, startTime } = get()
    if (!assessmentId) return

    const durationSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0

    const result = await window.api.assessment.submitAnswer(
      assessmentId, questionId, studentAnswer, durationSeconds
    )

    set((s) => ({
      answers: {
        ...s.answers,
        [questionId]: {
          questionId,
          studentAnswer,
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer
        }
      }
    }))
  },

  goToNext: () => {
    const { selectedSubjectIds, questions, currentSubjectIndex, currentQuestionIndex } = get()
    const subjectId = selectedSubjectIds[currentSubjectIndex]
    const subjectQuestions = questions[subjectId] || []

    if (currentQuestionIndex < subjectQuestions.length - 1) {
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
      const prevSubjectId = selectedSubjectIds[currentSubjectIndex - 1]
      const prevQuestions = get().questions[prevSubjectId] || []
      set({
        currentSubjectIndex: currentSubjectIndex - 1,
        currentQuestionIndex: prevQuestions.length - 1
      })
    }
  },

  goToQuestion: (subjectIndex, questionIndex) => {
    const { selectedSubjectIds, currentSubjectIndex, questions } = get()
    // Only allow navigating to current or previous subjects
    if (subjectIndex <= currentSubjectIndex) {
      const subjectId = selectedSubjectIds[subjectIndex]
      const qs = questions[subjectId] || []
      if (questionIndex >= 0 && questionIndex < qs.length) {
        set({ currentSubjectIndex: subjectIndex, currentQuestionIndex: questionIndex })
      }
    }
  },

  toggleFlag: (questionId) => {
    set((s) => {
      const next = new Set(s.flaggedQuestions)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return { flaggedQuestions: next }
    })
  },

  finishAssessment: async () => {
    const { assessmentId } = get()
    if (!assessmentId) return

    const report = await window.api.assessment.getReport(assessmentId)
    set({ report, step: 'report' })
  },

  loadHistory: async () => {
    const history = await window.api.assessment.getHistory()
    set({ history })
  },

  reset: () => set({
    mode: 'quick',
    selectedSubjectIds: [],
    questionsPerSubject: 15,
    assessmentId: null,
    questions: {},
    currentSubjectIndex: 0,
    currentQuestionIndex: 0,
    answers: {},
    startTime: null,
    flaggedQuestions: new Set(),
    report: null,
    step: 'setup'
  })
}))
