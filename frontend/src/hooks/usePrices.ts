import { useQuery } from '@tanstack/react-query'
import { fetchCurrentPrices, fetchPriceStatistics, fetchPriceHistory, fetchMapData } from '../api/prices'

// 每60秒自动刷新（数据实时性）
const REFRESH_INTERVAL = 60 * 1000

export function useCurrentPrices(category?: string, province?: string) {
  return useQuery({
    queryKey: ['prices', 'current', category, province],
    queryFn: () => fetchCurrentPrices(category, province),
    staleTime: 30 * 1000,         // 30秒内不重新请求
    refetchInterval: REFRESH_INTERVAL,  // 每分钟自动刷新
    refetchIntervalInBackground: true,
  })
}

export function usePriceStatistics(category = '外三元') {
  return useQuery({
    queryKey: ['prices', 'statistics', category],
    queryFn: () => fetchPriceStatistics(category),
    staleTime: 30 * 1000,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  })
}

export function usePriceHistory(category = '外三元', days = 30) {
  return useQuery({
    queryKey: ['prices', 'history', category, days],
    queryFn: () => fetchPriceHistory(category, days),
    staleTime: 5 * 60 * 1000,     // 历史数据5分钟刷新
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  })
}

export function useMapData(category = '外三元') {
  return useQuery({
    queryKey: ['prices', 'map', category],
    queryFn: () => fetchMapData(category),
    staleTime: 30 * 1000,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  })
}
