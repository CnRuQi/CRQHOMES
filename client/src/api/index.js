import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

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
      if (status === 401) {
        // 用完整路径（含 query）作为 redirect，登录后回跳不丢失参数
        const currentPath = router.currentRoute.value.fullPath
        const isEditing = currentPath.includes('/admin/posts/') && currentPath.includes('/edit')
        const isCreating = currentPath === '/admin/posts/create'

        if (isEditing || isCreating) {
          // 在编辑页面，提示用户保存后再登录
          const shouldLogout = window.confirm(
            '登录已过期，是否跳转到登录页？（请确保已保存当前编辑的内容）'
          )
          if (!shouldLogout) {
            return Promise.reject({
              code: 401,
              message: '登录已过期，请保存内容后重新登录',
            })
          }
        }

        const authStore = useAuthStore()
        authStore.clearAuth()
        // 避免在登录页重复跳转；带 redirect 以便登录后回跳原页面
        if (currentPath !== '/admin/login') {
          router.push({ name: 'AdminLogin', query: { redirect: currentPath } })
        }
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
