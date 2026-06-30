import { useState } from 'react'
import { Card, List, Tag, Typography, Space, Select, Pagination, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNewsList, useNewsCategories } from '../../hooks/useNews'
import { timeAgo } from '../../utils/format'
import type { NewsItem } from '../../types'

const { Title, Text, Paragraph } = Typography

const categoryColorMap: Record<string, string> = {
  '政策': 'red',
  '市场分析': 'blue',
  '价格预测': 'orange',
  '行业动态': 'green',
}

export default function NewsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useNewsList(page, 20, category)
  const { data: categories } = useNewsCategories()

  const filteredItems = data?.items?.filter((item: any) =>
      !search ||
      item.title.includes(search) ||
      item.summary?.includes(search)
  ) || []

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        生猪行业新闻资讯
      </Title>

      {/* 筛选栏 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
      >
        <Space wrap>
          <Select
            placeholder="新闻分类"
            allowClear
            style={{ width: 150 }}
            value={category}
            onChange={(val) => {
              setCategory(val)
              setPage(1)
            }}
            options={((categories as string[]) || ['政策', '市场分析', '价格预测', '行业动态']).map((c) => ({
              value: c,
              label: c,
            }))}
          />
          <Input
            placeholder="搜索新闻标题..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Space>
      </Card>

      {/* 新闻列表 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <List
          loading={isLoading}
          dataSource={filteredItems}
          renderItem={(item: NewsItem) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '16px 0' }}
              onClick={() => navigate(`/news/${item.id}`)}
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
                      {item.summary}
                    </Paragraph>
                    <Space>
                      <Tag color={categoryColorMap[item.category] || 'default'}>
                        {item.category}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.source_name}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {timeAgo(item.publish_date)}
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
            showTotal={(total) => `共 ${total} 条新闻`}
            showSizeChanger={false}
          />
        </div>
      </Card>
    </div>
  )
}
