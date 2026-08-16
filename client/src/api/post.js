import api from './index'

// 获取文章列表（前台）
export function getPosts(params = {}) {
  return api.get('/posts', { params })
}

// 获取文章详情
export function getPost(id) {
  return api.get(`/posts/${id}`)
}

// 获取所有文章（后台）
export function getAllPosts(params = {}) {
  return api.get('/posts/admin', { params })
}

// 获取单篇文章（后台，含草稿）
export function getPostForAdmin(id) {
  return api.get(`/posts/admin/${id}`)
}

// 创建文章
export function createPost(data) {
  return api.post('/posts', data)
}

// 更新文章
export function updatePost(id, data) {
  return api.put(`/posts/${id}`, data)
}

// 删除文章
export function deletePost(id) {
  return api.delete(`/posts/${id}`)
}

// 切换置顶
export function toggleTop(id) {
  return api.put(`/posts/${id}/top`)
}

// 获取归档
export function getArchives() {
  return api.get('/posts/archives')
}

// 更新排序
export function updateSortOrder(posts) {
  return api.put('/posts/sort', { posts })
}

// 获取文章统计
export function getStats() {
  return api.get('/posts/stats')
}

// 搜索文章
export function searchPosts(params = {}) {
  return api.get('/posts/search', { params })
}
