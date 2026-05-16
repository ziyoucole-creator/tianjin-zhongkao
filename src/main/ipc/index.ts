import type { BrowserWindow } from 'electron'
import { registerAssessmentHandlers } from './assessment'
import { registerScraperHandlers } from './scraper'
import { registerExerciseHandlers } from './exercise'
import { registerErrorBookHandlers } from './errorbook'
import { registerProgressHandlers } from './progress'
import { registerMockExamHandlers } from './mockexam'
import { registerLLMHandlers } from './llm'
import { registerCurriculumHandlers } from './curriculum'
import { registerUpdateHandlers } from './update'
import { registerSettingsHandlers } from './settings'

export function registerAllHandlers(mainWindow?: BrowserWindow): void {
  registerAssessmentHandlers()
  registerScraperHandlers()
  registerExerciseHandlers()
  registerErrorBookHandlers()
  registerProgressHandlers()
  registerMockExamHandlers()
  registerLLMHandlers()
  registerCurriculumHandlers()
  registerUpdateHandlers(mainWindow)
  registerSettingsHandlers()
}
