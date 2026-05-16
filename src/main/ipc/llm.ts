import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

// 从环境变量或 apikey.txt 读取 DeepSeek API Key
function getApiKey(): string {
  const envKey = process.env.DEEPSEEK_API_KEY
  if (envKey && envKey.trim()) {
    return envKey.trim()
  }
  try {
    const devPath = path.join(process.cwd(), 'apikey.txt')
    if (fs.existsSync(devPath)) {
      return fs.readFileSync(devPath, 'utf-8').trim()
    }
    const prodPath = path.join(process.resourcesPath || '', 'apikey.txt')
    if (fs.existsSync(prodPath)) {
      return fs.readFileSync(prodPath, 'utf-8').trim()
    }
    return ''
  } catch {
    return ''
  }
}

const DEEPSEEK_HOST = 'api.deepseek.com'
const DEEPSEEK_PATH = '/v1/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'

function httpsPost(host: string, path: string, headers: Record<string, string>, body: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host,
      path,
      method: 'POST',
      headers,
      timeout: 60000,
    }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, data: Buffer.concat(chunks).toString('utf-8') })
      })
      res.on('error', reject)
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')) })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

interface GenerateSimilarParams {
  subject: string
  kpName: string
  questionContent: string
  questionType: string
  questionAnswer: string
  questionAnalysis: string | null
  difficulty: string
  count?: number
}

interface GeneratedQuestion {
  content: string
  options: string[] | null
  answer: string
  analysis: string
  type: string
  difficulty: string
}

function buildPrompt(params: GenerateSimilarParams): string {
  const { subject, kpName, questionContent, questionType, questionAnswer, questionAnalysis, difficulty, count } = params
  const n = count || 3

  const typeDesc: Record<string, string> = {
    single_choice: '单选题（4个选项，A/B/C/D）',
    multiple_choice: '多选题（4个选项，有多个正确答案）',
    fill_blank: '填空题',
  }

  const diffDesc: Record<string, string> = {
    easy: '基础',
    medium: '中等',
    hard: '较难',
  }

  return `你是一位天津中考备考辅导专家。请根据下面的错题，生成 ${n} 道同类型题目，帮助学生巩固薄弱知识点。

【原题信息】
- 科目：${subject}
- 知识点：${kpName}
- 题型：${typeDesc[questionType] || questionType}
- 难度：${diffDesc[difficulty] || difficulty}
- 原题：${questionContent}
- 正确答案：${questionAnswer}
${questionAnalysis ? `- 解析：${questionAnalysis}` : ''}

【生成要求】
1. 每道题必须考查与"${kpName}"相同的知识点，但题干内容不能与原题重复
2. 难度保持与"${diffDesc[difficulty] || difficulty}"一致
3. 如果是选择题，必须给出4个选项（A/B/C/D），其中单选题只有1个正确答案，多选题有2个以上正确答案
4. 如果是填空题，答案应是简短的词语、数字或短句
5. 每道题必须附带详细解析
6. 题目语言应符合初中生阅读水平
7. 优先结合天津中考命题风格

请严格按照以下 JSON 格式输出（不要输出其他内容）：
{
  "questions": [
    {
      "content": "题目内容",
      "options": ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"],
      "answer": "A",
      "analysis": "解析内容",
      "type": "${questionType}",
      "difficulty": "${difficulty}"
    }
  ]
}

注意：options 字段对于选择题是必需的（4个选项的数组），对于填空题应设为 null。
请只输出 JSON，不要包含其他说明文字。`
}

function parseResponse(raw: string): { questions?: GeneratedQuestion[] } | { error: string; raw?: string } {
  // 尝试直接解析
  try { const p = JSON.parse(raw); if (p?.questions) return p } catch { /* continue */ }
  // 尝试提取 JSON 块
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try { const p = JSON.parse(jsonMatch[0]); if (p?.questions) return p } catch { /* continue */ }
    try { const p = JSON.parse(jsonMatch[0].replace(/```json|```/g, '')); if (p?.questions) return p } catch { /* continue */ }
  }
  return { error: 'AI 返回格式异常，无法解析题目', raw }
}

export function registerLLMHandlers(): void {
  ipcMain.handle('llm:generateSimilar', async (_event, params: GenerateSimilarParams) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      return { error: '未找到 API Key，请设置环境变量 DEEPSEEK_API_KEY 或在项目根目录放置 apikey.txt 文件' }
    }

    const prompt = buildPrompt(params)
    const body = JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: '你是一位专业的天津中考备考辅导专家，擅长命制初中各科试题。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4096,
    })

    try {
      const { status, data } = await httpsPost(DEEPSEEK_HOST, DEEPSEEK_PATH, {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      }, body)

      if (status !== 200) {
        return { error: `API 请求失败 (${status}): ${data.slice(0, 300)}` }
      }

      let respData: any
      try { respData = JSON.parse(data) } catch {
        return { error: 'API 返回数据解析失败' }
      }

      const content = respData.choices?.[0]?.message?.content || ''
      if (!content) {
        return { error: 'AI 未返回内容', raw: data.slice(0, 500) }
      }

      const result = parseResponse(content)
      if ('error' in result) {
        return result
      }

      return { questions: result.questions! }
    } catch (err: any) {
      return { error: `网络请求失败: ${err.message || String(err)}` }
    }
  })

  ipcMain.handle('llm:checkKey', async () => {
    const apiKey = getApiKey()
    return { hasKey: !!apiKey && apiKey.length > 10 }
  })
}
