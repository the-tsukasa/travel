import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',  // 通过 Vite proxy 转发到 http://localhost:8080/api
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      // 可以在这里触发跳转到登录页
      if (window.location.pathname !== '/login' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
