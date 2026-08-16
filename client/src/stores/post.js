import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPosts, getPost } from '@/api/post'
import { getCategories } from '@/api/category'

export const usePostStore = defineStore('post', () => {
  const posts = ref([])
  const categories = ref([])
  const pagination = ref({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })

  // 获取文章列表
  async function fetchPosts(params = {}) {
    const res = await getPosts(params)
    posts.value = res.data.list
    pagination.value = res.data.pagination
    return res
  }

  // 获取文章详情
  async function fetchPost(slugOrId) {
    const res = await getPost(slugOrId)
    return res
  }

  // 获取分类列表
  async function fetchCategories() {
    try {
      const res = await getCategories()
      categories.value = res.data.categories
      return res
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  return {
    posts,
    categories,
    pagination,
    fetchPosts,
    fetchPost,
    fetchCategories,
  }
})
