import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Typography, Space, Statistic, Timeline, Modal, Input, message, Alert, Progress, Tag } from 'antd'
import {
  FormOutlined,
  BookOutlined,
  ProjectOutlined,
  LineChartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CloudDownloadOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { useEffect, useState, useMemo } from 'react'
import { useAssessmentStore } from '../stores/useAssessmentStore'

const { Title, Paragraph, Text } = Typography

const EXAM_DATE = new Date('2027-06-19')

export default function Home() {
  const navigate = useNavigate()
  const history = useAssessmentStore((s) => s.history)
  const loadHistory = useAssessmentStore((s) => s.loadHistory)

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // 倒计时
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const daysLeft = useMemo(() => {
    return Math.max(0, Math.ceil((EXAM_DATE.getTime() - now) / (1000 * 60 * 60 * 24)))
  }, [now])

  const latestAssessment = history[0]

  // 软件更新
  const [appVersion, setAppVersion] = useState('')
  const [appUpdateState, setAppUpdateState] = useState<AppUpdateState | null>(null)
  const [checkingApp, setCheckingApp] = useState(false)
  const [downloadingApp, setDownloadingApp] = useState(false)

  useEffect(() => {
    window.api.update.getVersion().then(setAppVersion)
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.update.onAppState((state) => {
      setAppUpdateState(state)
      if (state.state === 'downloading') {
        setDownloadingApp(true)
        setCheckingApp(false)
      } else if (state.state === 'downloaded') {
        setDownloadingApp(false)
      } else if (state.state === 'error' || state.state === 'up-to-date') {
        setCheckingApp(false)
        setDownloadingApp(false)
      }
    })
    return unsubscribe
  }, [])

  const handleCheckAppUpdate = async () => {
    setCheckingApp(true)
    setAppUpdateState(null)
    try {
      const result = await window.api.update.checkApp()
      if (!result.hasUpdate) {
        setAppUpdateState({ state: 'up-to-date' })
        message.info('当前已是最新版本')
      }
    } catch {
      setAppUpdateState({ state: 'error', message: '检查更新失败，请确认网络连接和 GitHub 配置' })
    } finally {
      setCheckingApp(false)
    }
  }

  const handleDownloadApp = async () => {
    try {
      await window.api.update.downloadApp()
    } catch {
      message.error('下载更新失败')
    }
  }

  const handleInstall = () => {
    window.api.update.install()
  }

  // 题库更新
  const [dbModalOpen, setDbModalOpen] = useState(false)
  const [dbUrl, setDbUrl] = useState('')
  const [checkingDb, setCheckingDb] = useState(false)
  const [dbResult, setDbResult] = useState<{ success: boolean; newQuestions: number; newKps: number; error?: string } | null>(null)

  const handleCheckDb = async () => {
    if (!dbUrl.trim()) {
      message.warning('请输入题库更新地址')
      return
    }
    setCheckingDb(true)
    setDbResult(null)
    try {
      const result = await window.api.update.checkDb(dbUrl.trim())
      setDbResult(result)
      if (result.success) {
        message.success(`题库更新完成：新增 ${result.newQuestions} 道题目，${result.newKps} 个知识点`)
      } else {
        message.error(result.error || '更新失败')
      }
    } catch (err) {
      setDbResult({ success: false, newQuestions: 0, newKps: 0, error: (err as Error).message })
      message.error('更新出错: ' + (err as Error).message)
    } finally {
      setCheckingDb(false)
    }
  }

  const features = [
    {
      icon: <FormOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
      title: '水平评估',
      desc: '7科全面诊断，精准定位薄弱知识点，生成个性化学习建议',
      action: () => navigate('/assessment'),
      btnText: '开始评估'
    },
    {
      icon: <BookOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: '真题练习',
      desc: '历年天津中考真题 + 各区模拟题，按知识点分类练习',
      action: () => navigate('/exercise'),
      btnText: '开始练习'
    },
    {
      icon: <ProjectOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      title: '错题本',
      desc: '自动收录错题，举一反三推送同类题目，直至彻底掌握',
      action: () => navigate('/errorbook'),
      btnText: '查看错题'
    },
    {
      icon: <LineChartOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      title: '成绩追踪',
      desc: '历次评估成绩曲线，各科提升趋势一目了然，对标目标高中',
      action: () => navigate('/progress'),
      btnText: '查看趋势'
    }
  ]

  const updateCardActions: React.ReactNode[] = []
  if (appUpdateState?.state === 'available') {
    updateCardActions.push(
      <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadApp} loading={downloadingApp}>
        下载更新
      </Button>
    )
  } else if (appUpdateState?.state === 'downloaded') {
    updateCardActions.push(
      <Button key="install" type="primary" onClick={handleInstall}>
        重启并安装
      </Button>
    )
  } else {
    updateCardActions.push(
      <Button key="check" type="primary" icon={<ReloadOutlined />} onClick={handleCheckAppUpdate} loading={checkingApp}>
        检查软件更新
      </Button>
    )
  }
  updateCardActions.push(
    <Button key="db" icon={<CloudDownloadOutlined />} onClick={() => setDbModalOpen(true)}>
      题库更新
    </Button>
  )

  return (
    <div>
      {/* 欢迎区 */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ color: '#fff', marginBottom: 4 }}>
              欢迎使用天津中考备考助手
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 0 }}>
              科学评估 → 精准定位 → 针对性提升，助你冲刺理想高中
            </Paragraph>
          </Col>
          <Col>
            <Space size="large">
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>中考总分</div>
                <div style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>800</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>考试科目</div>
                <div style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>7</div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 最近评估 */}
      {latestAssessment && (
        <Card
          style={{ marginBottom: 24 }}
          title={
            <Space>
              <ClockCircleOutlined />
              <span>最近评估</span>
            </Space>
          }
        >
          <Row gutter={24}>
            <Col span={8}>
              <Statistic
                title="总分"
                value={latestAssessment.total_score}
                suffix={`/ ${latestAssessment.max_score}`}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="得分率"
                value={Math.round((latestAssessment.total_score / latestAssessment.max_score) * 100)}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="评估日期"
                value={latestAssessment.created_at}
                prefix={<CalendarOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 功能入口 */}
      <Title level={4} style={{ marginBottom: 16 }}>快速入口</Title>
      <Row gutter={[16, 16]}>
        {features.map((f) => (
          <Col xs={24} sm={12} lg={6} key={f.title}>
            <Card hoverable className="report-card" style={{ height: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>{f.icon}</div>
              <Title level={5} style={{ textAlign: 'center' }}>{f.title}</Title>
              <Paragraph style={{ color: '#666', textAlign: 'center', fontSize: 13, minHeight: 40 }}>
                {f.desc}
              </Paragraph>
              <Button
                type={f.action ? 'primary' : 'default'}
                block
                onClick={f.action}
                disabled={!f.action}
              >
                {f.btnText}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 更新 */}
      <Card
        title={
          <Space>
            <CloudDownloadOutlined />
            <span>软件更新</span>
            {appVersion && <Tag color="blue">v{appVersion}</Tag>}
          </Space>
        }
        style={{ marginTop: 24 }}
        extra={<Space>{updateCardActions}</Space>}
      >
        {appUpdateState?.state === 'checking' && (
          <div style={{ color: '#1677ff' }}>正在检查更新...</div>
        )}
        {appUpdateState?.state === 'downloading' && (
          <div>
            <div style={{ marginBottom: 8, color: '#1677ff' }}>正在下载更新...</div>
            {appUpdateState.percent != null && (
              <Progress percent={Math.round(appUpdateState.percent)} />
            )}
          </div>
        )}
        {appUpdateState?.state === 'downloaded' && (
          <Alert type="success" message="更新已下载完成，请点击「重启并安装」以完成更新" showIcon />
        )}
        {appUpdateState?.state === 'up-to-date' && (
          <Alert type="info" message="当前已是最新版本" showIcon />
        )}
        {appUpdateState?.state === 'error' && (
          <Alert type="error" message={appUpdateState.message || '检查更新出错'} showIcon />
        )}
        {!appUpdateState && (
          <span style={{ color: '#666' }}>
            检查是否有新版本可用。题库更新请点击右侧"题库更新"按钮。
          </span>
        )}
      </Card>

      {/* 题库更新 Modal */}
      <Modal
        title="题库更新"
        open={dbModalOpen}
        onCancel={() => { setDbModalOpen(false); setDbResult(null) }}
        footer={null}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>题库下载地址</div>
          <Input
            placeholder="输入题库文件的 URL 地址"
            value={dbUrl}
            onChange={(e) => setDbUrl(e.target.value)}
            onPressEnter={handleCheckDb}
          />
        </div>

        {dbResult && (
          <Alert
            type={dbResult.success ? 'success' : 'error'}
            message={dbResult.success ? '更新成功' : '更新失败'}
            description={
              dbResult.success
                ? `新增 ${dbResult.newQuestions} 道题目，${dbResult.newKps} 个知识点`
                : dbResult.error
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <Button
          type="primary"
          loading={checkingDb}
          onClick={handleCheckDb}
          block
        >
          {checkingDb ? '正在下载合并题库...' : '开始更新'}
        </Button>
      </Modal>

      {/* 使用步骤 */}
      <Card title="使用流程" style={{ marginTop: 24 }}>
        <Timeline
          items={[
            { color: 'green', children: '第一步：完成水平评估，了解各科当前水平' },
            { color: 'blue', children: '第二步：根据诊断报告，确定薄弱科目和知识点' },
            { color: 'orange', children: '第三步：在真题练习中有针对性地训练薄弱项' },
            { color: 'red', children: '第四步：错题本收录错题，定期重做巩固' },
            { color: 'purple', children: '第五步：再次评估，查看成绩提升情况' }
          ]}
        />
      </Card>
    </div>
  )
}
