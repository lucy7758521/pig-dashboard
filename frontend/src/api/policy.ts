import client from './client'
import type { ApiResponse, PolicyListData, PolicyDetail } from '../types'

export async function fetchPolicyList(
  page = 1, pageSize = 20, province?: string, policyType?: string
) {
  const params: Record<string, string | number> = { page, page_size: pageSize }
  if (province) params.province = province
  if (policyType) params.policy_type = policyType
  const res = await client.get<ApiResponse<PolicyListData>>('/policies', { params })
  return res.data.data
}

export async function fetchPolicyDetail(id: number) {
  const res = await client.get<ApiResponse<PolicyDetail>>(`/policies/${id}`)
  return res.data.data
}

export async function fetchPolicyProvinces() {
  const res = await client.get<ApiResponse<string[]>>('/policies/provinces')
  return res.data.data
}
