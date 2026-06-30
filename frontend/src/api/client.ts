import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器
client.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code !== 0) {
      console.error(`API Error: ${data.message}`)
      return Promise.reject(new Error(data.message || 'API Error'))
    }
    return response
  },
  (error) => {
    console.error('Network Error:', error.message)
    return Promise.reject(error)
  }
)

export default client
