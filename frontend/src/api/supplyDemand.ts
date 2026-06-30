import { apiGet } from './client'
import type { ApiResponse, SupplyDemandOverview } from '../types'

export async function fetchSupplyDemandOverview() {
  return apiGet<ApiResponse<SupplyDemandOverview>>(
    '/api/v1/supply-demand/overview',
    'supply-demand.json'
  ).then((res) => (res as ApiResponse<SupplyDemandOverview>).data)
}
