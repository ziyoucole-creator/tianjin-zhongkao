import { BrowserWindow } from 'electron'

/**
 * 用 Electron 内置 Chromium 加载页面并提取渲染后的 HTML
 * 能处理 SPA、JS 动态渲染、反爬机制
 */
export function fetchRenderedHTML(url: string, timeout = 20000): Promise<string> {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    })

    const timer = setTimeout(() => {
      // 超时：提取当前已渲染的内容
      win.webContents.executeJavaScript('document.documentElement.outerHTML')
        .then((html: string) => {
          cleanup()
          resolve(html)
        })
        .catch(() => {
          cleanup()
          reject(new Error(`Timeout loading: ${url}`))
        })
    }, timeout)

    const cleanup = () => {
      clearTimeout(timer)
      if (!win.isDestroyed()) win.close()
    }

    win.webContents.on('did-finish-load', async () => {
      // 等待额外的 JS 渲染（SPA 框架）
      await sleep(2000)

      // 尝试等待常见的内容容器出现
      try {
        await win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const check = () => {
              const selectors = [
                '.question-item', '.exam-question', '.test-item',
                '.paper-list', '.content-wrapper', '.main-content',
                '[class*="question"]', '[class*="paper"]', '[class*="exam"]',
                'article', '.container', '.wrapper'
              ]
              for (const sel of selectors) {
                const el = document.querySelector(sel)
                if (el && el.textContent && el.textContent.trim().length > 50) {
                  resolve(true)
                  return
                }
              }
              // 如果页面有足够多的文本，也算加载成功
              if (document.body && document.body.textContent && document.body.textContent.length > 500) {
                resolve(true)
                return
              }
              setTimeout(check, 500)
            }
            setTimeout(() => resolve(false), 5000)
            check()
          })
        `)
      } catch { /* ignore */ }

      try {
        const html = await win.webContents.executeJavaScript('document.documentElement.outerHTML')
        cleanup()
        resolve(html)
      } catch (err) {
        cleanup()
        reject(err)
      }
    })

    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      cleanup()
      reject(new Error(`Failed to load: ${errorDescription} (${errorCode})`))
    })

    win.loadURL(url)
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 在已渲染的页面中执行 JS 来批量提取题目数据
 */
export async function extractQuestionsFromPage(url: string): Promise<{
  questions: Array<{
    content: string
    options: string[] | null
    answer: string
    analysis: string | null
  }>
  year: number
}> {
  const html = await fetchRenderedHTML(url)

  // 使用一个隐藏窗口来运行提取脚本
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    })

    win.webContents.on('did-finish-load', async () => {
      try {
        const result = await win.webContents.executeJavaScript(`
          (function() {
            const questions = []

            // 策略1: 查找结构化的题目容器
            const questionBlocks = document.querySelectorAll([
              '.question-item', '.exam-li', '.topic-item',
              '[class*="questionItem"]', '[class*="examItem"]',
              '.paper-question', '.test-question',
              'li[class*="question"]', 'div[class*="question"]',
              '.content-item', '.problem-item'
            ].join(','))

            if (questionBlocks.length > 0) {
              questionBlocks.forEach(block => {
                const text = (block.textContent || '').trim()
                if (text.length < 10) return

                // 查找选项
                const optionEls = block.querySelectorAll([
                  '.option', '.choice', '[class*="option"]', '[class*="choice"]',
                  'label', 'li[class*="opt"]'
                ].join(','))
                const options = Array.from(optionEls)
                  .map(el => (el.textContent || '').trim())
                  .filter(t => t.length > 0 && t.length < 500)

                // 查找答案
                const answerEl = block.querySelector([
                  '.answer', '.correct', '.key', '.right',
                  '[class*="answer"]', '[class*="correct"]', '[class*="key"]'
                ].join(','))
                const answer = answerEl ? (answerEl.textContent || '').trim() : ''

                // 查找解析
                const analysisEl = block.querySelector([
                  '.analysis', '.explain', '.solution', '.jiexi',
                  '[class*="analysis"]', '[class*="explain"]'
                ].join(','))
                const analysis = analysisEl ? (analysisEl.textContent || '').trim() : null

                questions.push({
                  content: text.substring(0, 2000),
                  options: options.length >= 2 ? options.slice(0, 8) : null,
                  answer: answer || '[答案待确认]',
                  analysis: analysis
                })
              })
            }

            // 策略2: 如果是试卷页面，按题号切分
            if (questions.length === 0) {
              const mainContent = document.querySelector([
                '.paper-content', '.exam-content', '.main', 'article',
                '.content', '#content', '.detail-content', '[class*="content"]'
              ].join(','))

              const container = mainContent || document.body
              const fullText = (container.textContent || '').trim()

              // 按题号模式分割: "1." "1、" "第1题" "(1)" 等
              const parts = fullText.split(/(?=(?:^|\\n)\\s*(?:第)?\\d{1,3}[.、．题)])/g)
                .filter(p => p.trim().length > 15)

              if (parts.length >= 3) {
                parts.forEach(part => {
                  const lines = part.trim().split(/\\n|\\r\\n/).filter(l => l.trim())
                  if (lines.length === 0) return

                  // 提取选项行（A. B. C. D. 模式）
                  const optionLines = lines.filter(l => /^\\s*[A-D][.、．)]/.test(l.trim()))
                  const questionLines = lines.filter(l =>
                    !/^\\s*[A-D][.、．)]/.test(l.trim()) &&
                    !/^\\s*(答案|解析|解答|详解|考点)/.test(l.trim())
                  )

                  // 查找答案和解析
                  const answerMatch = part.match(/(?:答案|正确答案)[：:：]\\s*(.+?)(?:\\n|$)/)
                  const analysisMatch = part.match(/(?:解析|详解|解答)[：:：]\\s*([\\s\\S]+?)(?=(?:\\n(?:答案|解析|考点)|$))/)

                  questions.push({
                    content: questionLines.join('\\n').trim().substring(0, 2000),
                    options: optionLines.length >= 2 ? optionLines : null,
                    answer: answerMatch ? answerMatch[1].trim() : '[答案待确认]',
                    analysis: analysisMatch ? analysisMatch[1].trim() : null
                  })
                })
              }
            }

            // 策略3: 最保守——整页文本作为一个题组
            if (questions.length === 0) {
              const bodyText = (document.body.textContent || '').trim()
              if (bodyText.length > 50) {
                questions.push({
                  content: bodyText.substring(0, 5000),
                  options: null,
                  answer: '[需手动标注]',
                  analysis: null
                })
              }
            }

            // 从页面中提取年份
            let year = new Date().getFullYear()
            const yearMatch = (document.title + ' ' + (document.body.textContent || ''))
              .match(/(20\\d{2})/)
            if (yearMatch) year = parseInt(yearMatch[1])

            return { questions, year }
          })()
        `)

        resolve(result)
      } catch (err) {
        reject(err)
      }
      win.close()
    })

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  })
}
