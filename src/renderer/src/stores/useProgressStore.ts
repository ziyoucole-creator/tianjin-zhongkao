import { create } from 'zustand'

interface ProgressState {
  overview: {
    assessmentCount: number
    lastAssessment: { id: number; total_score: number; max_score: number; created_at: string } | null
    totalQuestions: number
    correctQuestions: number
    overallAccuracy: number
  } | null

  trend: { id: number; score: number; maxScore: number; rate: number; date: string }[]

  subjectTrends: { date: string; [key: string]: any }[]

  mastery: {
    subjectId: number; subjectName: string; kpId: number; kpName: string
    totalAttempts: number; correctAttempts: number; masteryLevel: number; updatedAt: string
  }[]

  recommendations: {
    weakKps: { subjectName: string; kpName: string; masteryLevel: number; totalAttempts: number }[]
    needsReview: { subjectName: string; kpName: string; masteryLevel: number; totalAttempts: number }[]
  } | null

  loading: boolean

  loadAll: () => Promise<void>
}

export const useProgressStore = create<ProgressState>((set) => ({
  overview: null,
  trend: [],
  subjectTrends: [],
  mastery: [],
  recommendations: null,
  loading: false,

  loadAll: async () => {
    set({ loading: true })
    try {
      const [overview, trend, subjectTrends, mastery, recommendations] = await Promise.all([
        window.api.progress.getOverview(),
        window.api.progress.getTrend(),
        window.api.progress.getSubjectTrends(),
        window.api.progress.getMastery(),
        window.api.progress.getRecommendations()
      ])
      set({ overview, trend, subjectTrends, mastery, recommendations })
    } catch { /* ignore */ }
    finally { set({ loading: false }) }
  }
}))
