import client from './client'
import type { ApiResponse, NewsListData, NewsDetail } from '../types'

export async function fetchNewsList(page = 1, pageSize = 20, category?: string) {
  const params: Record<string, string | number> = { page, page_size: pageSize }
  if (category) params.category = category
  const res = await client.get<ApiResponse<NewsListData>>('/news', { params })
  return res.data.data
}

export async function fetchNewsDetail(id: number) {
  const res = await client.get<ApiResponse<NewsDetail>>(`/news/${id}`)
  return res.data.data
}

export async function fetchNewsCategories() {
  const res = await client.get<ApiResponse<string[]>>('/news/categories')
  return res.data.data
}
