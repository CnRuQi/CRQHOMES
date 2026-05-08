import api from './index'

// 登录
export function login(username, password) {
  return api.post('/auth/login', { username, password })
}

// 获取当前用户信息
export function getProfile() {
  return api.get('/auth/profile')
}

// 修改密码
export function changePassword(oldPassword, newPassword) {
  return api.put('/auth/password', { oldPassword, newPassword })
}

// 更新个人信息
export function updateProfile(data) {
  return api.put('/auth/profile', data)
}
