import { useQuery } from '@tanstack/react-query'
import { fetchPolicyList, fetchPolicyDetail, fetchPolicyProvinces } from '../api/policy'

export function usePolicyList(
  page = 1, pageSize = 20, province?: string, policyType?: string
) {
  return useQuery({
    queryKey: ['policies', 'list', page, pageSize, province, policyType],
    queryFn: () => fetchPolicyList(page, pageSize, province, policyType),
    staleTime: 300000,
  })
}

export function usePolicyDetail(id: number) {
  return useQuery({
    queryKey: ['policies', 'detail', id],
    queryFn: () => fetchPolicyDetail(id),
    enabled: !!id,
  })
}

export function usePolicyProvinces() {
  return useQuery({
    queryKey: ['policies', 'provinces'],
    queryFn: fetchPolicyProvinces,
    staleTime: 600000,
  })
}
