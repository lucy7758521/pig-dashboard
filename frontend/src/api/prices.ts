import { safeGet } from './client'

export async function fetchCurrentPrices(category?: string, province?: string) {
  const res = await safeGet<any>('/api/v1/prices/current', 'prices-current.json')
  let data = res.data || res
  if (!Array.isArray(data)) data = []
  if (category) data = data.filter((p: any) => p.category === category)
  if (province) data = data.filter((p: any) => p.province === province)
  return data
}

export async function fetchPriceStatistics(category = '外三元') {
  const res = await safeGet<any>('/api/v1/prices/statistics', 'prices-statistics.json')
  return res.data || res
}

export async function fetchPriceHistory(category = '外三元', days = 30) {
  const file = days <= 30 ? 'prices-history-30.json' : 'prices-history-90.json'
  const res = await safeGet<any>(`/api/v1/prices/history?category=${category}&days=${days}`, file)
  const raw = res.data || res
  const points = Array.isArray(raw)
    ? raw.map((p: any) => ({ date: p.record_date, price: p.avg_price }))
    : []
  return { category, points }
}

export async function fetchMapData(category = '外三元') {
  const data = await fetchCurrentPrices(category)
  return data.map((p: any) => ({ name: p.province, value: p.price_kg, change: p.change || 0 }))
}
