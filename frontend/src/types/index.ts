/** 价格数据项 */
export interface PriceItem {
  province: string
  category: string
  price_kg: number
  price_yuan: number
  rank: number
  record_date: string
  source: string
  source_display?: string
  change?: number | null
}

/** 价格统计 */
export interface PriceStatistics {
  category: string
  avg_price: number
  max_price: number
  min_price: number
  max_province: string
  min_province: string
  update_time: string
}

/** 趋势数据点 */
export interface TrendPoint {
  date: string
  price: number
}

/** 趋势数据 */
export interface TrendData {
  category: string
  points: TrendPoint[]
}

/** 地图数据点 */
export interface MapDataPoint {
  name: string
  value: number
}

/** 新闻项 */
export interface NewsItem {
  id: number
  title: string
  summary: string
  source_name: string
  source_url: string
  category: string
  publish_date: string
}

/** 新闻详情 */
export interface NewsDetail extends NewsItem {
  content: string
}

/** 新闻列表 */
export interface NewsListData {
  items: NewsItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** 企业动态项 */
export interface EnterpriseEvent {
  id: number
  enterprise_name: string
  stock_code: string
  event_type: string
  title: string
  content: string
  source_url: string
  event_date: string
  data_json: Record<string, unknown> | null
}

/** 企业动态列表 */
export interface EnterpriseListData {
  items: EnterpriseEvent[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** 企业统计 */
export interface EnterpriseStats {
  enterprise_name: string
  total_events: number
  event_types: Record<string, number>
  latest_events: EnterpriseEvent[]
}

/** Dashboard 概览卡片 */
export interface SummaryCards {
  avg_price: { value: number; unit: string; category: string; change?: number }
  highest_province: { name: string; price: number }
  lowest_province: { name: string; price: number }
  corn_price: { value: number; unit: string; update_date?: string }
  soybean_price: { value: number; unit: string; update_date?: string }
  update_time: string
}

/** Dashboard 概览数据 */
export interface DashboardOverview {
  summary_cards: SummaryCards
  map_data: MapDataPoint[]
  trend_data: TrendData
  latest_news: NewsItem[]
  enterprise_updates: EnterpriseEvent[]
}

/** API 响应通用格式 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta?: Record<string, unknown>
}

/** 政策动态项 */
export interface PolicyItem {
  id: number
  province: string
  title: string
  content: string
  source_name: string
  source_url: string
  policy_type: string
  publish_date: string
}

/** 政策详情 */
export interface PolicyDetail extends PolicyItem {}

/** 政策列表 */
export interface PolicyListData {
  items: PolicyItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** 供需看板 */
export interface TrendSeries {
  date: string
  value: number
}

export interface SupplyDemandOverview {
  update_time: string
  supply_index?: {
    value: number; change: number; trend: TrendSeries[]; unit: string
  }
  breeding_cost?: {
    value: number; trend: TrendSeries[]; unit: string
  }
  pig_grain_ratio?: {
    value: number; status: string; status_color: string; trend: TrendSeries[]; unit: string
  }
  price_index?: {
    value: number; presale_avg: number; deal_avg: number; deal_weight: number
    trend: TrendSeries[]; unit: string
  }
  feed_trend?: {
    corn: TrendSeries[]; soybean: TrendSeries[]; feed: TrendSeries[]
  }
}
