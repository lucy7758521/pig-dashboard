import { safeGet } from './client'

export async function fetchPolicies(page = 1, pageSize = 20, province?: string, policyType?: string) {
  const res = await safeGet<any>('/api/v1/policies', 'policies-list.json')
  return res.data || res
}

export async function fetchPolicyProvinces() {
  const res = await safeGet<any>('/api/v1/policies/provinces', 'policies-list.json')
  return res.data || []
}
