import { useEffect, useState, useCallback } from 'react'
import {
  Card, Row, Col, Button, Select, Typography, Space, Tag,
  Progress, List, Empty, message, Alert, Statistic, Divider
} from 'antd'
import {
  CloudDownloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, FileTextOutlined, ReloadOutlined,
  WarningOutlined
} from '@ant-design/icons'
import type { ScrapeSource, ScrapeTask } from '../types'

const { Title, Text, Paragraph } = Typography

const subjectColors: Record<string, string> = {
  '数学': '#1677ff', '语文': '#f5222d', '英语': '#52c41a',
  '物理': '#722ed1', '化学': '#fa8c16', '历史': '#13c2c2',
  '道德与法治': '#eb2f96', '道法': '#eb2f96'
}

export default function ScraperPage() {
  const [sources, setSources] = useState<ScrapeSource[]>([])
  const [tasks, setTasks] = useState<ScrapeTask[]>([])
  const [selectedSource, setSelectedSource] = useState('zujuan')
  const [selectedSubject, setSelectedSubject] = useState('数学')
  const [selectedYear, setSelectedYear] = useState(2024)
  const [loading, setLoading] = useState(false)

  // 加载数据源
  useEffect(() => {
    window.api.scraper.getSources().then(setSources)
  }, [])

  // 监听进度更新
  useEffect(() => {
    const unsubscribe = window.api.scraper.onProgress((task: ScrapeTask) => {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === task.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = task
          return updated
        }
        return [...prev, task]
      })
    })
    return unsubscribe
  }, [])

  const handleStart = useCallback(async () => {
    setLoading(true)
    try {
      const taskId = await window.api.scraper.start(selectedSource, selectedSubject, selectedYear)
      message.success(`爬取任务已启动: ${taskId}`)
    } catch (err) {
      message.error(`启动失败: ${(err as Error).message}`)
    }
    setLoading(false)
  }, [selectedSource, selectedSubject, selectedYear])

  const sourceInfo = sources.find((s) => s.name === selectedSource)
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const runningTasks = tasks.filter((t) => t.status === 'running')
  const totalNewQuestions = completedTasks.reduce((sum, t) => sum + t.newCount, 0)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <CloudDownloadOutlined /> 数据爬取中心
        </Title>
        <Button icon={<ReloadOutlined />} onClick={() => window.api.scraper.getAllTasks().then(setTasks)}>
          刷新状态
        </Button>
      </div>

      <Alert
        message="数据仅供个人学习使用，请勿对外分发题库内容。爬取频率已做限速处理，请耐心等待。"
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
      />
      <Alert
        message={
          <div>
            <strong>已内置真实题库数据（开源数据集）：</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li><strong>历史</strong>：1,056 道 2022 年全国中考真题（<a href="https://github.com/sanbuphy/InternLM-History" target="_blank" rel="noopener noreferrer">InternLM-History</a>，MIT 许可）</li>
              <li><strong>数学/物理/化学/政治/语文</strong>：CEval 初中题库 + CMMLU 多学科题库（CC BY-NC-SA 4.0 / Apache 2.0）</li>
              <li><strong>英语</strong>：RACE 初中阅读理解 28,000+ 题（Apache 2.0）</li>
            </ul>
            更多试题请使用下方爬取功能从优题课获取天津中考真题。
          </div>
        }
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 任务统计 */}
      {completedTasks.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="累计新增题目"
                value={totalNewQuestions}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="完成任务"
                value={completedTasks.length}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="跳过重复"
                value={completedTasks.reduce((sum, t) => sum + t.skipCount, 0)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="数据源"
                value={sources.filter((s) => s.enabled).length}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 爬取配置 */}
      <Card title="新建爬取任务" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Text strong>数据源</Text>
            <Select
              value={selectedSource}
              onChange={setSelectedSource}
              style={{ width: '100%', marginTop: 4 }}
              options={sources.filter((s) => s.enabled).map((s) => ({
                value: s.name,
                label: (
                  <Space>
                    <span>{s.label}</span>
                    <Tag style={{ fontSize: 10 }}>{s.subjects.length}科</Tag>
                  </Space>
                )
              }))}
            />
          </Col>
          <Col span={6}>
            <Text strong>科目</Text>
            <Select
              value={selectedSubject}
              onChange={setSelectedSubject}
              style={{ width: '100%', marginTop: 4 }}
              options={(sourceInfo?.subjects || ['数学', '语文', '英语', '物理', '化学']).map((s) => ({
                value: s,
                label: (
                  <Space>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8,
                      borderRadius: '50%', background: subjectColors[s] || '#999',
                      marginRight: 4
                    }} />
                    {s}
                  </Space>
                )
              }))}
            />
          </Col>
          <Col span={6}>
            <Text strong>年份</Text>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: '100%', marginTop: 4 }}
              options={(sourceInfo?.years || [2024, 2023, 2022, 2021]).map((y) => ({
                value: y, label: `${y}年`
              }))}
            />
          </Col>
          <Col span={6}>
            <div style={{ paddingTop: 24 }}>
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={handleStart}
                loading={loading}
                block
                disabled={runningTasks.length > 0}
              >
                开始爬取
              </Button>
            </div>
          </Col>
        </Row>
        {sourceInfo && (
          <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
            {sourceInfo.description} | 支持年份: {sourceInfo.years.join(', ')}
          </Paragraph>
        )}
      </Card>

      {/* 任务列表 */}
      <Card title={`任务记录 (${tasks.length})`}>
        {tasks.length === 0 ? (
          <Empty description="暂无爬取记录，配置并开始爬取" />
        ) : (
          <List
            dataSource={[...tasks].reverse()}
            renderItem={(task) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <Row justify="space-between" align="middle">
                    <Col span={12}>
                      <Space>
                        {task.status === 'running' && <SyncOutlined spin style={{ color: '#1677ff' }} />}
                        {task.status === 'completed' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        {task.status === 'failed' && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        {task.status === 'pending' && <WarningOutlined style={{ color: '#faad14' }} />}
                        <span>
                          <Tag>{task.target === 'zujuan' ? '组卷网' : task.target === 'youtike' ? '优题课' : task.target}</Tag>
                          <Tag color={subjectColors[task.subject]}>{task.subject}</Tag>
                          {task.status === 'completed' && (
                            <Tag color="success">+{task.newCount} 新题</Tag>
                          )}
                        </span>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {task.message}
                      </Text>
                    </Col>
                  </Row>
                  {task.status === 'running' && (
                    <Progress
                      percent={task.total > 0 ? Math.round((task.progress / task.total) * 100) : 0}
                      size="small"
                      style={{ marginTop: 8 }}
                      format={() => `${task.progress}/${task.total}`}
                    />
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}
