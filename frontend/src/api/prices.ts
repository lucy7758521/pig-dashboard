import client from './client'
import type { ApiResponse, PriceItem, PriceStatistics, TrendData, MapDataPoint } from '../types'

export async function fetchCurrentPrices(category?: string, province?: string) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (province) params.set('province', province)
  const res = await client.get<ApiResponse<PriceItem[]>>(`/prices/current?${params}`)
  return res.data.data
}

export async function fetchPriceStatistics(category = '外三元') {
  const res = await client.get<ApiResponse<PriceStatistics>>('/prices/statistics', {
    params: { category },
  })
  return res.data.data
}

export async function fetchPriceHistory(category = '外三元', days = 30) {
  const res = await client.get<ApiResponse<TrendData>>('/prices/trend', {
    params: { category, days },
  })
  return res.data.data
}

export async function fetchMapData(category = '外三元') {
  const res = await client.get<ApiResponse<MapDataPoint[]>>('/prices/map', {
    params: { category },
  })
  return res.data.data
}
