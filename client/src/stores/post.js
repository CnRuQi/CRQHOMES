import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPosts, getPost, getAllPosts } from '@/api/post'
import { getCategories } from '@/api/category'

export const usePostStore = defineStore('post', () => {
  const posts = ref([])
  const currentPost = ref(null)
  const categories = ref([])
  const pagination = ref({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const loading = ref(false)

  // 获取文章列表
  async function fetchPosts(params = {}) {
    loading.value = true
    try {
      const res = await getPosts(params)
      posts.value = res.data.list
      pagination.value = res.data.pagination
      return res
    } finally {
      loading.value = false
    }
  }

  // 获取文章详情
  async function fetchPost(slugOrId) {
    loading.value = true
    try {
      const res = await getPost(slugOrId)
      currentPost.value = res.data.post
      return res
    } finally {
      loading.value = false
    }
  }

  // 获取后台文章列表
  async function fetchAllPosts(params = {}) {
    loading.value = true
    try {
      const res = await getAllPosts(params)
      posts.value = res.data.list
      pagination.value = res.data.pagination
      return res
    } finally {
      loading.value = false
    }
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
    currentPost,
    categories,
    pagination,
    loading,
    fetchPosts,
    fetchPost,
    fetchAllPosts,
    fetchCategories,
  }
})
