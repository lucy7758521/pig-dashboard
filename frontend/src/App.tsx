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

const { Content, Sider } = Layout

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

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
            colorInfo: '#00d4ff',
            borderRadius: 8,
            colorBgContainer: '#111827',
            colorBgElevated: '#1a2236',
            colorBgLayout: '#0a0e17',
            colorBorder: 'rgba(0, 200, 255, 0.12)',
            colorBorderSecondary: 'rgba(0, 200, 255, 0.06)',
            colorText: '#e0e6ed',
            colorTextSecondary: '#8899aa',
            colorTextTertiary: '#556677',
            fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
          },
          components: {
            Card: {
              colorBgContainer: 'rgba(17, 24, 39, 0.8)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 1px rgba(0,200,255,0.1)',
              paddingLG: 20,
            },
            Menu: {
              darkItemBg: 'transparent',
              darkItemSelectedBg: 'rgba(0, 200, 255, 0.12)',
              darkItemHoverBg: 'rgba(0, 200, 255, 0.06)',
              darkSubMenuItemBg: 'transparent',
            },
            Table: {
              headerBg: 'rgba(0, 132, 255, 0.08)',
              rowHoverBg: 'rgba(0, 132, 255, 0.06)',
              borderColor: 'rgba(0, 200, 255, 0.06)',
            },
            Statistic: {
              contentFontSize: 28,
            },
            Tabs: {
              inkBarColor: '#00d4ff',
              itemActiveColor: '#00d4ff',
              itemHoverColor: '#40e0ff',
            },
          },
        }}
      >
        <BrowserRouter>
          <Layout style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 1 }}>
            <Header />
            <Layout>
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
              <Content
                style={{
                  padding: 24,
                  background: 'transparent',
                  minHeight: 'calc(100vh - 64px)',
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
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
