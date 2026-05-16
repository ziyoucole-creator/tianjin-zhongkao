import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Typography, Space, Tag, Statistic, Alert } from 'antd'
import { ClockCircleOutlined, FormOutlined, TrophyOutlined } from '@ant-design/icons'
import { useMockExamStore } from '../../stores/useMockExamStore'
import { useAppStore } from '../../stores/useAppStore'

const { Title, Text, Paragraph } = Typography

const subjectInfo: Record<number, { name: string; color: string; score: number; timeMin: number }> = {
  1: { name: '语文', color: '#f5222d', score: 120, timeMin: 120 },
  2: { name: '数学', color: '#1677ff', score: 120, timeMin: 100 },
  3: { name: '英语', color: '#52c41a', score: 120, timeMin: 100 },
  4: { name: '物理', color: '#722ed1', score: 100, timeMin: 60 },
  5: { name: '化学', color: '#fa8c16', score: 100, timeMin: 60 },
  6: { name: '历史', color: '#13c2c2', score: 100, timeMin: 50 },
  7: { name: '道法', color: '#eb2f96', score: 100, timeMin: 50 }
}

export default function MockExamSetup() {
  const navigate = useNavigate()
  const subjects = useAppStore((s) => s.subjects)
  const selectedSubjectIds = useMockExamStore((s) => s.selectedSubjectIds)
  const toggleSubject = useMockExamStore((s) => s.toggleSubject)
  const startExam = useMockExamStore((s) => s.startExam)
  const loadConfig = useMockExamStore((s) => s.loadConfig)
  const loading = useMockExamStore((s) => s.loading)

  useEffect(() => {
    loadConfig()
  }, [])

  const totalScore = selectedSubjectIds.reduce((sum, id) => sum + (subjectInfo[id]?.score || 0), 0)
  const totalTime = selectedSubjectIds.reduce((sum, id) => sum + (subjectInfo[id]?.timeMin || 0), 0)
  const totalQuestions = selectedSubjectIds.reduce((sum, id) => {
    const config = useMockExamStore.getState().examConfig[id]
    return sum + (config?.questionCount || 0)
  }, 0)

  const handleStart = async () => {
    if (selectedSubjectIds.length === 0) return
    await startExam()
    navigate('/mockexam/exam')
  }

  const quickSelectAll = () => {
    subjects.forEach((s) => {
      if (!selectedSubjectIds.includes(s.id)) toggleSubject(s.id)
    })
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <TrophyOutlined /> 模拟考试
      </Title>

      <Alert
        message="模拟真实中考环境，请预留充足时间，中途请勿退出"
        type="warning" showIcon style={{ marginBottom: 24 }}
      />

      <Card title="选择考试科目" style={{ marginBottom: 16 }}
        extra={<Button size="small" onClick={quickSelectAll}>全选</Button>}>
        <Row gutter={[12, 12]}>
          {subjects.map((s) => {
            const info = subjectInfo[s.id]
            if (!info) return null
            const selected = selectedSubjectIds.includes(s.id)
            return (
              <Col span={8} key={s.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => toggleSubject(s.id)}
                  style={{
                    border: selected ? `2px solid ${info.color}` : '1px solid #f0f0f0',
                    background: selected ? `${info.color}08` : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', width: 12, height: 12,
                      borderRadius: '50%', background: info.color
                    }} />
                    <Text strong>{info.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {info.score}分 | {info.timeMin}分钟
                    </Text>
                    {s.is_open_book === 1 && (
                      <Tag color="green" style={{ fontSize: 10 }}>开卷</Tag>
                    )}
                    {selected && <Tag color={info.color}>已选</Tag>}
                  </Space>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>

      <Card>
        <Row gutter={24}>
          <Col span={8}>
            <Statistic title="已选科目" value={selectedSubjectIds.length} suffix="/ 7" prefix={<FormOutlined />} />
          </Col>
          <Col span={8}>
            <Statistic title="总分" value={totalScore} suffix="分" prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1677ff' }} />
          </Col>
          <Col span={8}>
            <Statistic title="预计时长" value={totalTime} suffix="分钟" prefix={<ClockCircleOutlined />}
              valueStyle={{ color: totalTime > 180 ? '#ff4d4f' : '#faad14' }} />
          </Col>
        </Row>
        <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          预计共 {totalQuestions} 道题。建议选择全部7科进行完整模拟，或选择2-3科进行单科模拟。
        </Paragraph>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button type="primary" size="large" onClick={handleStart}
          loading={loading} disabled={selectedSubjectIds.length === 0}
          style={{ padding: '0 48px', height: 48, fontSize: 16 }}>
          开始模拟考试
        </Button>
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          考试开始后将开始计时，中途退出将无法继续
        </Paragraph>
      </div>
    </div>
  )
}
