import { Card, List, Tag, Typography } from 'antd'
import { BankOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { EnterpriseEvent } from '../../types'
import { eventTypeColors, timeAgo } from '../../utils/format'

const { Text, Paragraph } = Typography

const enterpriseColors: Record<string, string> = {
  '牧原股份': '#e74c3c',
  '温氏股份': '#27ae60',
  '新希望': '#2980b9',
  '正邦科技': '#f39c12',
  '天邦食品': '#8e44ad',
  '傲农生物': '#16a085',
}

interface Props {
  data: EnterpriseEvent[] | undefined
  loading: boolean
}

export default function EnterpriseSummary({ data, loading }: Props) {
  const navigate = useNavigate()

  return (
    <Card
      title={
        <span>
          <BankOutlined style={{ marginRight: 8 }} />
          头部企业动态
        </span>
      }
      extra={
        <a onClick={() => navigate('/enterprises')} style={{ fontSize: 13 }}>
          查看更多 →
        </a>
      }
      bordered={false}
      style={{
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        height: '100%',
      }}
      bodyStyle={{ padding: '0 12px' }}
    >
      <List
        loading={loading}
        dataSource={data || []}
        renderItem={(item: EnterpriseEvent) => (
          <List.Item
            style={{ cursor: 'pointer', padding: '12px 8px' }}
            onClick={() => navigate(`/enterprises/${item.enterprise_name}`)}
          >
            <List.Item.Meta
              title={
                <Text strong style={{ fontSize: 14 }}>
                  {item.title}
                </Text>
              }
              description={
                <div style={{ marginTop: 4 }}>
                  <Paragraph
                    ellipsis={{ rows: 1 }}
                    style={{ margin: 0, color: '#666', fontSize: 12 }}
                  >
                    {item.content}
                  </Paragraph>
                  <div style={{ marginTop: 6 }}>
                    <Tag
                      color={enterpriseColors[item.enterprise_name] || 'default'}
                      style={{ fontSize: 11 }}
                    >
                      {item.enterprise_name}
                    </Tag>
                    <Tag
                      color={eventTypeColors[item.event_type] || 'default'}
                      style={{ fontSize: 11 }}
                    >
                      {item.event_type}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {timeAgo(item.event_date)}
                    </Text>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
        split
      />
    </Card>
  )
}
