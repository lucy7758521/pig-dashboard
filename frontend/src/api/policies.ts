import { apiGet } from './client'
import type { ApiResponse, PolicyListData } from '../types'

export async function fetchPolicies(page = 1, pageSize = 20, province?: string, policyType?: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (province) params.set('province', province)
  if (policyType) params.set('policy_type', policyType)
  return apiGet<ApiResponse<PolicyListData>>(
    `/api/v1/policies?${params.toString()}`,
    'policies-list.json'
  ).then((res) => (res as ApiResponse<PolicyListData>).data)
}

export async function fetchPolicyProvinces() {
  return apiGet<ApiResponse<string[]>>('/api/v1/policies/provinces').then((res) => (res as ApiResponse<string[]>).data)
}
