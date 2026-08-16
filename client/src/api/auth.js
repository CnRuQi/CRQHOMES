import api from './index'

// 登录
export function login(username, password) {
  return api.post('/auth/login', { username, password })
}

// 登出
export function logout() {
  return api.post('/auth/logout')
}

// 获取当前用户信息
export function getProfile() {
  return api.get('/auth/profile')
}
