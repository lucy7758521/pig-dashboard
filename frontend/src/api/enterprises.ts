import { safeGet } from './client'

export async function fetchEnterpriseEvents(name?: string, eventType?: string, page = 1, pageSize = 20) {
  const res = await safeGet<any>('/api/v1/enterprises', 'enterprises-list.json')
  return res.data || res
}

export async function fetchEnterpriseStats(name: string) {
  const res = await safeGet<any>(`/api/v1/enterprises/${name}/stats`, 'enterprises-list.json')
  return res.data || res
}
