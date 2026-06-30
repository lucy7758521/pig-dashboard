import client from './client'
import type { ApiResponse, DashboardOverview } from '../types'

export async function fetchDashboardOverview() {
  const res = await client.get<ApiResponse<DashboardOverview>>('/dashboard/overview')
  return res.data.data
}
