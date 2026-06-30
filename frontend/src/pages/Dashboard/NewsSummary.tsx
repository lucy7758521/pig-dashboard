import { Card, List, Tag, Typography } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { NewsItem } from '../../types'
import { timeAgo } from '../../utils/format'

const { Text, Paragraph } = Typography

interface Props {
  data: NewsItem[] | undefined
  loading: boolean
}

export default function NewsSummary({ data, loading }: Props) {
  const navigate = useNavigate()

  const categoryColorMap: Record<string, string> = {
    '政策': 'red',
    '市场分析': 'blue',
    '价格预测': 'orange',
    '行业动态': 'green',
  }

  return (
    <Card
      title={
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          最新行业新闻
        </span>
      }
      extra={
        <a onClick={() => navigate('/news')} style={{ fontSize: 13 }}>
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
        renderItem={(item: NewsItem) => (
          <List.Item
            style={{ cursor: 'pointer', padding: '12px 8px' }}
            onClick={() => navigate(`/news/${item.id}`)}
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
                    {item.summary}
                  </Paragraph>
                  <div style={{ marginTop: 6 }}>
                    <Tag
                      color={categoryColorMap[item.category] || 'default'}
                      style={{ fontSize: 11 }}
                    >
                      {item.category}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.source_name} · {timeAgo(item.publish_date)}
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
