import axios from 'axios'

// 简单判断：能访问后端API就用后端，否则用静态JSON
const client = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

export default client

/**
 * 通用请求：先尝试后端 API，失败则加载静态 JSON
 */
export async function safeGet<T>(apiPath: string, staticFile: string): Promise<T> {
  // 优先尝试后端 API
  try {
    const res = await client.get<T>(apiPath)
    if (res.data) return res.data
  } catch {
    // 后端不可用，降级到静态数据
  }

  // 加载静态 JSON
  try {
    const base = window.location.hostname.includes('github.io') ? '/pig-dashboard' : ''
    const resp = await fetch(`${base}/data/${staticFile}`)
    if (resp.ok) {
      const json = await resp.json()
      return json as T
    }
  } catch {
    console.warn(`静态数据加载失败: ${staticFile}`)
  }

  throw new Error(`无法加载数据: ${apiPath}`)
}
