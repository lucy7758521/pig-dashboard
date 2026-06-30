import { apiGet } from './client'
import type { ApiResponse, NewsListData, NewsDetail } from '../types'

export async function fetchNewsList(page = 1, pageSize = 20, category?: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (category) params.set('category', category)
  return apiGet<ApiResponse<NewsListData>>(
    `/api/v1/news?${params.toString()}`,
    'news-list.json'
  ).then((res) => (res as ApiResponse<NewsListData>).data)
}

export async function fetchNewsDetail(id: number) {
  return apiGet<ApiResponse<NewsDetail>>(`/api/v1/news/${id}`).then((res) => (res as ApiResponse<NewsDetail>).data)
}

export async function fetchNewsCategories() {
  return apiGet<ApiResponse<string[]>>('/api/v1/news/categories').then((res) => (res as ApiResponse<string[]>).data)
}
