import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const isAuthenticated = computed(() => !!token.value)

  // 登录
  async function login(username, password) {
    const res = await loginApi(username, password)
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
    return res
  }

  // 获取用户信息
  async function fetchUser() {
    try {
      const res = await getProfile()
      user.value = res.data.user
      return res
    } catch (error) {
      logout()
      throw error
    }
  }

  // 登出
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    fetchUser,
    logout,
  }
})
