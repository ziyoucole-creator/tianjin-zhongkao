import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, theme } from 'antd'
import {
  HomeOutlined,
  FormOutlined,
  TrophyOutlined,
  BookOutlined,
  ProjectOutlined,
  LineChartOutlined,
  CloudDownloadOutlined,
  CompassOutlined
} from '@ant-design/icons'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '../../stores/useAppStore'

const EXAM_DATE = new Date('2027-06-19')

const { Sider, Content, Header } = Layout

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/assessment', icon: <FormOutlined />, label: '水平评估' },
  { key: '/curriculum', icon: <CompassOutlined />, label: '考点分析' },
  { key: '/mockexam', icon: <TrophyOutlined />, label: '模拟考试' },
  { key: '/exercise', icon: <BookOutlined />, label: '真题练习' },
  { key: '/errorbook', icon: <ProjectOutlined />, label: '错题本' },
  { key: '/progress', icon: <LineChartOutlined />, label: '成绩追踪' },
  { key: '/scraper', icon: <CloudDownloadOutlined />, label: '数据爬取' }
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const collapsed = useAppStore((s) => s.collapsed)
  const toggleCollapsed = useAppStore((s) => s.toggleCollapsed)
  const loadSubjects = useAppStore((s) => s.loadSubjects)
  const { token } = theme.useToken()

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3600000)
    return () => clearInterval(timer)
  }, [])

  const daysLeft = useMemo(() => {
    return Math.max(0, Math.ceil((EXAM_DATE.getTime() - now) / (1000 * 60 * 60 * 24)))
  }, [now])

  useEffect(() => {
    loadSubjects()
  }, [loadSubjects])

  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapsed}
        theme="light"
        style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: collapsed ? 16 : 18,
          color: token.colorPrimary
        }}>
          {collapsed ? '中考' : '天津中考备考助手'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey === '/' ? '/' : selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: token.colorBgContainer,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${token.colorBorderSecondary}`
        }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {menuItems.find((m) => m.key === selectedKey)?.label || ''}
          </span>
          <span style={{ color: token.colorTextSecondary, fontSize: 14 }}>
            距离2027年天津中考还有 <strong style={{ color: token.colorPrimary }}>{daysLeft}</strong> 天
          </span>
        </Header>
        <Content style={{ margin: 24, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
