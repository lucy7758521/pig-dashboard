import client from './client'
import type { ApiResponse, EnterpriseListData, EnterpriseStats } from '../types'

export async function fetchEnterpriseEvents(
  name?: string,
  eventType?: string,
  page = 1,
  pageSize = 20
) {
  const params: Record<string, string | number> = { page, page_size: pageSize }
  if (name) params.name = name
  if (eventType) params.event_type = eventType
  const res = await client.get<ApiResponse<EnterpriseListData>>('/enterprises', { params })
  return res.data.data
}

export async function fetchEnterpriseStats(name: string) {
  const res = await client.get<ApiResponse<EnterpriseStats>>(`/enterprises/${name}/stats`)
  return res.data.data
}
