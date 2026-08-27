import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 401 处理去重锁：编辑页多个并行请求同时 401 时只弹一次确认、跳转一次
let handling401 = false

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

      // 401 未授权 - 检查是否在编辑页面
      if (status === 401 && !handling401) {
        handling401 = true
        // 用完整路径（含 query）作为 redirect，登录后回跳不丢失参数
        const currentPath = router.currentRoute.value.fullPath
        const isEditing = currentPath.includes('/admin/posts/') && currentPath.includes('/edit')
        const isCreating = currentPath === '/admin/posts/create'

        if (isEditing || isCreating) {
          // 在编辑页面：明确告知未保存内容会丢失（过期状态下也无法保存）
          const shouldLogout = window.confirm('登录已过期，请重新登录（未保存的编辑内容将丢失）')
          if (!shouldLogout) {
            setTimeout(() => {
              handling401 = false
            }, 1500)
            return Promise.reject({
              code: 401,
              message: '登录已过期，请重新登录',
            })
          }
        }

        const authStore = useAuthStore()
        authStore.clearAuth()
        // 避免在登录页重复跳转；带 redirect 以便登录后回跳原页面
        if (currentPath !== '/admin/login') {
          router.push({ name: 'AdminLogin', query: { redirect: currentPath } })
        }
        // 短暂加锁，吸收同一时刻并发的多个 401
        setTimeout(() => {
          handling401 = false
        }, 1500)
      }

      // 返回错误信息
      return Promise.reject({
        code: status,
        message: data?.message || '请求失败',
      })
    }

    // 网络错误
    return Promise.reject({
      code: 0,
      message: '网络连接失败',
    })
  }
)

export default api
