import client from './client'
import type { ApiResponse, SupplyDemandOverview } from '../types'

export async function fetchSupplyDemandOverview() {
  const res = await client.get<ApiResponse<SupplyDemandOverview>>('/supply-demand/overview')
  return res.data.data
}
