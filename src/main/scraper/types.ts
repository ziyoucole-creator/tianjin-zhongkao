export interface ScrapedQuestion {
  subject_id: number
  kp_id: number | null
  type: 'single_choice' | 'multiple_choice' | 'fill_blank'
  difficulty: 'easy' | 'medium' | 'hard'
  content: string
  options: string[] | null
  answer: string
  analysis: string | null
  year: number
  source: string
  exam_frequency: 'high' | 'medium' | 'low'
}

export interface ScrapeTask {
  id: string
  target: string
  subject: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  total: number
  newCount: number
  skipCount: number
  message: string
}

export interface ScrapeSource {
  name: string
  label: string
  description: string
  subjects: string[]
  years: number[]
  enabled: boolean
}

export const SCRAPE_SOURCES: ScrapeSource[] = [
  {
    name: 'youtike',
    label: '优题课',
    description: '天津中考试卷真题汇总，全科覆盖，含答案与解析。免费可访问。',
    subjects: ['数学', '语文', '英语', '物理', '化学', '历史', '道德与法治'],
    years: [2021, 2022, 2023, 2024],
    enabled: true
  },
  {
    name: 'zujuan',
    label: '组卷网',
    description: '历年天津中考真题，按知识点分类。部分内容需登录。',
    subjects: ['数学', '语文', '英语', '物理', '化学'],
    years: [2020, 2021, 2022, 2023, 2024],
    enabled: true
  },
  {
    name: 'zxxk',
    label: '学科网',
    description: '综合教育资源平台，需付费账号',
    subjects: ['数学', '语文', '英语', '物理', '化学', '历史', '道德与法治'],
    years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    enabled: false
  }
]

// Data sources integrated at seed time:
export const BUNDLED_DATASETS = [
  {
    name: 'internlm-history',
    label: 'InternLM-History 开源数据集',
    description: '1056道2022年全国中考历史真题，含答案与解析，MIT开源许可',
    subjects: ['历史'],
    license: 'MIT',
    source: 'https://github.com/sanbuphy/InternLM-History'
  },
  {
    name: 'ceval',
    label: 'C-Eval 中文评测数据集',
    description: '初中数学/物理/化学/政治 + 高中语文，四选一选择题，含答案解析',
    subjects: ['数学', '物理', '化学', '道德与法治', '语文'],
    license: 'CC BY-NC-SA 4.0',
    source: 'https://github.com/hkust-nlp/ceval'
  },
  {
    name: 'cmmlu',
    label: 'CMMLU 中文多学科数据集',
    description: '语文/数学/物理/化学/历史/政治，覆盖多学段，四选一选择题',
    subjects: ['语文', '数学', '物理', '化学', '历史', '道德与法治'],
    license: 'Apache 2.0',
    source: 'https://github.com/haonan-li/CMMLU'
  },
  {
    name: 'race',
    label: 'RACE 英语阅读理解数据集',
    description: '28,000+中国初中英语阅读理解题，含篇章与选项',
    subjects: ['英语'],
    license: 'Apache 2.0',
    source: 'https://huggingface.co/datasets/race'
  }
]
