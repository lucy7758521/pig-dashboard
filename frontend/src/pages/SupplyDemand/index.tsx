import { Row, Col, Card, Spin, Statistic } from 'antd'
import {
  AlertOutlined, DollarOutlined, PercentageOutlined,
  LineChartOutlined, ExperimentOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useSupplyDemand } from '../../hooks/useSupplyDemand'

const DARK_TOOLTIP = {
  backgroundColor: 'rgba(10, 14, 23, 0.95)',
  borderColor: 'rgba(0, 200, 255, 0.15)',
  textStyle: { color: '#e0f0ff', fontSize: 12 },
}

const cardStyle = {
  borderRadius: 14,
  background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(10, 14, 23, 0.95))',
  border: '1px solid rgba(0, 200, 255, 0.1)',
  backdropFilter: 'blur(20px)',
}

const iconWrap = (bg: string, shadow: string, icon: React.ReactNode) => (
  <div style={{
    width: 40, height: 40, borderRadius: 10,
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: '#fff', boxShadow: shadow,
  }}>
    {icon}
  </div>
)

function TrendChart({ title, data, color, unit, height = 300 }: {
  title: string; data: { date: string; value: number }[];
  color: string; unit?: string; height?: number;
}) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      ...DARK_TOOLTIP,
      formatter: (p: { value: number[] }[]) =>
        `<b>${p[0].value[0]}</b><br/>${title}: <b style="color:${color}">${p[0].value[1].toFixed(2)}</b> ${unit || ''}`,
    },
    grid: { left: '3%', right: '4%', top: 10, bottom: 10, containLabel: true },
    xAxis: {
      type: 'category', data: data.map((d) => d.date.slice(5)),
      axisLabel: { color: '#556677', fontSize: 10 }, axisLine: { show: false },
    },
    yAxis: {
      type: 'value', name: unit || '',
      nameTextStyle: { color: '#556677', fontSize: 10 },
      axisLabel: { color: '#556677', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
    },
    series: [{
      type: 'line', smooth: true, symbol: 'none',
      lineStyle: { color, width: 2, shadowBlur: 8, shadowColor: color },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '25' }, { offset: 1, color: 'transparent' }] } },
      data: data.map((d) => d.value),
    }],
  }
  return <ReactECharts option={option} style={{ height }} />
}

function MultiTrendChart({ title, series, height = 320 }: {
  title: string; series: { name: string; color: string; data: { date: string; value: number }[] }[]; height?: number;
}) {
  const allDates = series[0]?.data.map((d) => d.date.slice(5)) || []
  const option = {
    backgroundColor: 'transparent',
    tooltip: { ...DARK_TOOLTIP, trigger: 'axis' },
    legend: { data: series.map((s) => s.name), textStyle: { color: '#7a8a9a', fontSize: 11 }, top: 0 },
    grid: { left: '3%', right: '4%', top: 35, bottom: 10, containLabel: true },
    xAxis: { type: 'category', data: allDates, axisLabel: { color: '#556677', fontSize: 10 }, axisLine: { show: false } },
    yAxis: { type: 'value', name: '元/公斤', nameTextStyle: { color: '#556677', fontSize: 10 }, axisLabel: { color: '#556677', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } } },
    series: series.map((s) => ({
      name: s.name, type: 'line', smooth: true, symbol: 'none',
      lineStyle: { color: s.color, width: 1.5 },
      data: s.data.map((d) => d.value),
    })),
  }
  return <ReactECharts option={option} style={{ height }} />
}

export default function SupplyDemandPage() {
  const { data, isLoading } = useSupplyDemand()

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  const supplyIndex = data?.supply_index
  const cost = data?.breeding_cost
  const ratio = data?.pig_grain_ratio
  const priceIndex = data?.price_index
  const feed = data?.feed_trend

  return (
    <div>
      <h2 style={{ color: '#e0f0ff', fontWeight: 700, marginBottom: 20, fontSize: 20 }}>
        📊 宏观供需数据看板
      </h2>

      {/* 指标卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={cardStyle} bodyStyle={{ padding: '18px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {iconWrap('linear-gradient(135deg, #00d4ff, #0a84ff)', '0 0 16px rgba(0,200,255,0.4)', <LineChartOutlined />)}
              <span style={{ color: '#7a8a9a', fontSize: 12 }}>供给指数</span>
            </div>
            <Statistic value={supplyIndex?.value ?? 0} suffix=" 指数"
              valueStyle={{ color: '#00d4ff', fontSize: 26, fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={cardStyle} bodyStyle={{ padding: '18px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {iconWrap('linear-gradient(135deg, #ffaa00, #ffcc44)', '0 0 16px rgba(255,170,0,0.4)', <DollarOutlined />)}
              <span style={{ color: '#7a8a9a', fontSize: 12 }}>养殖成本</span>
            </div>
            <Statistic value={cost?.value ?? 0} suffix=" 元/头"
              valueStyle={{ color: '#ffaa00', fontSize: 26, fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={cardStyle} bodyStyle={{ padding: '18px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {iconWrap('linear-gradient(135deg, #ff4466, #ff6688)', '0 0 16px rgba(255,68,102,0.4)', <AlertOutlined />)}
              <span style={{ color: '#7a8a9a', fontSize: 12 }}>猪粮比</span>
            </div>
            <Statistic value={ratio?.value ?? 0} suffix=""
              valueStyle={{ color: ratio?.status_color || '#ff4466', fontSize: 26, fontWeight: 700 }} />
            {ratio?.status && (
              <div style={{ color: ratio.status_color, fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                {ratio.status}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={cardStyle} bodyStyle={{ padding: '18px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {iconWrap('linear-gradient(135deg, #00ff88, #00cc66)', '0 0 16px rgba(0,255,136,0.4)', <PercentageOutlined />)}
              <span style={{ color: '#7a8a9a', fontSize: 12 }}>价格指数</span>
            </div>
            <Statistic value={priceIndex?.value ?? 0} suffix=""
              valueStyle={{ color: '#00ff88', fontSize: 26, fontWeight: 700 }} />
            {priceIndex && (
              <div style={{ color: '#556677', fontSize: 11, marginTop: 2 }}>
                预售 {priceIndex.presale_avg} / 成交 {priceIndex.deal_avg} 元/kg · 均重 {priceIndex.deal_weight}kg
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 供给指数走势 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} title={<span style={{ color: '#e0f0ff', fontSize: 14 }}>供给指数走势</span>}>
            {supplyIndex?.trend && <TrendChart title="供给指数" data={supplyIndex.trend} color="#00d4ff" unit="指数" height={300} />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} title={<span style={{ color: '#e0f0ff', fontSize: 14 }}>养殖成本走势</span>}>
            {cost?.trend && <TrendChart title="养殖成本" data={cost.trend} color="#ffaa00" unit="元/头" height={300} />}
          </Card>
        </Col>
      </Row>

      {/* 猪粮比 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} title={<span style={{ color: '#e0f0ff', fontSize: 14 }}>猪粮比（生猪价/玉米价）</span>}>
            {ratio?.trend && <TrendChart title="猪粮比" data={ratio.trend} color="#ff4466" unit="" height={300} />}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: -10 }}>
              {[{ label: '重度亏损', color: '#ff4466', range: '< 5.0' },
                { label: '轻度亏损', color: '#ffaa00', range: '5.0-5.5' },
                { label: '正常盈利', color: '#00ff88', range: '5.5-6.5' },
                { label: '高盈利', color: '#00d4ff', range: '> 6.5' },
              ].map((z) => (
                <div key={z.label} style={{ textAlign: 'center' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: z.color, margin: '0 auto 4px' }} />
                  <div style={{ color: '#556677', fontSize: 10 }}>{z.label}</div>
                  <div style={{ color: '#7a8a9a', fontSize: 10 }}>{z.range}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} title={<span style={{ color: '#e0f0ff', fontSize: 14 }}>价格指数走势</span>}>
            {priceIndex?.trend && <TrendChart title="价格指数" data={priceIndex.trend} color="#00ff88" unit="指数" height={300} />}
          </Card>
        </Col>
      </Row>

      {/* 饲料成本趋势 */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card bordered={false} style={cardStyle} title={<span style={{ color: '#e0f0ff', fontSize: 14 }}>饲料原料价格走势</span>}>
            {feed && (
              <MultiTrendChart title="饲料" series={[
                { name: '玉米', color: '#00ff88', data: feed.corn },
                { name: '大豆', color: '#ffaa00', data: feed.soybean },
                { name: '混合饲料', color: '#00d4ff', data: feed.feed },
              ]} height={300} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
