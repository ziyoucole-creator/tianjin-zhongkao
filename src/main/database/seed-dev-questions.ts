import type { Database as SqlJsDatabase } from 'sql.js'

interface DevQuestion {
  subject_id: number
  kp_id: number
  type: 'single_choice' | 'multiple_choice' | 'fill_blank'
  difficulty: 'easy' | 'medium' | 'hard'
  content: string
  options: string[] | null
  answer: string
  analysis: string
  year: number
  source: string
  exam_frequency: string
}

const DEV_QUESTIONS: DevQuestion[] = [
  // ==================== 语文 (subject_id=1) ====================
  // 基础知识 (1001)
  { subject_id: 1, kp_id: 1001, type: 'single_choice', difficulty: 'easy', content: '下列词语中加点字的注音完全正确的一项是？', options: ['A. 酝酿(niàng) 应和(hè) 着落(zhuó)', 'B. 贮蓄(chǔ) 粗犷(kuàng) 莅临(lì)', 'C. 棱镜(líng) 静谧(mì) 咄咄逼人(duō)', 'D. 淅沥(xī) 屋檐(yán) 花苞(bāo)'], answer: 'D', analysis: 'A项"着落"应为zhuó；B项"贮蓄"应为zhù，"粗犷"应为guǎng；C项"棱镜"应为léng。D项全部正确。', year: 2024, source: '天津模拟', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1001, type: 'single_choice', difficulty: 'medium', content: '下列词语书写完全正确的一项是？', options: ['A. 朗润 建壮 娇媚 呼朋引伴', 'B. 慈善 宽敞 澄清 花枝招展', 'C. 缭亮 烘托 繁花 精神抖擞', 'D. 铃铛 决别 憔悴 翻来覆去'], answer: 'B', analysis: 'A项"建壮"应为"健壮"；C项"缭亮"应为"嘹亮"；D项"决别"应为"诀别"。B项全部正确。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1001, type: 'fill_blank', difficulty: 'easy', content: '根据拼音写汉字：鸟儿将kē cháo（ ）安在繁花嫩叶当中，高兴起来了，hū péng yǐn bàn（ ）地卖弄清脆的喉咙。', options: null, answer: '窠巢 呼朋引伴', analysis: '考查《春》重点词语默写。"窠巢"指鸟兽的窝，"呼朋引伴"是中考常考四字词语。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // 字音字形 (1002)
  { subject_id: 1, kp_id: 1002, type: 'single_choice', difficulty: 'easy', content: '下列加点字注音全部正确的一项是？', options: ['A. 黄晕(yùn) 抖擞(sǒu) 卖弄(nòng)', 'B. 看护(kàn) 薄烟(báo) 蓑笠(suō)', 'C. 水涨(zhàng) 应和(hé) 嘹亮(liáo)', 'D. 筋骨(jīn) 缭乱(liáo) 澄澈(chéng)'], answer: 'A', analysis: 'B项"看护"应为kān；C项"水涨"应为zhǎng，"应和"应为hè；D项"筋骨"应为jīn无错但A更常见考查。A项全部正确。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1002, type: 'fill_blank', difficulty: 'easy', content: '下列词语中加点的字，每对读音都不同的一项是：A. 着落/着急 应和/和平 B. 薄雪/单薄 济南/救济 C. 澄清/澄沙 暖和/和平 D. 贮蓄/储藏 看护/看见', options: null, answer: 'A', analysis: 'A项zhuó/zháo，hè/hé，两对均不同；B项báo/bó，jǐ/jì；C项chéng/dèng，huo/hé；D项zhù/chǔ，kān/kàn。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // 词语成语运用 (1003)
  { subject_id: 1, kp_id: 1003, type: 'single_choice', difficulty: 'medium', content: '下列句子中加点成语使用恰当的一项是？', options: ['A. 他在演讲比赛中夸夸其谈，赢得了观众的阵阵掌声', 'B. 春天的公园里百花齐放，美不胜收', 'C. 他做错了事还强词夺理，真让人叹为观止', 'D. 这次考试他考了满分，同学们都对他刮目相看，认为他妙手偶得'], answer: 'B', analysis: 'A项"夸夸其谈"是贬义词；C项"叹为观止"是褒义词，用在此处不当；D项"妙手偶得"指技术高超的人偶然得到。B项使用正确。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 1, kp_id: 1003, type: 'single_choice', difficulty: 'medium', content: '依次填入下面句子横线处的词语最恰当的一项是：春天来了，大地___生机，一场春雨过后，空气格外___。', options: ['A. 焕发 清新', 'B. 散发 清澈', 'C. 焕然 清爽', 'D. 爆发 清洁'], answer: 'A', analysis: '"焕发生机"是固定搭配；形容空气用"清新"。考查近义词辨析。', year: 2024, source: '天津模拟', exam_frequency: 'medium' },

  // 病句辨析 (1004)
  { subject_id: 1, kp_id: 1004, type: 'single_choice', difficulty: 'medium', content: '下列句子中没有语病的一项是？', options: ['A. 通过这次活动，使我开阔了眼界', 'B. 能否刻苦努力，是取得好成绩的关键', 'C. 天津是一座美丽的海滨城市，拥有悠久的历史文化', 'D. 我们一定要防止安全事故不再发生'], answer: 'C', analysis: 'A项缺主语（通过……使……）；B项两面对一面（能否……是……）；D项否定不当（防止……不再）。C项没有语病。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1004, type: 'single_choice', difficulty: 'hard', content: '下列对病句的修改不正确的一项是？', options: ['A. "经过三年的努力，使他的成绩有了很大提高"——删去"使"', 'B. "一个人能否成为真正的读者，关键在于他在青少年时期养成良好的阅读习惯"——删去"能否"', 'C. "为了防止校园欺凌事件不再发生，学校加强了安全管理"——将"加强"改为"增强"', 'D. "这次比赛的获胜，将决定我们能否进入决赛"——删去"能否"'], answer: 'C', analysis: 'C项"防止……不再"否定不当，应删去"不"，而非改"加强"为"增强"。A、B、D项修改均正确。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 古诗文 (1005)
  { subject_id: 1, kp_id: 1005, type: 'fill_blank', difficulty: 'easy', content: '补写出下列名篇名句中的空缺部分。\n（1）________，若出其中；________，若出其里。（曹操《观沧海》）\n（2）我寄愁心与明月，________。（李白《闻王昌龄左迁龙标遥有此寄》）', options: null, answer: '星汉灿烂 日月之行 随君直到夜郎西', analysis: '考查七年级上册课内古诗默写。《观沧海》和《闻王昌龄左迁龙标遥有此寄》均为天津中考必考篇目。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1005, type: 'single_choice', difficulty: 'medium', content: '下列对《次北固山下》赏析不正确的一项是？', options: ['A. "客路青山外"点出诗人漂泊在外的羁旅之思', 'B. "潮平两岸阔"写出江水涨潮后两岸开阔的景象', 'C. "海日生残夜"表现诗人因夜不能寐而看到日出的痛苦', 'D. "归雁洛阳边"借用鸿雁传书的典故表达思乡之情'], answer: 'C', analysis: '"海日生残夜"表现的是新旧交替的哲理，蕴含着积极向上的精神，而非"因夜不能寐而看到日出的痛苦"。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // 古诗默写 (1006)
  { subject_id: 1, kp_id: 1006, type: 'fill_blank', difficulty: 'easy', content: '根据课文默写古诗文。\n（1）________，思而不学则殆。（《论语》十二章）\n（2）非淡泊无以明志，________。（诸葛亮《诫子书》）', options: null, answer: '学而不思则罔 非宁静无以致远', analysis: '考查七年级课内文言文名句默写，均为天津中考默写高频考点。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1006, type: 'fill_blank', difficulty: 'medium', content: '理解性默写：王湾《次北固山下》中蕴含新事物必将取代旧事物哲理的诗句是：________，________。', options: null, answer: '海日生残夜 江春入旧年', analysis: '考查理解性默写，需准确把握诗句蕴含的哲理。"海日生残夜，江春入旧年"是天津中考高频默写考点。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 古诗词鉴赏 (1007)
  { subject_id: 1, kp_id: 1007, type: 'single_choice', difficulty: 'medium', content: '阅读《天净沙·秋思》，下列赏析不正确的一项是？枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。', options: ['A. 前三句用九个名词构成三组画面，渲染了悲凉氛围', 'B. "小桥流水人家"以乐景写哀情，反衬游子思乡之悲', 'C. "古道西风瘦马"中"瘦"字写出了马的羸弱，暗含游子旅途艰辛', 'D. 结尾直抒胸臆，"断肠人"指因饥饿而极度痛苦的人'], answer: 'D', analysis: '"断肠人"形容极度悲伤的游子，而非"因饥饿而痛苦的人"。"断肠"是古典诗词中"极度悲伤"的固定意象。', year: 2024, source: '天津模拟', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1007, type: 'fill_blank', difficulty: 'medium', content: '李白《闻王昌龄左迁龙标遥有此寄》中，将月亮人格化、表达对友人关切之情的句子是：________，________。', options: null, answer: '我寄愁心与明月 随君直到夜郎西', analysis: '考查古诗词名句鉴赏。拟人手法将明月化为信使，表达对友人的深切关怀。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 文言文阅读 (1008)
  { subject_id: 1, kp_id: 1008, type: 'single_choice', difficulty: 'medium', content: '阅读《〈论语〉十二章》选段，下列加点词语解释不正确的一项是？子曰："学而时习之，不亦说乎？"', options: ['A. 时：按时', 'B. 习：温习、练习', 'C. 说：说话', 'D. 亦：也'], answer: 'C', analysis: '"说"是通假字，同"悦"，愉快的意思，而非"说话"。这是中考常考的文言实词。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1008, type: 'fill_blank', difficulty: 'hard', content: '翻译下列文言句子：\n"温故而知新，可以为师矣。"', options: null, answer: '温习旧的知识，能够有新的体会和发现，就可以凭借这一点做老师了。', analysis: '考查文言文翻译。"故"指旧的知识，"新"指新的理解和体会，"可以"是"可以凭借"的意思。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // 现代文阅读 (1009)
  { subject_id: 1, kp_id: 1009, type: 'single_choice', difficulty: 'medium', content: '阅读《春》，下列对"小草偷偷地从土里钻出来，嫩嫩的，绿绿的"一句赏析最恰当的是？', options: ['A. 这句话主要说明春天到了', 'B. "偷偷地"用了比喻手法，"钻"写出草长得慢', 'C. "偷偷地"运用拟人手法写春草悄然而生，"钻"表现破土而出的挤劲与生命力', 'D. 这句话是在描写土地的颜色'], answer: 'C', analysis: '"偷偷地"运用拟人修辞，"钻"写出小草破土而出的挤劲和旺盛生命力。拟人动词赏析是天津中考现代文阅读高频题型。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1009, type: 'fill_blank', difficulty: 'hard', content: '分析《秋天的怀念》中"母亲就悄悄地躲出去，在我看不见的地方偷偷地听着我的动静"一句中"悄悄地"和"偷偷地"的表达效果。', options: null, answer: '"悄悄地"写出母亲不想让儿子看到自己的担忧，表现母爱的细腻无私；"偷偷地"写出母亲虽然躲出去却仍牵挂着儿子，默默关注着儿子的一举一动。两个叠词生动形象地表现了深沉而细腻的母爱。', analysis: '考查细节描写赏析。需从词语含义、表现内容、情感表达三个层面作答。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 名著阅读 (1010)
  { subject_id: 1, kp_id: 1010, type: 'single_choice', difficulty: 'easy', content: '下列关于《朝花夕拾》的说法不正确的一项是？', options: ['A. 《从百草园到三味书屋》出自鲁迅的《朝花夕拾》', 'B. 《阿长与〈山海经〉》表达了对长妈妈的怀念', 'C. 《朝花夕拾》是鲁迅的散文诗集', 'D. 《藤野先生》记录了作者在日本留学的经历'], answer: 'C', analysis: '《朝花夕拾》是散文集，不是散文诗集。鲁迅的散文诗集是《野草》。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 1, kp_id: 1010, type: 'fill_blank', difficulty: 'medium', content: '名著阅读填空：《西游记》中，孙悟空的第一位师父是________，他教会了孙悟空________和________。', options: null, answer: '菩提祖师 七十二变 筋斗云', analysis: '考查《西游记》重要情节。菩提祖师是孙悟空的启蒙师父。', year: 2023, source: '天津模拟', exam_frequency: 'medium' },

  // 作文 (1011)
  { subject_id: 1, kp_id: 1011, type: 'single_choice', difficulty: 'easy', content: '关于中考作文，以下做法正确的是？', options: ['A. 开头可以不点题，最后再点就行', 'B. 作文跑题没关系，语言优美就能得高分', 'C. 记叙文要抓住细节描写，写出真情实感', 'D. 字数少于600字不会扣分'], answer: 'C', analysis: '天津中考作文评分标准：记叙文需有真情实感和细节描写。A项开头必须点题；B项跑题会严重扣分；D项字数不足会扣分。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 1, kp_id: 1011, type: 'fill_blank', difficulty: 'medium', content: '中考记叙文写作的六个基本要素是：________、________、________、________、________、________。', options: null, answer: '时间 地点 人物 起因 经过 结果', analysis: '记叙文六要素是写作基础，确保文章内容完整、条理清晰。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // ==================== 数学 (subject_id=2) ====================
  // 数与式 (2001)
  { subject_id: 2, kp_id: 2001, type: 'single_choice', difficulty: 'easy', content: '计算：-3 + 5 的结果是？', options: ['A. -8', 'B. 2', 'C. -2', 'D. 8'], answer: 'B', analysis: '异号两数相加，取绝对值较大加数的符号，并用较大的绝对值减去较小的绝对值。|-3|=3，|5|=5，5>3，所以结果为+（5-3）=2。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2001, type: 'single_choice', difficulty: 'medium', content: '下列计算正确的是？', options: ['A. a²·a³ = a⁶', 'B. (a²)³ = a⁶', 'C. a⁶÷a² = a³', 'D. (ab)² = ab²'], answer: 'B', analysis: 'A项应为a⁵（同底数幂相乘指数相加）；C项应为a⁴（同底数幂相除指数相减）；D项应为a²b²（积的乘方等于乘方的积）。B项幂的乘方计算正确。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 实数运算 (2002)
  { subject_id: 2, kp_id: 2002, type: 'single_choice', difficulty: 'easy', content: '√16 的算术平方根是？', options: ['A. 4', 'B. ±4', 'C. 2', 'D. ±2'], answer: 'C', analysis: '√16=4，求4的算术平方根，√4=2。注意：先求√16的值，再求其算术平方根。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2002, type: 'fill_blank', difficulty: 'medium', content: '计算：|√3 - 2| + (π - 3.14)⁰ = ________。', options: null, answer: '3 - √3', analysis: '|√3-2|=2-√3（因为√3<2），(π-3.14)⁰=1（任何非零数的零次幂等于1）。原式=2-√3+1=3-√3。', year: 2023, source: '天津中考', exam_frequency: 'high' },

  // 代数式与因式分解 (2003)
  { subject_id: 2, kp_id: 2003, type: 'single_choice', difficulty: 'medium', content: '分解因式 x² - 4 的结果是？', options: ['A. (x+2)(x-2)', 'B. (x-2)²', 'C. (x+4)(x-4)', 'D. x(x-4)'], answer: 'A', analysis: '运用平方差公式：a²-b²=(a+b)(a-b)。x²-4=x²-2²=(x+2)(x-2)。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2003, type: 'fill_blank', difficulty: 'medium', content: '分解因式：x² + 6x + 9 = ________。', options: null, answer: '(x+3)²', analysis: '运用完全平方公式：a²+2ab+b²=(a+b)²。x²+6x+9=x²+2·x·3+3²=(x+3)²。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 方程与不等式 (2004)
  { subject_id: 2, kp_id: 2004, type: 'single_choice', difficulty: 'easy', content: '方程 2x - 6 = 0 的解是？', options: ['A. x = -3', 'B. x = 3', 'C. x = 6', 'D. x = 2'], answer: 'B', analysis: '2x-6=0，移项得2x=6，两边同除以2得x=3。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2004, type: 'single_choice', difficulty: 'medium', content: '不等式组 {x>2, x≤5} 的解集在数轴上表示正确的是？', options: ['A. 2<x≤5', 'B. 2≤x<5', 'C. x>2或x≤5', 'D. x≥2且x<5'], answer: 'A', analysis: '不等式组的解集是各不等式解集的公共部分。x>2且x≤5，即2<x≤5。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 一元二次方程 (2005)
  { subject_id: 2, kp_id: 2005, type: 'single_choice', difficulty: 'medium', content: '一元二次方程 x² - 5x + 6 = 0 的两个根是？', options: ['A. x₁=1, x₂=6', 'B. x₁=-2, x₂=-3', 'C. x₁=2, x₂=3', 'D. x₁=-1, x₂=-6'], answer: 'C', analysis: '因式分解：(x-2)(x-3)=0，所以x₁=2，x₂=3。也可用求根公式验证。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2005, type: 'fill_blank', difficulty: 'hard', content: '若关于x的一元二次方程 x² + (2k-1)x + k² = 0 有两个相等的实数根，则k的值为________。', options: null, answer: 'k = 1/4', analysis: '有两个相等实数根 → Δ=0。Δ=(2k-1)²-4×1×k²=4k²-4k+1-4k²=-4k+1=0，解得k=1/4。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 不等式与不等式组 (2006)
  { subject_id: 2, kp_id: 2006, type: 'single_choice', difficulty: 'medium', content: '解不等式：3x - 7 > 2x + 1，解集为？', options: ['A. x > 8', 'B. x < 8', 'C. x > -6', 'D. x > 6'], answer: 'A', analysis: '3x-7>2x+1，移项：3x-2x>1+7，得x>8。', year: 2023, source: '天津模拟', exam_frequency: 'medium' },
  { subject_id: 2, kp_id: 2006, type: 'fill_blank', difficulty: 'medium', content: '不等式组 {2x-1>3, 5-x≥2} 的整数解为________。', options: null, answer: 'x=3', analysis: '2x-1>3 → 2x>4 → x>2；5-x≥2 → -x≥-3 → x≤3。∴2<x≤3，整数解为3。', year: 2024, source: '天津中考', exam_frequency: 'medium' },

  // 函数 (2007)
  { subject_id: 2, kp_id: 2007, type: 'single_choice', difficulty: 'medium', content: '下列各点中，在函数 y = 2x - 1 图象上的是？', options: ['A. (1, 1)', 'B. (1, 2)', 'C. (0, 1)', 'D. (2, 1)'], answer: 'A', analysis: '将x=1代入：y=2×1-1=1，所以点(1,1)在图象上。B:(1,2)→y=2×1-1=1≠2；C:(0,1)→y=2×0-1=-1≠1；D:(2,1)→y=2×2-1=3≠1。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2007, type: 'single_choice', difficulty: 'hard', content: '关于二次函数 y = ax² + bx + c（a≠0），以下说法正确的是？', options: ['A. a>0时函数图象开口向下', 'B. 对称轴一定是y轴', 'C. 当a>0时函数有最小值', 'D. 函数图象一定经过原点'], answer: 'C', analysis: 'A项a>0开口向上；B项对称轴为x=-b/(2a)，不一定是y轴；D项当c≠0时不过原点。C项正确，a>0时抛物线开口向上，函数有最小值。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 一次函数 (2008)
  { subject_id: 2, kp_id: 2008, type: 'single_choice', difficulty: 'medium', content: '一次函数 y = -2x + 3 的图象不经过哪个象限？', options: ['A. 第一象限', 'B. 第二象限', 'C. 第三象限', 'D. 第四象限'], answer: 'C', analysis: 'k=-2<0，函数y随x增大而减小；b=3>0，图象与y轴交于正半轴(0,3)。图象经过一、二、四象限，不经过第三象限。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2008, type: 'fill_blank', difficulty: 'medium', content: '已知一次函数 y = kx + b 的图象经过点(1, 3)和(2, 5)，则k=________，b=________。', options: null, answer: 'k=2 b=1', analysis: '代入两点：{k+b=3, 2k+b=5}，两式相减得k=2，代入k+b=3得b=1。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // 二次函数 (2009)
  { subject_id: 2, kp_id: 2009, type: 'single_choice', difficulty: 'medium', content: '抛物线 y = (x-1)² + 2 的顶点坐标是？', options: ['A. (-1, 2)', 'B. (1, 2)', 'C. (1, -2)', 'D. (-1, -2)'], answer: 'B', analysis: '二次函数顶点式：y=a(x-h)²+k，顶点为(h,k)。y=(x-1)²+2中h=1，k=2，顶点为(1, 2)。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2009, type: 'fill_blank', difficulty: 'hard', content: '已知抛物线 y = x² + 2x + m 与x轴只有一个交点，则m=________。', options: null, answer: 'm=1', analysis: '与x轴只有一个交点 → Δ=0。Δ=b²-4ac=4-4×1×m=4-4m=0，解得m=1。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 反比例函数 (2010)
  { subject_id: 2, kp_id: 2010, type: 'single_choice', difficulty: 'medium', content: '反比例函数 y = 6/x 的图象位于哪些象限？', options: ['A. 一、二象限', 'B. 一、三象限', 'C. 二、四象限', 'D. 三、四象限'], answer: 'B', analysis: 'k=6>0，反比例函数图象位于第一、第三象限。当k<0时位于第二、第四象限。', year: 2024, source: '天津模拟', exam_frequency: 'medium' },
  { subject_id: 2, kp_id: 2010, type: 'fill_blank', difficulty: 'medium', content: '已知反比例函数 y = k/x 的图象经过点(-2, 3)，则k=________。', options: null, answer: 'k=-6', analysis: '将点(-2,3)代入：3=k/(-2)，k=-6。k为比例系数，其几何意义是图象上一点横纵坐标的乘积。', year: 2023, source: '天津中考', exam_frequency: 'medium' },

  // 几何图形 (2011)
  { subject_id: 2, kp_id: 2011, type: 'single_choice', difficulty: 'easy', content: '已知∠A=35°，则∠A的余角等于？', options: ['A. 55°', 'B. 145°', 'C. 35°', 'D. 65°'], answer: 'A', analysis: '两个角互为余角，则它们的和为90°。∠A的余角=90°-35°=55°。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2011, type: 'single_choice', difficulty: 'medium', content: '一个多边形的内角和是720°，则这个多边形是？', options: ['A. 四边形', 'B. 五边形', 'C. 六边形', 'D. 七边形'], answer: 'C', analysis: 'n边形内角和公式：(n-2)×180°=720°，n-2=4，n=6。所以是六边形。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // 三角形 (2012)
  { subject_id: 2, kp_id: 2012, type: 'single_choice', difficulty: 'medium', content: '下列各组线段中，能构成三角形的是？', options: ['A. 2cm, 3cm, 5cm', 'B. 3cm, 4cm, 5cm', 'C. 1cm, 2cm, 4cm', 'D. 2cm, 3cm, 6cm'], answer: 'B', analysis: '三角形两边之和大于第三边。A:2+3=5，等于第三边，不能；B:3+4>5，能；C:1+2<4，不能；D:2+3<6，不能。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2012, type: 'fill_blank', difficulty: 'hard', content: '如图，在△ABC中，AB=AC，∠A=40°，BD是AC边上的高，则∠DBC=________°。', options: null, answer: '20', analysis: 'AB=AC → ∠C=∠ABC=(180°-40°)/2=70°。BD⊥AC → ∠BDC=90°。在Rt△BDC中，∠DBC=90°-70°=20°。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 四边形 (2013)
  { subject_id: 2, kp_id: 2013, type: 'single_choice', difficulty: 'medium', content: '下列性质中，矩形具有而平行四边形不一定具有的是？', options: ['A. 对边平行且相等', 'B. 对角线互相平分', 'C. 四个角都是直角', 'D. 对角相等'], answer: 'C', analysis: 'A、B、D都是平行四边形的一般性质。只有矩形的特殊性质是四个角都是直角（以及对角线相等）。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2013, type: 'fill_blank', difficulty: 'medium', content: '菱形ABCD的对角线AC=6cm，BD=8cm，则菱形的面积为________cm²。', options: null, answer: '24', analysis: '菱形面积=对角线乘积的一半，S=6×8/2=24cm²。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 圆 (2014)
  { subject_id: 2, kp_id: 2014, type: 'single_choice', difficulty: 'medium', content: '已知圆的半径为5cm，圆心角为72°所对的弧长为？(π取3.14)', options: ['A. 3.14cm', 'B. 6.28cm', 'C. 2πcm', 'D. 4πcm'], answer: 'B', analysis: '弧长公式：l=nπr/180°。l=72×π×5/180=2π=6.28cm。注意审题用3.14取近似值。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 2, kp_id: 2014, type: 'fill_blank', difficulty: 'hard', content: '如图，AB是⊙O的直径，CD是弦，AB⊥CD于E。若AB=10，CD=8，则OE=________。', options: null, answer: '3', analysis: '半径OA=5，CD⊥AB于E，则CE=CD/2=4。在Rt△OCE中，OC=5，CE=4，由勾股定理：OE=√(5²-4²)=3。', year: 2023, source: '天津中考', exam_frequency: 'high' },

  // 统计与概率 (2015)
  { subject_id: 2, kp_id: 2015, type: 'single_choice', difficulty: 'easy', content: '一组数据：2, 3, 4, 4, 5 的中位数是？', options: ['A. 3', 'B. 4', 'C. 3.5', 'D. 4.5'], answer: 'B', analysis: '将数据从小到大排序：2,3,4,4,5，中间位置第3个数为4，所以中位数是4。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 2, kp_id: 2015, type: 'fill_blank', difficulty: 'medium', content: '一个不透明的袋中有3个红球和2个白球，随机摸出一个球是红球的概率为________。', options: null, answer: '3/5', analysis: 'P(红球)=红球数/总球数=3/(3+2)=3/5。古典概型，所有结果等可能。', year: 2023, source: '天津模拟', exam_frequency: 'medium' },

  // ==================== 英语 (subject_id=3) ====================
  // 单项选择 (3001)
  { subject_id: 3, kp_id: 3001, type: 'single_choice', difficulty: 'easy', content: '— ________ is your school from your home?\n— About 2 kilometers.', options: ['A. How long', 'B. How far', 'C. How often', 'D. How soon'], answer: 'B', analysis: '回答是距离(About 2 kilometers)，问距离用How far。How long问时长/长度，How often问频率，How soon问多久以后。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 3, kp_id: 3001, type: 'single_choice', difficulty: 'medium', content: 'My brother ________ the piano every day after school.', options: ['A. practise', 'B. practises', 'C. is practising', 'D. practised'], answer: 'B', analysis: 'every day表示一般现在时，主语My brother是第三人称单数，动词需加-s/es，practice的第三人称单数形式是practises。', year: 2023, source: '天津中考', exam_frequency: 'high' },

  // 完形填空 (3002)
  { subject_id: 3, kp_id: 3002, type: 'single_choice', difficulty: 'medium', content: '（完形填空节选）\nWhen I was young, I was afraid of making mistakes. My grandfather __1__ told me, "Mistakes are the best teachers."', options: ['A. never', 'B. always', 'C. hardly', 'D. sometimes'], answer: 'B', analysis: '根据语境，祖父常安慰"我"，"always"表示"总是"，符合语境。从下文的建议可知祖父是经常说这句话的人。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 3, kp_id: 3002, type: 'single_choice', difficulty: 'hard', content: '（完形填空节选）\nThe girl felt so __1__ that she couldn\'t say a word when she received the award.', options: ['A. excited', 'B. bored', 'C. worried', 'D. relaxed'], answer: 'A', analysis: '收到奖项时的情绪，结合"couldn\'t say a word"（激动得说不出话），应用excited（激动的）。bored=无聊的，worried=担心的，relaxed=放松的，均不符合。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 阅读理解 (3003)
  { subject_id: 3, kp_id: 3003, type: 'single_choice', difficulty: 'medium', content: '（阅读理解节选）\nWhat is the main idea of the passage about environmental protection?', options: ['A. To introduce different types of pollution', 'B. To encourage people to protect the environment', 'C. To explain how factories cause pollution', 'D. To describe a visit to a polluted river'], answer: 'B', analysis: '主旨大意题。环保类文章通常以"鼓励人们保护环境"为主旨。需通读全文把握作者写作目的，不可仅凭细节判断。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 3, kp_id: 3003, type: 'single_choice', difficulty: 'hard', content: '（阅读理解节选）\nThe word "it" in paragraph 3 refers to ________.', options: ['A. the school', 'B. the library', 'C. the new technology', 'D. the robot'], answer: 'C', analysis: '代词指代题。需回原文找到段落3中的"it"，并联系前一句确定所指对象。"it"指代上文中提到的"new technology"。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 补全对话 (3004)
  { subject_id: 3, kp_id: 3004, type: 'single_choice', difficulty: 'medium', content: '补全对话：\nA: ________\nB: I\'d like a cup of coffee, please.', options: ['A. What do you want?', 'B. Can I help you?', 'C. Do you like coffee?', 'D. What about some tea?'], answer: 'B', analysis: '对话中B回答想要咖啡，说明A在提供帮助/问需求。"Can I help you?"是服务场景的标准用语。A项语气过于直接。', year: 2024, source: '天津模拟', exam_frequency: 'medium' },
  { subject_id: 3, kp_id: 3004, type: 'fill_blank', difficulty: 'medium', content: '补全对话：\nA: What\'s the weather like today?\nB: ________.', options: null, answer: "It's sunny / It's raining / It's cloudy（根据上下文合理即可）", analysis: '考查口语交际中的天气问答。What\'s the weather like 询问天气情况，回答用It\'s + 天气形容词。', year: 2023, source: '天津中考', exam_frequency: 'medium' },

  // 书面表达 (3005)
  { subject_id: 3, kp_id: 3005, type: 'single_choice', difficulty: 'medium', content: '写申请邮件时，开头问候语最合适的是？', options: ['A. Hi, buddy!', 'B. Dear Sir or Madam,', 'C. Hello, my friend!', 'D. Yo!'], answer: 'B', analysis: '申请邮件为正式书信，应用正式问候语"Dear Sir or Madam,"。A、C、D均为非正式用语，不适合正式场合。', year: 2024, source: '天津模拟', exam_frequency: 'high' },
  { subject_id: 3, kp_id: 3005, type: 'fill_blank', difficulty: 'hard', content: '翻译并润色：\n"我们应该保护环境，因为这对我们的健康很重要。"', options: null, answer: 'We should protect the environment because it is very important for our health.', analysis: '考查汉译英及书面表达能力。译文需注意：①使用because连接因果从句；②"对……很重要"用be important for；③主语用it指代前文提到的protect the environment。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 听力理解 (3006)
  { subject_id: 3, kp_id: 3006, type: 'single_choice', difficulty: 'easy', content: '（听力节选）\nWhat time does the school bus leave?\nA. At 7:15　B. At 7:30　C. At 7:45', options: ['A. At 7:15', 'B. At 7:30', 'C. At 7:45'], answer: 'B', analysis: '听力材料中明确提到"The school bus leaves at half past seven"，即7:30。注意听数字和时间表达。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 3, kp_id: 3006, type: 'single_choice', difficulty: 'medium', content: '（听力节选）\nWhat is the relationship between the two speakers?\nA. Teacher and student　B. Mother and son　C. Doctor and patient', options: ['A. Teacher and student', 'B. Mother and son', 'C. Doctor and patient'], answer: 'A', analysis: '对话中提到"homework"和"classroom"，判断为师生关系。听力中需捕捉关键词判断说话人关系。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // ==================== 物理 (subject_id=4) ====================
  // 力学 (4001)
  { subject_id: 4, kp_id: 4001, type: 'single_choice', difficulty: 'easy', content: '下列哪个是力的单位？', options: ['A. 千克(kg)', 'B. 牛顿(N)', 'C. 米(m)', 'D. 秒(s)'], answer: 'B', analysis: '力的国际单位是牛顿(N)，以科学家牛顿命名。千克是质量单位，米是长度单位，秒是时间单位。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 4, kp_id: 4001, type: 'single_choice', difficulty: 'medium', content: '一个物体受到两个力的作用，这两个力的三要素完全相同，则该物体？', options: ['A. 一定处于静止状态', 'B. 一定做匀速直线运动', 'C. 运动状态一定改变', 'D. 运动状态一定不变'], answer: 'C', analysis: '两个力的三要素（大小、方向、作用点）完全相同，即两个力方向相同，合力不为零（F合=2F），物体运动状态一定改变。', year: 2023, source: '天津模拟', exam_frequency: 'high' },

  // 运动和力 (4002)
  { subject_id: 4, kp_id: 4002, type: 'single_choice', difficulty: 'medium', content: '正在行驶的汽车突然刹车时，乘客会向前倾倒，这是因为？', options: ['A. 乘客受到向前的力', 'B. 乘客具有惯性', 'C. 乘客受到向后的力', 'D. 汽车对乘客有向前的摩擦力'], answer: 'B', analysis: '乘客原来随车一起向前运动，刹车时车减速而乘客由于惯性保持原来向前运动的状态，所以向前倾倒。惯性是一切物体的固有属性。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 4, kp_id: 4002, type: 'fill_blank', difficulty: 'medium', content: '一辆质量为1.5t的汽车在水平路面上匀速行驶，受到地面的摩擦力为车重的0.1倍，则牵引力F=________N。(g取10N/kg)', options: null, answer: '1500', analysis: 'G=mg=1500kg×10N/kg=15000N，f=0.1G=1500N。因匀速行驶，F=f=1500N（二力平衡）。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 压强与浮力 (4003)
  { subject_id: 4, kp_id: 4003, type: 'single_choice', difficulty: 'medium', content: '一个物体浸没在水中，排开水的重力为10N，则物体受到的浮力为？', options: ['A. 大于10N', 'B. 等于10N', 'C. 小于10N', 'D. 无法判断'], answer: 'B', analysis: '根据阿基米德原理：F浮=G排。物体受到的浮力等于排开液体的重力。G排=10N，所以F浮=10N。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 4, kp_id: 4003, type: 'fill_blank', difficulty: 'hard', content: '一本物理书平放在水平桌面上，它对桌面的压强约为________Pa。（物理书质量约200g，面积约400cm²，g=10N/kg）', options: null, answer: '50', analysis: 'G=mg=0.2kg×10N/kg=2N，S=400cm²=0.04m²，p=F/S=G/S=2/0.04=50Pa。注意单位换算：cm²→m²需除以10000。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 功和机械能 (4004)
  { subject_id: 4, kp_id: 4004, type: 'single_choice', difficulty: 'medium', content: '一个物体沿光滑斜面下滑，以下说法正确的是？', options: ['A. 动能减小，重力势能增大', 'B. 动能增大，重力势能减小', 'C. 动能不变，重力势能减小', 'D. 动能增大，重力势能不变'], answer: 'B', analysis: '物体下滑时高度降低→重力势能减小；光滑斜面→无摩擦→机械能守恒→动能增大（速度增大）。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 4, kp_id: 4004, type: 'fill_blank', difficulty: 'medium', content: '用50N的水平推力推一个重200N的箱子前进了2m，推力做的功为________J。', options: null, answer: '100', analysis: 'W=Fs=50N×2m=100J。注意：功等于力与在力的方向上移动距离的乘积，重力的方向与运动方向垂直，重力不做功。', year: 2023, source: '天津模拟', exam_frequency: 'medium' },

  // 电学 (4005)
  { subject_id: 4, kp_id: 4005, type: 'single_choice', difficulty: 'easy', content: '下列材料中，属于导体的是？', options: ['A. 橡胶', 'B. 铜丝', 'C. 塑料', 'D. 陶瓷'], answer: 'B', analysis: '铜是良好的导体。橡胶、塑料、陶瓷都是绝缘体。导体和绝缘体的区别在于是否有大量可自由移动的电荷。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 4, kp_id: 4005, type: 'single_choice', difficulty: 'medium', content: '两个电阻R₁=3Ω和R₂=6Ω串联，总电阻为？', options: ['A. 2Ω', 'B. 3Ω', 'C. 9Ω', 'D. 18Ω'], answer: 'C', analysis: '串联电路总电阻：R总=R₁+R₂=3Ω+6Ω=9Ω。串联电阻大于任一分电阻。若并联：1/R总=1/3+1/6=1/2，R总=2Ω。', year: 2023, source: '天津中考', exam_frequency: 'high' },

  // 电路基础 (4006)
  { subject_id: 4, kp_id: 4006, type: 'single_choice', difficulty: 'medium', content: '在串联电路中，各处电流________。', options: ['A. 都相等', 'B. 靠近电源正极的更大', 'C. 靠近电源负极的更大', 'D. 无法确定'], answer: 'A', analysis: '串联电路中电流处处相等，这是串联电路的基本特点。并联电路中各支路两端电压相等。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 4, kp_id: 4006, type: 'fill_blank', difficulty: 'medium', content: '在如图电路中，电源电压为6V，灯泡L₁和L₂串联，电压表测L₁两端电压为2V，则L₂两端电压为________V。', options: null, answer: '4', analysis: '串联电路电压规律：U总=U₁+U₂。U₂=U总-U₁=6V-2V=4V。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 欧姆定律与电功率 (4007)
  { subject_id: 4, kp_id: 4007, type: 'single_choice', difficulty: 'medium', content: '一个电阻为20Ω的用电器，两端电压为10V，则通过它的电流为？', options: ['A. 0.2A', 'B. 0.5A', 'C. 2A', 'D. 200A'], answer: 'B', analysis: '欧姆定律：I=U/R=10V/20Ω=0.5A。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 4, kp_id: 4007, type: 'fill_blank', difficulty: 'hard', content: '一个标有"6V 3W"的小灯泡正常发光时，通过灯丝的电流为________A，灯丝电阻为________Ω。', options: null, answer: '0.5 12', analysis: '由P=UI得I=P/U=3W/6V=0.5A；由R=U/I=6V/0.5A=12Ω。也可由P=U²/R直接求R=U²/P=36/3=12Ω。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // 光学 (4008)
  { subject_id: 4, kp_id: 4008, type: 'single_choice', difficulty: 'easy', content: '光在同种均匀介质中沿________传播。', options: ['A. 直线', 'B. 曲线', 'C. 折线', 'D. 任意路径'], answer: 'A', analysis: '光在同种均匀介质中沿直线传播。这是光的基本性质。小孔成像、日食月食、影子的形成都可用此原理解释。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 4, kp_id: 4008, type: 'single_choice', difficulty: 'medium', content: '物体放在凸透镜前，在光屏上得到倒立缩小的实像，则物距u满足？', options: ['A. u < f', 'B. f < u < 2f', 'C. u = 2f', 'D. u > 2f'], answer: 'D', analysis: '凸透镜成像规律：u>2f时成倒立缩小实像（照相机原理）；f<u<2f时成倒立放大实像（投影仪原理）；u<f时成正立放大虚像（放大镜原理）。', year: 2023, source: '天津中考', exam_frequency: 'medium' },

  // 热学 (4009)
  { subject_id: 4, kp_id: 4009, type: 'single_choice', difficulty: 'medium', content: '下列物态变化中，属于液化的是？', options: ['A. 冰雪消融', 'B. 冬天玻璃上的冰花', 'C. 夏天冰棍周围的"白气"', 'D. 衣柜里的樟脑丸变小'], answer: 'C', analysis: 'A是熔化（固→液）；B是凝华（气→固）；C是液化（气→液，空气中的水蒸气遇冷液化）；D是升华（固→气）。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 4, kp_id: 4009, type: 'fill_blank', difficulty: 'medium', content: '质量为2kg的水温度从20℃升高到100℃，水吸收的热量为________J。[c水=4.2×10³J/(kg·℃)]', options: null, answer: '6.72×10⁵', analysis: 'Q吸=cmΔt=4.2×10³×2×(100-20)=4.2×10³×2×80=6.72×10⁵J。', year: 2024, source: '天津模拟', exam_frequency: 'medium' },

  // ==================== 化学 (subject_id=5) ====================
  // 物质构成 (5001)
  { subject_id: 5, kp_id: 5001, type: 'single_choice', difficulty: 'easy', content: '保持水的化学性质的最小粒子是？', options: ['A. 氢原子', 'B. 氧原子', 'C. 水分子', 'D. 氢元素'], answer: 'C', analysis: '分子是保持物质化学性质的最小粒子。水由水分子(H₂O)构成，保持水化学性质的是水分子。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 5, kp_id: 5001, type: 'single_choice', difficulty: 'medium', content: '下列符号中，既能表示一种元素，又能表示一个原子，还能表示一种物质的是？', options: ['A. O', 'B. N', 'C. Fe', 'D. H'], answer: 'C', analysis: 'Fe是金属元素符号，可表示铁元素、一个铁原子、铁单质。O、N、H表示非金属元素，只能表示元素和一个原子，不能表示单质（需O₂、N₂、H₂）。', year: 2023, source: '天津中考', exam_frequency: 'high' },

  // 化学方程式 (5002)
  { subject_id: 5, kp_id: 5002, type: 'single_choice', difficulty: 'medium', content: '下列化学方程式书写正确的是？', options: ['A. Fe + O₂ → Fe₃O₄', 'B. 2H₂O = 2H₂↑ + O₂↑', 'C. 2NaOH + CO₂ → Na₂CO₃ + H₂O', 'D. CaCO₃ + HCl → CaCl₂ + H₂O + CO₂'], answer: 'C', analysis: 'A未配平：3Fe+2O₂→Fe₃O₄；B缺条件和气体符号（需通电和↑）；D未配平：CaCO₃+2HCl→CaCl₂+H₂O+CO₂↑。C正确。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 5, kp_id: 5002, type: 'fill_blank', difficulty: 'medium', content: '配平下列化学方程式：\n__CH₄ + __O₂ → __CO₂ + __H₂O', options: null, answer: '1 2 1 2 即 CH₄ + 2O₂ → CO₂ + 2H₂O', analysis: '用观察法或原子守恒法配平。检查：C:1=1✓ H:4=2×2=4✓ O:2×2=2+2=4✓。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 溶液 (5003)
  { subject_id: 5, kp_id: 5003, type: 'single_choice', difficulty: 'medium', content: '将50g 20%的NaCl溶液加水稀释到100g，所得溶液的溶质质量分数为？', options: ['A. 5%', 'B. 10%', 'C. 15%', 'D. 20%'], answer: 'B', analysis: '稀释前后溶质质量不变。m(NaCl)=50g×20%=10g，稀释后溶液质量100g，w=10g/100g×100%=10%。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 5, kp_id: 5003, type: 'fill_blank', difficulty: 'medium', content: '如图是A、B两种物质的溶解度曲线。t₁℃时，A的溶解度________(大于/等于/小于)B的溶解度。', options: null, answer: '小于', analysis: '看溶解度曲线交点：在t₁℃时，A曲线在B曲线下方，说明A的溶解度小于B。两曲线相交处溶解度相等。', year: 2023, source: '天津模拟', exam_frequency: 'medium' },

  // 酸碱盐 (5004)
  { subject_id: 5, kp_id: 5004, type: 'single_choice', difficulty: 'medium', content: '下列物质中，属于碱的是？', options: ['A. NaCl', 'B. NaOH', 'C. HCl', 'D. Na₂SO₄'], answer: 'B', analysis: 'NaOH=氢氧化钠，由金属离子Na⁺和OH⁻组成，属于碱。NaCl是盐，HCl是酸，Na₂SO₄是盐。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 5, kp_id: 5004, type: 'single_choice', difficulty: 'hard', content: '下列各组物质能在水溶液中共存的是？', options: ['A. NaOH和HCl', 'B. NaCl和AgNO₃', 'C. Na₂CO₃和Ca(OH)₂', 'D. NaCl和KNO₃'], answer: 'D', analysis: 'A:NaOH+HCl→NaCl+H₂O(中和反应)；B:NaCl+AgNO₃→AgCl↓+NaNO₃(沉淀)；C:Na₂CO₃+Ca(OH)₂→CaCO₃↓+2NaOH(沉淀)。D不发生反应，可共存。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 金属与材料 (5005)
  { subject_id: 5, kp_id: 5005, type: 'single_choice', difficulty: 'medium', content: '根据金属活动性顺序，下列金属中最活泼的是？', options: ['A. Cu', 'B. Fe', 'C. Zn', 'D. Ag'], answer: 'C', analysis: '金属活动性顺序：K>Ca>Na>Mg>Al>Zn>Fe>Sn>Pb>(H)>Cu>Hg>Ag>Pt>Au。四者中Zn最活泼，故选C。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 5, kp_id: 5005, type: 'fill_blank', difficulty: 'medium', content: '铁在潮湿的空气中容易生锈，铁锈的主要成分是________（填化学式）。', options: null, answer: 'Fe₂O₃（或Fe₂O₃·xH₂O）', analysis: '铁生锈是铁与空气中的氧气和水蒸气反应，铁锈的主要成分是氧化铁(Fe₂O₃)，含有结晶水时写作Fe₂O₃·xH₂O。', year: 2023, source: '天津中考', exam_frequency: 'medium' },

  // 化学实验 (5006)
  { subject_id: 5, kp_id: 5006, type: 'single_choice', difficulty: 'medium', content: '实验室制取CO₂常用的药品是？', options: ['A. 碳酸钠和稀盐酸', 'B. 石灰石和稀硫酸', 'C. 石灰石和稀盐酸', 'D. 碳在氧气中燃烧'], answer: 'C', analysis: '实验室用石灰石(主要成分CaCO₃)和稀盐酸(HCl)反应制取CO₂：CaCO₃+2HCl→CaCl₂+H₂O+CO₂↑。不用硫酸因为CaSO₄微溶会阻碍反应。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 5, kp_id: 5006, type: 'fill_blank', difficulty: 'hard', content: '粗盐提纯的步骤依次为：________、________、________。', options: null, answer: '溶解 过滤 蒸发', analysis: '粗盐提纯是天津中考化学实验核心考点。步骤：①溶解（加水搅拌使NaCl溶解）②过滤（除去不溶性杂质）③蒸发（得到纯净NaCl晶体）。', year: 2024, source: '天津中考', exam_frequency: 'high' },

  // ==================== 历史 (subject_id=6) ====================
  // 中国古代史 (6001)
  { subject_id: 6, kp_id: 6001, type: 'single_choice', difficulty: 'easy', content: '我国境内目前已确认的最早的古人类是？', options: ['A. 北京人', 'B. 元谋人', 'C. 山顶洞人', 'D. 蓝田人'], answer: 'B', analysis: '元谋人是我国境内目前已确认的最早的古人类，距今约170万年，发现于云南省元谋县。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 6, kp_id: 6001, type: 'single_choice', difficulty: 'medium', content: '丝绸之路开通于哪位皇帝时期？', options: ['A. 秦始皇', 'B. 汉高祖', 'C. 汉武帝', 'D. 汉文帝'], answer: 'C', analysis: '汉武帝派张骞出使西域，开辟了丝绸之路，促进了东西方经济文化交流。这是汉代对外交往的重要事件。', year: 2023, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 6, kp_id: 6001, type: 'fill_blank', difficulty: 'medium', content: '北魏________推行汉化改革，促进了民族大融合。', options: null, answer: '孝文帝', analysis: '北魏孝文帝推行汉化改革措施：迁都洛阳、改汉姓、穿汉服、说汉语、与汉族通婚等，促进了民族大融合。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 中国近代史 (6002)
  { subject_id: 6, kp_id: 6002, type: 'single_choice', difficulty: 'medium', content: '标志着中国近代史开端的事件是？', options: ['A. 辛亥革命', 'B. 鸦片战争', 'C. 五四运动', 'D. 洋务运动'], answer: 'B', analysis: '1840年鸦片战争是中国近代史的开端，中国开始沦为半殖民地半封建社会。辛亥革命、五四运动、洋务运动均发生在鸦片战争之后。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 6, kp_id: 6002, type: 'single_choice', difficulty: 'hard', content: '下列关于辛亥革命的说法不正确的是？', options: ['A. 推翻了清王朝统治', 'B. 结束了中国两千多年的封建帝制', 'C. 使民主共和观念深入人心', 'D. 彻底改变了中国半殖民地半封建社会的性质'], answer: 'D', analysis: '辛亥革命没有改变中国半殖民地半封建社会的性质，这一任务由新民主主义革命完成。A、B、C均为辛亥革命的积极意义。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 中国现代史 (6003)
  { subject_id: 6, kp_id: 6003, type: 'single_choice', difficulty: 'medium', content: '作出"改革开放"伟大决策的会议是？', options: ['A. 中共八大', 'B. 中共十一届三中全会', 'C. 中共十二大', 'D. 中共十四大'], answer: 'B', analysis: '1978年中共十一届三中全会作出改革开放的伟大决策，开启了社会主义现代化建设新时期，是中国现代史的重要转折点。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 6, kp_id: 6003, type: 'fill_blank', difficulty: 'medium', content: '________年________月________日，中华人民共和国成立。', options: null, answer: '1949年10月1日', analysis: '1949年10月1日中华人民共和国成立，标志着中国现代史的开端。这是中考历史必考知识点。', year: 2023, source: '天津中考', exam_frequency: 'high' },

  // 世界史 (6004)
  { subject_id: 6, kp_id: 6004, type: 'single_choice', difficulty: 'medium', content: '文艺复兴运动的发源地是？', options: ['A. 英国', 'B. 法国', 'C. 意大利', 'D. 德国'], answer: 'C', analysis: '文艺复兴运动于14世纪发源于意大利，以人文主义为核心思想，但丁、达芬奇、莎士比亚等是代表人物。', year: 2024, source: '天津中考', exam_frequency: 'medium' },
  { subject_id: 6, kp_id: 6004, type: 'single_choice', difficulty: 'hard', content: '下列关于第二次世界大战的说法正确的是？', options: ['A. 二战的转折点是斯大林格勒战役', 'B. 二战开始于1937年', 'C. 中国没有参与二战', 'D. 联合国成立于二战之前'], answer: 'A', analysis: 'B项二战开始于1939年9月1日德国闪击波兰；C项中国是二战的主要参战国之一；D项联合国成立于1945年二战结束后。A项正确。', year: 2023, source: '天津模拟', exam_frequency: 'medium' },

  // ==================== 道法 (subject_id=7) ====================
  // 道德 (7001)
  { subject_id: 7, kp_id: 7001, type: 'single_choice', difficulty: 'easy', content: '下列属于中华民族传统美德的是？', options: ['A. 铺张浪费', 'B. 尊老爱幼', 'C. 损人利己', 'D. 言而无信'], answer: 'B', analysis: '尊老爱幼是中华民族的传统美德。铺张浪费、损人利己、言而无信都是不道德的行为。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 7, kp_id: 7001, type: 'single_choice', difficulty: 'medium', content: '认识自己最有效的途径是？', options: ['A. 只看自己的优点', 'B. 通过他人的评价和自我反思', 'C. 只听取别人的批评', 'D. 不需要认识自己'], answer: 'B', analysis: '正确认识自己需要：①自我观察和分析；②通过他人评价了解自己；③在实践中认识自己。要全面、客观地看待自己。', year: 2024, source: '天津模拟', exam_frequency: 'high' },

  // 法律 (7002)
  { subject_id: 7, kp_id: 7002, type: 'single_choice', difficulty: 'medium', content: '我国宪法规定，中华人民共和国的一切权力属于？', options: ['A. 国家主席', 'B. 国务院', 'C. 人民', 'D. 全国人大'], answer: 'C', analysis: '我国是人民民主专政的社会主义国家，宪法第二条规定："中华人民共和国的一切权力属于人民。"', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 7, kp_id: 7002, type: 'single_choice', difficulty: 'hard', content: '以下关于权利和义务的说法正确的是？', options: ['A. 可以只享受权利，不履行义务', 'B. 权利和义务是统一的', 'C. 义务可以放弃', 'D. 未成年人只有权利没有义务'], answer: 'B', analysis: '在我国，公民的权利和义务是统一的，相互依存、相互促进。没有无义务的权利，也没有无权利的义务。法定义务不可放弃。', year: 2023, source: '天津中考', exam_frequency: 'high' },

  // 国情 (7003)
  { subject_id: 7, kp_id: 7003, type: 'single_choice', difficulty: 'medium', content: '我国当前社会的主要矛盾是？', options: ['A. 人民日益增长的物质文化需要同落后的社会生产之间的矛盾', 'B. 人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾', 'C. 经济发展与环境保护之间的矛盾', 'D. 城市发展与农村落后之间的矛盾'], answer: 'B', analysis: '党的十九大报告指出，我国社会主要矛盾已转化为"人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾"。A项是十九大之前的主要矛盾表述。', year: 2024, source: '天津中考', exam_frequency: 'high' },
  { subject_id: 7, kp_id: 7003, type: 'single_choice', difficulty: 'hard', content: '以下关于"中国梦"的说法不正确的是？', options: ['A. 中国梦归根到底是人民的梦', 'B. 实现中国梦必须走中国道路', 'C. 中国梦就是成为世界霸主', 'D. 实现中国梦需要弘扬中国精神'], answer: 'C', analysis: '中国梦是实现中华民族伟大复兴，不是成为世界霸主。中国梦的本质是国家富强、民族振兴、人民幸福。C项表述错误。', year: 2024, source: '天津模拟', exam_frequency: 'high' },
]

export function seedDevQuestions(db: SqlJsDatabase): number {
  // Check if dev questions already exist (check for the source tag)
  const checkStmt = db.prepare("SELECT COUNT(*) as cnt FROM questions WHERE source = '天津模拟'")
  checkStmt.step()
  const existingCount = checkStmt.getAsObject().cnt as number
  checkStmt.free()

  if (existingCount >= 30) {
    console.log('[seed] Dev questions already exist, skipping')
    return 0
  }

  const insertStmt = db.prepare(`
    INSERT INTO questions (subject_id, kp_id, type, difficulty, content, options, answer, analysis, year, source, exam_frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let imported = 0
  for (const q of DEV_QUESTIONS) {
    try {
      insertStmt.bind([
        q.subject_id, q.kp_id, q.type, q.difficulty,
        q.content,
        q.options ? JSON.stringify(q.options) : null,
        q.answer, q.analysis, q.year, q.source, q.exam_frequency
      ])
      insertStmt.step()
      insertStmt.reset()
      imported++
    } catch (err) {
      console.error(`[seed] Failed to insert dev question for kp_id=${q.kp_id}:`, (err as Error).message)
    }
  }
  insertStmt.free()

  console.log(`[seed] Dev questions: ${imported} inserted`)
  return imported
}
