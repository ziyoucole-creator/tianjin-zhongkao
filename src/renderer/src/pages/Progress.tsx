import { useEffect } from 'react'
import {
  Card, Row, Col, Typography, Statistic, Progress, Tag, Spin, Empty,
  List, Space, Divider
} from 'antd'
import {
  LineChartOutlined, TrophyOutlined, RiseOutlined,
  RadarChartOutlined, AimOutlined, BookOutlined
} from '@ant-design/icons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, BarChart, Bar
} from 'recharts'
import { useProgressStore } from '../stores/useProgressStore'

const { Title, Text } = Typography

const subjectColorsArr = ['#1677ff', '#f5222d', '#52c41a', '#722ed1', '#fa8c16', '#13c2c2', '#eb2f96']

export default function ProgressPage() {
  const store = useProgressStore()

  useEffect(() => {
    store.loadAll()
  }, [])

  if (store.loading && !store.overview) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  if (!store.overview || store.overview.assessmentCount === 0) {
    return (
      <Empty description="还没有评估记录，请先完成一次水平评估" style={{ marginTop: 100 }}>
        <Text type="secondary">评估数据会在这里自动生成趋势和分析</Text>
      </Empty>
    )
  }

  const { overview } = store

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}><LineChartOutlined /> 成绩追踪</Title>

      {/* Overview stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="评估次数" value={overview.assessmentCount} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="累计答题" value={overview.totalQuestions} prefix={<AimOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="整体正确率" value={overview.overallAccuracy} suffix="%"
              valueStyle={{ color: overview.overallAccuracy >= 70 ? '#52c41a' : overview.overallAccuracy >= 50 ? '#faad14' : '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="最近得分"
              value={overview.lastAssessment ? `${overview.lastAssessment.total_score}/${overview.lastAssessment.max_score}` : '-'}
              valueStyle={{ fontSize: 18, color: '#1677ff' }} />
          </Card>
        </Col>
      </Row>

      {/* Score trend chart */}
      {store.trend.length >= 2 && (
        <Card title={<><RiseOutlined /> 得分趋势</>} style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={store.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="rate" name="得分率(%)" stroke="#1677ff" strokeWidth={2}
                dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Per-subject trend */}
      {store.subjectTrends.length >= 2 && (
        <Card title={<><LineChartOutlined /> 各科得分率趋势</>} style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={store.subjectTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              {Object.keys(store.subjectTrends[0] || {})
                .filter((k) => k !== 'date')
                .map((key, i) => (
                  <Line key={key} type="monotone" dataKey={key} name={key}
                    stroke={subjectColorsArr[i % subjectColorsArr.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Knowledge point mastery radar */}
      {store.mastery.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title={<><RadarChartOutlined /> 知识点掌握度</>}>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={store.mastery.slice(0, 8).map((m) => ({
                  kp: m.kpName.length > 6 ? m.kpName.substring(0, 6) + '..' : m.kpName,
                  mastery: m.masteryLevel
                }))}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="kp" fontSize={11} />
                  <PolarRadiusAxis domain={[0, 100]} tickCount={5} fontSize={10} />
                  <Radar name="掌握度(%)" dataKey="mastery" stroke="#1677ff" fill="#1677ff" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title={<><AimOutlined /> 掌握度分布</>}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[
                  { level: '优秀(≥80%)', count: store.mastery.filter((m) => m.masteryLevel >= 80).length },
                  { level: '良好(60-79%)', count: store.mastery.filter((m) => m.masteryLevel >= 60 && m.masteryLevel < 80).length },
                  { level: '需加强(<60%)', count: store.mastery.filter((m) => m.masteryLevel < 60).length }
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="level" width={110} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="知识点数量" fill="#1677ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* Recommendations */}
      {store.recommendations && (
        <Row gutter={16}>
          <Col span={12}>
            <Card title={<Text style={{ color: '#ff4d4f' }}>薄弱知识点</Text>} size="small">
              {store.recommendations.weakKps.length === 0 ? (
                <Empty description="暂无，继续加油！" />
              ) : (
                <List size="small"
                  dataSource={store.recommendations.weakKps}
                  renderItem={(item, idx) => (
                    <List.Item>
                      <Space>
                        <Tag color="error">#{idx + 1}</Tag>
                        <Text>{item.subjectName} · {item.kpName}</Text>
                        <Progress percent={item.masteryLevel} size="small"
                          status="exception" style={{ width: 80 }} />
                      </Space>
                    </List.Item>
                  )} />
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title={<Text style={{ color: '#faad14' }}>需要复习</Text>} size="small">
              {store.recommendations.needsReview.length === 0 ? (
                <Empty description="暂无，继续加油！" />
              ) : (
                <List size="small"
                  dataSource={store.recommendations.needsReview.slice(0, 8)}
                  renderItem={(item, idx) => (
                    <List.Item>
                      <Space>
                        <Tag color="warning">#{idx + 1}</Tag>
                        <Text>{item.subjectName} · {item.kpName}</Text>
                        <Progress percent={item.masteryLevel} size="small"
                          status="active" style={{ width: 80 }} />
                      </Space>
                    </List.Item>
                  )} />
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* Detailed mastery table */}
      {store.mastery.length > 0 && (
        <Card title="各知识点掌握详情" style={{ marginTop: 16 }}>
          {store.mastery.map((m) => (
            <Row key={`${m.subjectId}-${m.kpId}`} style={{ marginBottom: 8 }} align="middle">
              <Col span={4}><Tag color={subjectColorsArr[m.subjectId % 7]}>{m.subjectName}</Tag></Col>
              <Col span={8}><Text>{m.kpName}</Text></Col>
              <Col span={8}>
                <Progress percent={m.masteryLevel} size="small"
                  status={m.masteryLevel >= 70 ? 'success' : m.masteryLevel >= 50 ? 'active' : 'exception'}
                  format={() => `${m.masteryLevel}%`} />
              </Col>
              <Col span={4}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {m.correctAttempts}/{m.totalAttempts}次
                </Text>
              </Col>
            </Row>
          ))}
        </Card>
      )}

      <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 40 }}>
        <Text type="secondary">建议每 2 周完成一次评估，持续追踪学习效果</Text>
      </div>
    </div>
  )
}
