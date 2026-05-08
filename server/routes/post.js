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
  getArchives
} = require('../controllers/postController')
const { authenticate } = require('../middleware/auth')

// GET /api/posts - 获取文章列表（前台）
router.get('/', getPosts)

// GET /api/posts/archives - 获取归档
router.get('/archives', getArchives)

// GET /api/posts/admin - 获取所有文章（后台管理）
router.get('/admin', authenticate, getAllPosts)

// GET /api/posts/:id - 获取文章详情
router.get('/:id', getPost)

// POST /api/posts - 创建文章
router.post('/', authenticate, createPost)

// PUT /api/posts/:id - 更新文章
router.put('/:id', authenticate, updatePost)

// DELETE /api/posts/:id - 删除文章
router.delete('/:id', authenticate, deletePost)

// PUT /api/posts/:id/top - 切换置顶
router.put('/:id/top', authenticate, toggleTop)

module.exports = router
