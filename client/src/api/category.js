import api from './index'

// 获取所有分类
export function getCategories() {
  return api.get('/categories')
}

// 创建分类
export function createCategory(data) {
  return api.post('/categories', data)
}

// 更新分类
export function updateCategory(id, data) {
  return api.put(`/categories/${id}`, data)
}

// 删除分类
export function deleteCategory(id) {
  return api.delete(`/categories/${id}`)
}
