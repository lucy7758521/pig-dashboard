import { Card, Table, Tabs, Tag } from 'antd'
import { CaretUpOutlined, CaretDownOutlined, MinusOutlined } from '@ant-design/icons'
import { useCurrentPrices } from '../../hooks/usePrices'
import { useAppStore } from '../../store/appStore'
import { categoryColors } from '../../utils/format'
import type { PriceItem } from '../../types'

const CATEGORIES = ['外三元', '内三元', '土杂猪']

/** 涨跌渲染：红涨绿跌灰平，显示百分比 */
function renderChange(change: number | undefined | null, priceKg: number) {
  if (change === undefined || change === null || change === 0 || priceKg <= 0) {
    return <span style={{ color: '#999' }}><MinusOutlined /> 0.00%</span>
  }
  const pct = (change / priceKg) * 100  // 搜猪网 change 是元/斤，需换算为百分比
  const isUp = pct > 0
  return (
    <span style={{ color: isUp ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>
      {isUp ? <CaretUpOutlined /> : <CaretDownOutlined />}
      {' '}{Math.abs(pct).toFixed(2)}%
    </span>
  )
}

const columns = [
  {
    title: '排名',
    dataIndex: 'rank',
    key: 'rank',
    width: 65,
    render: (rank: number) => {
      const color = rank <= 3 ? '#e74c3c' : rank <= 5 ? '#f39c12' : '#999'
      return <Tag color={color}>{rank}</Tag>
    },
  },
  {
    title: '省份',
    dataIndex: 'province',
    key: 'province',
    width: 90,
    render: (text: string) => <strong>{text}</strong>,
  },
  {
    title: '价格(元/公斤)',
    dataIndex: 'price_kg',
    key: 'price_kg',
    width: 115,
    sorter: (a: PriceItem, b: PriceItem) => a.price_kg - b.price_kg,
    defaultSortOrder: 'descend' as const,
    render: (val: number) => (
      <span style={{ fontSize: 14, fontWeight: 600 }}>{val.toFixed(2)}</span>
    ),
  },
  {
    title: '价格(元/斤)',
    dataIndex: 'price_yuan',
    key: 'price_yuan',
    width: 100,
    render: (val: number) => (
      <span style={{ color: '#888' }}>{val.toFixed(2)}</span>
    ),
  },
  {
    title: '24h涨跌',
    dataIndex: 'change',
    key: 'change',
    width: 90,
    sorter: (a: PriceItem, b: PriceItem) => ((a.change || 0) / (a.price_kg || 1)) - ((b.change || 0) / (b.price_kg || 1)),
    render: (change: number, record: PriceItem) => renderChange(change, record.price_kg),
  },
]

export default function PriceRankTable() {
  const selectedCategory = useAppStore((s) => s.selectedCategory)
  const setSelectedCategory = useAppStore((s) => s.setSelectedCategory)
  const { data, isLoading } = useCurrentPrices(selectedCategory)

  return (
    <Card
      title={<span style={{ color: '#e0f0ff', fontSize: 15, fontWeight: 600 }}>🏆 品种价格排行</span>}
      bordered={false}
      style={{
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(10, 14, 23, 0.95))',
        border: '1px solid rgba(0, 200, 255, 0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <Tabs
        activeKey={selectedCategory}
        onChange={setSelectedCategory}
        items={CATEGORIES.map((cat) => ({
          key: cat,
          label: (
            <span style={{ color: selectedCategory === cat ? '#00d4ff' : '#7a8a9a' }}>
              {cat}
            </span>
          ),
          children: (
            <Table
              dataSource={data || []}
              columns={columns}
              rowKey="province"
              loading={isLoading}
              size="small"
              pagination={false}
              scroll={{ y: 400 }}
            />
          ),
        }))}
      />
    </Card>
  )
}
