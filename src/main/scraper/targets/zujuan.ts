import * as cheerio from 'cheerio'
import { delay } from '../http'
import { fetchRenderedHTML } from '../browser'
import {
  extractQuestions, extractOptions, extractAnswer,
  extractAnalysis, extractYear, inferDifficulty,
  inferQuestionType, inferSubjectId, cleanText
} from '../parser'
import type { ScrapedQuestion } from '../types'

/**
 * 组卷网 (zujuan.xkw.com) 爬虫
 *
 * 注意：组卷网是学科网旗下的商业平台，完整访问需要付费账号。
 * 免费状态下仅能浏览部分试题预览。本爬虫尝试提取公开可见的题目。
 *
 * URL patterns:
 * - Knowledge point: https://zujuan.xkw.com/czsx/zsd4677/ds4_5_2pt6a120000o1zsd_s4677
 * - Year filtered: https://zujuan.xkw.com/czsx/zsd4677/ds4_5_2y2024a120000g9o1zsd_s4677/
 */

const SUBJECT_PATH_MAP: Record<string, string> = {
  '数学': 'czsx', '语文': 'czyw', '英语': 'czyy',
  '物理': 'czwl', '化学': 'czhx', '历史': 'czls',
  '道德与法治': 'czzz'
}

export async function scrapeZujuan(
  subject: string,
  year: number,
  onProgress: (current: number, total: number, msg: string) => void
): Promise<ScrapedQuestion[]> {
  const results: ScrapedQuestion[] = []
  const subjectPath = SUBJECT_PATH_MAP[subject] || 'czsx'

  onProgress(0, 0, '正在访问组卷网（可能需要登录）...')

  // Try the search/filter page
  const searchUrls = [
    `https://zujuan.xkw.com/${subjectPath}/search?keyword=${encodeURIComponent('天津中考' + year)}`,
    `https://zujuan.xkw.com/${subjectPath}/zsd4677/ds4_5_2y${year}a120000o1zsd_s4677/`,
    `https://zujuan.xkw.com/${subjectPath}/`,
  ]

  let html = ''
  for (const url of searchUrls) {
    try {
      html = await fetchRenderedHTML(url, 25000)
      if (html && html.length > 1000) break
    } catch {
      continue
    }
  }

  if (!html || html.length < 1000) {
    onProgress(0, 0, '组卷网无法访问，可能需要登录账号')
    return results
  }

  const $ = cheerio.load(html)

  // Check if we hit a login wall
  const pageText = $('body').text()
  if (pageText.includes('登录') && pageText.includes('注册') && pageText.length < 2000) {
    onProgress(0, 0, '组卷网需要登录才能浏览试题。请使用优题课数据源。')
    return results
  }

  // Find question links
  const questionLinks: { href: string; title: string }[] = []
  $('a[href*="question"], a[href*="topic"], a[href*="problem"], a[href*="zsd"]').each((_i, el) => {
    const href = $(el).attr('href')
    const title = cleanText($(el).text())
    if (href && title && title.length > 5) {
      const fullUrl = href.startsWith('http') ? href : `https://zujuan.xkw.com${href.startsWith('/') ? '' : '/'}${href}`
      questionLinks.push({ href: fullUrl, title })
    }
  })

  // Fallback: find any content links
  if (questionLinks.length === 0) {
    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href')
      const text = cleanText($(el).text())
      if (href && text && text.length > 8 && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const fullUrl = href.startsWith('http') ? href : `https://zujuan.xkw.com${href.startsWith('/') ? '' : '/'}${href}`
        if (fullUrl.includes('zujuan.xkw.com')) {
          questionLinks.push({ href: fullUrl, title: text })
        }
      }
    })
  }

  // Deduplicate
  const seen = new Set<string>()
  const uniqueLinks = questionLinks.filter(p => {
    if (seen.has(p.href)) return false
    seen.add(p.href)
    return true
  }).slice(0, 30) // Limit to 30 pages to be polite

  if (uniqueLinks.length === 0) {
    onProgress(0, 0, '组卷网未找到可访问的题目链接。建议使用优题课数据源。')
    return results
  }

  const total = uniqueLinks.length
  onProgress(0, total, `发现 ${total} 个链接，开始提取...`)

  for (let i = 0; i < uniqueLinks.length; i++) {
    const { href, title } = uniqueLinks[i]
    try {
      await delay(1000 + Math.random() * 2000)
      const detailHtml = await fetchRenderedHTML(href, 20000)
      const $detail = cheerio.load(detailHtml)

      const questions = extractQuestions($detail, $detail('body'))
      const options = extractOptions($detail, $detail('body'))
      const answer = extractAnswer($detail, $detail('body'))
      const analysis = extractAnalysis($detail, $detail('body'))

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

      onProgress(i + 1, total, `已抓取 ${i + 1}/${total}: ${results.length} 题`)
    } catch (err) {
      onProgress(i + 1, total, `跳过: ${href.substring(0, 50)}...`)
    }
  }

  return results
}
