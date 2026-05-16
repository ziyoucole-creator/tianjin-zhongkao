// 天津中考课程知识点体系
// 基于人教版教材 + 外研版英语 + 天津中考考试说明

export interface KnowledgePoint {
  name: string
  kpId?: number  // 映射到数据库 knowledge_points.id
  weight: number
  examFrequency: 'high' | 'medium' | 'low'
  children?: KnowledgePoint[]
}

// KP name → DB ID 映射表，基于 seed.ts 中的知识点ID
export const KP_ID_MAP: Record<string, number> = {
  // 语文
  '基础知识': 1001, '字音字形': 1002, '词语成语运用': 1003, '病句辨析': 1004,
  '古诗文': 1005, '古诗默写': 1006, '古诗词鉴赏': 1007,
  '文言文阅读': 1008, '现代文阅读': 1009, '名著阅读': 1010, '作文': 1011,
  // 数学
  '数与式': 2001, '实数运算': 2002, '代数式与因式分解': 2003,
  '方程与不等式': 2004, '一元二次方程': 2005, '不等式与不等式组': 2006,
  '函数': 2007, '一次函数': 2008, '二次函数': 2009, '反比例函数': 2010,
  '几何图形': 2011, '三角形': 2012, '四边形': 2013, '圆': 2014, '统计与概率': 2015,
  // 英语
  '单项选择': 3001, '完形填空': 3002, '阅读理解': 3003, '补全对话': 3004, '书面表达': 3005, '听力理解': 3006,
  // 物理
  '力学': 4001, '运动和力': 4002, '压强与浮力': 4003, '功和机械能': 4004,
  '电学': 4005, '电路基础': 4006, '欧姆定律与电功率': 4007, '光学': 4008, '热学': 4009,
  // 化学
  '物质构成': 5001, '化学方程式': 5002, '溶液': 5003, '酸碱盐': 5004, '金属与材料': 5005, '化学实验': 5006,
  // 历史
  '中国古代史': 6001, '中国近代史': 6002, '中国现代史': 6003, '世界史': 6004,
  // 道法
  '道德': 7001, '法律': 7002, '国情': 7003,
}

// 展开 curriculum KPs 为扁平 KP ID 列表
export function collectKpIds(kps?: KnowledgePoint[]): number[] {
  const ids: number[] = []
  if (!kps) return ids
  for (const kp of kps) {
    const id = kp.kpId ?? KP_ID_MAP[kp.name]
    if (id) ids.push(id)
    if (kp.children) ids.push(...collectKpIds(kp.children))
  }
  return ids
}

// 课文篇目
export interface Passage {
  title: string
  author: string
  genre: string // 体裁：散文/小说/说明文/议论文/诗歌/童话/寓言等
  isEssential: boolean // 精读(true) vs 略读(false)
  unit: string
  keyPoints: string[] // 考查重点
  readingSkills: string[] // 阅读能力训练点
}

// 历年真题
export interface ExamQuestion {
  year: number
  source: string // 天津中考/天津模拟/全国中考
  type: string // 阅读理解/语言运用/综合
  content: string // 题目内容
  answer: string
  analysis: string
}

// 课文关联真题
export interface PassageExamLink {
  passageTitle: string
  questions: ExamQuestion[]
}

export interface GradeKP {
  grade: '初一上' | '初一下' | '初二上' | '初二下' | '初三上' | '初三下'
  name: string
  description: string
  weight: number // 中考分值占比
  examFrequency: 'high' | 'medium' | 'low'
  kps?: KnowledgePoint[]
  children?: { name: string; description: string }[]
  passages?: Passage[] // 现代文阅读完整篇目
  examLinks?: PassageExamLink[] // 历年真题
}

export interface ExamPolicy {
  score: number
  examType: '闭卷' | '开卷' | '闭卷+机考'
  examTime: string
  questionTypes: { name: string; score: string; note?: string }[]
  trends: string[]
}

export interface SubjectCurriculum {
  subjectId: number
  subject: string
  subjectColor: string
  examPolicy: ExamPolicy
  grades: GradeKP[]
  totalExamWeight: number
  summary: string
}

export const CURRICULUM: SubjectCurriculum[] = [
  // ==================== 语文 ====================
  {
    subjectId: 1,
    subject: '语文',
    subjectColor: '#f5222d',
    examPolicy: {
      score: 120,
      examType: '闭卷',
      examTime: '120分钟',
      questionTypes: [
        { name: '基础积累（字词/病句/默写）', score: '20分', note: '含古诗默写8分' },
        { name: '课内文言文/现代文阅读', score: '35分' },
        { name: '课外文言文阅读', score: '7分' },
        { name: '课外现代文阅读', score: '15分' },
        { name: '语言运用 / 名著阅读', score: '10分' },
        { name: '作文（记叙文/议论文）', score: '50分', note: '体裁二选一，要求字数不少于600字' },
      ],
      trends: [
        '70%试题改编自教材，侧重课内知识迁移',
        '作文重视真情实感，反对套作和模板化',
        '名著阅读考查整本书，不再只考片段',
        '文言文比重逐年增加，难度稳定',
      ],
    },
    totalExamWeight: 120,
    summary: '语文覆盖初中三个年级，教材内容占中考约70%。基础知识+古诗文积累贯穿三年，阅读与写作在初三完成能力整合。',
    grades: [
      {
        grade: '初一上', name: '记叙文入门与古诗启蒙', description: '学习记叙文六要素、修辞手法、基础文言文', weight: 8, examFrequency: 'medium',
        kps: [
          { name: '基础知识', weight: 2, examFrequency: 'high', children: [
            { name: '字音字形', weight: 1, examFrequency: 'high' },
          ]},
          { name: '古诗文', weight: 3, examFrequency: 'high', children: [
            { name: '古诗默写', weight: 2, examFrequency: 'high' },
          ]},
          { name: '现代文阅读', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '现代文阅读', description: '春、济南的冬天、从百草园到三味书屋等经典篇目' },
          { name: '古诗文', description: '古代诗歌四首、《论语》十二章、世说新语二则' },
          { name: '写作基础', description: '记叙文写作入门：学会记事、写人要抓住特点' },
        ],
        passages: [
          // ===== 第一单元：四季美景 =====
          {
            title: '春', author: '朱自清', genre: '散文', isEssential: true,
            unit: '第一单元·四季美景',
            keyPoints: ['修辞手法赏析（比喻、拟人、排比）', '景物描写顺序与方法', '语言特点：生动形象、富有节奏感', '春草图、春花图、春风图、春雨图、迎春图的画面分析'],
            readingSkills: ['赏析优美语句', '把握写景抒情散文的特点', '学习多角度描写景物的方法'],
          },
          {
            title: '济南的冬天', author: '老舍', genre: '散文', isEssential: true,
            unit: '第一单元·四季美景',
            keyPoints: ['对比手法（北平与济南对比）', '拟人修辞（"暖和安适地睡着"）', '情景交融的写作特色', '抓住景物特征（温晴）进行描写'],
            readingSkills: ['体会作者对景物的独特感受', '学习抓住特征描写景物的方法', '品味平实而生动的语言'],
          },
          {
            title: '雨的四季', author: '刘湛秋', genre: '散文', isEssential: false,
            unit: '第一单元·四季美景',
            keyPoints: ['四季雨的不同特点', '多感官描写（视觉、听觉、嗅觉）', '拟人化手法贯穿全文'],
            readingSkills: ['自读课文：运用圈点批注法', '感受写景散文的语言美'],
          },
          // ===== 第二单元：至爱亲情 =====
          {
            title: '秋天的怀念', author: '史铁生', genre: '散文', isEssential: true,
            unit: '第二单元·至爱亲情',
            keyPoints: ['细节描写表现母爱（"悄悄躲出去""眼边红红的"）', '插叙手法', '标题含义与作用', '结尾含蓄深沉的抒情方式', '关键词句理解（"好好儿活"）'],
            readingSkills: ['通过细节描写体会人物情感', '理解含蓄表达中的深沉情感', '学习插叙的叙事手法'],
          },
          {
            title: '散步', author: '莫怀戚', genre: '散文', isEssential: true,
            unit: '第二单元·至爱亲情',
            keyPoints: ['以小见大的写作手法', '对称句式与回环结构', '景物描写的作用（烘托人物心情）', '责任与亲情的主题把握'],
            readingSkills: ['学习以小见大的写法', '品味对称句式的表达效果', '理解景物描写的烘托作用'],
          },
          {
            title: '散文诗二首（金色花·荷叶母亲）', author: '泰戈尔 / 冰心', genre: '散文诗', isEssential: false,
            unit: '第二单元·至爱亲情',
            keyPoints: ['金色花：童趣想象表达母爱', '荷叶母亲：象征手法（荷叶象征母亲）', '散文诗的特点：兼具散文与诗歌特征', '比较两篇散文诗的异同'],
            readingSkills: ['学习比较阅读', '理解象征手法', '体会散文诗的语言特点'],
          },
          // ===== 第三单元：学习生活 =====
          {
            title: '从百草园到三味书屋', author: '鲁迅', genre: '散文', isEssential: true,
            unit: '第三单元·学习生活',
            keyPoints: ['对比手法（百草园与三味书屋对比）', '景物描写的顺序与方法', '雪地捕鸟的动词连用', '美女蛇故事的插叙作用', '先生形象的分析'],
            readingSkills: ['学习景物描写的有序性', '体会优美词语的表现力', '理解对比结构的表达效果'],
          },
          {
            title: '再塑生命的人', author: '海伦·凯勒', genre: '散文', isEssential: false,
            unit: '第三单元·学习生活',
            keyPoints: ['莎莉文老师的教育智慧', '心理描写表现内心世界', '"再塑生命"的含义', '叙事中的议论与抒情'],
            readingSkills: ['学习通过具体事例表现人物', '体会叙事中议论抒情的作用'],
          },
          // ===== 第四单元：人生之舟 =====
          {
            title: '纪念白求恩', author: '毛泽东', genre: '议论文', isEssential: true,
            unit: '第四单元·人生之舟',
            keyPoints: ['议论文三要素（论点/论据/论证）', '对比论证（白求恩与某些人的对比）', '叙议结合的写法', '排比句式的表达效果'],
            readingSkills: ['初步学习议论文阅读方法', '区分叙述与议论', '学习对比论证'],
          },
          {
            title: '植树的牧羊人', author: '让·乔诺', genre: '小说', isEssential: true,
            unit: '第四单元·人生之舟',
            keyPoints: ['环境描写的作用（前后对比）', '人物形象分析（牧羊人的品质）', '叙事视角（第一人称"我"）', '以时间顺序组织材料'],
            readingSkills: ['通过环境变化感受人物精神', '学习分析人物形象的方法'],
          },
          {
            title: '走一步，再走一步', author: '莫顿·亨特', genre: '散文', isEssential: false,
            unit: '第四单元·人生之舟',
            keyPoints: ['心理描写（恐惧→自信的变化过程）', '父亲的教育智慧', '结尾议论的升华作用', '以小见大：从爬崖经历到人生哲理'],
            readingSkills: ['学习心理变化的描写', '理解叙事后议论点题的作用'],
          },
          // ===== 第五单元：动物与人 =====
          {
            title: '猫', author: '郑振铎', genre: '散文/小说', isEssential: true,
            unit: '第五单元·动物与人',
            keyPoints: ['三只猫的对比描写', '伏笔与照应（第三只猫的冤案）', '作者情感变化（喜爱→愤怒→悔恨）', '结尾的深刻反思：不能凭主观臆断'],
            readingSkills: ['学习对比手法刻画形象', '体会伏笔与照应的妙处', '品味含蓄深刻的结尾'],
          },
          {
            title: '动物笑谈', author: '康拉德·劳伦兹', genre: '科普散文', isEssential: false,
            unit: '第五单元·动物与人',
            keyPoints: ['生动幽默的科学小品文风格', '科学家的探究精神', '细节描写的趣味性'],
            readingSkills: ['学习生动有趣的科普写作', '感受科学精神与人文关怀的结合'],
          },
          // ===== 第六单元：想象之翼 =====
          {
            title: '皇帝的新装', author: '安徒生', genre: '童话', isEssential: true,
            unit: '第六单元·想象之翼',
            keyPoints: ['童话的讽刺与夸张手法', '人物形象分析（皇帝、骗子、大臣、小孩）', '心理描写与语言描写的结合', '小孩说真话的象征意义'],
            readingSkills: ['学习童话的阅读方法', '理解夸张与讽刺的表达效果', '分析人物形象'],
          },
          {
            title: '天上的街市', author: '郭沫若', genre: '诗歌', isEssential: true,
            unit: '第六单元·想象之翼',
            keyPoints: ['联想与想象的区别和运用', '意象分析（街灯、明星、街市、牛郎织女）', '反复、比喻修辞', '诗人对自由幸福的向往'],
            readingSkills: ['学习现代诗歌的朗读与赏析', '理解联想与想象的表达效果'],
          },
          {
            title: '女娲造人', author: '袁珂', genre: '神话', isEssential: false,
            unit: '第六单元·想象之翼',
            keyPoints: ['神话的想象与夸张', '女娲形象分析（勤劳、智慧、慈爱）', '与古代神话记载的比较'],
            readingSkills: ['学习神话的阅读方法', '感受想象的魅力'],
          },
        ],
        examLinks: [
          {
            passageTitle: '春',
            questions: [
              { year: 2022, source: '天津中考', type: '课内阅读', content: '赏析"小草偷偷地从土里钻出来，嫩嫩的，绿绿的"中"偷偷地""钻"的表达效果。', answer: '"偷偷地"运用拟人手法，写出春草在不知不觉中生长的情态；"钻"写出小草破土而出的挤劲，表现其旺盛的生命力。两个词生动形象地写出了春草的生机与活力。', analysis: '考查修辞手法赏析。拟人动词的表达效果题是天津中考高频题型，答题模式：手法+内容+效果+情感。' },
              { year: 2021, source: '天津模拟', type: '语言运用', content: '仿照"春天像刚落地的娃娃，从头到脚都是新的，它生长着"的句式，写一个比喻句描写秋天。', answer: '示例：秋天像成熟的中年人，从头到脚都是稳重的，它收获着。', analysis: '考查比喻修辞的运用和句式仿写能力。注意保持排比结构和比喻的一致性与合理性。' },
              { year: 2020, source: '天津中考', type: '综合', content: '《春》中作者调动了多种感官描写春风，请举例说明。', answer: '触觉："像母亲的手抚摸着你"；嗅觉："风里带来些新翻的泥土的气息"；听觉："鸟儿……唱出宛转的曲子"。多感官描写使春风具体可感。', analysis: '考查多角度描写方法。天津中考重视对写景方法的分析能力。' },
            ],
          },
          {
            passageTitle: '济南的冬天',
            questions: [
              { year: 2023, source: '天津模拟', type: '课内阅读', content: '文章第一段将济南与北平、伦敦、热带对比有什么作用？', answer: '通过对比，突出济南冬天"温晴"的特点，表达作者对济南冬天的独特喜爱之情，为下文具体描写做铺垫。', analysis: '考查对比手法的作用。答题要点：突出特征+表达情感+结构作用。' },
              { year: 2019, source: '天津中考', type: '课内阅读', content: '"山坡上卧着些小村庄"中的"卧"字好在哪里？', answer: '"卧"字运用拟人手法，生动写出了小村庄安闲、舒适的情态，与济南冬天"暖和安适"的整体特点相呼应，表达了作者的喜爱之情。', analysis: '考查拟人动词的赏析。天津中考常考此类题型。' },
            ],
          },
          {
            passageTitle: '秋天的怀念',
            questions: [
              { year: 2023, source: '天津中考', type: '课外迁移', content: '（课外散文阅读）文中写母亲"总是悄悄地"做某事，与史铁生《秋天的怀念》中母亲"悄悄躲出去"有何相似表达效果？', answer: '两处都通过"悄悄"这一细节描写，表现母亲细腻深沉的爱——不想让孩子察觉自己的担忧，默默承受痛苦，体现母爱的无私与伟大。', analysis: '考查课内外对比阅读。天津中考近年侧重课内知识向课外迁移的能力。' },
              { year: 2021, source: '天津模拟', type: '课内阅读', content: '标题"秋天的怀念"有什么含义？', answer: '表层：回忆秋天发生的事；深层：①秋天是母亲去世的季节，表达对母亲的深深怀念；②"秋天"暗含人生的萧瑟与成熟，母亲的话让"我"懂得了生命的意义。', analysis: '考查标题含义分析。需从表层和深层两个角度作答。' },
            ],
          },
          {
            passageTitle: '散步',
            questions: [
              { year: 2020, source: '天津模拟', type: '课内阅读', content: '"好像我背上的同她背上的加起来，就是整个世界"，如何理解这句话？', answer: '"我"背母亲，妻子背儿子，象征着中年人承担着赡养老人和养育子女的双重责任，这种责任就是"整个世界"。运用以小见大的手法，升华主题。', analysis: '考查关键句含义理解。需结合全文主题（责任与亲情）作答。' },
            ],
          },
          {
            passageTitle: '从百草园到三味书屋',
            questions: [
              { year: 2022, source: '天津中考', type: '课内阅读', content: '第二段描写百草园景物，作者是按什么顺序写的？请简要分析。', answer: '从整体到局部：先写"不必说……也不必说……"的整体景象，再写"单是……"的局部泥墙根一带。从高到低：从菜畦、石井栏、皂荚树、桑葚（高处），到鸣蝉、黄蜂、叫天子、油蛉、蟋蟀（低处）。', analysis: '考查景物描写的顺序。天津中考重视对文章结构层次的把握能力。' },
              { year: 2021, source: '天津模拟', type: '语言运用', content: '分析雪地捕鸟一段中动词连用的表达效果。', answer: '"扫、露、支、撒、系、牵、看、走、拉、罩"一连串动词，准确生动地写出了捕鸟的全过程，表现了儿童的专注与兴奋，也流露出作者对童年生活的怀念。', analysis: '考查动词连用的表达效果。答题要点：准确生动+过程清晰+情感流露。' },
            ],
          },
          {
            passageTitle: '猫',
            questions: [
              { year: 2023, source: '天津中考', type: '现代文阅读', content: '（课内现代文阅读）第三只猫的遭遇给"我"怎样的启示？', answer: '不能凭主观臆断下结论，要实事求是、明辨是非；对弱小者要有同情心，不能因个人好恶而偏袒或不公；要勇于反思和自省。', analysis: '考查文章主旨理解。需结合"我"的悔恨之情和文章结尾的议论进行分析。' },
            ],
          },
          {
            passageTitle: '皇帝的新装',
            questions: [
              { year: 2020, source: '天津中考', type: '课内阅读', content: '文中为什么安排一个小孩子说出真话？', answer: '小孩子天真无邪、没有顾虑，与成人的虚伪、世故形成鲜明对比。小孩说真话的情节突出了童话的讽刺主题：成人世界的虚伪与自欺欺人，赞扬诚实与纯真。', analysis: '考查人物形象与主题的关系。对比手法是天津中考高频考点。' },
            ],
          },
          {
            passageTitle: '天上的街市',
            questions: [
              { year: 2021, source: '天津模拟', type: '诗歌鉴赏', content: '诗中"定然""定能够"等词语反复出现有什么表达效果？', answer: '"定然""定能够"表示肯定语气，反复出现强调了诗人对美好理想的确信，表现了诗人对自由、幸福生活的坚定向往，增强了诗歌的感染力。', analysis: '考查词语反复的表达效果。注意联系诗歌主旨进行分析。' },
            ],
          },
        ],
      },
      {
        grade: '初一下', name: '记叙文深化与文言文积累', description: '学习人物传记、抒情散文、文言文实词虚词', weight: 10, examFrequency: 'medium',
        kps: [
          { name: '基础知识', weight: 2, examFrequency: 'high', children: [
            { name: '词语成语运用', weight: 1, examFrequency: 'medium' },
          ]},
          { name: '古诗文', weight: 3, examFrequency: 'high', children: [
            { name: '古诗词鉴赏', weight: 2, examFrequency: 'high' },
          ]},
          { name: '文言文阅读', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '现代文阅读', description: '邓稼先、说和做、黄河颂、伟大的悲剧等' },
          { name: '古诗文', description: '木兰诗、短文两篇（陋室铭/爱莲说）、古代诗歌五首' },
          { name: '写作进阶', description: '学习抒情、抓住细节、怎样选材' },
        ],
        passages: [
          { title: '邓稼先', author: '杨振宁', genre: '人物传记', isEssential: true, unit: '第一单元·杰出人物', keyPoints: ['人物形象分析', '典型事例选取', '对比手法', '记叙中的议论与抒情'], readingSkills: ['学习通过典型事例表现人物品质', '体会作者的情感态度', '把握传记文学的写作特点'] },
          { title: '说和做——记闻一多先生言行片段', author: '臧克家', genre: '散文', isEssential: true, unit: '第一单元·杰出人物', keyPoints: ['叙述与议论的结合', '细节描写表现人物', '标题含义与作用', '过渡段的作用'], readingSkills: ['学习叙议结合的写法', '品味细节描写', '理解标题的深层含义'] },
          { title: '黄河颂', author: '光未然', genre: '诗歌', isEssential: true, unit: '第二单元·家国情怀', keyPoints: ['意象分析（黄河的象征意义）', '反复与呼告修辞', '诗歌的节奏与韵律', '抒情方式（直接抒情）'], readingSkills: ['学习现代诗歌的朗读技巧', '把握诗歌意象', '体会诗歌的爱国主义情感'] },
          { title: '木兰诗', author: '佚名', genre: '乐府民歌', isEssential: true, unit: '第三单元·古诗文', keyPoints: ['互文修辞手法', '详略得当的叙事', '排比与对偶句式', '木兰形象的多重性'], readingSkills: ['学习互文的修辞手法', '理解详略安排的表达效果', '分析人物形象的多样性'] },
          { title: '短文两篇（陋室铭/爱莲说）', author: '刘禹锡 / 周敦颐', genre: '铭/说', isEssential: true, unit: '第三单元·古诗文', keyPoints: ['托物言志的写作手法', '骈散结合的语言特点', '类比与对比', '文言实词总结'], readingSkills: ['学习托物言志的写作手法', '背诵并默写全文', '积累重点文言词汇'] },
          { title: '伟大的悲剧', author: '茨威格', genre: '传记', isEssential: false, unit: '第四单元·探险与科幻', keyPoints: ['传记文学的真实性与文学性', '心理描写的作用', '叙事的详略与节奏', '标题"悲剧"与"伟大"的矛盾统一'], readingSkills: ['学习传记文学的阅读方法', '体会叙事的节奏感', '把握人物精神品质'] },
        ],
      },
      {
        grade: '初二上', name: '说明文阅读与古诗文强化', description: '学习新闻写作、说明文方法、写景文言文', weight: 12, examFrequency: 'high',
        kps: [
          { name: '基础知识', weight: 2, examFrequency: 'high', children: [
            { name: '病句辨析', weight: 1, examFrequency: 'high' },
          ]},
          { name: '古诗文', weight: 3, examFrequency: 'high', children: [
            { name: '古诗默写', weight: 2, examFrequency: 'high' },
            { name: '古诗词鉴赏', weight: 2, examFrequency: 'high' },
          ]},
          { name: '文言文阅读', weight: 2, examFrequency: 'high' },
          { name: '现代文阅读', weight: 3, examFrequency: 'high' },
          { name: '名著阅读', weight: 1, examFrequency: 'medium' },
        ],
        children: [
          { name: '新闻与说明文', description: '新闻两则、中国石拱桥、苏州园林、蝉' },
          { name: '古诗文（背诵量最大）', description: '三峡、短文二篇、与朱元思书、孟子二章、愚公移山、诗词五首' },
          { name: '名著阅读', description: '《红星照耀中国》《昆虫记》' },
        ],
        passages: [
          { title: '中国石拱桥', author: '茅以升', genre: '说明文', isEssential: true, unit: '第三单元·建筑之美', keyPoints: ['说明对象及其特征', '说明顺序（逻辑顺序）', '说明方法（列数字/举例子/打比方/摹状貌）', '说明文语言的准确性'], readingSkills: ['学习分析说明方法及其作用', '把握说明对象的特征', '体会说明文语言的严谨性'] },
          { title: '苏州园林', author: '叶圣陶', genre: '说明文', isEssential: true, unit: '第三单元·建筑之美', keyPoints: ['总分总的结构', '围绕"图画美"展开说明', '分类别的说明方法', '朴实而典雅的语言风格'], readingSkills: ['学习总分结构的分析', '抓住说明中心', '品味文艺性说明文的语言'] },
          { title: '蝉', author: '法布尔', genre: '科学小品', isEssential: false, unit: '第四单元·自然奥秘', keyPoints: ['科学性与文学性的统一', '拟人手法贯穿全文', '观察与实验的科学精神', '生动的细节描写'], readingSkills: ['学习科普文的阅读方法', '体会科学与文学的结合', '感受科学家的探究精神'] },
          { title: '三峡', author: '郦道元', genre: '山水散文', isEssential: true, unit: '第六单元·山水之美', keyPoints: ['正侧结合描写手法', '四时之景的不同特色', '骈散结合的语言', '夸张手法的运用'], readingSkills: ['学习山水文言文的阅读方法', '背诵并默写全文', '体会文言文的韵律美'] },
          { title: '短文二篇（答谢中书书/记承天寺夜游）', author: '陶弘景 / 苏轼', genre: '小品文', isEssential: true, unit: '第六单元·山水之美', keyPoints: ['借景抒情的写法', '"闲人"含义的理解', '文言文比较阅读', '情景交融的艺术特色'], readingSkills: ['学习比较阅读方法', '理解借景抒情的写法', '背诵并默写全文'] },
          { title: '与朱元思书', author: '吴均', genre: '骈文', isEssential: true, unit: '第六单元·山水之美', keyPoints: ['骈文的特点（对仗/用典）', '以动写静的手法', '视觉与听觉结合', '景物描写的层次感'], readingSkills: ['了解骈文的基本特点', '学习多感官描写', '体会古典山水散文的意境'] },
        ],
      },
      {
        grade: '初二下', name: '散文阅读与议论文入门', description: '学习事理说明文、游记散文、诗经', weight: 12, examFrequency: 'high',
        kps: [
          { name: '古诗文', weight: 3, examFrequency: 'high', children: [
            { name: '古诗默写', weight: 2, examFrequency: 'high' },
            { name: '古诗词鉴赏', weight: 2, examFrequency: 'high' },
          ]},
          { name: '文言文阅读', weight: 2, examFrequency: 'high' },
          { name: '现代文阅读', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '散文与说明文', description: '社戏、大自然的语言、阿西莫夫短文二篇' },
          { name: '古诗文', description: '桃花源记、小石潭记、核舟记、《诗经》二首、唐诗三首' },
          { name: '口语交际', description: '演讲与辩论：最后一次讲演、应有格物致知精神' },
        ],
        passages: [
          { title: '社戏', author: '鲁迅', genre: '小说', isEssential: true, unit: '第一单元·民风民俗', keyPoints: ['环境描写的作用', '人物群像的刻画', '叙事的详略安排', '结尾的抒情与议论', '民俗文化的表现'], readingSkills: ['学习通过环境描写烘托人物心情', '分析小说中人物群像的描写方法', '体会作者对童年和故乡的情感'] },
          { title: '大自然的语言', author: '竺可桢', genre: '事理说明文', isEssential: true, unit: '第二单元·自然奥秘', keyPoints: ['事理说明文的逻辑顺序', '从现象到本质的说明思路', '举例子/列数字/引用的说明方法', '说明文语言的严谨与生动'], readingSkills: ['学习事理说明文的阅读方法', '把握由表及里的说明逻辑', '区分现象与规律的表述'] },
          { title: '阿西莫夫短文二篇', author: '阿西莫夫', genre: '科普说明文', isEssential: false, unit: '第二单元·自然奥秘', keyPoints: ['跨学科的科学推理', '论证的逻辑结构', '假设与验证的科学方法', '语言的逻辑性与趣味性'], readingSkills: ['学习科学推理类文章的阅读', '培养跨学科思维能力'] },
          { title: '桃花源记', author: '陶渊明', genre: '记', isEssential: true, unit: '第三单元·理想家园', keyPoints: ['虚实结合的写作手法', '以渔人行踪为线索', '桃花源的环境描写', '理想社会的象征意义', '古今异义词总结'], readingSkills: ['学习虚实结合的写法', '背诵并默写全文', '理解作者的社会理想'] },
          { title: '小石潭记', author: '柳宗元', genre: '游记', isEssential: true, unit: '第三单元·理想家园', keyPoints: ['移步换景的写作手法', '正侧结合写水清', '寓情于景（"悄怆幽邃"）', '动静结合的描写', '作者贬谪心境的理解'], readingSkills: ['学习游记散文的阅读方法', '体会寓情于景的写法', '背诵并默写全文'] },
          { title: '核舟记', author: '魏学洢', genre: '记', isEssential: true, unit: '第三单元·理想家园', keyPoints: ['空间顺序的说明方法', '细节描写的精妙', '总分总的结构', '中国古代微雕艺术的了解'], readingSkills: ['学习空间顺序的表述', '体会细节描写的作用', '了解中国传统工艺文化'] },
        ],
      },
      {
        grade: '初三上', name: '小说阅读与议论文写作', description: '学习小说鉴赏、议论方法、议论文写作', weight: 18, examFrequency: 'high',
        kps: [
          { name: '古诗文', weight: 3, examFrequency: 'high', children: [
            { name: '古诗词鉴赏', weight: 2, examFrequency: 'high' },
          ]},
          { name: '文言文阅读', weight: 2, examFrequency: 'high' },
          { name: '现代文阅读', weight: 3, examFrequency: 'high' },
          { name: '名著阅读', weight: 1, examFrequency: 'medium' },
          { name: '作文', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '现代文', description: '故乡、我的叔叔于勒、中国人失掉自信力了吗' },
          { name: '小说名著', description: '智取生辰纲、范进中举、三顾茅庐、刘姥姥进大观园' },
          { name: '古诗文（核心考点）', description: '岳阳楼记、醉翁亭记、湖心亭看雪、诗词三首' },
          { name: '议论文写作', description: '观点要明确、议论要言之有据、论证要合理' },
        ],
        passages: [
          { title: '故乡', author: '鲁迅', genre: '小说', isEssential: true, unit: '第四单元·少年成长', keyPoints: ['对比手法（少年闰土与中年闰土）', '环境描写（故乡的衰败）', '人物形象分析（闰土/杨二嫂）', '结尾的议论与希望', '第一人称叙事的表达效果'], readingSkills: ['学习通过对比分析人物变化', '体会环境描写与主题的关系', '理解"路"的象征意义'] },
          { title: '我的叔叔于勒', author: '莫泊桑', genre: '小说', isEssential: true, unit: '第四单元·少年成长', keyPoints: ['情节的曲折（盼于勒→遇于勒→躲于勒）', '人物描写方法（神态/语言/动作）', '对比与讽刺手法', '线索（菲利普夫妇的态度变化）', '金钱与亲情主题'], readingSkills: ['学习分析情节的起伏', '体会讽刺手法的运用', '把握小说的主题'] },
          { title: '中国人失掉自信力了吗', author: '鲁迅', genre: '驳论文', isEssential: true, unit: '第五单元·思辨之光', keyPoints: ['驳论的方法（驳论证→立论）', '比喻论证（"脊梁"）', '排比与反问的修辞效果', '文言白话相间的语言风格'], readingSkills: ['学习驳论文的阅读方法', '分析论证的结构', '品味鲁迅杂文的语言特色'] },
          { title: '岳阳楼记', author: '范仲淹', genre: '记', isEssential: true, unit: '第三单元·游目骋怀', keyPoints: ['叙事/写景/议论/抒情相结合', '对比手法（阴景悲/晴景喜）', '"先天下之忧而忧"的思想内涵', '骈散结合的语言风格', '写景的层次与方法'], readingSkills: ['学习叙事写景议论的结合', '背诵并默写全文', '理解"古仁人之心"的内涵'] },
          { title: '醉翁亭记', author: '欧阳修', genre: '记', isEssential: true, unit: '第三单元·游目骋怀', keyPoints: ['一字立骨法（"乐"字贯穿全文）', '骈散结合的写法', '21个"也"字的结构作用', '太守之乐的理解', '写景的顺序（由大到小）'], readingSkills: ['学习一字立骨的写法', '背诵并默写全文', '体会作者与民同乐的情怀'] },
          { title: '湖心亭看雪', author: '张岱', genre: '小品文', isEssential: true, unit: '第三单元·游目骋怀', keyPoints: ['白描手法（"天与云与山与水，上下一白"）', '简洁传神的语言', '故国之思的含蓄表达', '量词的精妙使用（"一痕""一点""一芥"）'], readingSkills: ['学习白描手法的鉴赏', '体会含蓄情感的写法', '背诵并默写全文'] },
          { title: '智取生辰纲', author: '施耐庵', genre: '小说', isEssential: true, unit: '第六单元·小说名著', keyPoints: ['双线结构（明暗线）', '环境描写（天气炎热的作用）', '人物形象（杨志/吴用）', '伏笔与照应', '白话小说的语言特点'], readingSkills: ['学习双线结构的分析', '体会环境描写的叙事作用', '了解古典白话小说的语言'] },
          { title: '范进中举', author: '吴敬梓', genre: '讽刺小说', isEssential: true, unit: '第六单元·小说名著', keyPoints: ['夸张的讽刺手法', '对比手法（胡屠户前后态度）', '细节描写的讽刺效果', '科举制度对知识分子的毒害主题'], readingSkills: ['学习讽刺小说的阅读方法', '体会夸张与对比的表达效果', '分析人物形象的典型性'] },
        ],
      },
      {
        grade: '初三下', name: '中考综合复习与冲刺', description: '文言文综合复习、中考题型专项训练、作文升格', weight: 60, examFrequency: 'high',
        kps: [
          { name: '基础知识', weight: 2, examFrequency: 'high', children: [
            { name: '字音字形', weight: 1, examFrequency: 'high' },
            { name: '病句辨析', weight: 1, examFrequency: 'high' },
          ]},
          { name: '古诗文', weight: 3, examFrequency: 'high', children: [
            { name: '古诗默写', weight: 2, examFrequency: 'high' },
            { name: '古诗词鉴赏', weight: 2, examFrequency: 'high' },
          ]},
          { name: '文言文阅读', weight: 2, examFrequency: 'high' },
          { name: '现代文阅读', weight: 3, examFrequency: 'high' },
          { name: '作文', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '现代文', description: '祖国啊我亲爱的祖国、孔乙己、变色龙、溜索' },
          { name: '古诗文（必考篇目）', description: '鱼我所欲也、唐雎不辱使命、送东阳马生序、曹刿论战、邹忌讽齐王纳谏、出师表、诗词曲五首' },
          { name: '中考写作', description: '记叙文/议论文升格训练，审题立意，语言润色' },
        ],
        passages: [
          { title: '孔乙己', author: '鲁迅', genre: '小说', isEssential: true, unit: '第二单元·人物画廊', keyPoints: ['人物形象分析（孔乙己的悲剧）', '环境描写（咸亨酒店的社会缩影）', '第一人称叙事视角的作用', '"笑"的深层含义', '科举制度批判主题'], readingSkills: ['学习分析社会环境与人物命运的关系', '体会以乐写哀的手法', '把握小说的批判主题'] },
          { title: '变色龙', author: '契诃夫', genre: '讽刺小说', isEssential: true, unit: '第二单元·人物画廊', keyPoints: ['奥楚蔑洛夫的形象分析', '对话推动情节的写法', '军大衣细节的作用', '夸张与讽刺手法', '社会环境对人物性格的影响'], readingSkills: ['学习通过语言描写分析人物性格', '体会讽刺艺术的表达效果', '理解标题的象征意义'] },
          { title: '鱼我所欲也', author: '孟子', genre: '论说文', isEssential: true, unit: '第三单元·家国之思', keyPoints: ['比喻论证（鱼与熊掌）', '对比论证（生与义）', '正反论证的结构', '排比句式的论证效果', '"本心"的内涵'], readingSkills: ['学习多种论证方法的综合运用', '背诵并默写全文', '理解孟子舍生取义的价值观'] },
          { title: '送东阳马生序', author: '宋濂', genre: '赠序', isEssential: true, unit: '第三单元·家国之思', keyPoints: ['对比手法（自己与太学生）', '现身说法的劝说方式', '记叙与议论的结合', '求学精神的现实意义'], readingSkills: ['学习赠序的文体特点', '体会对比论证的说服力', '背诵并默写全文'] },
          { title: '曹刿论战', author: '左丘明', genre: '史传文', isEssential: true, unit: '第六单元·政治军事', keyPoints: ['详略得当的叙事（详论战/略作战）', '人物形象（曹刿的远见卓识）', '对话描写刻画人物', '"一鼓作气"的战术思想'], readingSkills: ['学习详略得当的叙事技巧', '分析文言文的人物对话', '背诵并默写全文'] },
          { title: '出师表', author: '诸葛亮', genre: '表', isEssential: true, unit: '第六单元·政治军事', keyPoints: ['融情于理（议论/叙事/抒情结合）', '三条建议的结构', '语言特点（质朴恳切）', '成语典故总结'], readingSkills: ['学习"表"的文体特点', '体会融情于理的写法', '背诵并默写全文'] },
        ],
      },
    ],
  },

  // ==================== 数学 ====================
  {
    subjectId: 2,
    subject: '数学',
    subjectColor: '#1677ff',
    examPolicy: {
      score: 120,
      examType: '闭卷',
      examTime: '100分钟',
      questionTypes: [
        { name: '选择题（12题）', score: '36分' },
        { name: '填空题（6题）', score: '18分' },
        { name: '解答题（7题）', score: '66分', note: '含基础计算、几何证明、函数综合、统计应用、压轴题' },
      ],
      trends: [
        '基础题约60%，中档题约25%，压轴题约15%',
        '压轴题方向：几何旋转/翻折综合 + 二次函数数形结合',
        '重准确度、熟练度、规范度，反对盲目刷题',
        '情境题融入现实场景（如天津地标建筑相关几何问题）',
      ],
    },
    totalExamWeight: 120,
    summary: '数学三年六个学期，知识层层递进。初一打基础（数与式/方程），初二是分水岭（几何证明/函数入门），初三综合拔高（二次函数/圆/相似）。中考核心：函数与几何各占约40分。',
    grades: [
      {
        grade: '初一上', name: '数与式的入门', description: '有理数运算、整式加减、一元一次方程、基础几何', weight: 10, examFrequency: 'medium',
        kps: [
          { name: '数与式', weight: 3, examFrequency: 'high', children: [
            { name: '实数运算', weight: 2, examFrequency: 'high' },
          ]},
        ],
        children: [
          { name: '有理数', description: '正负数、数轴、相反数、绝对值、有理数四则运算' },
          { name: '整式的加减', description: '单项式与多项式、合并同类项、去括号' },
          { name: '一元一次方程', description: '解方程与应用题、配套/工程/行程问题' },
          { name: '几何图形初步', description: '直线、射线、线段、角的概念与计算' },
        ],
      },
      {
        grade: '初一下', name: '代数与几何基础', description: '实数、平面直角坐标系、方程组、不等式、数据统计', weight: 12, examFrequency: 'high',
        kps: [
          { name: '数与式', weight: 3, examFrequency: 'high', children: [
            { name: '实数运算', weight: 2, examFrequency: 'high' },
          ]},
          { name: '方程与不等式', weight: 3, examFrequency: 'high', children: [
            { name: '不等式与不等式组', weight: 2, examFrequency: 'medium' },
          ]},
          { name: '几何图形', weight: 3, examFrequency: 'high', children: [
            { name: '三角形', weight: 2, examFrequency: 'high' },
          ]},
        ],
        children: [
          { name: '相交线与平行线', description: '对顶角、同位角、内错角、同旁内角、平行线判定与性质' },
          { name: '实数', description: '平方根、立方根、无理数、实数运算' },
          { name: '平面直角坐标系', description: '坐标表示、平移变换' },
          { name: '二元一次方程组', description: '代入法、加减法、应用题' },
          { name: '不等式与不等式组', description: '一元一次不等式、不等式组、应用' },
        ],
      },
      {
        grade: '初二上', name: '几何证明核心', description: '三角形全等、轴对称、因式分解、分式', weight: 18, examFrequency: 'high',
        kps: [
          { name: '数与式', weight: 3, examFrequency: 'high', children: [
            { name: '代数式与因式分解', weight: 2, examFrequency: 'high' },
          ]},
          { name: '几何图形', weight: 3, examFrequency: 'high', children: [
            { name: '三角形', weight: 2, examFrequency: 'high' },
          ]},
        ],
        children: [
          { name: '三角形', description: '三边关系、内角和、外角性质、中线/高线/角平分线' },
          { name: '全等三角形', description: 'SSS/SAS/ASA/AAS/HL判定、全等证明与应用（中考几何基础）' },
          { name: '轴对称', description: '等腰三角形性质与判定、最短路径问题' },
          { name: '整式乘法与因式分解', description: '平方差/完全平方公式、提公因式/公式法/十字相乘法' },
        ],
      },
      {
        grade: '初二下', name: '函数入门与四边形', description: '二次根式、勾股定理、平行四边形、一次函数', weight: 22, examFrequency: 'high',
        kps: [
          { name: '函数', weight: 3, examFrequency: 'high', children: [
            { name: '一次函数', weight: 2, examFrequency: 'high' },
          ]},
          { name: '几何图形', weight: 3, examFrequency: 'high', children: [
            { name: '四边形', weight: 2, examFrequency: 'high' },
          ]},
        ],
        children: [
          { name: '二次根式', description: '化简、运算、分母有理化' },
          { name: '勾股定理', description: '勾股定理及其逆定理、应用（最短路径/折叠）' },
          { name: '平行四边形', description: '平行四边形/矩形/菱形/正方形的性质与判定、中位线' },
          { name: '一次函数', description: '定义、图象与性质、与方程/不等式的关系、应用题（中考必考）' },
        ],
      },
      {
        grade: '初三上', name: '函数与几何深化', description: '二次函数、旋转、圆、概率', weight: 24, examFrequency: 'high',
        kps: [
          { name: '方程与不等式', weight: 3, examFrequency: 'high', children: [
            { name: '一元二次方程', weight: 2, examFrequency: 'high' },
          ]},
          { name: '函数', weight: 3, examFrequency: 'high', children: [
            { name: '二次函数', weight: 3, examFrequency: 'high' },
          ]},
          { name: '几何图形', weight: 3, examFrequency: 'high', children: [
            { name: '圆', weight: 3, examFrequency: 'high' },
          ]},
        ],
        children: [
          { name: '一元二次方程', description: '解法（配方法/公式法/因式分解法）、判别式、根与系数关系' },
          { name: '二次函数（压轴核心）', description: '图象与性质、顶点式/交点式/一般式、最值问题、数形结合' },
          { name: '旋转', description: '中心对称、旋转作图、旋转性质（压轴题常用）' },
          { name: '圆', description: '圆周角/圆心角、切线性质与判定、弧长与扇形面积、正多边形与圆' },
        ],
      },
      {
        grade: '初三下', name: '综合复习与压轴突破', description: '反比例函数、相似、锐角三角函数、总复习', weight: 34, examFrequency: 'high',
        kps: [
          { name: '函数', weight: 3, examFrequency: 'high', children: [
            { name: '一次函数', weight: 2, examFrequency: 'high' },
            { name: '二次函数', weight: 3, examFrequency: 'high' },
            { name: '反比例函数', weight: 2, examFrequency: 'medium' },
          ]},
          { name: '几何图形', weight: 3, examFrequency: 'high', children: [
            { name: '三角形', weight: 2, examFrequency: 'high' },
            { name: '四边形', weight: 2, examFrequency: 'high' },
            { name: '圆', weight: 3, examFrequency: 'high' },
          ]},
          { name: '统计与概率', weight: 1, examFrequency: 'medium' },
        ],
        children: [
          { name: '反比例函数', description: '图象与性质、k的几何意义、与一次函数综合' },
          { name: '相似', description: '相似三角形判定与性质、位似（与圆/函数综合）' },
          { name: '锐角三角函数', description: '正弦/余弦/正切、解直角三角形、仰角/俯角问题（中考~11分）' },
          { name: '统计与概率', description: '统计图分析、中位数/众数/方差、概率计算（中考~11分）' },
        ],
      },
    ],
  },

  // ==================== 英语 ====================
  {
    subjectId: 3,
    subject: '英语',
    subjectColor: '#52c41a',
    examPolicy: {
      score: 120,
      examType: '闭卷+机考',
      examTime: '听力机考（独立，20分）+ 笔试90分钟（100分）',
      questionTypes: [
        { name: '听力理解（机考）', score: '20分', note: '提前考试，2025年起实行' },
        { name: '单项填空（15题×1分）', score: '15分' },
        { name: '完形填空（10题×1分）', score: '10分' },
        { name: '阅读理解（15题×2分）', score: '30分', note: '含应用文、记叙文、说明文、科技类' },
        { name: '补全对话（5题×1分）', score: '5分' },
        { name: '完成句子（5题×2分）', score: '10分' },
        { name: '任务型阅读（5题×1分）', score: '5分' },
        { name: '综合填空（10题×1分）', score: '10分' },
        { name: '书面表达（1题）', score: '15分', note: '约80-100词' },
      ],
      trends: [
        '2025年起听力改为机考，笔试时间缩短为90分钟',
        '阅读理解注重科技类、环保类文本',
        '综合填空考查语境理解力，难度加大',
        '书面表达侧重应用文（书信/邮件/倡议书）',
      ],
    },
    totalExamWeight: 120,
    summary: '天津使用外研版教材，语法体系与人教版重合度高。三年衔接紧密：初一五大时态基础 → 初二完成时/从句 → 初三被动语态/定语从句综合。词汇量要求约1600词。',
    grades: [
      {
        grade: '初一上', name: '英语基础入门', description: 'be动词、代词、there be、一般现在时、现在进行时', weight: 8, examFrequency: 'medium',
        kps: [
          { name: '单项选择', weight: 2, examFrequency: 'high' },
          { name: '听力理解', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '语法基础', description: 'be动词三种形式、人称代词与物主代词、指示代词' },
          { name: 'there be句型', description: '存在句、位置介词、some/any用法' },
          { name: 'have/has got', description: '拥有表达、家庭成员、外貌描述' },
          { name: '一般现在时', description: '第三人称单数、频率副词、日常活动表达' },
        ],
      },
      {
        grade: '初一下', name: '五大时态基础', description: '将来时、一般过去时、情态动词、祈使句', weight: 10, examFrequency: 'medium',
        kps: [
          { name: '单项选择', weight: 2, examFrequency: 'high' },
          { name: '听力理解', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '一般将来时', description: 'be going to / will 区别、时间状语' },
          { name: '一般过去时', description: '规则/不规则动词变化、过去时间状语' },
          { name: '情态动词', description: 'can / must / have to 用法与区别' },
          { name: '句型', description: '祈使句、感叹句、选择疑问句' },
        ],
      },
      {
        grade: '初二上', name: '比较等级与不定式', description: '形容词副词比较级/最高级、不定式用法、过去进行时', weight: 12, examFrequency: 'high',
        kps: [
          { name: '单项选择', weight: 2, examFrequency: 'high' },
          { name: '完形填空', weight: 2, examFrequency: 'high' },
          { name: '阅读理解', weight: 3, examFrequency: 'high' },
          { name: '听力理解', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '比较级与最高级', description: '规则变化、不规则变化、比较句型（as...as/than）' },
          { name: '动词不定式', description: 'to do作宾语/宾补/状语/主语' },
          { name: '过去进行时', description: 'was/were doing、与一般过去时区别' },
          { name: '情态动词推测', description: 'may/might/must/can表示推测' },
        ],
      },
      {
        grade: '初二下', name: '完成时与从句入门', description: '现在完成时、简单句结构、并列句、宾语从句', weight: 14, examFrequency: 'high',
        kps: [
          { name: '完形填空', weight: 2, examFrequency: 'high' },
          { name: '阅读理解', weight: 3, examFrequency: 'high' },
          { name: '补全对话', weight: 1, examFrequency: 'medium' },
          { name: '书面表达', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '现在完成时（中考重点）', description: 'have/has done、already/yet/for/since、与一般过去时区别' },
          { name: '感官动词', description: 'look/sound/smell/taste/feel + adj' },
          { name: '句子结构', description: '简单句五种基本结构、并列句（and/but/or）' },
          { name: '宾语从句（中考难点）', description: 'that/if/whether/wh-引导、语序、时态呼应' },
        ],
      },
      {
        grade: '初三上', name: '被动语态与从句深化', description: '六大时态综合、状语从句、被动语态、定语从句', weight: 20, examFrequency: 'high',
        kps: [
          { name: '完形填空', weight: 2, examFrequency: 'high' },
          { name: '阅读理解', weight: 3, examFrequency: 'high' },
          { name: '补全对话', weight: 1, examFrequency: 'medium' },
          { name: '书面表达', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '六大时态综合', description: '时态辨析与混合运用' },
          { name: '状语从句', description: '时间/原因/目的/条件/让步状语从句（中考必考）' },
          { name: '被动语态（中考核心）', description: '一般现在/过去/将来的被动语态、含情态动词的被动' },
          { name: '定语从句（中考难点）', description: 'that/who/which引导、关系代词省略、限定性定语从句' },
        ],
      },
      {
        grade: '初三下', name: '中考综合复习', description: '全部语法体系复习、中考题型专项训练、写作模板积累', weight: 56, examFrequency: 'high',
        kps: [
          { name: '单项选择', weight: 2, examFrequency: 'high' },
          { name: '完形填空', weight: 2, examFrequency: 'high' },
          { name: '阅读理解', weight: 3, examFrequency: 'high' },
          { name: '书面表达', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '综合复习', description: '词汇1600分类复习、语法易错点梳理、完形/阅读解题技巧' },
          { name: '书面表达', description: '书信/邮件/倡议书/记叙文四类常考文体模板' },
          { name: '听力专项', description: '短对话、长对话、短文理解三大题型训练' },
        ],
      },
    ],
  },

  // ==================== 物理 ====================
  {
    subjectId: 4,
    subject: '物理',
    subjectColor: '#722ed1',
    examPolicy: {
      score: 100,
      examType: '闭卷',
      examTime: '60分钟（与化学合场共120分钟）',
      questionTypes: [
        { name: '选择题（单选10+不定项4）', score: '32分' },
        { name: '填空题', score: '28分' },
        { name: '作图与简答题', score: '8分' },
        { name: '实验与探究题', score: '20分' },
        { name: '计算题', score: '12分' },
      ],
      trends: [
        '实验操作考查加强，电路实验为必考',
        '情境题融入真实案例（神舟飞船、天津之眼、天津港等）',
        '力学约40分 + 电学约38分为两大板块',
        '不定项选择难度大，需准确判断',
      ],
    },
    totalExamWeight: 100,
    summary: '物理从初二开始学习，两个年级完成全部内容。八年级（初二）学力学和基础物理现象，九年级（初三）学电学。力学和电学各占中考约40分，是得分关键。',
    grades: [
      {
        grade: '初二上', name: '物理现象入门', description: '机械运动、声现象、物态变化、光现象、透镜、质量密度', weight: 22, examFrequency: 'high',
        kps: [
          { name: '光学', weight: 1, examFrequency: 'medium' },
          { name: '热学', weight: 1, examFrequency: 'medium' },
        ],
        children: [
          { name: '机械运动', description: '长度与时间测量、运动的描述、速度计算' },
          { name: '声现象', description: '声音的产生与传播、声音的特性、噪声控制' },
          { name: '物态变化', description: '温度计、熔化与凝固、汽化与液化、升华与凝华' },
          { name: '光现象', description: '光的直线传播、反射定律、平面镜成像、折射' },
          { name: '透镜及其应用', description: '凸透镜成像规律（中考实验考点）、眼睛与眼镜' },
          { name: '质量与密度', description: '质量测量、密度公式与计算、密度测量实验' },
        ],
      },
      {
        grade: '初二下', name: '力学核心', description: '力、运动与力、压强、浮力、功和机械能、简单机械', weight: 38, examFrequency: 'high',
        kps: [
          { name: '力学', weight: 3, examFrequency: 'high', children: [
            { name: '运动和力', weight: 2, examFrequency: 'high' },
            { name: '压强与浮力', weight: 2, examFrequency: 'high' },
            { name: '功和机械能', weight: 2, examFrequency: 'medium' },
          ]},
        ],
        children: [
          { name: '力', description: '力的概念与效果、重力、弹力（弹簧测力计）、摩擦力' },
          { name: '运动和力', description: '牛顿第一定律、惯性、二力平衡、合力' },
          { name: '压强', description: '压强概念、液体压强、大气压强、流体压强与流速' },
          { name: '浮力（压轴常客）', description: '阿基米德原理、浮沉条件、浮力计算（称重法/原理法/平衡法）' },
          { name: '功和机械能', description: '功、功率、动能与势能、机械能守恒' },
          { name: '简单机械', description: '杠杆（五要素/平衡条件）、滑轮（定/动/滑轮组）、机械效率' },
        ],
      },
      {
        grade: '初三上', name: '热学与电学基础', description: '分子热运动、内能、热机、电流电路、电压电阻', weight: 20, examFrequency: 'high',
        kps: [
          { name: '电学', weight: 3, examFrequency: 'high', children: [
            { name: '电路基础', weight: 2, examFrequency: 'high' },
          ]},
        ],
        children: [
          { name: '热和能', description: '分子热运动、内能、比热容（Q=cmΔt）' },
          { name: '内能的利用', description: '热机、热机效率、能量守恒' },
          { name: '电流和电路', description: '电荷、电路图、串联与并联、电流表使用' },
          { name: '电压与电阻', description: '电压表使用、串并联电压规律、电阻与变阻器' },
        ],
      },
      {
        grade: '初三下', name: '电学核心与综合', description: '欧姆定律、电功率、生活用电、电与磁、信息传递', weight: 20, examFrequency: 'high',
        kps: [
          { name: '电学', weight: 3, examFrequency: 'high', children: [
            { name: '欧姆定律与电功率', weight: 2, examFrequency: 'high' },
          ]},
          { name: '力学', weight: 3, examFrequency: 'high', children: [
            { name: '运动和力', weight: 2, examFrequency: 'high' },
          ]},
        ],
        children: [
          { name: '欧姆定律（电学核心）', description: 'I=U/R、伏安法测电阻、串并联电阻规律' },
          { name: '电功率（中考计算重点）', description: 'P=UI=W/t、焦耳定律Q=I²Rt、额定功率与实际功率' },
          { name: '生活用电', description: '家庭电路、安全用电、保险丝/空气开关' },
          { name: '电与磁', description: '奥斯特实验、电磁铁、电动机与发电机原理、电磁感应' },
        ],
      },
    ],
  },

  // ==================== 化学 ====================
  {
    subjectId: 5,
    subject: '化学',
    subjectColor: '#fa8c16',
    examPolicy: {
      score: 100,
      examType: '闭卷',
      examTime: '60分钟（与物理合场共120分钟）',
      questionTypes: [
        { name: '选择题（15题×2分）', score: '30分' },
        { name: '填空题', score: '24分' },
        { name: '简答题', score: '16分' },
        { name: '实验题', score: '20分' },
        { name: '计算题', score: '10分' },
      ],
      trends: [
        '推断题和计算题约占总分50%',
        '实验操作考查：粗盐提纯为经典考点',
        '化学方程式配平与计算是基础得分项',
        '复分解反应条件/离子共存为难点',
      ],
    },
    totalExamWeight: 100,
    summary: '化学仅在初三学习一年，但中考占100分。上册打基础（物质构成、化学方程式），下册综合应用（金属、溶液、酸碱盐）。一年学完九个单元，节奏紧张。',
    grades: [
      {
        grade: '初三上', name: '化学基础', description: '化学入门、空气、物质构成、水、化学方程式、碳、燃烧', weight: 55, examFrequency: 'high',
        kps: [
          { name: '物质构成', weight: 2, examFrequency: 'high' },
          { name: '化学方程式', weight: 3, examFrequency: 'high' },
          { name: '化学实验', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '走进化学世界', description: '物理变化/化学变化、化学实验基本操作、药品取用' },
          { name: '空气与氧气', description: '空气成分、氧气性质与制取（中考实验考点）' },
          { name: '物质构成的奥秘', description: '分子与原子、原子结构、元素与元素符号、离子' },
          { name: '自然界的水', description: '水的组成（电解实验）、化学式与化合价' },
          { name: '化学方程式（核心工具）', description: '质量守恒定律、化学方程式书写与配平、计算步骤' },
          { name: '碳和碳的氧化物', description: '金刚石/石墨/C₆₀、CO与CO₂性质与转化、二氧化碳制取实验' },
          { name: '燃料及其利用', description: '燃烧条件与灭火原理、化石燃料、能源' },
        ],
      },
      {
        grade: '初三下', name: '综合应用', description: '金属、溶液、酸碱盐、化学与生活', weight: 45, examFrequency: 'high',
        kps: [
          { name: '溶液', weight: 2, examFrequency: 'medium' },
          { name: '酸碱盐', weight: 3, examFrequency: 'high' },
          { name: '金属与材料', weight: 2, examFrequency: 'medium' },
          { name: '化学实验', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '金属和金属材料', description: '金属共性、合金、金属活动性顺序（中考高频）' },
          { name: '溶液', description: '溶液形成、溶解度与溶解度曲线、溶质质量分数计算' },
          { name: '酸和碱（中考重难点）', description: '常见酸碱性质、中和反应、pH、复分解反应条件' },
          { name: '盐 化肥', description: '常见盐（NaCl/Na₂CO₃/NaHCO₃/CaCO₃）、粗盐提纯（实验考点）、化肥' },
          { name: '化学与生活', description: '人类营养素、有机合成材料（不设重点题型）' },
        ],
      },
    ],
  },

  // ==================== 历史 ====================
  {
    subjectId: 6,
    subject: '历史',
    subjectColor: '#13c2c2',
    examPolicy: {
      score: 100,
      examType: '开卷',
      examTime: '60分钟（与道法合场共120分钟）',
      questionTypes: [
        { name: '选择题（25题×2分）', score: '50分', note: '需结合图文材料分析，2025年起强调材料结合' },
        { name: '非选择题（3大题）', score: '50分', note: '第26题中国古代史、第27题中国近现代史、第28题世界史' },
      ],
      trends: [
        '2025年起开卷考试可携带任意纸质资料',
        '不考死记硬背，重材料分析与知识迁移',
        '时间轴梳理能力是核心素养',
        '难度比例约6:2:2，选择题有一定区分度',
      ],
    },
    totalExamWeight: 100,
    summary: '历史贯穿初中三年，中国古代史（七上+七下）、中国近现代史（八上+八下）、世界史（九上+九下）。中考侧重材料分析与时间轴综合能力。',
    grades: [
      {
        grade: '初一上', name: '中国古代史（早期）', description: '从早期人类到三国两晋南北朝', weight: 15, examFrequency: 'high',
        kps: [
          { name: '中国古代史', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '史前与夏商周', description: '北京人、炎帝黄帝、夏商周更替、青铜器、甲骨文、春秋战国百家争鸣' },
          { name: '秦汉', description: '秦统一与制度、汉武大一统、丝绸之路' },
          { name: '三国两晋南北朝', description: '三国鼎立、北魏孝文帝改革' },
        ],
      },
      {
        grade: '初一下', name: '中国古代史（后期）', description: '从隋唐到明清', weight: 18, examFrequency: 'high',
        kps: [
          { name: '中国古代史', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '隋唐', description: '隋朝大运河、贞观之治、开元盛世、唐朝中外交流' },
          { name: '宋元', description: '重文轻武、经济重心南移、四大发明、元朝行省制度' },
          { name: '明清', description: '明朝君主集权、郑和下西洋、闭关锁国、清朝疆域' },
        ],
      },
      {
        grade: '初二上', name: '中国近代史（上）', description: '从鸦片战争到五四运动', weight: 22, examFrequency: 'high',
        kps: [
          { name: '中国近代史', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '列强侵略', description: '鸦片战争、第二次鸦片战争、甲午中日战争、八国联军侵华' },
          { name: '近代化探索', description: '洋务运动、戊戌变法、辛亥革命、新文化运动' },
        ],
      },
      {
        grade: '初二下', name: '中国现代史', description: '从新中国成立至今', weight: 18, examFrequency: 'high',
        kps: [
          { name: '中国现代史', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '建国与探索', description: '开国大典、土地改革、一五计划、三大改造、文革' },
          { name: '改革开放', description: '十一届三中全会、经济特区、港澳回归、新时代' },
        ],
      },
      {
        grade: '初三上', name: '世界古代与近代史', description: '从上古文明到工业革命', weight: 15, examFrequency: 'medium',
        kps: [
          { name: '世界史', weight: 2, examFrequency: 'medium' },
        ],
        children: [
          { name: '世界古代', description: '古埃及/巴比伦/印度/希腊/罗马、中世纪欧洲、阿拉伯帝国' },
          { name: '世界近代（上）', description: '文艺复兴、新航路开辟、英法美资产阶级革命、工业革命' },
        ],
      },
      {
        grade: '初三下', name: '世界近现代史', description: '从马克思主义到当代世界', weight: 12, examFrequency: 'medium',
        kps: [
          { name: '中国近代史', weight: 3, examFrequency: 'high' },
          { name: '中国现代史', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '世界近代（下）', description: '马克思主义、俄国改革、美国内战、日本明治维新' },
          { name: '世界现代', description: '一战二战、冷战、多极化趋势、经济全球化' },
        ],
      },
    ],
  },

  // ==================== 道法 ====================
  {
    subjectId: 7,
    subject: '道法',
    subjectColor: '#eb2f96',
    examPolicy: {
      score: 100,
      examType: '开卷',
      examTime: '60分钟（与历史合场共120分钟）',
      questionTypes: [
        { name: '选择题（24题×2分）', score: '48分' },
        { name: '非选择题（8题）', score: '52分', note: '含材料分析、简答、实践探究' },
      ],
      trends: [
        '2025年起开卷考试可携带任意纸质资料',
        '难度比例7:2:1，第28-29题为拔高题',
        '材料分析结合时事热点（基层治理、科技伦理）',
        '跨年级/跨课本综合考查是拉分关键',
      ],
    },
    totalExamWeight: 100,
    summary: '道法贯穿三年，分三大板块：道德（个人成长/社会责任）、法律（权利义务/法治意识）、国情（制度自信/发展战略）。开卷考试难度在于时间紧张和对材料的快速定位。',
    grades: [
      {
        grade: '初一上', name: '成长的节拍', description: '中学适应、认识自己、友谊与成长', weight: 8, examFrequency: 'low',
        kps: [
          { name: '道德', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '成长的节拍', description: '中学序曲、少年有梦、认识自己、做更好的自己' },
          { name: '友谊的天空', description: '友谊与成长同行、交友原则、网络交往' },
        ],
      },
      {
        grade: '初一下', name: '青春与社会', description: '青春成长、情绪管理、集体生活、法治意识', weight: 10, examFrequency: 'medium',
        kps: [
          { name: '道德', weight: 2, examFrequency: 'high' },
          { name: '法律', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '青春时光', description: '青春期的变化与应对、青春飞扬与有格' },
          { name: '做情绪的主人', description: '情绪管理与调节、传递情感正能量' },
          { name: '在集体中成长', description: '集体与个人的关系、共建美好集体' },
          { name: '法治天地', description: '法律在我们身边、法律伴我们成长' },
        ],
      },
      {
        grade: '初二上', name: '社会与规则', description: '社会参与、规则意识、社会责任', weight: 14, examFrequency: 'high',
        kps: [
          { name: '道德', weight: 2, examFrequency: 'high' },
          { name: '法律', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '走进社会生活', description: '我与社会、网络生活新空间' },
          { name: '遵守社会规则', description: '秩序与规则、诚实守信、法不可违' },
          { name: '勇担社会责任', description: '责任与角色、关爱他人、服务社会' },
        ],
      },
      {
        grade: '初二下', name: '宪法与制度', description: '宪法精神、权利义务、国家制度', weight: 18, examFrequency: 'high',
        kps: [
          { name: '法律', weight: 3, examFrequency: 'high' },
          { name: '国情', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '维护宪法权威', description: '公民权利的保障书、治国安邦的总章程' },
          { name: '理解权利义务', description: '公民基本权利（政治/人身/经济/文化）、基本义务、权利与义务统一' },
          { name: '人民当家作主（中考重点）', description: '根本政治制度（人大）、基本政治制度（政党/民族区域自治/基层群众自治）、基本经济制度' },
          { name: '崇尚法治精神', description: '自由平等、公平正义、法治与德治' },
        ],
      },
      {
        grade: '初三上', name: '国情与发展', description: '改革开放、科技创新、民主法治、文化自信、生态文明', weight: 25, examFrequency: 'high',
        kps: [
          { name: '法律', weight: 3, examFrequency: 'high' },
          { name: '国情', weight: 3, examFrequency: 'high' },
        ],
        children: [
          { name: '富强与创新', description: '改革开放成就、共享发展、科教兴国/创新驱动发展战略' },
          { name: '民主与法治', description: '社会主义民主、依法治国、法治中国建设' },
          { name: '文明与家园', description: '中华文化传承、文化自信、社会主义核心价值观、美丽中国/生态文明' },
          { name: '和谐与梦想', description: '民族团结、一国两制、中国梦' },
        ],
      },
      {
        grade: '初三下', name: '世界与未来', description: '中国与世界、时代使命', weight: 25, examFrequency: 'high',
        kps: [
          { name: '国情', weight: 3, examFrequency: 'high' },
          { name: '道德', weight: 2, examFrequency: 'high' },
        ],
        children: [
          { name: '我们共同的世界', description: '经济全球化、文化多样性、和平与发展' },
          { name: '世界舞台上的中国（中考重点）', description: '中国担当、一带一路、人类命运共同体' },
          { name: '走向未来的少年', description: '职业规划、终身学习、时代使命与担当' },
        ],
      },
    ],
  },
]

// ==================== 天津中考政策汇总 ====================
export const ZK_POLICY_SUMMARY = {
  title: '天津中考 (2025-2027) 考试政策',
  totalScore: 800,
  examDays: 3,
  highlights: [
    '英语听力2025年起改为机考，提前单独考试',
    '历史·道法开卷可携带任意纸质材料',
    '物理·化学含实验操作考查（各约10%）',
    '体育40分（平时18分 + 统测22分）',
    '2027年起调整加分政策（取消优秀学生/干部加分）',
  ],
  gradeLevelNote: '物理从初二开始学习，化学仅在初三学习一年。语文/数学/英语/历史/道法贯穿七~九年级。',
}
