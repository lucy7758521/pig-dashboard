import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Tag, Space, Button, Spin, Divider } from 'antd'
import { ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons'
import { useNewsDetail } from '../../hooks/useNews'
import { formatFullDate } from '../../utils/format'

const { Title, Paragraph, Text } = Typography

const categoryColorMap: Record<string, string> = {
  '政策': 'red',
  '市场分析': 'blue',
  '价格预测': 'orange',
  '行业动态': 'green',
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useNewsDetail(Number(id))

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <Title level={4}>新闻不存在</Title>
        <Button onClick={() => navigate('/news')}>返回列表</Button>
      </Card>
    )
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/news')}
        style={{ marginBottom: 16 }}
      >
        返回新闻列表
      </Button>

      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Title level={3} style={{ marginBottom: 12 }}>
          {data.title}
        </Title>

        <Space style={{ marginBottom: 16 }}>
          <Tag color={categoryColorMap[data.category] || 'default'}>
            {data.category}
          </Tag>
          <Text type="secondary">{data.source_name}</Text>
          <Text type="secondary">
            {data.publish_date ? formatFullDate(data.publish_date) : ''}
          </Text>
          {data.source_url && !data.source_url.startsWith('mock') && (
            <a href={data.source_url} target="_blank" rel="noopener noreferrer">
              <LinkOutlined /> 原文链接
            </a>
          )}
        </Space>

        <Divider />

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#333' }}>
          <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>
            {data.content || data.summary}
          </Paragraph>
        </div>

        <Divider />

        <Text type="secondary" style={{ fontSize: 12 }}>
          声明：以上内容为行业资讯聚合，仅供参考，不构成投资建议。
        </Text>
      </Card>
    </div>
  )
}
