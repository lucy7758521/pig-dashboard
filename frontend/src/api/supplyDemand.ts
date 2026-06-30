import { safeGet } from './client'

export async function fetchSupplyDemandOverview() {
  const res = await safeGet<any>('/api/v1/supply-demand/overview', 'supply-demand.json')
  return res.data || res
}
