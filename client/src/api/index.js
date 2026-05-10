import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const { response } = error

    if (response) {
      const { status, data } = response

      // 401 未授权
      if (status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/admin/login')
      }

      // 返回错误信息
      return Promise.reject({
        code: status,
        message: data?.message || '请求失败'
      })
    }

    // 网络错误
    return Promise.reject({
      code: 0,
      message: '网络连接失败'
    })
  }
)

export default api
