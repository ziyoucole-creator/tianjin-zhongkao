import * as cheerio from 'cheerio'
import type { ScrapedQuestion } from './types'

const SUBJECT_KEYWORDS: Record<number, string[]> = {
  1: ['语文', 'yuwen', 'chinese'],
  2: ['数学', 'shuxue', 'math'],
  3: ['英语', 'yingyu', 'english'],
  4: ['物理', 'wuli', 'physics'],
  5: ['化学', 'huaxue', 'chemistry'],
  6: ['历史', 'lishi', 'history'],
  7: ['道德与法治', '政治', '道法', 'daode', 'politics', 'zhengzhi']
}

/**
 * 根据页面标题或URL推断科目ID
 */
export function inferSubjectId(text: string, url: string): number {
  const combined = (text + url).toLowerCase()
  for (const [id, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    for (const kw of keywords) {
      if (combined.includes(kw)) return Number(id)
    }
  }
  return 2 // 默认数学
}

/**
 * 推断难度等级
 */
export function inferDifficulty(text: string): 'easy' | 'medium' | 'hard' {
  const t = text.toLowerCase()
  if (t.includes('困难') || t.includes('拔高') || t.includes('压轴') || t.includes('hard')) return 'hard'
  if (t.includes('容易') || t.includes('基础') || t.includes('简单') || t.includes('easy')) return 'easy'
  return 'medium'
}

/**
 * 推断题型
 */
export function inferQuestionType(text: string, options: string[] | null): ScrapedQuestion['type'] {
  const t = text.toLowerCase()
  if (options && options.length > 0) {
    if (t.includes('多选') || t.includes('不定项')) return 'multiple_choice'
    return 'single_choice'
  }
  return 'fill_blank'
}

/**
 * 清理文本：去HTML实体、多余空白
 */
export function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 通用题目提取：从HTML中查找常见的题目容器
 */
export function extractQuestions($: cheerio.CheerioAPI, container: cheerio.Cheerio<cheerio.AnyNode>): string[] {
  const questions: string[] = []

  // 常见题目选择器
  const selectors = [
    '.question-item', '.question-content', '.topic-content',
    '.exam-question', '.question-stem', '.q-content',
    '[class*="question"]', '[class*="topic"]',
    '.test-item', '.problem-item'
  ]

  for (const sel of selectors) {
    container.find(sel).each((_i, el) => {
      const text = cleanText($(el).text())
      if (text.length > 10) questions.push(text)
    })
  }

  return questions
}

/**
 * 提取选项列表
 */
export function extractOptions($: cheerio.CheerioAPI, container: cheerio.Cheerio<cheerio.AnyNode>): string[] | null {
  const options: string[] = []

  // 常见选项容器
  const optionSelectors = [
    '.option-item', '.option', '.choice-item',
    '[class*="option"]', '[class*="choice"]',
    'label.option', '.answer-option'
  ]

  for (const sel of optionSelectors) {
    container.find(sel).each((_i, el) => {
      const text = cleanText($(el).text())
      if (text && text.length < 500) options.push(text)
    })
  }

  // 如果没找到，尝试正则匹配 A. B. C. D. 模式
  if (options.length === 0) {
    const fullText = container.text()
    const letterOptions = fullText.match(/([A-D])[\.\s、]+([^\n]{1,200})/g)
    if (letterOptions && letterOptions.length >= 2) {
      return letterOptions.map((o) => cleanText(o))
    }
  }

  return options.length >= 2 ? options : null
}

/**
 * 提取答案
 */
export function extractAnswer($: cheerio.CheerioAPI, container: cheerio.Cheerio<cheerio.AnyNode>): string {
  // 常见答案选择器
  const answerSelectors = [
    '.answer', '.correct-answer', '.key',
    '[class*="answer"]', '[class*="key"]',
    '.daan', '.right-answer'
  ]

  for (const sel of answerSelectors) {
    const el = container.find(sel)
    if (el.length > 0) {
      const text = cleanText(el.text())
      if (text) return text
    }
  }

  return ''
}

/**
 * 提取解析
 */
export function extractAnalysis($: cheerio.CheerioAPI, container: cheerio.Cheerio<cheerio.AnyNode>): string | null {
  const analysisSelectors = [
    '.analysis', '.explanation', '.solution',
    '[class*="analysis"]', '[class*="explanation"]',
    '.jiexi', '.xiangjie'
  ]

  for (const sel of analysisSelectors) {
    const el = container.find(sel)
    if (el.length > 0) {
      const text = cleanText(el.text())
      if (text) return text
    }
  }

  return null
}

/**
 * 从年份字符串中提取数字
 */
export function extractYear(text: string, url: string): number {
  const matches = (text + url).match(/(20\d{2})/)
  return matches ? Number(matches[1]) : new Date().getFullYear()
}
