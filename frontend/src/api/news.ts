import { safeGet } from './client'

export async function fetchNewsList(page = 1, pageSize = 20, category?: string) {
  const res = await safeGet<any>('/api/v1/news', 'news-list.json')
  return res.data || res
}

export async function fetchNewsDetail(id: number) {
  const res = await safeGet<any>(`/api/v1/news/${id}`, 'news-list.json')
  return res.data || res
}

export async function fetchNewsCategories() {
  const res = await safeGet<any>('/api/v1/news/categories', 'news-list.json')
  return res.data || []
}
