import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Row, Col, Button, Typography, Statistic, Tag, Progress,
  Space, Divider, Empty, List, Collapse, Descriptions, Spin
} from 'antd'
import {
  TrophyOutlined, RadarChartOutlined, HomeOutlined,
  ReloadOutlined, RiseOutlined, InfoCircleOutlined,
  FrownOutlined, MehOutlined, SmileOutlined
} from '@ant-design/icons'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip, Legend
} from 'recharts'
import { useAssessmentStore } from '../../stores/useAssessmentStore'
import { useAppStore } from '../../stores/useAppStore'
import type { KpAnalysis, SubjectScore } from '../../types'

const { Title, Text, Paragraph } = Typography

const subjectColors: Record<number, string> = {
  1: '#f5222d', 2: '#1677ff', 3: '#52c41a', 4: '#722ed1',
  5: '#fa8c16', 6: '#13c2c2', 7: '#eb2f96'
}

export default function AssessmentReport() {
  const navigate = useNavigate()
  const subjects = useAppStore((s) => s.subjects)
  const report = useAssessmentStore((s) => s.report)
  const reset = useAssessmentStore((s) => s.reset)

  // 如果没有报告，返回
  if (!report) {
    return (
      <Empty
        description="暂无评估报告"
        style={{ marginTop: 100 }}
      >
        <Button type="primary" onClick={() => navigate('/assessment')}>
          开始评估
        </Button>
      </Empty>
    )
  }

  const { assessment, subjects: subjectScores, kpAnalysis } = report

  // 雷达图数据
  const radarData = subjectScores.map((ss) => {
    const subjectInfo = subjects.find((s) => s.id === ss.id)
    const percentage = ss.maxScore > 0 ? Math.round((ss.score / ss.maxScore) * 100) : 0
    return {
      subject: subjectInfo?.name || '',
      score: percentage,
      full: 100
    }
  })

  // 知识点薄弱项排序
  const improvementList = useMemo(() => {
    const items: { subject: string; kp: string; rate: number; potential: number; color: string }[] = []
    for (const ss of subjectScores) {
      const kps = kpAnalysis[ss.id] || []
      const subjectInfo = subjects.find((s) => s.id === ss.id)
      for (const kp of kps) {
        if (kp.rate < 70) {
          // 提分潜力 = (1 - 正确率) * 该题在本科占比
          const potential = Math.round((1 - kp.rate / 100) * (kp.total / ss.total) * ss.maxScore)
          items.push({
            subject: subjectInfo?.name || '',
            kp: kp.name,
            rate: kp.rate,
            potential: Math.max(potential, 2),
            color: subjectColors[ss.id] || '#1677ff'
          })
        }
      }
    }
    return items.sort((a, b) => b.potential - a.potential).slice(0, 10)
  }, [subjectScores, kpAnalysis, subjects])

  // 得分率评级
  const overallRate = assessment.max_score > 0
    ? Math.round((assessment.total_score / assessment.max_score) * 100)
    : 0
  const rateLevel = overallRate >= 80 ? 'excellent' : overallRate >= 60 ? 'good' : 'need_improve'

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <TrophyOutlined /> 水平评估报告
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { reset(); navigate('/assessment') }}>
            重新评估
          </Button>
          <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Space>
      </div>

      {/* 总分概览 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24} align="middle">
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic
              title="评估总分"
              value={assessment.total_score}
              suffix={`/ ${assessment.max_score}`}
              valueStyle={{ fontSize: 48, fontWeight: 700, color: '#1677ff' }}
              prefix={<TrophyOutlined />}
            />
            <Progress
              percent={overallRate}
              status={rateLevel === 'excellent' ? 'success' : rateLevel === 'good' ? 'active' : 'exception'}
              style={{ marginTop: 8 }}
            />
            <Text type="secondary">
              {rateLevel === 'excellent' ? (
                <><SmileOutlined style={{ color: '#52c41a' }} /> 基础扎实，继续保持</>
              ) : rateLevel === 'good' ? (
                <><MehOutlined style={{ color: '#faad14' }} /> 有一定基础，存在提升空间</>
              ) : (
                <><FrownOutlined style={{ color: '#ff4d4f' }} /> 需要系统复习，夯实基础</>
              )}
            </Text>
          </Col>
          <Col span={16}>
            <Row gutter={[16, 16]}>
              {subjectScores.map((ss) => {
                const rate = ss.maxScore > 0 ? Math.round((ss.score / ss.maxScore) * 100) : 0
                return (
                  <Col span={8} key={ss.id}>
                    <Statistic
                      title={
                        <Space>
                          <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: subjectColors[ss.id]
                          }} />
                          {ss.name}
                        </Space>
                      }
                      value={ss.score}
                      suffix={<span style={{ fontSize: 14, color: '#999' }}>/ {ss.maxScore}</span>}
                      valueStyle={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: subjectColors[ss.id]
                      }}
                    />
                    <Progress
                      percent={rate}
                      size="small"
                      strokeColor={subjectColors[ss.id]}
                      style={{ marginTop: 4 }}
                    />
                  </Col>
                )
              })}
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 雷达图 + 分析 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={10}>
          <Card title={<><RadarChartOutlined /> 能力雷达图</>} className="report-card">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" fontSize={13} />
                <PolarRadiusAxis domain={[0, 100]} tickCount={5} fontSize={11} />
                <Radar
                  name="得分率(%)"
                  dataKey="score"
                  stroke="#1677ff"
                  fill="#1677ff"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip formatter={(value: number) => `${value}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={14}>
          <Card title={<><RiseOutlined /> 优先提升建议</>} className="report-card">
            {improvementList.length === 0 ? (
              <Empty description="各知识点掌握良好，继续保持！" />
            ) : (
              <List
                size="small"
                dataSource={improvementList}
                renderItem={(item, idx) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Tag color={item.color} style={{ fontWeight: 500 }}>#{idx + 1}</Tag>
                          <Text strong>{item.subject} · {item.kp}</Text>
                        </Space>
                        <Space>
                          <Tag color="error">正确率 {item.rate}%</Tag>
                          <Tag color="blue">预计提分 +{item.potential}分</Tag>
                        </Space>
                      </div>
                      <Progress
                        percent={item.rate}
                        size="small"
                        status="exception"
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 各科详细分析 */}
      <Card title="各科详细分析" style={{ marginBottom: 24 }}>
        <Collapse
          accordion
          items={subjectScores.map((ss) => {
            const kps = kpAnalysis[ss.id] || []
            const rate = ss.maxScore > 0 ? Math.round((ss.score / ss.maxScore) * 100) : 0
            const level = rate >= 80 ? '✅ 基础扎实' : rate >= 60 ? '⚠️ 需要加强' : '❌ 薄弱科目'

            return {
              key: ss.id,
              label: (
                <Space>
                  <span style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: subjectColors[ss.id]
                  }} />
                  <Text strong>{ss.name}</Text>
                  <Tag color={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error'}>
                    {ss.score}/{ss.maxScore}分 · {rate}%
                  </Tag>
                  <Text type="secondary">{level}</Text>
                </Space>
              ),
              children: (
                <div>
                  <Descriptions column={3} size="small" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="答对题数">{ss.correct}/{ss.total}</Descriptions.Item>
                    <Descriptions.Item label="得分">{ss.score}/{ss.maxScore}</Descriptions.Item>
                    <Descriptions.Item label="得分率">{rate}%</Descriptions.Item>
                  </Descriptions>
                  {kps.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>知识点掌握情况：</Text>
                      {kps.map((kp) => (
                        <Row key={kp.name} style={{ marginBottom: 8 }} align="middle">
                          <Col span={6}>
                            <Text>{kp.name}</Text>
                          </Col>
                          <Col span={14}>
                            <Progress
                              percent={kp.rate}
                              size="small"
                              status={kp.rate >= 70 ? 'success' : kp.rate >= 50 ? 'active' : 'exception'}
                              format={() => `${kp.correct}/${kp.total}`}
                            />
                          </Col>
                          <Col span={4}>
                            <Text style={{ fontSize: 12, color: '#999' }}>
                              正确率 {kp.rate}%
                            </Text>
                          </Col>
                        </Row>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
          })}
        />
      </Card>

      {/* 底部操作 */}
      <div style={{ textAlign: 'center', paddingBottom: 40 }}>
        <Space size="large">
          <Button size="large" icon={<ReloadOutlined />} onClick={() => { reset(); navigate('/assessment') }}>
            再次评估
          </Button>
          <Button size="large" type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Space>
        <Paragraph type="secondary" style={{ marginTop: 16 }}>
          建议每 2-4 周评估一次，追踪学习效果
        </Paragraph>
      </div>
    </div>
  )
}
