import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Radio, Checkbox, Typography, Space, Tag, Divider, message, Statistic } from 'antd'
import { ThunderboltOutlined, ExperimentOutlined, TrophyOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useAssessmentStore } from '../../stores/useAssessmentStore'
import type { AssessmentMode } from '../../types'

const { Title, Paragraph, Text } = Typography

const subjectColors: Record<number, string> = {
  1: '#f5222d', 2: '#1677ff', 3: '#52c41a', 4: '#722ed1',
  5: '#fa8c16', 6: '#13c2c2', 7: '#eb2f96'
}

export default function AssessmentStart() {
  const navigate = useNavigate()
  const subjects = useAppStore((s) => s.subjects)
  const loadSubjects = useAppStore((s) => s.loadSubjects)

  const mode = useAssessmentStore((s) => s.mode)
  const selectedSubjectIds = useAssessmentStore((s) => s.selectedSubjectIds)
  const questionsPerSubject = useAssessmentStore((s) => s.questionsPerSubject)
  const setMode = useAssessmentStore((s) => s.setMode)
  const toggleSubject = useAssessmentStore((s) => s.toggleSubject)
  const setQuestionsPerSubject = useAssessmentStore((s) => s.setQuestionsPerSubject)
  const startAssessment = useAssessmentStore((s) => s.startAssessment)

  useEffect(() => {
    if (subjects.length === 0) loadSubjects()
  }, [subjects.length, loadSubjects])

  const handleStart = async () => {
    if (selectedSubjectIds.length === 0) {
      message.warning('请至少选择一个科目')
      return
    }
    try {
      await startAssessment()
      navigate('/assessment/exam')
    } catch (err) {
      message.error('启动评估失败，请重试')
      console.error(err)
    }
  }

  const selectAll = () => {
    const allIds = subjects.map((s) => s.id)
    if (selectedSubjectIds.length === subjects.length) {
      // 反选全部
      allIds.forEach((id) => toggleSubject(id))
    } else {
      // 全选
      const unselected = allIds.filter((id) => !selectedSubjectIds.includes(id))
      unselected.forEach((id) => toggleSubject(id))
    }
  }

  const totalQuestions = selectedSubjectIds.length * questionsPerSubject
  const estimatedTime = mode === 'quick'
    ? Math.round(selectedSubjectIds.length * 8)   // 快速模式每科约8分钟（15题）
    : selectedSubjectIds.length * 30              // 全真模式每科约30分钟（30题）

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <ExperimentOutlined /> 水平评估
      </Title>

      {/* 模式选择 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>评估模式</Title>
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value as AssessmentMode)}
          style={{ width: '100%' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Card
                size="small"
                className={mode === 'quick' ? 'report-card' : ''}
                style={{
                  border: mode === 'quick' ? '2px solid #1677ff' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setMode('quick')
                  setQuestionsPerSubject(15)
                }}
              >
                <Space align="start">
                  <ThunderboltOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                  <div>
                    <div><Text strong>快速诊断</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      每科 {questionsPerSubject} 题 | 约 {Math.round(selectedSubjectIds.length * 8)} 分钟 | 快速摸底
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                size="small"
                className={mode === 'full' ? 'report-card' : ''}
                style={{
                  border: mode === 'full' ? '2px solid #fa8c16' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setMode('full')
                  setQuestionsPerSubject(30)
                }}
              >
                <Space align="start">
                  <ExperimentOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  <div>
                    <div><Text strong>全真评估</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      每科 30 题 | 约 {selectedSubjectIds.length * 30} 分钟 | 更精确评估
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Radio.Group>
      </Card>

      {/* 科目选择 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>选择评估科目</Title>
          <Button size="small" onClick={selectAll}>
            {selectedSubjectIds.length === subjects.length ? '取消全选' : '全选'}
          </Button>
        </div>
        <Row gutter={[12, 12]}>
          {subjects.map((subject) => {
            const selected = selectedSubjectIds.includes(subject.id)
            return (
              <Col xs={12} sm={8} md={6} lg={Math.floor(24 / 7)} key={subject.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => toggleSubject(subject.id)}
                  style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: selected
                      ? `2px solid ${subjectColors[subject.id] || '#1677ff'}`
                      : '1px solid #d9d9d9',
                    background: selected ? `${subjectColors[subject.id] || '#1677ff'}08` : '#fff'
                  }}
                >
                  <div style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: selected ? subjectColors[subject.id] : '#999'
                  }}>
                    {subject.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    {subject.total_score}分 {subject.is_open_book ? '| 开卷' : '| 闭卷'}
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>

      {/* 概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="评估题量"
              value={totalQuestions}
              suffix="题"
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="预计用时"
              value={estimatedTime}
              suffix="分钟"
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 开始 */}
      <Button
        type="primary"
        size="large"
        block
        onClick={handleStart}
        disabled={selectedSubjectIds.length === 0}
        style={{ height: 56, fontSize: 18 }}
      >
        开始评估（{selectedSubjectIds.length}科 · {totalQuestions}题）
      </Button>
    </div>
  )
}
