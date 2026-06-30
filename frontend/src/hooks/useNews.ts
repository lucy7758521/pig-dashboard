import { useQuery } from '@tanstack/react-query'
import { fetchNewsList, fetchNewsDetail, fetchNewsCategories } from '../api/news'

const REFRESH_INTERVAL = 60 * 1000  // 每分钟刷新

export function useNewsList(page = 1, pageSize = 20, category?: string) {
  return useQuery({
    queryKey: ['news', 'list', page, pageSize, category],
    queryFn: () => fetchNewsList(page, pageSize, category),
    staleTime: 30 * 1000,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  })
}

export function useNewsDetail(id: number) {
  return useQuery({
    queryKey: ['news', 'detail', id],
    queryFn: () => fetchNewsDetail(id),
    enabled: id > 0,
  })
}

export function useNewsCategories() {
  return useQuery({
    queryKey: ['news', 'categories'],
    queryFn: fetchNewsCategories,
    staleTime: 600000,
    refetchInterval: 10 * 60 * 1000,    // 分类变化少，10分钟刷新
  })
}
