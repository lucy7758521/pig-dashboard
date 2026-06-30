import { useState } from 'react'
import { Card, List, Tag, Typography, Space, Select, Pagination } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useEnterpriseEvents } from '../../hooks/useEnterprises'
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

const ENTERPRISES = ['牧原股份', '温氏股份', '新希望', '正邦科技', '天邦食品', '傲农生物']
const EVENT_TYPES = ['公告', '出栏数据', '股价动态', '新闻']

export default function EnterprisesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [name, setName] = useState<string | undefined>()
  const [eventType, setEventType] = useState<string | undefined>()
  const { data, isLoading } = useEnterpriseEvents(name, eventType, page, 20)

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        头部企业实时动态
      </Title>

      {/* 筛选栏 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
      >
        <Space wrap>
          <Select
            placeholder="选择企业"
            allowClear
            style={{ width: 150 }}
            value={name}
            onChange={(val) => {
              setName(val)
              setPage(1)
            }}
            options={ENTERPRISES.map((e) => ({ value: e, label: e }))}
          />
          <Select
            placeholder="事件类型"
            allowClear
            style={{ width: 150 }}
            value={eventType}
            onChange={(val) => {
              setEventType(val)
              setPage(1)
            }}
            options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </Space>
      </Card>

      {/* 企业动态列表 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <List
          loading={isLoading}
          dataSource={data?.items || []}
          renderItem={(item: EnterpriseEvent) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '16px 0' }}
              onClick={() => navigate(`/enterprises/${item.enterprise_name}`)}
            >
              <List.Item.Meta
                title={
                  <Text strong style={{ fontSize: 15 }}>
                    {item.title}
                  </Text>
                }
                description={
                  <div style={{ marginTop: 6 }}>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ margin: 0, color: '#666', fontSize: 13, marginBottom: 8 }}
                    >
                      {item.content}
                    </Paragraph>
                    <Space>
                      <Tag color={enterpriseColors[item.enterprise_name] || 'default'}>
                        {item.enterprise_name} {item.stock_code}
                      </Tag>
                      <Tag color={eventTypeColors[item.event_type] || 'default'}>
                        {item.event_type}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {timeAgo(item.event_date)}
                      </Text>
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
          split
        />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination
            current={page}
            total={data?.total || 0}
            pageSize={20}
            onChange={setPage}
            showTotal={(total) => `共 ${total} 条动态`}
            showSizeChanger={false}
          />
        </div>
      </Card>
    </div>
  )
}
