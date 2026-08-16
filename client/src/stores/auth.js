import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getProfile, logout as logoutApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  // 登录态由后端 httpOnly cookie 维护，前端以 user 是否存在判断
  const isAuthenticated = computed(() => !!user.value)

  // 登录（后端通过 httpOnly cookie 下发 token）
  async function login(username, password) {
    const res = await loginApi(username, password)
    user.value = res.data.user
    return res
  }

  // 获取用户信息（刷新页面后恢复登录态）
  async function fetchUser() {
    try {
      const res = await getProfile()
      user.value = res.data.user
      return res
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  // 登出（调用后端清除 cookie）
  async function logout() {
    try {
      await logoutApi()
    } catch (_error) {
      // 即使接口失败也清理本地状态
    } finally {
      clearAuth()
    }
  }

  // 仅清理本地状态（不发起请求，供 401 拦截器使用）
  function clearAuth() {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    login,
    fetchUser,
    logout,
    clearAuth,
  }
})
