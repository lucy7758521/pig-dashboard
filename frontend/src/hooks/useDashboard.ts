import { useQuery } from '@tanstack/react-query'
import { fetchDashboardOverview } from '../api/dashboard'

// Dashboard - 每分钟自动刷新
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardOverview,
    refetchInterval: 60 * 1000,           // 每60秒自动刷新
    refetchIntervalInBackground: true,    // 后台也刷新
    staleTime: 30 * 1000,
  })
}
