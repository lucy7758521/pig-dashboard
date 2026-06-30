import { useState } from 'react'
import { Card, List, Tag, Typography, Space, Select, Pagination, Empty } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'
import { usePolicies, usePolicyProvinces } from '../../hooks/usePolicies'
import { timeAgo } from '../../utils/format'
import type { PolicyItem } from '../../types'

const { Title, Text, Paragraph } = Typography

const policyTypeColors: Record<string, string> = {
  '补贴': 'green',
  '调运': 'blue',
  '环保': 'cyan',
  '产能调控': 'red',
  '金融支持': 'gold',
  '其他': 'default',
}

const POLICY_TYPES = ['补贴', '调运', '环保', '产能调控', '金融支持', '其他']

export default function PolicyPage() {
  const [page, setPage] = useState(1)
  const [province, setProvince] = useState<string | undefined>()
  const [policyType, setPolicyType] = useState<string | undefined>()
  const { data, isLoading } = usePolicies(page, 20, province, policyType)
  const { data: provinces } = usePolicyProvinces()

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <FileProtectOutlined style={{ marginRight: 8 }} />
        各省市生猪政策动态
      </Title>

      {/* 筛选栏 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
      >
        <Space wrap>
          <Select
            placeholder="选择省份"
            allowClear
            style={{ width: 150 }}
            value={province}
            onChange={(val) => { setProvince(val); setPage(1) }}
            options={(provinces || ['全国']).map((p) => ({ value: p, label: p }))}
          />
          <Select
            placeholder="政策类型"
            allowClear
            style={{ width: 150 }}
            value={policyType}
            onChange={(val) => { setPolicyType(val); setPage(1) }}
            options={POLICY_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </Space>
      </Card>

      {/* 政策列表 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {!isLoading && (!data?.items || data.items.length === 0) ? (
          <Empty description="暂无政策数据，请稍后刷新" />
        ) : (
          <>
            <List
              loading={isLoading}
              dataSource={data?.items || []}
              renderItem={(item: PolicyItem) => (
                <List.Item style={{ padding: '16px 0' }}>
                  <List.Item.Meta
                    title={
                      <Text strong style={{ fontSize: 15 }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <div style={{ marginTop: 6 }}>
                        {item.content && (
                          <Paragraph
                            ellipsis={{ rows: 2 }}
                            style={{ margin: 0, color: '#666', fontSize: 13, marginBottom: 8 }}
                          >
                            {item.content}
                          </Paragraph>
                        )}
                        <Space>
                          <Tag color="blue">{item.province}</Tag>
                          <Tag color={policyTypeColors[item.policy_type] || 'default'}>
                            {item.policy_type}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.source_name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.publish_date ? timeAgo(item.publish_date) : ''}
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
                showTotal={(total) => `共 ${total} 条政策`}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
