import { Row, Col } from 'antd'
import { useDashboard } from '../../hooks/useDashboard'
import StatsCards from './StatsCards'
import ChinaMap from './ChinaMap'
import PriceTrend from './PriceTrend'
import PriceRankTable from './PriceRankTable'
import NewsSummary from './NewsSummary'
import EnterpriseSummary from './EnterpriseSummary'

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* 概览统计卡片 */}
      <StatsCards data={data?.summary_cards} loading={isLoading} />

      {/* 地图 + 趋势图 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <ChinaMap data={data?.map_data} loading={isLoading} />
        </Col>
        <Col xs={24} lg={10}>
          <PriceTrend />
        </Col>
      </Row>

      {/* 排行表 */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <PriceRankTable />
        </Col>
      </Row>

      {/* 新闻 + 企业动态 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <NewsSummary data={data?.latest_news} loading={isLoading} />
        </Col>
        <Col xs={24} lg={10}>
          <EnterpriseSummary data={data?.enterprise_updates} loading={isLoading} />
        </Col>
      </Row>
    </div>
  )
}
