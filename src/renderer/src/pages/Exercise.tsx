import { useEffect } from 'react'
import {
  Card, Row, Col, Select, Typography, Tag, Button, Space,
  Pagination, Empty, Spin, Divider
} from 'antd'
import {
  BookOutlined, EyeOutlined, EyeInvisibleOutlined,
  CheckCircleOutlined, FilterOutlined
} from '@ant-design/icons'
import { useExerciseStore } from '../stores/useExerciseStore'

const { Title, Text, Paragraph } = Typography

const subjectColors: Record<string, string> = {
  '数学': '#1677ff', '语文': '#f5222d', '英语': '#52c41a',
  '物理': '#722ed1', '化学': '#fa8c16', '历史': '#13c2c2',
  '道德与法治': '#eb2f96', '道法': '#eb2f96'
}

const typeLabels: Record<string, string> = {
  single_choice: '单选', multiple_choice: '多选', fill_blank: '填空'
}
const typeColors: Record<string, string> = {
  single_choice: 'blue', multiple_choice: 'purple', fill_blank: 'orange'
}
const diffColors: Record<string, string> = {
  easy: 'success', medium: 'warning', hard: 'error'
}
const diffLabels: Record<string, string> = {
  easy: '基础', medium: '中等', hard: '较难'
}

export default function ExercisePage() {
  const store = useExerciseStore()

  useEffect(() => {
    store.loadSubjects()
  }, [])

  useEffect(() => {
    store.loadFilters(store.filters.subjectId)
    store.loadQuestions()
  }, [store.filters.subjectId])

  const handleSearch = () => {
    store.setPage(1)
    store.loadQuestions()
  }

  const subjectName = store.subjects.find((s) => s.id === store.filters.subjectId)?.name || ''

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <BookOutlined /> 真题练习
      </Title>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col span={6}>
            <Text strong style={{ fontSize: 12 }}>科目</Text>
            <Select
              value={store.filters.subjectId}
              onChange={(v) => {
                store.setFilter('subjectId', v)
                store.setFilter('kpId', undefined)
                store.loadFilters(v)
              }}
              style={{ width: '100%', marginTop: 4 }}
              options={store.subjects.map((s) => ({
                value: s.id,
                label: (
                  <Space>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8,
                      borderRadius: '50%', background: subjectColors[s.name] || '#999'
                    }} />
                    {s.name}
                  </Space>
                )
              }))}
            />
          </Col>
          <Col span={5}>
            <Text strong style={{ fontSize: 12 }}>年份</Text>
            <Select
              value={store.filters.year}
              onChange={(v) => store.setFilter('year', v)}
              allowClear
              placeholder="全部"
              style={{ width: '100%', marginTop: 4 }}
              options={(store.filterMeta.years || []).map((y) => ({ value: y, label: `${y}年` }))}
            />
          </Col>
          <Col span={5}>
            <Text strong style={{ fontSize: 12 }}>题型</Text>
            <Select
              value={store.filters.type}
              onChange={(v) => store.setFilter('type', v)}
              allowClear
              placeholder="全部"
              style={{ width: '100%', marginTop: 4 }}
              options={store.filterMeta.types.map((t) => ({
                value: t, label: typeLabels[t] || t
              }))}
            />
          </Col>
          <Col span={5}>
            <Text strong style={{ fontSize: 12 }}>难度</Text>
            <Select
              value={store.filters.difficulty}
              onChange={(v) => store.setFilter('difficulty', v)}
              allowClear
              placeholder="全部"
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { value: 'easy', label: '基础' },
                { value: 'medium', label: '中等' },
                { value: 'hard', label: '较难' }
              ]}
            />
          </Col>
          <Col span={3}>
            <div style={{ paddingTop: 24 }}>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={handleSearch}
                block
              >
                筛选
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Results */}
      <Spin spinning={store.loading}>
        {store.questions.length === 0 && !store.loading ? (
          <Empty description="该条件下暂无题目，请切换筛选条件" />
        ) : (
          <>
            <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
              共 {store.total} 题 | 第 {(store.page - 1) * store.pageSize + 1}-{Math.min(store.page * store.pageSize, store.total)} 题
            </div>

            {store.questions.map((q, idx) => (
              <Card
                key={q.id}
                style={{ marginBottom: 12 }}
                title={
                  <Space wrap>
                    <Tag color={typeColors[q.type]}>{typeLabels[q.type] || q.type}</Tag>
                    <Tag color={diffColors[q.difficulty]}>{diffLabels[q.difficulty] || q.difficulty}</Tag>
                    {q.year && <Tag>{q.year}年</Tag>}
                    {q.kp_name && <Tag color="default">{q.kp_name}</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      #{idx + 1 + (store.page - 1) * store.pageSize}
                    </Text>
                  </Space>
                }
              >
                <Paragraph style={{ fontSize: 15, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                  {q.content}
                </Paragraph>

                {/* Options for choice questions */}
                {q.options && q.options.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {q.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i)
                      const isCorrect = store.showAnswer[q.id] &&
                        opt.trim().startsWith(letter + '.') &&
                        q.answer.includes(letter)
                      return (
                        <div
                          key={i}
                          style={{
                            padding: '6px 12px',
                            marginBottom: 4,
                            borderRadius: 6,
                            background: isCorrect ? '#f6ffed' : '#fafafa',
                            border: isCorrect ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                            cursor: 'default'
                          }}
                        >
                          {opt}
                          {isCorrect && <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Toggle answer */}
                <Button
                  type="link"
                  icon={store.showAnswer[q.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => store.toggleAnswer(q.id)}
                  style={{ padding: 0 }}
                >
                  {store.showAnswer[q.id] ? '隐藏答案' : '查看答案'}
                </Button>

                {store.showAnswer[q.id] && (
                  <Card
                    size="small"
                    style={{ marginTop: 8, background: '#fafafa' }}
                  >
                    <p>
                      <Text strong>正确答案：</Text>
                      <Text style={{ color: '#52c41a', fontSize: 15 }}>{q.answer}</Text>
                    </p>
                    {q.analysis && (
                      <p style={{ marginBottom: 0 }}>
                        <Text strong>解析：</Text>
                        <Text>{q.analysis}</Text>
                      </p>
                    )}
                    {q.source && q.source !== 'simulated' && (
                      <p style={{ marginTop: 4, marginBottom: 0 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          来源：{q.source}
                        </Text>
                      </p>
                    )}
                  </Card>
                )}
              </Card>
            ))}

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={store.page}
                total={store.total}
                pageSize={store.pageSize}
                onChange={(p) => { store.setPage(p); store.loadQuestions() }}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Spin>
    </div>
  )
}
