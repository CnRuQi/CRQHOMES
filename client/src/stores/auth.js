import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  // 登录
  async function login(username, password) {
    const res = await loginApi(username, password)
    user.value = res.data.user
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
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    login,
    fetchUser,
    logout
  }
})
