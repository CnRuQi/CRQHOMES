const express = require('express')
const router = express.Router()
const {
  getPosts,
  getPost,
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  toggleTop,
  getArchives,
  updateSortOrder,
  getStats,
  searchPosts
} = require('../controllers/postController')
const { authenticate } = require('../middleware/auth')
const { postRules } = require('../middleware/validator')

// GET /api/posts/stats - 获取文章统计（后台）
router.get('/stats', authenticate, getStats)

// GET /api/posts/search - 搜索文章
router.get('/search', searchPosts)

// GET /api/posts - 获取文章列表（前台）
router.get('/', postRules.list, getPosts)

// GET /api/posts/archives - 获取归档
router.get('/archives', getArchives)

// GET /api/posts/admin - 获取所有文章（后台管理）
router.get('/admin', authenticate, postRules.list, getAllPosts)

// PUT /api/posts/sort - 更新排序
router.put('/sort', authenticate, postRules.sortOrder, updateSortOrder)

// GET /api/posts/:id - 获取文章详情
router.get('/:id', postRules.getById, getPost)

// POST /api/posts - 创建文章
router.post('/', authenticate, postRules.create, createPost)

// PUT /api/posts/:id - 更新文章
router.put('/:id', authenticate, postRules.update, updatePost)

// DELETE /api/posts/:id - 删除文章
router.delete('/:id', authenticate, postRules.getById, deletePost)

// PUT /api/posts/:id/top - 切换置顶
router.put('/:id/top', authenticate, postRules.getById, toggleTop)

module.exports = router
