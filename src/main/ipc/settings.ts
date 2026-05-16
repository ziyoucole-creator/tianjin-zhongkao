import { ipcMain, safeStorage } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

function getKeyPath(): string {
  return path.join(app.getPath('userData'), 'apikey.enc')
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getApiKey', async () => {
    try {
      const keyPath = getKeyPath()
      if (!fs.existsSync(keyPath)) return ''
      const encrypted = fs.readFileSync(keyPath)
      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(encrypted)
      }
      return ''
    } catch {
      return ''
    }
  })

  ipcMain.handle('settings:setApiKey', async (_event, key: string) => {
    try {
      if (!key.trim()) {
        const keyPath = getKeyPath()
        if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath)
        return true
      }
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(key.trim())
        fs.writeFileSync(getKeyPath(), encrypted)
        return true
      }
      return false
    } catch {
      return false
    }
  })
}
