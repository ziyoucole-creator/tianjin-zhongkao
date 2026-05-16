import React, { useState, useEffect } from 'react'
import { Card, Tag, Typography, Row, Col, Table, Divider, Alert, Badge, Drawer, Pagination, Space, Empty, Button } from 'antd'
import {
  ReadOutlined,
  CalculatorOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  GlobalOutlined,
  BulbOutlined,
  BookOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  StarFilled,
  FileSearchOutlined,
  UnorderedListOutlined,
  DownOutlined,
  SearchOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  ProfileOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { CURRICULUM, ZK_POLICY_SUMMARY, collectKpIds, KP_ID_MAP } from '../data/curriculum'
import type { SubjectCurriculum, GradeKP } from '../data/curriculum'
import type { KnowledgePoint as CurriculumKP } from '../data/curriculum'
import { useCurriculumStore } from '../stores/useCurriculumStore'

const { Title, Paragraph, Text } = Typography

const subjectIcons: Record<number, React.ReactNode> = {
  1: <ReadOutlined />,
  2: <CalculatorOutlined />,
  3: <GlobalOutlined />,
  4: <ThunderboltOutlined />,
  5: <ExperimentOutlined />,
  6: <HistoryOutlined />,
  7: <BulbOutlined />,
}

const frequencyConfig = {
  high: { color: 'red', label: '高频考点' },
  medium: { color: 'orange', label: '中频考点' },
  low: { color: 'green', label: '低频考点' },
}

function ExamPolicyCard({ subject }: { subject: SubjectCurriculum }) {
  const qtColumns: ColumnsType<SubjectCurriculum['examPolicy']['questionTypes'][number]> = [
    { title: '题型', dataIndex: 'name', key: 'name' },
    { title: '分值', dataIndex: 'score', key: 'score', width: 100 },
    { title: '备注', dataIndex: 'note', key: 'note', render: (v: string | undefined) => v || '-' },
  ]

  return (
    <Card
      title={
        <span>
          <TrophyOutlined style={{ marginRight: 8, color: subject.subjectColor }} />
          中考政策 · {subject.subject}
        </span>
      }
      style={{ marginBottom: 24 }}
    >
      <Row gutter={24}>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: subject.subjectColor }}>{subject.examPolicy.score}</div>
            <div style={{ color: '#666' }}>满分</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#333' }}>{subject.examPolicy.examType}</div>
            <div style={{ color: '#666' }}>考试形式</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#333' }}>{subject.examPolicy.examTime}</div>
            <div style={{ color: '#666' }}>考试时间</div>
          </div>
        </Col>
      </Row>

      <Divider orientation="left" plain>题型分布</Divider>
      <Table
        columns={qtColumns}
        dataSource={subject.examPolicy.questionTypes}
        rowKey="name"
        pagination={false}
        size="small"
      />

      <Divider orientation="left" plain>命题趋势</Divider>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        {subject.examPolicy.trends.map((t, i) => (
          <li key={i} style={{ marginBottom: 4, color: '#555' }}>{t}</li>
        ))}
      </ul>
    </Card>
  )
}

// Find the best matching KP id for a topic name
function findKpId(name: string, kps?: CurriculumKP[]): number | null {
  if (!kps) return null
  for (const kp of kps) {
    const id = kp.kpId ?? KP_ID_MAP[kp.name]
    if (id && (kp.name.includes(name) || name.includes(kp.name))) return id
    if (kp.children) {
      for (const child of kp.children) {
        const childId = child.kpId ?? KP_ID_MAP[child.name]
        if (childId && (child.name.includes(name) || name.includes(child.name))) return childId
      }
    }
  }
  // Fallback: return first available KP id
  for (const kp of kps) {
    const id = kp.kpId ?? KP_ID_MAP[kp.name]
    if (id) return id
  }
  return null
}

function ZKPolicyOverview() {
  return (
    <Card
      title={
        <span>
          <InfoCircleOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          {ZK_POLICY_SUMMARY.title}
        </span>
      }
      style={{ marginBottom: 24 }}
    >
      <Row gutter={24}>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#1677ff' }}>{ZK_POLICY_SUMMARY.totalScore}</div>
            <div style={{ color: '#666' }}>中考总分</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#52c41a' }}>7</div>
            <div style={{ color: '#666' }}>考试科目</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#fa8c16' }}>{ZK_POLICY_SUMMARY.examDays}</div>
            <div style={{ color: '#666' }}>考试天数</div>
          </div>
        </Col>
      </Row>

      <Divider orientation="left" plain>政策亮点</Divider>
      <Row gutter={[12, 12]}>
        {ZK_POLICY_SUMMARY.highlights.map((h, i) => (
          <Col xs={24} sm={12} key={i}>
            <Alert message={h} type="info" showIcon icon={<CheckCircleOutlined />} />
          </Col>
        ))}
      </Row>

      <Paragraph style={{ marginTop: 16, marginBottom: 0, color: '#888', fontSize: 13 }}>
        {ZK_POLICY_SUMMARY.gradeLevelNote}
      </Paragraph>
    </Card>
  )
}

const allSubjects = CURRICULUM

// ==================== Layer 1: 考点概览 — Grade Overview Table ====================
function GradeOverviewTable({ grades, subjectColor, counts, selectedIndex, onSelect }: {
  grades: GradeKP[]
  subjectColor: string
  counts: Record<number, number>
  selectedIndex: number | null
  onSelect: (index: number) => void
}) {
  const columns: ColumnsType<GradeKP & { kpCount: number; totalQuestions: number }> = [
    {
      title: '年级', dataIndex: 'grade', key: 'grade', width: 90,
      render: (v: string) => <Text strong style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{v}</Text>,
    },
    {
      title: '内容主题', dataIndex: 'name', key: 'name', width: 200, ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: '知识点', key: 'kpCount', width: 80,
      render: (_: unknown, record: GradeKP & { kpCount: number }) => {
        const kpCount = record.kpCount
        return <Badge count={kpCount} style={{ backgroundColor: subjectColor }} />
      },
    },
    {
      title: '中考分值', dataIndex: 'weight', key: 'weight', width: 100,
      render: (v: number) => <Text strong style={{ color: subjectColor }}>约{v}分</Text>,
    },
    {
      title: '频率', dataIndex: 'examFrequency', key: 'examFrequency', width: 90,
      render: (v: string) => {
        const cfg = frequencyConfig[v as keyof typeof frequencyConfig] || frequencyConfig.medium
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '', key: 'action', width: 110,
      render: (_: unknown, _record: unknown, index: number) => (
        <Button
          type={selectedIndex === index ? 'primary' : 'default'}
          size="small"
          icon={selectedIndex === index ? <DownOutlined /> : <SearchOutlined />}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSelect(index) }}
        >
          {selectedIndex === index ? '收起' : '查看考点'}
        </Button>
      ),
    },
  ]

  const dataSource = grades.map((g) => {
    const kpCount = g.kps?.length || 0
    const totalQuestions = g.kps
      ? g.kps.reduce((sum, kp) => {
          const id = kp.kpId ?? KP_ID_MAP[kp.name]
          return sum + (id ? counts[id] || 0 : 0)
        }, 0)
      : 0
    return { ...g, kpCount, totalQuestions, key: g.grade }
  })

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      size="small"
      rowKey="grade"
      onRow={(_, index) => ({
        onClick: () => onSelect(index!),
        style: {
          cursor: 'pointer',
          background: selectedIndex === index ? '#f0f5ff' : undefined,
        },
      })}
    />
  )
}

// ==================== Layer 2 & 3: 具体考点 + 考点解析 ====================
function KPDetailCards({ grade, subjectColor, counts, onDrillDown }: {
  grade: GradeKP
  subjectColor: string
  counts: Record<number, number>
  onDrillDown: (kpId: number, kpName: string) => void
}) {
  if (!grade.kps || grade.kps.length === 0) {
    return <Empty description="该年级暂无考点数据" />
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 15, color: subjectColor }}>
          <AppstoreOutlined style={{ marginRight: 6 }} />
          {grade.grade} · 具体考点与解析
        </Text>
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>{grade.description}</Text>
      </div>

      {grade.kps.map((kp, ki) => {
        const kpId = kp.kpId ?? KP_ID_MAP[kp.name]
        const questionCount = kpId ? counts[kpId] || 0 : 0
        const freq = frequencyConfig[kp.examFrequency]

        return (
          <Card
            key={ki}
            size="small"
            style={{ marginBottom: 16, borderLeft: `4px solid ${subjectColor}` }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text strong style={{ fontSize: 15 }}>{kp.name}</Text>
                <Tag color={freq.color} style={{ fontSize: 11 }}>{freq.label}</Tag>
                <Tag color={subjectColor} style={{ fontSize: 11 }}>中考权重 {kp.weight} 分</Tag>
                {questionCount > 0 && (
                  <Badge count={`${questionCount}题`} style={{ backgroundColor: subjectColor, fontSize: 10 }} />
                )}
              </div>
            }
          >
            {/* 考点解析 */}
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 13, color: '#333' }}>
                <ProfileOutlined style={{ marginRight: 4 }} />考点解析
              </Text>
              <Paragraph style={{ marginTop: 4, marginBottom: 0, fontSize: 13, color: '#555' }}>
                {kp.name}在中考中占<Text strong>约{kp.weight}分</Text>，属于<Text strong style={{ color: freq.color }}>{freq.label}</Text>。
                {kp.examFrequency === 'high'
                  ? '历年中考必考内容，需要重点掌握，确保不失分。'
                  : kp.examFrequency === 'medium'
                    ? '中考常考内容，需要熟练掌握基本题型和方法。'
                    : '中考偶尔涉及，掌握基本概念即可。'}
              </Paragraph>
            </div>

            {/* 子考点 */}
            {kp.children && kp.children.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13, color: '#333' }}>
                  <AppstoreOutlined style={{ marginRight: 4 }} />涵盖子考点
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {kp.children.map((child, ci) => {
                    const childId = child.kpId ?? KP_ID_MAP[child.name]
                    const childCount = childId ? counts[childId] || 0 : 0
                    return (
                      <Tag
                        key={ci}
                        color={subjectColor}
                        style={{ fontSize: 12, cursor: childId ? 'pointer' : 'default', padding: '2px 8px' }}
                        onClick={childId ? () => onDrillDown(childId, child.name) : undefined}
                      >
                        {child.name}（权重{child.weight}分）
                        {childCount > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>[{childCount}题]</span>}
                      </Tag>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 课文/知识点篇目 — 取自 grade.children */}
            {grade.children && grade.children.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13, color: '#333' }}>
                  <UnorderedListOutlined style={{ marginRight: 4 }} />相关学习内容
                </Text>
                <Row gutter={[8, 6]} style={{ marginTop: 6 }}>
                  {grade.children
                    .filter((c) => {
                      // Match children that belong to this KP
                      const cid = findKpId(c.name, [kp])
                      if (cid) return true
                      // Also match by name overlap
                      return kp.children?.some(
                        (child) =>
                          child.name.includes(c.name.slice(0, 3)) ||
                          c.name.includes(child.name.slice(0, 3))
                      ) || false
                    })
                    .map((c, ci) => (
                      <Col xs={24} sm={12} md={8} key={ci}>
                        <div style={{
                          padding: '8px 12px',
                          background: '#fafafa',
                          borderRadius: 6,
                          fontSize: 12,
                        }}>
                          <Text strong style={{ fontSize: 12 }}>{c.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 11 }}>{c.description}</Text>
                        </div>
                      </Col>
                    ))}
                </Row>
                {grade.children.filter((c) => {
                  const cid = findKpId(c.name, [kp])
                  if (cid) return true
                  return kp.children?.some(
                    (child) =>
                      child.name.includes(c.name.slice(0, 3)) ||
                      c.name.includes(child.name.slice(0, 3))
                  ) || false
                }).length === 0 && grade.children.length > 0 && (
                  <Row gutter={[8, 6]} style={{ marginTop: 6 }}>
                    {grade.children.map((c, ci) => (
                      <Col xs={24} sm={12} md={8} key={ci}>
                        <div style={{
                          padding: '8px 12px',
                          background: '#fafafa',
                          borderRadius: 6,
                          fontSize: 12,
                        }}>
                          <Text strong style={{ fontSize: 12 }}>{c.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 11 }}>{c.description}</Text>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            )}

            {/* 课文篇目 (语文专用) */}
            {grade.passages && grade.passages.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13, color: '#333' }}>
                  <BookOutlined style={{ marginRight: 4 }} />教材篇目（{grade.passages.length}篇）
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {grade.passages.map((p, pi) => {
                    const pid = findKpId(p.title, [kp]) || findKpId(p.genre, [kp])
                    return (
                      <Tag
                        key={pi}
                        style={{ fontSize: 11, cursor: pid ? 'pointer' : 'default' }}
                        color={p.isEssential ? 'red' : 'default'}
                        onClick={pid ? () => onDrillDown(pid, p.title) : undefined}
                      >
                        {p.isEssential ? <StarFilled style={{ fontSize: 9, marginRight: 2 }} /> : null}
                        {p.title}
                      </Tag>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 真题钻取入口 */}
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Button
                type="primary"
                size="small"
                icon={<FileSearchOutlined />}
                onClick={() => kpId && onDrillDown(kpId, kp.name)}
                disabled={!kpId}
              >
                {questionCount > 0 ? `真题钻取（${questionCount}题）` : '暂无真题'}
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ==================== Main Page ====================
export default function CurriculumPage() {
  const [activeSubject, setActiveSubject] = useState(1)
  const [selectedGradeIndex, setSelectedGradeIndex] = useState<number | null>(null)

  const subject = allSubjects.find((s) => s.subjectId === activeSubject) || allSubjects[0]

  const {
    kpQuestionCounts,
    loadKpCounts,
    drillDownKpId,
    drillDownKpName,
    drillDownQuestions,
    drillDownTotal,
    drillDownPage,
    drillDownLoading,
    drillDown,
    closeDrillDown,
  } = useCurriculumStore()

  // 切换科目时加载该科目所有KP的真题数量，并重置选中的年级
  useEffect(() => {
    const allKpIds = subject.grades.flatMap((g) => collectKpIds(g.kps))
    if (allKpIds.length > 0) {
      loadKpCounts(allKpIds)
    }
    setSelectedGradeIndex(null)
  }, [subject.subjectId])

  const handleDrillDown = (kpId: number, kpName: string) => {
    drillDown(kpId, kpName, 1)
    setDrillAnswers({}); setDrillSubmitted({}); setDrillResults({})
  }

  const handleDrillPageChange = (page: number) => {
    if (drillDownKpId) {
      drillDown(drillDownKpId, drillDownKpName, page)
      setDrillAnswers({}); setDrillSubmitted({}); setDrillResults({})
    }
  }

  const handleGradeSelect = (index: number) => {
    setSelectedGradeIndex(prev => prev === index ? null : index)
  }

  // Student answer interaction state for drill-down drawer
  const [drillAnswers, setDrillAnswers] = useState<Record<number, string>>({})
  const [drillSubmitted, setDrillSubmitted] = useState<Record<number, boolean>>({})
  const [drillResults, setDrillResults] = useState<Record<number, { isCorrect: boolean; correctAnswer: string }>>({})

  const handleSelectOption = (questionId: number, letter: string) => {
    if (drillSubmitted[questionId]) return
    setDrillAnswers(prev => ({ ...prev, [questionId]: letter }))
  }

  const handleSubmitAnswer = async (q: any) => {
    if (drillSubmitted[q.id]) return
    const studentAnswer = (drillAnswers[q.id] || '').trim()
    if (!studentAnswer) return

    const normalize = (s: string) =>
      s.trim()
       .replace(/[''']/g, "'")
       .replace(/["""]/g, '"')
       .replace(/\s+/g, '')
       .replace(/[.。,，!！?？;；:：]+$/g, '')
       .toLowerCase()

    const s = normalize(studentAnswer)
    const c = normalize(q.answer || '')
    const isCorrect = s === c

    setDrillSubmitted(prev => ({ ...prev, [q.id]: true }))
    setDrillResults(prev => ({ ...prev, [q.id]: { isCorrect, correctAnswer: q.answer } }))

    if (!isCorrect) {
      try {
        await window.api.errorbook.addWrongQuestion({ questionId: q.id, studentAnswer })
      } catch { /* ignore */ }
    }
  }

  const typeLabel: Record<string, string> = { single_choice: '单选', multiple_choice: '多选', fill_blank: '填空' }
  const diffLabel: Record<string, string> = { easy: '基础', medium: '中等', hard: '较难' }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        <BookOutlined style={{ marginRight: 8 }} />
        考点分析
      </Title>

      {/* Subject selector */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[12, 12]}>
          {allSubjects.map((s) => (
            <Col xs={12} sm={6} md={3} key={s.subjectId}>
              <Card
                hoverable
                size="small"
                onClick={() => setActiveSubject(s.subjectId)}
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderColor: activeSubject === s.subjectId ? s.subjectColor : undefined,
                  borderWidth: activeSubject === s.subjectId ? 2 : 1,
                }}
              >
                <div style={{ fontSize: 24, color: s.subjectColor, marginBottom: 4 }}>
                  {subjectIcons[s.subjectId]}
                </div>
                <div style={{ fontWeight: activeSubject === s.subjectId ? 700 : 400, color: s.subjectColor }}>
                  {s.subject}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>{s.examPolicy.score}分</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* All subjects overview table */}
      <Card
        title={<span><TrophyOutlined style={{ marginRight: 8 }} />天津中考各科政策一览</span>}
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={allSubjects}
          rowKey="subjectId"
          pagination={false}
          size="small"
          columns={[
            {
              title: '科目', dataIndex: 'subject', key: 'subject', width: 100,
              render: (text: string, record: SubjectCurriculum) => (
                <Space>
                  <span style={{
                    display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                    background: record.subjectColor
                  }} />
                  <Text strong style={{ color: record.subjectColor }}>{text}</Text>
                </Space>
              )
            },
            {
              title: '满分', dataIndex: ['examPolicy', 'score'], key: 'score', width: 70,
              render: (v: number) => <Text strong>{v}分</Text>
            },
            {
              title: '形式', dataIndex: ['examPolicy', 'examType'], key: 'examType', width: 90,
              render: (v: string) => <Tag color={v.includes('开卷') ? 'green' : 'blue'}>{v}</Tag>
            },
            {
              title: '时间', dataIndex: ['examPolicy', 'examTime'], key: 'examTime',
              render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>
            },
            {
              title: '题型分布', dataIndex: ['examPolicy', 'questionTypes'], key: 'questionTypes',
              render: (types: { name: string; score: string }[]) => (
                <Space wrap size={[2, 2]}>
                  {types.slice(0, 4).map((t, i) => (
                    <Tag key={i} style={{ fontSize: 10, margin: 0 }}>{t.name.split('（')[0]}: {t.score}</Tag>
                  ))}
                  {types.length > 4 && <Text type="secondary" style={{ fontSize: 10 }}>+{types.length - 4}项</Text>}
                </Space>
              )
            },
          ]}
        />
      </Card>

      {/* Subject summary */}
      <Card style={{ marginBottom: 24, borderLeft: `4px solid ${subject.subjectColor}` }}>
        <Row align="middle" gutter={16}>
          <Col>
            <span style={{ fontSize: 40, color: subject.subjectColor }}>{subjectIcons[subject.subjectId]}</span>
          </Col>
          <Col flex={1}>
            <Title level={4} style={{ marginBottom: 4, color: subject.subjectColor }}>
              {subject.subject} · 考点分析
            </Title>
            <Paragraph style={{ marginBottom: 0, color: '#555' }}>{subject.summary}</Paragraph>
          </Col>
        </Row>
      </Card>

      {/* Layer 1: 考点概览 — Grade Overview Table */}
      <Card
        title={
          <span>
            <BarChartOutlined style={{ marginRight: 8, color: subject.subjectColor }} />
            各年级考点概览
            <Text type="secondary" style={{ fontSize: 13, marginLeft: 12 }}>点击"查看考点"可展开具体考点与解析</Text>
          </span>
        }
        style={{ marginBottom: 24 }}
      >
        <GradeOverviewTable
          grades={subject.grades}
          subjectColor={subject.subjectColor}
          counts={kpQuestionCounts}
          selectedIndex={selectedGradeIndex}
          onSelect={handleGradeSelect}
        />
      </Card>

      {/* Layer 2 & 3: 具体考点 + 考点解析 */}
      {selectedGradeIndex !== null && (
        <Card
          title={
            <span>
              <ProfileOutlined style={{ marginRight: 8, color: subject.subjectColor }} />
              具体考点与解析
            </span>
          }
          style={{ marginBottom: 24, borderLeft: `4px solid ${subject.subjectColor}` }}
        >
          <KPDetailCards
            grade={subject.grades[selectedGradeIndex]}
            subjectColor={subject.subjectColor}
            counts={kpQuestionCounts}
            onDrillDown={handleDrillDown}
          />
        </Card>
      )}

      {/* Exam policy */}
      <ExamPolicyCard subject={subject} />

      {/* ZK policy overview */}
      {activeSubject === 1 && <ZKPolicyOverview />}

      {/* Layer 4: 真题钻取 Drawer */}
      <Drawer
        title={
          <span>
            <FileSearchOutlined style={{ marginRight: 8, color: subject.subjectColor }} />
            真题钻取：{drillDownKpName}
            <Tag color={subject.subjectColor} style={{ marginLeft: 8 }}>{drillDownTotal} 道真题</Tag>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>先作答，后看答案</Text>
          </span>
        }
        open={drillDownKpId !== null}
        onClose={() => { closeDrillDown(); setDrillAnswers({}); setDrillSubmitted({}); setDrillResults({}) }}
        width={720}
        loading={drillDownLoading}
      >
        {drillDownQuestions.length === 0 && !drillDownLoading ? (
          <Empty description="该考点暂无真题数据" />
        ) : (
          drillDownQuestions.map((q) => {
            const submitted = drillSubmitted[q.id]
            const result = drillResults[q.id]
            const selected = drillAnswers[q.id] || ''
            const isChoice = q.type === 'single_choice' && q.options && q.options.length > 0
            const isFill = q.type === 'fill_blank' || !q.options || q.options.length === 0

            return (
              <Card
                key={q.id}
                size="small"
                style={{ marginBottom: 12 }}
                title={
                  <Space size={4}>
                    <Tag color="blue">{typeLabel[q.type] || q.type}</Tag>
                    <Tag color={q.difficulty === 'easy' ? 'green' : q.difficulty === 'hard' ? 'red' : 'orange'}>
                      {diffLabel[q.difficulty] || q.difficulty}
                    </Tag>
                    {q.year && <Tag>{q.year}年</Tag>}
                    <Tag color="geekblue">{q.source}</Tag>
                    {submitted && (
                      result?.isCorrect
                        ? <Tag color="success" icon={<CheckCircleOutlined />}>回答正确</Tag>
                        : <Tag color="error">回答错误</Tag>
                    )}
                  </Space>
                }
              >
                <Paragraph style={{ fontSize: 14, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                  {q.content}
                </Paragraph>

                {isChoice && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
                      请选择一个答案：
                    </Text>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {q.options!.map((opt: string, oi: number) => {
                        const letter = String.fromCharCode(65 + oi)
                        const isSelected = selected === letter
                        const isCorrectOpt = submitted && result && letter === result.correctAnswer
                        const isWrongSelected = submitted && result && isSelected && !result.isCorrect

                        return (
                          <div
                            key={oi}
                            onClick={() => handleSelectOption(q.id, letter)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 6,
                              border: isCorrectOpt ? '2px solid #52c41a'
                                : isWrongSelected ? '2px solid #ff4d4f'
                                : isSelected ? '2px solid #1677ff'
                                : '1px solid #d9d9d9',
                              background: isCorrectOpt ? '#f6ffed'
                                : isWrongSelected ? '#fff2f0'
                                : isSelected ? '#e6f4ff'
                                : '#fff',
                              cursor: submitted ? 'default' : 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <Tag color={isCorrectOpt ? 'success' : isWrongSelected ? 'error' : isSelected ? 'processing' : 'default'}
                              style={{ fontFamily: 'monospace', margin: 0 }}>
                              {letter}
                            </Tag>
                            <Text style={{ fontSize: 13, flex: 1 }}>{opt.replace(/^[A-D][.、]\s*/, '')}</Text>
                            {isCorrectOpt && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            {isWrongSelected && <span style={{ color: '#ff4d4f', fontSize: 11 }}>你的选择</span>}
                          </div>
                        )
                      })}
                    </Space>
                    {!submitted && (
                      <div style={{ marginTop: 10, textAlign: 'right' }}>
                        <Tag
                          color={selected ? 'blue' : 'default'}
                          style={{ cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.5, padding: '4px 16px' }}
                          onClick={() => selected && handleSubmitAnswer(q)}
                        >
                          提交答案
                        </Tag>
                      </div>
                    )}
                  </div>
                )}

                {isFill && !submitted && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
                      请输入你的答案：
                    </Text>
                    <Space>
                      <input
                        type="text"
                        value={selected}
                        onChange={(e) => handleSelectOption(q.id, e.target.value)}
                        placeholder="输入答案..."
                        style={{
                          padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9',
                          fontSize: 14, width: 300,
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && selected.trim()) handleSubmitAnswer(q) }}
                      />
                      <Tag
                        color={selected.trim() ? 'blue' : 'default'}
                        style={{ cursor: selected.trim() ? 'pointer' : 'not-allowed', opacity: selected.trim() ? 1 : 0.5, padding: '4px 16px' }}
                        onClick={() => selected.trim() && handleSubmitAnswer(q)}
                      >
                        提交
                      </Tag>
                    </Space>
                  </div>
                )}

                {isFill && submitted && (
                  <div style={{ marginBottom: 8, background: '#fffbe6', padding: '6px 12px', borderRadius: 4 }}>
                    <Text style={{ fontSize: 13 }}>
                      你的答案：<Text strong style={{ color: result?.isCorrect ? '#52c41a' : '#ff4d4f' }}>{drillAnswers[q.id]}</Text>
                    </Text>
                  </div>
                )}

                {submitted && (
                  <>
                    <div style={{ background: '#f6ffed', padding: 8, borderRadius: 4, marginBottom: 4 }}>
                      <Text style={{ color: '#52c41a', fontSize: 13 }}>
                        <strong>正确答案：</strong>{result?.correctAnswer || q.answer}
                      </Text>
                      {!result?.isCorrect && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                          （已自动加入错题本）
                        </Text>
                      )}
                    </div>
                    {q.analysis && (
                      <div style={{ background: '#f0f5ff', padding: 8, borderRadius: 4 }}>
                        <Text style={{ color: '#666', fontSize: 12 }}>
                          <strong>解析：</strong>{q.analysis}
                        </Text>
                      </div>
                    )}
                  </>
                )}
              </Card>
            )
          })
        )}
        {drillDownTotal > 10 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={drillDownPage}
              total={drillDownTotal}
              pageSize={10}
              onChange={handleDrillPageChange}
              showTotal={(t) => `共 ${t} 题`}
              size="small"
            />
          </div>
        )}
      </Drawer>
    </div>
  )
}
