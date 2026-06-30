import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Tag, Space, Button, Spin, List, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined, BankOutlined } from '@ant-design/icons'
import { useEnterpriseStats, useEnterpriseEvents } from '../../hooks/useEnterprises'
import { eventTypeColors, timeAgo } from '../../utils/format'
import type { EnterpriseEvent } from '../../types'

const { Title, Text, Paragraph } = Typography

const enterpriseColors: Record<string, string> = {
  '牧原股份': '#e74c3c',
  '温氏股份': '#27ae60',
  '新希望': '#2980b9',
  '正邦科技': '#f39c12',
  '天邦食品': '#8e44ad',
  '傲农生物': '#16a085',
}

export default function EnterpriseDetailPage() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useEnterpriseStats(name || '')
  const { data: events, isLoading: eventsLoading } = useEnterpriseEvents(name, undefined, 1, 50)

  if (statsLoading || eventsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/enterprises')}
        style={{ marginBottom: 16 }}
      >
        返回企业列表
      </Button>

      {/* 企业信息卡片 */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: 16,
          borderLeft: `4px solid ${enterpriseColors[name || ''] || '#ccc'}`,
        }}
      >
        <Space align="center" size={16}>
          <BankOutlined
            style={{ fontSize: 36, color: enterpriseColors[name || ''] || '#999' }}
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {name}
            </Title>
            <Text type="secondary">
              累计动态: {stats?.total_events || 0} 条
            </Text>
          </div>
        </Space>

        <Row gutter={16} style={{ marginTop: 16 }}>
          {stats?.event_types &&
            Object.entries(stats.event_types).map(([key, val]) => (
              <Col key={key} xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title={key}
                    value={val}
                    suffix="条"
                    valueStyle={{ color: eventTypeColors[key] || '#333' }}
                  />
                </Card>
              </Col>
            ))}
        </Row>
      </Card>

      {/* 动态列表 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        title="全部动态"
      >
        <List
          dataSource={events?.items || []}
          renderItem={(item: EnterpriseEvent) => (
            <List.Item style={{ padding: '16px 0' }}>
              <List.Item.Meta
                title={
                  <Text strong style={{ fontSize: 15 }}>
                    {item.title}
                  </Text>
                }
                description={
                  <div style={{ marginTop: 6 }}>
                    <Paragraph style={{ margin: 0, color: '#666', fontSize: 13, marginBottom: 8 }}>
                      {item.content}
                    </Paragraph>
                    <Space>
                      <Tag color={eventTypeColors[item.event_type] || 'default'}>
                        {item.event_type}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {timeAgo(item.event_date)}
                      </Text>
                    </Space>
                    {item.data_json && Object.keys(item.data_json).length > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '8px 12px',
                          background: '#f5f5f5',
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      >
                        {Object.entries(item.data_json).map(([k, v]) => (
                          <Tag key={k} style={{ marginBottom: 4 }}>
                            {k}: {String(v)}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
          split
        />
      </Card>
    </div>
  )
}
