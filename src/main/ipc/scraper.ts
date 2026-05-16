import { ipcMain, BrowserWindow } from 'electron'
import { runScrape, onTaskProgress, SCRAPE_SOURCES } from '../scraper/index'
import type { ScrapeTask } from '../scraper/index'

const activeTasks = new Map<string, ScrapeTask>()
let nextTaskId = 1

export function registerScraperHandlers(): void {
  // 获取可用的爬取源
  ipcMain.handle('scraper:getSources', () => {
    return SCRAPE_SOURCES
  })

  // 启动爬取任务
  ipcMain.handle('scraper:start', async (_event, params: {
    source: string
    subject: string
    year: number
  }) => {
    const taskId = `task_${nextTaskId++}`
    const task: ScrapeTask = {
      id: taskId,
      target: params.source,
      subject: params.subject,
      status: 'pending',
      progress: 0,
      total: 0,
      newCount: 0,
      skipCount: 0,
      message: '排队中...'
    }
    activeTasks.set(taskId, task)

    // 异步执行爬取
    runScrape(taskId, params.source, params.subject, params.year)
      .then((result) => {
        activeTasks.set(taskId, result)
      })
      .catch((err) => {
        activeTasks.set(taskId, {
          ...task,
          status: 'failed',
          message: `错误: ${(err as Error).message}`
        })
      })

    return taskId
  })

  // 获取任务状态
  ipcMain.handle('scraper:getTask', (_event, taskId: string) => {
    return activeTasks.get(taskId) || null
  })

  // 获取所有任务
  ipcMain.handle('scraper:getAllTasks', () => {
    return Array.from(activeTasks.values())
  })

  // 后续可通过此监听器推送进度更新到前端
  // electron-vite 不原生支持 main→renderer 推送, 后续可用 webContents.send
}

/**
 * 将 scraper 进度推送到渲染进程
 */
export function setupScraperProgressBridge(win: BrowserWindow): void {
  onTaskProgress((task) => {
    if (!win.isDestroyed()) {
      win.webContents.send('scraper:progress', task)
    }
  })
}
