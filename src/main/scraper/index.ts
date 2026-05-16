import { EventEmitter } from 'events'
import { getDatabase } from '../database/connection'
import { saveQuestions, createTask } from './storage'
import { scrapeZujuan } from './targets/zujuan'
import { scrapeYoutike } from './targets/youtike'
import type { ScrapedQuestion, ScrapeTask } from './types'

export { SCRAPE_SOURCES, BUNDLED_DATASETS } from './types'
export type { ScrapeTask, ScrapeSource } from './types'

const scraperEmitter = new EventEmitter()

/**
 * 运行爬取任务
 */
export async function runScrape(
  taskId: string,
  sourceName: string,
  subject: string,
  year: number
): Promise<ScrapeTask> {
  const db = await getDatabase()
  const task = createTask(taskId, sourceName, subject)
  task.status = 'running'

  const emitProgress = () => {
    scraperEmitter.emit('task-progress', task)
  }

  const onProgress = (current: number, total: number, msg: string) => {
    task.progress = current
    task.total = total
    task.message = msg
    emitProgress()
  }

  try {
    let questions: ScrapedQuestion[] = []

    switch (sourceName) {
      case 'zujuan':
        questions = await scrapeZujuan(subject, year, onProgress)
        break
      case 'youtike':
        questions = await scrapeYoutike(subject, year, onProgress)
        break
      default:
        throw new Error(`Unknown source: ${sourceName}`)
    }

    // 去重存入数据库
    const { inserted, skipped } = saveQuestions(db, questions)

    task.status = 'completed'
    task.newCount = inserted
    task.skipCount = skipped
    task.message = `完成：新增 ${inserted} 题，跳过重复 ${skipped} 题`
    emitProgress()
  } catch (err) {
    task.status = 'failed'
    task.message = `失败: ${(err as Error).message}`
    emitProgress()
  }

  return task
}

/**
 * 订阅任务进度（供IPC使用）
 */
export function onTaskProgress(callback: (task: ScrapeTask) => void): void {
  scraperEmitter.on('task-progress', callback)
}

export function offTaskProgress(callback: (task: ScrapeTask) => void): void {
  scraperEmitter.off('task-progress', callback)
}
