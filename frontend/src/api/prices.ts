import { apiGet } from './client'
import type { ApiResponse, PriceItem, PriceStatistics, TrendData } from '../types'

export async function fetchCurrentPrices(category?: string, province?: string) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (province) params.set('province', province)
  const qs = params.toString()
  return apiGet<ApiResponse<PriceItem[]>>(
    `/api/v1/prices/current${qs ? '?' + qs : ''}`,
    'prices-current.json'
  ).then((res) => {
    const apiRes = res as ApiResponse<PriceItem[]>
    // 静态 JSON 是 {code, data} 格式，本地 API 也是
    if (apiRes.data) return apiRes.data
    // 兼容：如果直接是数组（旧格式）
    return res as unknown as PriceItem[]
  })
}

export async function fetchPriceStatistics(category = '外三元') {
  return apiGet<ApiResponse<PriceStatistics>>(
    `/api/v1/prices/statistics?category=${encodeURIComponent(category)}`,
    'prices-statistics.json'
  ).then((res) => {
    const apiRes = res as ApiResponse<PriceStatistics>
    return apiRes.data || (res as unknown as PriceStatistics)
  })
}

export async function fetchPriceHistory(category = '外三元', days = 30): Promise<TrendData> {
  const file = days <= 30 ? 'prices-history-30.json' : 'prices-history-90.json'
  return apiGet<ApiResponse<{ record_date: string; category: string; avg_price: number }[]>>(
    `/api/v1/prices/history?category=${encodeURIComponent(category)}&days=${days}`,
    file
  ).then((res) => {
    const apiRes = res as ApiResponse<{ record_date: string; category: string; avg_price: number }[]>
    const data = apiRes.data || (res as unknown as { record_date: string; category: string; avg_price: number }[])
    const points = Array.isArray(data) ? data.map((p) => ({
      date: p.record_date,
      price: p.avg_price,
    })) : []
    return { category, points }
  })
}

export async function fetchMapData(category = '外三元') {
  const data = await fetchCurrentPrices(category)
  return data.map((p) => ({ name: p.province, value: p.price_kg, change: p.change || 0 }))
}
