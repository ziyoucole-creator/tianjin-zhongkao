import { create } from 'zustand'

interface DrillDownQuestion {
  id: number
  subject_id: number
  kp_id: number
  type: string
  difficulty: string
  content: string
  options: string[] | null
  answer: string
  analysis: string | null
  year: number | null
  source: string
  kp_name: string
  subject_name: string
}

interface CurriculumState {
  // KP question counts
  kpQuestionCounts: Record<number, number>
  loadingCounts: boolean

  // Drill-down
  drillDownKpId: number | null
  drillDownKpName: string
  drillDownQuestions: DrillDownQuestion[]
  drillDownTotal: number
  drillDownPage: number
  drillDownLoading: boolean

  // Subject overview
  subjectKpCounts: { kpId: number; name: string; questionCount: number }[]
  subjectTotalQuestions: number

  // Actions
  loadKpCounts: (kpIds: number[]) => Promise<void>
  drillDown: (kpId: number, kpName: string, page?: number) => Promise<void>
  closeDrillDown: () => void
  loadSubjectStats: (subjectId: number) => Promise<void>
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  kpQuestionCounts: {},
  loadingCounts: false,

  drillDownKpId: null,
  drillDownKpName: '',
  drillDownQuestions: [],
  drillDownTotal: 0,
  drillDownPage: 1,
  drillDownLoading: false,

  subjectKpCounts: [],
  subjectTotalQuestions: 0,

  loadKpCounts: async (kpIds: number[]) => {
    const uniqueIds = [...new Set(kpIds)]
    set({ loadingCounts: true })
    try {
      const counts = await window.api.curriculum.getKpQuestionCounts(uniqueIds)
      set({ kpQuestionCounts: counts })
    } catch {
      // ignore errors
    } finally {
      set({ loadingCounts: false })
    }
  },

  drillDown: async (kpId: number, kpName: string, page = 1) => {
    set({ drillDownLoading: true, drillDownKpId: kpId, drillDownKpName: kpName, drillDownPage: page })
    try {
      const result = await window.api.curriculum.getQuestionsByKp({ kpId, page, pageSize: 10 })
      set({
        drillDownQuestions: result.questions,
        drillDownTotal: result.total,
        drillDownPage: result.page,
      })
    } catch {
      // ignore errors
    } finally {
      set({ drillDownLoading: false })
    }
  },

  closeDrillDown: () => {
    set({
      drillDownKpId: null,
      drillDownKpName: '',
      drillDownQuestions: [],
      drillDownTotal: 0,
      drillDownPage: 1,
    })
  },

  loadSubjectStats: async (subjectId: number) => {
    try {
      const stats = await window.api.curriculum.getSubjectStats(subjectId)
      set({ subjectKpCounts: stats.kpCounts, subjectTotalQuestions: stats.totalQuestions })
    } catch {
      // ignore errors
    }
  },
}))
