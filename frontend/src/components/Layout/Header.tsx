import { Layout, Typography, Space, Tag } from 'antd'
import dayjs from 'dayjs'

const { Header: AntHeader } = Layout
const { Title } = Typography

export default function Header() {
  return (
    <AntHeader
      style={{
        background: 'linear-gradient(135deg, #0a0e17 0%, #111d2e 40%, #0a1628 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: 64,
        borderBottom: '1px solid rgba(0, 200, 255, 0.15)',
        boxShadow: '0 2px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(0, 200, 255, 0.06) inset',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}
    >
      <Space align="center" size={14}>
        <div style={{
          width: 40, height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #00d4ff, #0a84ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0, 200, 255, 0.3)',
          fontSize: 22,
        }}>
          🐷
        </div>
        <div>
          <Title level={4} style={{ margin: 0, color: '#e0f0ff', fontWeight: 700, letterSpacing: 1 }}>
            国内生猪综合数据看板
          </Title>
          <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: -2, letterSpacing: 2 }}>
            CHINA PORK MARKET INTELLIGENCE
          </div>
        </div>
      </Space>
      <Space size={16}>
        <span className="live-indicator" />
        <Tag
          style={{
            background: 'rgba(0, 255, 136, 0.08)',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            color: '#00ff88',
            fontSize: 13,
            borderRadius: 6,
            padding: '2px 12px',
          }}
        >
          实时数据 · {dayjs().format('YYYY-MM-DD HH:mm')}
        </Tag>
      </Space>
    </AntHeader>
  )
}
