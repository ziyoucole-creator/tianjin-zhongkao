import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { getDatabase, closeDatabase, saveDatabase } from './database/connection'
import { initDatabase } from './database/schema'
import { seedDatabase } from './database/seed'
import { registerAllHandlers } from './ipc/index'
import { setupScraperProgressBridge } from './ipc/scraper'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: '天津中考备考助手',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // 异步初始化数据库
  const db = await getDatabase()
  initDatabase(db)
  seedDatabase(db)
  saveDatabase()

  // 注册 IPC 处理器
  registerAllHandlers(mainWindow!)

  createWindow()

  // 设置爬虫进度桥（需要 BrowserWindow 引用）
  if (mainWindow) {
    setupScraperProgressBridge(mainWindow)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
