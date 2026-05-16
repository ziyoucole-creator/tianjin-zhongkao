import { app, ipcMain, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as https from 'https'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import initSqlJs from 'sql.js'
import { getDatabase, saveDatabase } from '../database/connection'

// ==================== 题库更新 ====================

function downloadFile(url: string, destPath: string, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http
    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location
        if (redirectUrl) {
          downloadFile(redirectUrl, destPath, onProgress).then(resolve).catch(reject)
          return
        }
        reject(new Error(`Redirect without location`))
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      const total = parseInt(res.headers['content-length'] || '0', 10)
      let downloaded = 0
      const file = fs.createWriteStream(destPath)

      res.on('data', (chunk: Buffer) => {
        downloaded += chunk.length
        if (total > 0 && onProgress) {
          onProgress(Math.round((downloaded / total) * 100))
        }
      })

      res.pipe(file)

      file.on('finish', () => {
        file.close()
        resolve()
      })

      file.on('error', (err) => {
        fs.unlinkSync(destPath)
        reject(err)
      })
    }).on('error', reject)
  })
}

// ==================== 软件更新 ====================

let updateDownloaded = false

function setupAutoUpdater(mainWindow: BrowserWindow): void {
  if (process.env.ELECTRON_RENDERER_URL) {
    console.log('[update] Dev mode detected, autoUpdater not active')
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.allowPrerelease = false

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update:app-state', { state: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:app-state', {
      state: 'available',
      version: info.version,
    })
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update:app-state', { state: 'up-to-date' })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:app-state', {
      state: 'downloading',
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', () => {
    updateDownloaded = true
    mainWindow.webContents.send('update:app-state', { state: 'downloaded' })
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update:app-state', {
      state: 'error',
      message: err.message,
    })
  })
}

export function registerUpdateHandlers(mainWindow?: BrowserWindow): void {
  if (mainWindow) {
    setupAutoUpdater(mainWindow)
  }

  // --- 软件更新 ---
  ipcMain.handle('update:get-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('update:check-app', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        hasUpdate: !!result?.updateInfo,
        version: result?.updateInfo?.version || null,
      }
    } catch (err) {
      if (process.env.ELECTRON_RENDERER_URL) {
        return { hasUpdate: false, version: null }
      }
      throw err
    }
  })

  ipcMain.handle('update:download-app', async () => {
    await autoUpdater.downloadUpdate()
  })

  ipcMain.handle('update:install', () => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall()
    }
  })

  // --- 题库更新 ---
  ipcMain.handle('update:check-db', async (_event, url: string) => {
    const tempDir = os.tmpdir()
    const tempDb = path.join(tempDir, `zhongkao-update-${Date.now()}.db`)
    let newQuestions = 0
    let newKps = 0

    try {
      await downloadFile(url, tempDb)

      const remoteBuffer = fs.readFileSync(tempDb)
      const remoteSql = await initSqlJs()
      const remoteDb = new remoteSql.Database(new Uint8Array(remoteBuffer))

      const localDb = await getDatabase()

      const remoteKps = remoteDb.exec('SELECT * FROM knowledge_points')
      if (remoteKps.length > 0) {
        for (const row of remoteKps[0].values) {
          const [id, subjectId, parentId, name, weight, examFreq] = row
          const localCheck = localDb.exec(
            'SELECT COUNT(*) as cnt FROM knowledge_points WHERE id = ?',
            { bind: [id] }
          )
          const exists = localCheck[0]?.values?.[0]?.[0] as number > 0
          if (!exists) {
            localDb.run(
              'INSERT INTO knowledge_points (id, subject_id, parent_id, name, weight, exam_frequency) VALUES (?, ?, ?, ?, ?, ?)',
              [id, subjectId, parentId, String(name), weight, String(examFreq)]
            )
            newKps++
          }
        }
      }

      const remoteQs = remoteDb.exec('SELECT * FROM questions')
      if (remoteQs.length > 0) {
        const insertStmt = localDb.prepare(
          `INSERT INTO questions (subject_id, kp_id, type, difficulty, content, options, answer, analysis, year, source, exam_frequency)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )

        for (const row of remoteQs[0].values) {
          const [/* id */, subjectId, kpId, type, difficulty, content, options, answer, analysis, year, source, examFreq] = row
          const dupCheck = localDb.exec(
            'SELECT COUNT(*) as cnt FROM questions WHERE content = ? AND subject_id = ? AND type = ?',
            { bind: [content, subjectId, type] }
          )
          const exists = (dupCheck[0]?.values?.[0]?.[0] as number) > 0
          if (!exists) {
            try {
              insertStmt.bind([
                subjectId,
                kpId,
                String(type),
                String(difficulty),
                String(content),
                options,
                String(answer),
                analysis,
                year,
                String(source),
                String(examFreq),
              ])
              insertStmt.step()
              insertStmt.reset()
              newQuestions++
            } catch {
              insertStmt.reset()
            }
          }
        }
        insertStmt.free()
      }

      if (newQuestions > 0 || newKps > 0) {
        saveDatabase()
      }

      remoteDb.close()

      return {
        success: true,
        newQuestions,
        newKps,
      }
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
        newQuestions: 0,
        newKps: 0,
      }
    } finally {
      try {
        if (fs.existsSync(tempDb)) fs.unlinkSync(tempDb)
      } catch { /* ignore */ }
    }
  })
}
