import axios from 'axios'

// 检测运行环境
const isGitHubPages = window.location.hostname.includes('github.io')
const BASE = isGitHubPages ? '/pig-dashboard' : ''

const client = axios.create({
  baseURL: isGitHubPages ? '' : '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code !== 0 && data.code !== undefined) {
      return Promise.reject(new Error(data.message || 'API Error'))
    }
    return response
  },
  (error) => {
    console.warn('API 不可用:', error.message)
    return Promise.reject(error)
  }
)

/**
 * 通用 API 请求：GitHub Pages 上直接用静态 JSON，本地开发用后端 API
 */
export async function apiGet<T>(path: string, fallbackFile?: string): Promise<T> {
  // GitHub Pages: 直接加载静态 JSON（跳过 API 请求）
  if (isGitHubPages && fallbackFile) {
    const url = `${BASE}/data/${fallbackFile}`
    const res = await fetch(url)
    if (res.ok) {
      const json = await res.json()
      return json as T
    }
    throw new Error(`静态数据加载失败: ${url}`)
  }

  // 本地开发: 请求后端 API
  try {
    const res = await client.get<T>(path)
    return res.data
  } catch (err) {
    // 本地开发时如果后端挂了，也尝试静态数据
    if (fallbackFile) {
      const res = await fetch(`/data/${fallbackFile}`)
      if (res.ok) {
        const json = await res.json()
        return json as T
      }
    }
    throw err
  }
}

export { BASE, isGitHubPages }
export default client
