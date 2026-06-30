import { useState } from 'react'
import { Card, Table, Tabs, Tag, Select, Space, Typography } from 'antd'
import { SearchOutlined, CaretUpOutlined, CaretDownOutlined, MinusOutlined } from '@ant-design/icons'
import { useCurrentPrices, usePriceHistory } from '../../hooks/usePrices'
import { useAppStore } from '../../store/appStore'
import { categoryColors, formatPrice } from '../../utils/format'
import type { PriceItem } from '../../types'
import ReactECharts from 'echarts-for-react'

const { Title, Text } = Typography
const CATEGORIES = ['外三元', '内三元', '土杂猪']

/** 涨跌渲染：红涨绿跌灰平，显示百分比 */
function renderChange(change: number | undefined | null, priceKg: number) {
  if (change === undefined || change === null || change === 0 || priceKg <= 0) {
    return <span style={{ color: '#999', fontSize: 13 }}><MinusOutlined /> 0.00%</span>
  }
  const pct = (change / priceKg) * 100
  const isUp = pct > 0
  return (
    <span style={{ color: isUp ? '#e74c3c' : '#27ae60', fontWeight: 600, fontSize: 13 }}>
      {isUp ? <CaretUpOutlined /> : <CaretDownOutlined />}
      {' '}{Math.abs(pct).toFixed(2)}%
    </span>
  )
}

export default function PricesPage() {
  const selectedCategory = useAppStore((s) => s.selectedCategory)
  const setSelectedCategory = useAppStore((s) => s.setSelectedCategory)
  const [searchProvince, setSearchProvince] = useState<string | undefined>()
  const { data, isLoading } = useCurrentPrices(selectedCategory, searchProvince)
  const { data: historyData } = usePriceHistory(selectedCategory, 90)

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => {
        const color = rank <= 3 ? '#e74c3c' : rank <= 5 ? '#f39c12' : '#999'
        return <Tag color={color}>{rank}</Tag>
      },
    },
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
      width: 120,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '价格(元/公斤)',
      dataIndex: 'price_kg',
      key: 'price_kg',
      width: 150,
      sorter: (a: PriceItem, b: PriceItem) => a.price_kg - b.price_kg,
      defaultSortOrder: 'descend' as const,
      render: (val: number) => (
        <Text strong style={{ fontSize: 16 }}>
          {formatPrice(val)}
        </Text>
      ),
    },
    {
      title: '价格(元/斤)',
      dataIndex: 'price_yuan',
      key: 'price_yuan',
      width: 130,
      render: (val: number) => (
        <Text type="secondary">{val.toFixed(2)} 元/斤</Text>
      ),
    },
    {
      title: '24h涨跌',
      dataIndex: 'change',
      key: 'change',
      width: 100,
      sorter: (a: PriceItem, b: PriceItem) => ((a.change || 0) / (a.price_kg || 1)) - ((b.change || 0) / (b.price_kg || 1)),
      render: (change: number, record: PriceItem) => renderChange(change, record.price_kg),
    },
    {
      title: '数据来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (text: string) => (
        <Tag>{text === 'soozhu' ? '搜猪网' : text === 'akshare' ? 'AKShare' : text === 'mock' ? '模拟数据' : text}</Tag>
      ),
    },
  ]

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { value: number[] }[]) => {
        if (!params || params.length === 0) return ''
        return `${params[0].value[0]}<br/>${selectedCategory}: ${params[0].value[1].toFixed(2)} 元/公斤`
      },
    },
    grid: { left: '3%', right: '4%', bottom: '8%', top: 20, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: historyData?.points.map((p) => p.date) || [],
      axisLabel: { rotate: 30, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: '元/公斤',
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 18, bottom: 4 },
    ],
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: categoryColors[selectedCategory] || '#e74c3c', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: categoryColors[selectedCategory] + '40' || '#e74c3c40' },
              { offset: 1, color: 'rgba(255,255,255,0)' },
            ],
          },
        },
        data: historyData?.points.map((p) => p.price) || [],
      },
    ],
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        全国生猪价格行情
      </Title>

      {/* 趋势图 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
        title={`${selectedCategory} 近90天价格走势`}
      >
        <ReactECharts option={chartOption} style={{ height: 350 }} />
      </Card>

      {/* 排行表 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        title="各省份价格排行"
        extra={
          <Space>
            <Select
              placeholder="搜索省份"
              allowClear
              showSearch
              style={{ width: 150 }}
              onChange={(val) => setSearchProvince(val)}
              options={
                data?.map((item) => ({
                  value: item.province,
                  label: item.province,
                })) || []
              }
              suffixIcon={<SearchOutlined />}
            />
          </Space>
        }
      >
        <Tabs
          activeKey={selectedCategory}
          onChange={setSelectedCategory}
          items={CATEGORIES.map((cat) => ({
            key: cat,
            label: (
              <span style={{ color: selectedCategory === cat ? categoryColors[cat] : undefined }}>
                {cat}
              </span>
            ),
            children: (
              <Table
                dataSource={data || []}
                columns={columns}
                rowKey="province"
                loading={isLoading}
                size="middle"
                pagination={false}
                scroll={{ y: 500 }}
              />
            ),
          }))}
        />
      </Card>
    </div>
  )
}
