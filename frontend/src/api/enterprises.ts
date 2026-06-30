import { apiGet } from './client'
import type { ApiResponse, EnterpriseListData, EnterpriseStats } from '../types'

export async function fetchEnterpriseEvents(name?: string, eventType?: string, page = 1, pageSize = 20) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (name) params.set('name', name)
  if (eventType) params.set('event_type', eventType)
  return apiGet<ApiResponse<EnterpriseListData>>(
    `/api/v1/enterprises?${params.toString()}`,
    'enterprises-list.json'
  ).then((res) => (res as ApiResponse<EnterpriseListData>).data)
}

export async function fetchEnterpriseStats(name: string) {
  return apiGet<ApiResponse<EnterpriseStats>>(
    `/api/v1/enterprises/${encodeURIComponent(name)}/stats`,
    'enterprises-list.json'
  ).then((res) => (res as ApiResponse<EnterpriseStats>).data)
}
