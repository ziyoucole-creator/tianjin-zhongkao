import { useEffect, useState } from 'react'
import {
  Card, Row, Col, Select, Typography, Tag, Button, Space,
  Pagination, Empty, Spin, Statistic, Progress, message, Modal, List, Divider, Alert
} from 'antd'
import {
  ProjectOutlined, EyeOutlined, EyeInvisibleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined,
  PlayCircleOutlined, TrophyOutlined, RobotOutlined,
  BulbOutlined, CopyOutlined
} from '@ant-design/icons'
import { useErrorBookStore } from '../stores/useErrorBookStore'
import { useAppStore } from '../stores/useAppStore'

const { Title, Text, Paragraph } = Typography

const subjectColors: Record<string, string> = {
  '数学': '#1677ff', '语文': '#f5222d', '英语': '#52c41a',
  '物理': '#722ed1', '化学': '#fa8c16', '历史': '#13c2c2',
  '道德与法治': '#eb2f96', '道法': '#eb2f96'
}
const typeLabels: Record<string, string> = { single_choice: '单选', multiple_choice: '多选', fill_blank: '填空' }
const diffLabels: Record<string, string> = { easy: '基础', medium: '中等', hard: '较难' }

export default function ErrorBookPage() {
  const store = useErrorBookStore()
  const subjects = useAppStore((s) => s.subjects)

  useEffect(() => {
    store.loadStats()
    store.loadQuestions()
  }, [])

  const handleFilter = () => {
    store.setPage(1)
    store.loadQuestions()
  }

  const handleMarkMastered = (id: number) => {
    Modal.confirm({
      title: '确认已掌握',
      content: '将该题标记为"已掌握"后，它将从错题本中移除。',
      onOk: () => store.markMastered(id),
      okText: '确认已掌握'
    })
  }

  // AI generation state
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiQuestions, setAiQuestions] = useState<any[]>([])
  const [aiError, setAiError] = useState('')
  const [aiSourceQ, setAiSourceQ] = useState<any>(null)

  const handleGenerateSimilar = async (q: any) => {
    setAiSourceQ(q)
    setAiModalOpen(true)
    setAiLoading(true)
    setAiError('')
    setAiQuestions([])

    try {
      const result = await window.api.llm.generateSimilar({
        subject: q.subject_name || '',
        kpName: q.kp_name || '',
        questionContent: q.content,
        questionType: q.type,
        questionAnswer: q.answer,
        questionAnalysis: q.analysis || null,
        difficulty: q.difficulty || 'medium',
        count: 3,
      })

      if (result.error) {
        setAiError(result.error)
      } else if (result.questions) {
        setAiQuestions(result.questions)
      } else {
        setAiError('未生成题目，请重试')
      }
    } catch (err: any) {
      setAiError(`请求失败: ${err.message || String(err)}`)
    } finally {
      setAiLoading(false)
    }
  }

  const typeLabels2: Record<string, string> = {
    single_choice: '单选', multiple_choice: '多选', fill_blank: '填空'
  }
  const diffLabels2: Record<string, string> = { easy: '基础', medium: '中等', hard: '较难' }

  // Practice mode view
  if (store.mode === 'practice') {
    const correctCount = Object.values(store.practiceResult).filter((r) => r?.isCorrect).length
    const totalAnswered = Object.values(store.practiceResult).filter((r) => r !== null).length

    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}><PlayCircleOutlined /> 错题重练</Title>
          <Space>
            <Text>已答 {totalAnswered}/{store.practiceQuestions.length} | 正确 {correctCount}</Text>
            <Button onClick={() => store.endPractice()}>返回浏览</Button>
          </Space>
        </div>

        {store.practiceQuestions.map((q: any, idx) => {
          const result = store.practiceResult[q.id]
          const inputVal = store.practiceInput[q.id] || ''

          return (
            <Card key={q.id} style={{ marginBottom: 12 }}
              title={<Space><Tag>{typeLabels[q.type] || q.type}</Tag><Text>#{idx + 1}</Text></Space>}>
              <Paragraph style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{q.content}</Paragraph>

              {q.options && q.options.length > 0 ? (
                <div style={{ marginBottom: 12 }}>
                  {q.options.map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i)
                    const selected = inputVal === letter
                    const isCorrectOpt = result?.correctAnswer?.includes(letter)
                    return (
                      <div key={i} onClick={() => !result && store.setPracticeInput(q.id, letter)}
                        style={{
                          padding: '8px 12px', marginBottom: 4, borderRadius: 6, cursor: result ? 'default' : 'pointer',
                          background: result
                            ? (isCorrectOpt ? '#f6ffed' : selected ? '#fff2f0' : '#fafafa')
                            : (selected ? '#e6f4ff' : '#fafafa'),
                          border: result
                            ? (isCorrectOpt ? '1px solid #b7eb8f' : selected ? '1px solid #ffa39e' : '1px solid #f0f0f0')
                            : (selected ? '1px solid #1677ff' : '1px solid #f0f0f0')
                        }}>
                        {opt}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <input
                    value={inputVal}
                    onChange={(e) => store.setPracticeInput(q.id, e.target.value)}
                    disabled={!!result}
                    placeholder="输入答案..."
                    style={{ padding: '8px 12px', width: '100%', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 15 }}
                  />
                </div>
              )}

              {!result && (
                <Button type="primary" onClick={() => store.submitPracticeAnswer(q.id)} disabled={!inputVal.trim()}>
                  提交答案
                </Button>
              )}

              {result && (
                <Card size="small" style={{ marginTop: 8, background: result.isCorrect ? '#f6ffed' : '#fff2f0' }}>
                  <Text strong style={{ color: result.isCorrect ? '#52c41a' : '#ff4d4f' }}>
                    {result.isCorrect ? <><CheckCircleOutlined /> 正确</> : <><CloseCircleOutlined /> 错误</>}
                  </Text>
                  {!result.isCorrect && <p style={{ marginTop: 4 }}>正确答案：<Text strong>{result.correctAnswer}</Text></p>}
                  {q.analysis && <p style={{ marginTop: 4, color: '#666' }}>解析：{q.analysis}</p>}
                </Card>
              )}
            </Card>
          )
        })}
      </div>
    )
  }

  // Browse mode
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}><ProjectOutlined /> 错题本</Title>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => store.startPractice(store.subjectId)}>
          错题重练
        </Button>
      </div>

      {/* Stats */}
      {store.stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="错题总数" value={store.stats.totalWrong} valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总答题数" value={store.stats.totalAttempts}
                prefix={<TrophyOutlined style={{ color: '#1677ff' }} />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="正确率"
                value={store.stats.totalAttempts > 0
                  ? Math.round((1 - store.stats.totalWrong / store.stats.totalAttempts) * 100) : 0}
                suffix="%" valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="薄弱科目"
                value={store.stats.bySubject.length > 0 ? store.stats.bySubject[0]?.subject_name || '-' : '-'}
                valueStyle={{ fontSize: 16 }} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col span={6}>
            <Select value={store.subjectId} onChange={(v) => store.setFilter('subjectId', v)}
              allowClear placeholder="全部科目" style={{ width: '100%' }}
              options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
          </Col>
          <Col span={3}>
            <Button type="primary" onClick={handleFilter} block>筛选</Button>
          </Col>
          <Col span={15}>
            {store.stats?.bySubject && store.stats.bySubject.length > 0 && (
              <Space wrap>
                {store.stats.bySubject.map((s) => (
                  <Tag key={s.subject_id} color={subjectColors[s.subject_name]}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { store.setFilter('subjectId', s.subject_id); store.loadQuestions() }}>
                    {s.subject_name} {s.count}题
                  </Tag>
                ))}
              </Space>
            )}
          </Col>
        </Row>
      </Card>

      {/* Wrong question list */}
      <Spin spinning={store.loading}>
        {store.questions.length === 0 ? (
          <Empty description={store.stats?.totalWrong === 0 ? '暂无错题，继续保持！' : '该筛选条件下暂无错题'} />
        ) : (
          <>
            {store.questions.map((q, idx) => {
              const isShow = store.showAnswer[q.id]
              return (
                <Card key={q.id} style={{ marginBottom: 12 }}
                  title={
                    <Space wrap>
                      <Tag color={subjectColors[q.subject_name || '']}>{q.subject_name}</Tag>
                      <Tag>{typeLabels[q.type] || q.type}</Tag>
                      <Tag color={q.difficulty === 'easy' ? 'green' : q.difficulty === 'medium' ? 'blue' : 'red'}>
                        {diffLabels[q.difficulty] || q.difficulty}
                      </Tag>
                      {q.kp_name && <Tag color="default">{q.kp_name}</Tag>}
                      <Text type="secondary" style={{ fontSize: 11 }}>答错于 {q.assessment_date}</Text>
                    </Space>
                  }
                  extra={
                    <Space>
                      <Button size="small" type="link" icon={<RobotOutlined />}
                        onClick={() => handleGenerateSimilar(q)}
                        style={{ color: '#722ed1' }}>
                        AI出题
                      </Button>
                      <Button size="small" type="link" danger icon={<DeleteOutlined />}
                        onClick={() => handleMarkMastered(q.id)}>
                        已掌握
                      </Button>
                    </Space>
                  }>
                  <Paragraph style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{q.content}</Paragraph>

                  {q.options && q.options.length > 0 && (
                    <div style={{ marginBottom: 8, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
                      {q.options.map((opt: string, oi: number) => {
                        const letter = String.fromCharCode(65 + oi)
                        const isCorrect = q.answer && (q.answer === letter || q.answer.includes(letter))
                        return (
                          <div key={oi} style={{
                            padding: '2px 0', fontSize: 13,
                            color: isCorrect ? '#52c41a' : '#333',
                            fontWeight: isCorrect ? 600 : 400,
                          }}>
                            {isCorrect && <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
                            {opt}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <Space style={{ marginBottom: 8 }}>
                    <Text type="secondary">你的答案：</Text>
                    <Text style={{ color: '#ff4d4f', textDecoration: 'line-through' }}>{q.student_answer}</Text>
                  </Space>

                  <Button type="link" icon={isShow ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => store.toggleAnswer(q.id)} style={{ padding: 0 }}>
                    {isShow ? '隐藏解析' : '查看解析'}
                  </Button>

                  {isShow && (
                    <Card size="small" style={{ marginTop: 8, background: '#fafafa' }}>
                      <p><Text strong>正确答案：</Text><Text style={{ color: '#52c41a', fontSize: 15 }}>{q.answer}</Text></p>
                      {q.analysis && <p style={{ marginBottom: 0 }}><Text strong>解析：</Text>{q.analysis}</p>}
                    </Card>
                  )}
                </Card>
              )
            })}

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination current={store.page} total={store.total} pageSize={store.pageSize}
                onChange={(p) => { store.setPage(p); store.loadQuestions() }} showSizeChanger={false} />
            </div>
          </>
        )}
      </Spin>

      {/* AI 生成同类题弹窗 */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            <span>AI 生成同类题目</span>
            {aiSourceQ && (
              <Tag color="purple">基于错题 #{aiSourceQ.id}</Tag>
            )}
          </Space>
        }
        open={aiModalOpen}
        onCancel={() => { setAiModalOpen(false); setAiQuestions([]); setAiError('') }}
        footer={null}
        width={720}
        destroyOnClose
      >
        {aiSourceQ && (
          <Card size="small" style={{ marginBottom: 16, background: '#fff7e6', border: '1px solid #ffd591' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <strong>原错题</strong> | {aiSourceQ.subject_name} · {aiSourceQ.kp_name} · {diffLabels2[aiSourceQ.difficulty] || aiSourceQ.difficulty}
            </Text>
            <Paragraph style={{ margin: '4px 0 0 0', fontSize: 13 }} ellipsis={{ rows: 2 }}>
              {aiSourceQ.content}
            </Paragraph>
          </Card>
        )}

        {aiError && (
          <Alert message={aiError} type="error" showIcon style={{ marginBottom: 16 }} closable onClose={() => setAiError('')} />
        )}

        {aiLoading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <Paragraph type="secondary" style={{ marginTop: 16 }}>
              正在调用 DeepSeek 生成同类题目，请稍候...
            </Paragraph>
          </div>
        )}

        {!aiLoading && aiQuestions.length > 0 && (
          <>
            <Alert
              message={`已生成 ${aiQuestions.length} 道同类型题目，可直接用于练习`}
              type="success" showIcon style={{ marginBottom: 12 }}
            />
            <List
              dataSource={aiQuestions}
              renderItem={(item: any, idx: number) => (
                <List.Item key={idx} style={{ padding: 0, marginBottom: 12 }}>
                  <Card
                    size="small"
                    style={{ width: '100%', borderLeft: '3px solid #722ed1' }}
                    title={
                      <Space size={4}>
                        <Tag color="purple">#{idx + 1}</Tag>
                        <Tag>{typeLabels2[item.type] || item.type}</Tag>
                        <Tag color={item.difficulty === 'easy' ? 'green' : item.difficulty === 'medium' ? 'blue' : 'red'}>
                          {diffLabels2[item.difficulty] || item.difficulty}
                        </Tag>
                      </Space>
                    }
                  >
                    <Paragraph style={{ fontSize: 14, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                      {item.content}
                    </Paragraph>
                    {item.options && item.options.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        {item.options.map((opt: string, oi: number) => (
                          <div key={oi} style={{
                            padding: '4px 8px', marginBottom: 2, borderRadius: 4,
                            background: item.answer === String.fromCharCode(65 + oi) ? '#f6ffed' : '#fafafa',
                            border: item.answer === String.fromCharCode(65 + oi) ? '1px solid #b7eb8f' : '1px solid #f0f0f0'
                          }}>
                            <Text style={{ fontSize: 13 }}>
                              {opt}
                              {item.answer === String.fromCharCode(65 + oi) && (
                                <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                              )}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                    <Divider style={{ margin: '4px 0 8px 0' }} />
                    <Paragraph style={{ fontSize: 12, marginBottom: 0 }}>
                      <Text strong style={{ color: '#52c41a' }}>答案：{item.answer}</Text>
                      {!item.options && (
                        <Text style={{ marginLeft: 12, color: '#666' }}>{item.analysis}</Text>
                      )}
                    </Paragraph>
                    {item.options && item.analysis && (
                      <Paragraph style={{ fontSize: 12, color: '#666', marginBottom: 0, marginTop: 4 }}>
                        <Text strong>解析：</Text>{item.analysis}
                      </Paragraph>
                    )}
                  </Card>
                </List.Item>
              )}
            />
          </>
        )}

        {!aiLoading && !aiError && aiQuestions.length === 0 && (
          <Empty description="点击错题卡片上的「AI出题」按钮生成同类题目" />
        )}
      </Modal>
    </div>
  )
}
