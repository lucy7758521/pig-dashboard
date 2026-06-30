import { useNavigate, useLocation } from 'react-router-dom'
import { Menu } from 'antd'
import {
  DashboardOutlined,
  LineChartOutlined,
  FileTextOutlined,
  BankOutlined,
  FileProtectOutlined,
  FundOutlined,
} from '@ant-design/icons'

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '综合看板' },
  { key: '/prices', icon: <LineChartOutlined />, label: '价格行情' },
  { key: '/supply-demand', icon: <FundOutlined />, label: '供需看板' },
  { key: '/news', icon: <FileTextOutlined />, label: '新闻资讯' },
  { key: '/enterprises', icon: <BankOutlined />, label: '企业动态' },
  { key: '/policies', icon: <FileProtectOutlined />, label: '政策动态' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = menuItems.find(
    (item) => item.key !== '/' && location.pathname.startsWith(item.key)
  )?.key || (location.pathname === '/' ? '/' : '/')

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{
        padding: '0 24px 16px',
        fontSize: 11,
        color: '#4a6a8a',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        NAVIGATION
      </div>
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          background: 'transparent',
          borderRight: 0,
          fontSize: 14,
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        padding: 16,
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.06), rgba(10, 132, 255, 0.04))',
        border: '1px solid rgba(0, 200, 255, 0.08)',
      }}>
        <div style={{ fontSize: 11, color: '#4a6a8a', marginBottom: 4 }}>数据源</div>
        <div style={{ fontSize: 12, color: '#7a9aba' }}>
          搜猪网 · AKShare<br />
          农业农村部 · 新浪财经
        </div>
      </div>
    </div>
  )
}
