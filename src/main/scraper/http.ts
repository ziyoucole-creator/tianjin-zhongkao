import * as https from 'https'
import * as http from 'http'

export interface FetchOptions {
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
}

export function fetchHTML(url: string, options: FetchOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const transport = urlObj.protocol === 'https:' ? https : http
    const headers = { ...DEFAULT_HEADERS, ...options.headers }
    const timeout = options.timeout || 15000

    const req = transport.get(url, { headers, timeout }, (res) => {
      // 处理重定向
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href
        fetchHTML(redirectUrl, options).then(resolve).catch(reject)
        return
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`))
        return
      }

      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        let html = Buffer.concat(chunks).toString('utf-8')
        // 处理 gzip（如果服务器忽略 Accept-Encoding）
        resolve(html)
      })
      res.on('error', reject)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timeout: ${url}`))
    })
    req.on('error', reject)
  })
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
