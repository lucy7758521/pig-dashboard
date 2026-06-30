import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, Layout, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import DashboardPage from './pages/Dashboard'
import PricesPage from './pages/Prices'
import NewsPage from './pages/News'
import NewsDetailPage from './pages/News/NewsDetail'
import EnterprisesPage from './pages/Enterprises'
import EnterpriseDetailPage from './pages/Enterprises/EnterpriseDetail'
import PolicyPage from './pages/Policy'
import SupplyDemandPage from './pages/SupplyDemand'
import { useState, useEffect } from 'react'

const { Content, Sider } = Layout

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

function AppLayout() {
  const [mobile, setMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 1 }}>
      <Header onMenuClick={() => setCollapsed(!collapsed)} isMobile={mobile} />
      <Layout>
        {!mobile && (
          <Sider
            width={210}
            style={{
              background: 'rgba(10, 14, 23, 0.95)',
              borderRight: '1px solid rgba(0, 200, 255, 0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Sidebar />
          </Sider>
        )}
        {mobile && collapsed && (
          <div style={{
            position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
            zIndex: 99, background: 'rgba(10,14,23,0.98)', backdropFilter: 'blur(20px)',
            padding: 12,
          }}>
            <Sidebar onNavigate={() => setCollapsed(false)} />
          </div>
        )}
        <Content
          style={{
            padding: mobile ? 12 : 24,
            background: 'transparent',
            minHeight: 'calc(100vh - 64px)',
            overflowX: 'hidden',
          }}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/prices" element={<PricesPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/enterprises" element={<EnterprisesPage />} />
            <Route path="/enterprises/:name" element={<EnterpriseDetailPage />} />
            <Route path="/policies" element={<PolicyPage />} />
            <Route path="/supply-demand" element={<SupplyDemandPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#00d4ff',
            colorSuccess: '#00ff88',
            colorWarning: '#ffaa00',
            colorError: '#ff4466',
            borderRadius: 8,
            colorBgContainer: '#111827',
            colorBgElevated: '#1a2236',
            colorBgLayout: '#0a0e17',
            colorBorder: 'rgba(0, 200, 255, 0.12)',
            colorText: '#e0e6ed',
            colorTextSecondary: '#8899aa',
          },
          components: {
            Card: {
              colorBgContainer: 'rgba(17, 24, 39, 0.8)',
              paddingLG: 16,
            },
            Table: {
              headerBg: 'rgba(0, 132, 255, 0.08)',
              rowHoverBg: 'rgba(0, 132, 255, 0.06)',
              borderColor: 'rgba(0, 200, 255, 0.06)',
            },
            Statistic: { contentFontSize: 24 },
            Tabs: {
              inkBarColor: '#00d4ff',
              itemActiveColor: '#00d4ff',
            },
          },
        }}
      >
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
