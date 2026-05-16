import { contextBridge, ipcRenderer } from 'electron'

const api = {
  assessment: {
    getQuestions: (subjectIds: number[], questionsPerSubject: number) =>
      ipcRenderer.invoke('assessment:getQuestions', { subjectIds, questionsPerSubject }),
    create: (mode: string, subjectIds: number[], questions: Record<number, unknown[]>) =>
      ipcRenderer.invoke('assessment:create', { mode, subjectIds, questions }),
    submitAnswer: (assessmentId: number, questionId: number, studentAnswer: string, durationSeconds: number) =>
      ipcRenderer.invoke('assessment:submitAnswer', { assessmentId, questionId, studentAnswer, durationSeconds }),
    getReport: (assessmentId: number) =>
      ipcRenderer.invoke('assessment:getReport', assessmentId),
    getHistory: () =>
      ipcRenderer.invoke('assessment:getHistory')
  },
  data: {
    getSubjects: () => ipcRenderer.invoke('data:getSubjects'),
    getKnowledgePoints: (subjectId: number) => ipcRenderer.invoke('data:getKnowledgePoints', subjectId)
  },
  scraper: {
    getSources: () => ipcRenderer.invoke('scraper:getSources'),
    start: (source: string, subject: string, year: number) =>
      ipcRenderer.invoke('scraper:start', { source, subject, year }),
    getTask: (taskId: string) => ipcRenderer.invoke('scraper:getTask', taskId),
    getAllTasks: () => ipcRenderer.invoke('scraper:getAllTasks'),
    onProgress: (callback: (task: any) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, task: any) => callback(task)
      ipcRenderer.on('scraper:progress', handler)
      return () => ipcRenderer.removeListener('scraper:progress', handler)
    }
  },
  exercise: {
    getQuestions: (params: {
      subjectId: number; year?: number; type?: string;
      difficulty?: string; kpId?: number; page?: number; pageSize?: number
    }) => ipcRenderer.invoke('exercise:getQuestions', params),
    getQuestion: (questionId: number) => ipcRenderer.invoke('exercise:getQuestion', questionId),
    getFilters: (subjectId: number) => ipcRenderer.invoke('exercise:getFilters', subjectId),
    getStats: (subjectId: number) => ipcRenderer.invoke('exercise:getStats', subjectId)
  },
  errorbook: {
    getWrongQuestions: (params: {
      subjectId?: number; kpId?: number; page?: number; pageSize?: number
    }) => ipcRenderer.invoke('errorbook:getWrongQuestions', params),
    getStats: () => ipcRenderer.invoke('errorbook:getStats'),
    markMastered: (questionId: number) => ipcRenderer.invoke('errorbook:markMastered', questionId),
    getPracticeSet: (params: { subjectId?: number; limit?: number }) =>
      ipcRenderer.invoke('errorbook:getPracticeSet', params),
    addWrongQuestion: (params: { questionId: number; studentAnswer: string }) =>
      ipcRenderer.invoke('errorbook:addWrongQuestion', params)
  },
  progress: {
    getOverview: () => ipcRenderer.invoke('progress:getOverview'),
    getTrend: () => ipcRenderer.invoke('progress:getTrend'),
    getSubjectTrends: () => ipcRenderer.invoke('progress:getSubjectTrends'),
    getMastery: () => ipcRenderer.invoke('progress:getMastery'),
    getRecommendations: () => ipcRenderer.invoke('progress:getRecommendations')
  },
  mockexam: {
    getQuestions: (subjectIds: number[]) => ipcRenderer.invoke('mockexam:getQuestions', { subjectIds }),
    create: (subjectIds: number[], questions: Record<number, any[]>) =>
      ipcRenderer.invoke('mockexam:create', { subjectIds, questions }),
    submitAnswer: (examId: number, questionId: number, studentAnswer: string) =>
      ipcRenderer.invoke('mockexam:submitAnswer', { examId, questionId, studentAnswer }),
    getReport: (examId: number) => ipcRenderer.invoke('mockexam:getReport', examId),
    getHistory: () => ipcRenderer.invoke('mockexam:getHistory'),
    getConfig: () => ipcRenderer.invoke('mockexam:getConfig') as Promise<Record<number, { timeMin: number; questionCount: number }>>
  },
  llm: {
    generateSimilar: (params: {
      subject: string; kpName: string; questionContent: string
      questionType: string; questionAnswer: string
      questionAnalysis: string | null; difficulty: string; count?: number
    }) => ipcRenderer.invoke('llm:generateSimilar', params),
    checkKey: () => ipcRenderer.invoke('llm:checkKey') as Promise<{ hasKey: boolean }>
  },
  curriculum: {
    getKpQuestionCounts: (kpIds: number[]) => ipcRenderer.invoke('curriculum:getKpQuestionCounts', kpIds),
    getQuestionsByKp: (params: { kpId: number; page?: number; pageSize?: number }) =>
      ipcRenderer.invoke('curriculum:getQuestionsByKp', params),
    getSubjectStats: (subjectId: number) => ipcRenderer.invoke('curriculum:getSubjectStats', subjectId)
  },
  update: {
    getVersion: () => ipcRenderer.invoke('update:get-version') as Promise<string>,
    checkDb: (url: string) => ipcRenderer.invoke('update:check-db', url) as Promise<{
      success: boolean; newQuestions: number; newKps: number; error?: string
    }>,
    checkApp: () => ipcRenderer.invoke('update:check-app') as Promise<{ hasUpdate: boolean; version: string | null }>,
    downloadApp: () => ipcRenderer.invoke('update:download-app'),
    install: () => ipcRenderer.invoke('update:install'),
    onAppState: (callback: (state: AppUpdateState) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: AppUpdateState) => callback(state)
      ipcRenderer.on('update:app-state', handler)
      return () => ipcRenderer.removeListener('update:app-state', handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
