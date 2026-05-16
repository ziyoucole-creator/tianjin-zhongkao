import initSqlJs from 'sql.js'
import type { Database as SqlJsDatabase } from 'sql.js'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

let db: SqlJsDatabase
let SQL: Awaited<ReturnType<typeof initSqlJs>>
let dbPath: string

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!db) {
    SQL = await initSqlJs()
    dbPath = path.join(app.getPath('userData'), 'zhongkao.db')

    // Check for pre-built database in several locations
    const prebuiltPaths = [
      path.join(process.cwd(), 'data', 'zhongkao.db'),
      path.join(process.resourcesPath || '', 'data', 'zhongkao.db'),
    ]

    if (fs.existsSync(dbPath)) {
      // Load existing user database
      const buffer = fs.readFileSync(dbPath)
      db = new SQL.Database(buffer)
      console.log('[db] Loaded existing database from userData')
    } else {
      // Try pre-built database first
      let prebuiltLoaded = false
      for (const p of prebuiltPaths) {
        if (fs.existsSync(p)) {
          try {
            const buffer = fs.readFileSync(p)
            db = new SQL.Database(buffer)
            console.log(`[db] Loaded pre-built database from ${p} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)
            prebuiltLoaded = true
            break
          } catch (err) {
            console.log(`[db] Failed to load pre-built database: ${(err as Error).message}`)
          }
        }
      }
      if (!prebuiltLoaded) {
        db = new SQL.Database()
        console.log('[db] Created new empty database')
      }
    }

    db.run('PRAGMA foreign_keys = ON;')
  }
  return db
}

export function saveDatabase(): void {
  if (db && dbPath) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = undefined as unknown as SqlJsDatabase
  }
}

export function getSqlModule() {
  return SQL
}
