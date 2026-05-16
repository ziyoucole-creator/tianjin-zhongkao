import { useState, useEffect } from 'react'
import { Card, Input, Button, Typography, message, Alert, Space, Divider } from 'antd'
import { KeyOutlined, ApiOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [maskedKey, setMaskedKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    loadKey()
  }, [])

  const loadKey = async () => {
    const key = await window.api.settings.getApiKey()
    if (key) {
      setHasKey(true)
      setMaskedKey(key.slice(0, 6) + '****' + key.slice(-4))
    }
  }

  const handleSave = async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      message.warning('请输入 API Key')
      return
    }
    if (!trimmed.startsWith('sk-')) {
      message.warning('API Key 格式不正确，应以 sk- 开头')
      return
    }
    setLoading(true)
    try {
      const ok = await window.api.settings.setApiKey(trimmed)
      if (ok) {
        message.success('API Key 已安全保存')
        setHasKey(true)
        setMaskedKey(trimmed.slice(0, 6) + '****' + trimmed.slice(-4))
        setApiKey('')
      } else {
        message.error('保存失败，请重试')
      }
    } catch {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    await window.api.settings.setApiKey('')
    setHasKey(false)
    setMaskedKey('')
    setApiKey('')
    message.info('API Key 已清除')
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <Title level={3}>
        <KeyOutlined style={{ marginRight: 8 }} />
        设置
      </Title>

      <Card title="LLM API Key" style={{ marginBottom: 24 }}>
        <Alert
          type="info"
          showIcon
          icon={<ApiOutlined />}
          style={{ marginBottom: 16 }}
          message={
            <span>
              目前仅支持 <Text strong>DeepSeek</Text> 大模型。<br />
              请前往 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">platform.deepseek.com/api_keys</a> 创建 API Key。
            </span>
          }
        />

        {hasKey && (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message={
              <span>已配置 Key：<Text code>{maskedKey}</Text></span>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <Space.Compact style={{ width: '100%' }}>
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={hasKey ? '输入新 Key 替换（留空不修改）' : '输入 DeepSeek API Key（sk-...）'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onPressEnter={handleSave}
          />
          <Button type="primary" onClick={handleSave} loading={loading}>
            保存
          </Button>
        </Space.Compact>

        {hasKey && (
          <div style={{ marginTop: 12 }}>
            <Button danger size="small" onClick={handleClear}>
              清除 API Key
            </Button>
          </div>
        )}

        <Divider />

        <div style={{ color: '#666', fontSize: 13 }}>
          <p><Text strong>优先级：</Text>环境变量 <Text code>DEEPSEEK_API_KEY</Text> &gt; 本页面配置 &gt; apikey.txt 文件</p>
          <p><Text strong>安全说明：</Text>Key 使用 Windows DPAPI 加密存储于本机，其他程序无法读取。</p>
        </div>
      </Card>
    </div>
  )
}
