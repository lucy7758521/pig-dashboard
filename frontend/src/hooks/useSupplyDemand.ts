import { useQuery } from '@tanstack/react-query'
import { fetchSupplyDemandOverview } from '../api/supplyDemand'

export function useSupplyDemand() {
  return useQuery({
    queryKey: ['supply-demand'],
    queryFn: fetchSupplyDemandOverview,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    staleTime: 30 * 1000,
  })
}
