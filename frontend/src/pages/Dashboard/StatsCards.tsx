import { Row, Col, Card, Statistic } from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  DashboardOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  MinusOutlined,
} from '@ant-design/icons'
import type { SummaryCards } from '../../types'

interface Props {
  data: SummaryCards | undefined
  loading: boolean
}

function ChangeBadge({ change, basePrice }: { change: number | undefined; basePrice: number }) {
  if (change === undefined || change === null || change === 0 || basePrice <= 0) {
    return <span style={{ color: '#556677', fontSize: 13 }}><MinusOutlined /> 0.00%</span>
  }
  const pct = (change / basePrice) * 100
  const isUp = pct > 0
  return (
    <span style={{ color: isUp ? '#ff4466' : '#00ff88', fontWeight: 600, fontSize: 14 }}>
      {isUp ? <CaretUpOutlined /> : <CaretDownOutlined />}
      {' '}{Math.abs(pct).toFixed(2)}%
    </span>
  )
}

const cardConfigs = [
  {
    key: 'avg',
    title: '外三元全国均价',
    icon: <DashboardOutlined />,
    iconBg: 'linear-gradient(135deg, #ff4466, #ff6688)',
    iconShadow: '0 0 20px rgba(255, 68, 102, 0.4)',
    borderColor: 'rgba(255, 68, 102, 0.3)',
  },
  {
    key: 'top',
    title: '价格最高省份',
    icon: <TrophyOutlined />,
    iconBg: 'linear-gradient(135deg, #ffaa00, #ffcc44)',
    iconShadow: '0 0 20px rgba(255, 170, 0, 0.4)',
    borderColor: 'rgba(255, 170, 0, 0.3)',
  },
  {
    key: 'corn',
    title: '玉米均价',
    icon: <RiseOutlined />,
    iconBg: 'linear-gradient(135deg, #00ff88, #00cc66)',
    iconShadow: '0 0 20px rgba(0, 255, 136, 0.4)',
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  {
    key: 'soy',
    title: '大豆均价',
    icon: <FallOutlined />,
    iconBg: 'linear-gradient(135deg, #00d4ff, #0a84ff)',
    iconShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
]

export default function StatsCards({ data, loading }: Props) {
  const getContent = (config: typeof cardConfigs[number]) => {
    switch (config.key) {
      case 'avg':
        return {
          value: data?.avg_price?.value ?? 0,
          suffix: ' 元/公斤',
          extra: data?.avg_price?.change !== undefined ? (
            <ChangeBadge change={data.avg_price.change} basePrice={data.avg_price.value} />
          ) : null,
        }
      case 'top':
        return {
          value: data?.highest_province?.name ?? '-',
          suffix: ` ${data?.highest_province?.price ?? 0} 元/公斤`,
          extra: null,
        }
      case 'corn':
        return {
          value: data?.corn_price?.value ?? 0,
          suffix: ' 元/公斤',
          extra: null,
        }
      case 'soy':
        return {
          value: data?.soybean_price?.value ?? 0,
          suffix: ' 元/公斤',
          extra: null,
        }
      default:
        return { value: 0, suffix: '', extra: null }
    }
  }

  return (
    <Row gutter={[16, 16]}>
      {cardConfigs.map((config) => {
        const content = getContent(config)
        return (
          <Col xs={12} sm={12} md={6} key={config.key}>
            <Card
              loading={loading}
              bordered={false}
              style={{
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(26, 34, 54, 0.8))',
                border: `1px solid ${config.borderColor}`,
                backdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden',
              }}
              bodyStyle={{ padding: '20px 20px 16px' }}
            >
              {/* 背景发光点 */}
              <div style={{
                position: 'absolute',
                top: -20, right: -20,
                width: 80, height: 80,
                borderRadius: '50%',
                background: config.iconBg,
                opacity: 0.08,
                filter: 'blur(20px)',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36,
                  borderRadius: 10,
                  background: config.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                  color: '#fff',
                  boxShadow: config.iconShadow,
                }}>
                  {config.icon}
                </div>
                <span style={{ color: '#7a8a9a', fontSize: 12, fontWeight: 500 }}>
                  {config.title}
                </span>
              </div>
              <Statistic
                value={content.value}
                suffix={config.key === 'top' ? undefined : content.suffix}
                valueStyle={{
                  color: '#e0f0ff',
                  fontSize: config.key === 'top' ? 18 : 28,
                  fontWeight: 700,
                }}
              />
              {config.key === 'top' && (
                <div style={{ color: '#6a7a8a', fontSize: 12, marginTop: -2 }}>
                  {content.suffix}
                </div>
              )}
              {content.extra && (
                <div style={{ marginTop: 4 }}>
                  {content.extra}
                </div>
              )}
            </Card>
          </Col>
        )
      })}
    </Row>
  )
}
