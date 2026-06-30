import { useQuery } from '@tanstack/react-query'
import { fetchEnterpriseEvents, fetchEnterpriseStats } from '../api/enterprises'

const REFRESH_INTERVAL = 60 * 1000  // 每分钟刷新

export function useEnterpriseEvents(
  name?: string,
  eventType?: string,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: ['enterprises', 'list', name, eventType, page, pageSize],
    queryFn: () => fetchEnterpriseEvents(name, eventType, page, pageSize),
    staleTime: 30 * 1000,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  })
}

export function useEnterpriseStats(name: string) {
  return useQuery({
    queryKey: ['enterprises', 'stats', name],
    queryFn: () => fetchEnterpriseStats(name),
    enabled: !!name,
    staleTime: 30 * 1000,
    refetchInterval: REFRESH_INTERVAL,
  })
}
