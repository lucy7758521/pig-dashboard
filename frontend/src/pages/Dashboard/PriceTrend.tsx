import ReactECharts from 'echarts-for-react'
import { Card, Radio, Spin } from 'antd'
import { useState } from 'react'
import { usePriceHistory } from '../../hooks/usePrices'
import { formatDate } from '../../utils/format'
import { useAppStore } from '../../store/appStore'

const CATEGORIES = ['外三元', '内三元', '土杂猪']
const LINE_COLORS: Record<string, string> = {
  '外三元': '#ff4466',
  '内三元': '#ffaa00',
  '土杂猪': '#00d4ff',
}
const DAY_OPTIONS = [
  { label: '30天', value: 30 },
  { label: '90天', value: 90 },
  { label: '180天', value: 180 },
]

export default function PriceTrend() {
  const [days, setDays] = useState(30)
  const selectedCategory = useAppStore((s) => s.selectedCategory)

  const queries = CATEGORIES.map((cat) => ({
    cat,
    query: usePriceHistory(cat, days),
  }))

  const loading = queries.some((q) => q.query.isLoading)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 23, 0.95)',
      borderColor: 'rgba(0, 200, 255, 0.15)',
      textStyle: { color: '#e0f0ff', fontSize: 12 },
      formatter: (params: { seriesName: string; value: number[] }[]) => {
        if (!params || params.length === 0) return ''
        let result = `<b>${params[0].value[0]}</b><br/>`
        params.forEach((p) => {
          result += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${LINE_COLORS[p.seriesName] || '#fff'};margin-right:6px;"></span>${p.seriesName}: <b>${p.value[1].toFixed(2)}</b> 元/公斤<br/>`
        })
        return result
      },
    },
    legend: {
      data: CATEGORIES,
      top: 0,
      textStyle: { color: '#7a8a9a', fontSize: 12 },
    },
    grid: {
      left: '3%', right: '4%', bottom: '10%', top: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: queries[0]?.query.data?.points.map((p) => formatDate(p.date, 'MM-DD')) || [],
      axisLabel: { rotate: 45, fontSize: 10, color: '#556677' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '元/公斤',
      nameTextStyle: { color: '#556677', fontSize: 11 },
      axisLabel: { fontSize: 11, color: '#556677' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { start: 0, end: 100, height: 18, bottom: 6, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(17,24,39,0.8)' },
    ],
    series: queries.map((q) => ({
      name: q.cat,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: LINE_COLORS[q.cat] || '#fff',
        width: q.cat === selectedCategory ? 3 : 1.2,
        shadowBlur: q.cat === selectedCategory ? 10 : 0,
        shadowColor: q.cat === selectedCategory ? LINE_COLORS[q.cat] : 'transparent',
      },
      areaStyle: q.cat === selectedCategory ? {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: (LINE_COLORS[q.cat] || '#ff4466') + '20' },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ],
        },
      } : undefined,
      data: q.query.data?.points.map((p) => p.price) || [],
    })),
  }

  return (
    <Card
      title={<span style={{ color: '#e0f0ff', fontSize: 15, fontWeight: 600 }}>📈 价格走势图</span>}
      bordered={false}
      extra={
        <Radio.Group
          value={days}
          onChange={(e) => setDays(e.target.value)}
          size="small"
          optionType="button"
        >
          {DAY_OPTIONS.map((opt) => (
            <Radio.Button key={opt.value} value={opt.value}>
              {opt.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      }
      style={{
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(10, 14, 23, 0.95))',
        border: '1px solid rgba(0, 200, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        height: '100%',
      }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      ) : (
        <ReactECharts option={option} style={{ height: 380 }} />
      )}
    </Card>
  )
}
