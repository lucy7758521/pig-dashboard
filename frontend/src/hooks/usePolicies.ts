import { useQuery } from '@tanstack/react-query'
import { fetchPolicies, fetchPolicyProvinces } from '../api/policies'

const REFRESH_INTERVAL = 60 * 1000

export function usePolicies(
  page = 1,
  pageSize = 20,
  province?: string,
  policyType?: string
) {
  return useQuery({
    queryKey: ['policies', 'list', page, pageSize, province, policyType],
    queryFn: () => fetchPolicies(page, pageSize, province, policyType),
    staleTime: 30 * 1000,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  })
}

export function usePolicyProvinces() {
  return useQuery({
    queryKey: ['policies', 'provinces'],
    queryFn: () => fetchPolicyProvinces(),
    staleTime: 30 * 1000,
    refetchInterval: 10 * 60 * 1000,
  })
}
