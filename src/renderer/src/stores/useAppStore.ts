import { create } from 'zustand'
import type { Subject } from '../types'

interface AppState {
  subjects: Subject[]
  loading: boolean
  collapsed: boolean
  setSubjects: (subjects: Subject[]) => void
  setLoading: (loading: boolean) => void
  toggleCollapsed: () => void
  loadSubjects: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  subjects: [],
  loading: false,
  collapsed: false,

  setSubjects: (subjects) => set({ subjects }),
  setLoading: (loading) => set({ loading }),
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),

  loadSubjects: async () => {
    set({ loading: true })
    try {
      const subjects = await window.api.data.getSubjects()
      set({ subjects, loading: false })
    } catch {
      set({ loading: false })
    }
  }
}))
