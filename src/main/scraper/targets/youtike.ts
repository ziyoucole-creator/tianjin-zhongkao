import * as cheerio from 'cheerio'
import { delay } from '../http'
import { fetchRenderedHTML } from '../browser'
import {
  extractQuestions, extractOptions, extractAnswer,
  extractAnalysis, extractYear, inferDifficulty,
  inferQuestionType, inferSubjectId, cleanText
} from '../parser'
import type { ScrapedQuestion } from '../types'

// Real URL patterns discovered from youtike.com site structure analysis (2026-05):
// - List page (mobile): https://m.youtike.com/document/list-st3-sj0-gr90-tp1-vs0-bk0-pr3.html
// - List page (desktop): https://qjt.youtike.com/document/list-tp1-st3-sj{id}-vs0-tb0-yr{year}-gr0-ct0-pr3.html
// - Detail page: https://youtike.com/document/{id}.html
// - Paper list: https://qjt.youtike.com/paper/list.html?stageId=3&gradeId=90&areaId=3

const YOUTIKE_SUBJECT_IDS: Record<string, string> = {
  '语文': '1', '数学': '2', '英语': '3',
  '物理': '4', '化学': '5', '历史': '6',
  '道德与法治': '7'
}

const YOUTIKE_LIST_URL = 'https://m.youtike.com/document/list-st3-sj0-gr90-tp1-vs0-bk0-pr3.html'
const YOUTIKE_PAPER_LIST = 'https://qjt.youtike.com/paper/list.html?stageId=3&gradeId=90&areaId=3'

/**
 * 优题课爬虫 — 使用已验证的正确URL结构
 * 从试卷列表页 → 试卷详情页 → 逐题提取
 */
export async function scrapeYoutike(
  subject: string,
  year: number,
  onProgress: (current: number, total: number, msg: string) => void
): Promise<ScrapedQuestion[]> {
  const results: ScrapedQuestion[] = []
  const subjectId = YOUTIKE_SUBJECT_IDS[subject] || '2'

  onProgress(0, 0, '正在访问优题课...')

  // Build subject-filtered URL
  const listUrl = `https://qjt.youtike.com/document/list-tp1-st3-sj${subjectId}-vs0-tb0-yr${year}-gr0-ct0-pr3.html`

  let html = ''
  let usedUrl = ''

  // Try multiple URL patterns
  const urlsToTry = [
    listUrl,
    `${YOUTIKE_LIST_URL}&subject=${encodeURIComponent(subject)}`,
    YOUTIKE_LIST_URL,
    YOUTIKE_PAPER_LIST
  ]

  for (const url of urlsToTry) {
    try {
      onProgress(0, 0, `尝试访问: ${url.substring(0, 60)}...`)
      html = await fetchRenderedHTML(url, 25000)
      if (html && html.length > 500) {
        usedUrl = url
        break
      }
    } catch {
      continue
    }
  }

  if (!html || html.length < 500) {
    onProgress(0, 0, '优题课无法访问，请检查网络连接')
    return results
  }

  const $ = cheerio.load(html)

  // Extract paper/document links
  const paperLinks: { href: string; title: string }[] = []

  // Strategy 1: Find links containing 'document' (detail pages)
  $('a[href*="document"]').each((_i, el) => {
    const href = $(el).attr('href')
    const title = cleanText($(el).text())
    if (href && title && title.length > 3) {
      const fullUrl = href.startsWith('http') ? href :
        `https://youtike.com${href.startsWith('/') ? '' : '/'}${href}`
      if (title.includes('天津') || title.includes(subject) || title.includes(String(year))) {
        paperLinks.push({ href: fullUrl, title })
      }
    }
  })

  // Strategy 2: If few results, include all document links
  if (paperLinks.length < 5) {
    $('a[href*="document"]').each((_i, el) => {
      const href = $(el).attr('href')
      const title = cleanText($(el).text())
      if (href && title && title.length > 3) {
        const fullUrl = href.startsWith('http') ? href :
          `https://youtike.com${href.startsWith('/') ? '' : '/'}${href}`
        const exists = paperLinks.some(p => p.href === fullUrl)
        if (!exists) paperLinks.push({ href: fullUrl, title })
      }
    })
  }

  // Strategy 3: Try paper links
  if (paperLinks.length === 0) {
    $('a[href*="paper"]').each((_i, el) => {
      const href = $(el).attr('href')
      const title = cleanText($(el).text())
      if (href && title && title.length > 5) {
        const fullUrl = href.startsWith('http') ? href :
          `https://qjt.youtike.com${href.startsWith('/') ? '' : '/'}${href}`
        paperLinks.push({ href: fullUrl, title })
      }
    })
  }

  // Deduplicate
  const seen = new Set<string>()
  const uniqueLinks = paperLinks.filter(p => {
    const key = p.href
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (uniqueLinks.length === 0) {
    onProgress(0, 0, '优题课未找到匹配的试卷，请检查科目和年份')
    return results
  }

  const total = uniqueLinks.length
  onProgress(0, total, `发现 ${total} 份试卷，开始提取题目...`)

  for (let i = 0; i < uniqueLinks.length; i++) {
    const { href, title } = uniqueLinks[i]
    try {
      await delay(800 + Math.random() * 1500)
      const detailHtml = await fetchRenderedHTML(href, 20000)
      const $detail = cheerio.load(detailHtml)

      // Extract all questions from the detail page
      const questions = extractQuestions($detail, $detail('body'))

      // If no structured questions found, try splitting by question patterns
      if (questions.length === 0) {
        const bodyText = cleanText($detail('body').text())
        // Split by Chinese question numbering: 一、二、 or 1. 2. or （1）（2）
        const parts = bodyText.split(/(?=(?:^|\n)\s*(?:\d{1,2}[\.\、\)）]|[一二三四五六七八九十]+[、.]))/)
        for (const part of parts) {
          const trimmed = part.trim()
          if (trimmed.length > 15 && trimmed.length < 3000) {
            questions.push(trimmed)
          }
        }
      }

      // If still no questions, try exam-item selectors
      if (questions.length === 0) {
        $detail('.exam-item, .question-item, .topic-item, [class*="question"], [class*="topic"]').each((_j, el) => {
          const text = cleanText($detail(el).text())
          if (text.length > 10) questions.push(text)
        })
      }

      const answer = extractAnswer($detail, $detail('body'))
      const analysis = extractAnalysis($detail, $detail('body'))
      const options = extractOptions($detail, $detail('body'))

      for (const content of questions) {
        if (content.length < 10) continue

        results.push({
          subject_id: inferSubjectId(title + ' ' + subject, href),
          kp_id: null,
          type: inferQuestionType(content, options),
          difficulty: inferDifficulty(content + ' ' + title),
          content,
          options,
          answer: answer || '[答案待确认]',
          analysis,
          year: extractYear(title + ' ' + String(year), href),
          source: href,
          exam_frequency: 'high'
        })
      }

      onProgress(i + 1, total, `已提取 ${i + 1}/${total} 份试卷: 共 ${results.length} 题`)
    } catch (err) {
      onProgress(i + 1, total, `跳过: ${href.substring(0, 60)}...`)
    }
  }

  return results
}
