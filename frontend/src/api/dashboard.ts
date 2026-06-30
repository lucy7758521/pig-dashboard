import { safeGet } from './client'

export async function fetchDashboardOverview() {
  const res = await safeGet<any>('/api/v1/dashboard/overview', 'dashboard.json')
  return res.data || res
}
