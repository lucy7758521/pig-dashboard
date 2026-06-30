import { apiGet } from './client'
import type { ApiResponse, DashboardOverview } from '../types'

export async function fetchDashboardOverview() {
  return apiGet<ApiResponse<DashboardOverview>>(
    '/api/v1/dashboard/overview',
    'dashboard.json'
  ).then((res) => (res as ApiResponse<DashboardOverview>).data)
}
