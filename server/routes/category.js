const express = require('express')
const router = express.Router()
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController')
const { authenticate } = require('../middleware/auth')

// GET /api/categories - 获取所有分类
router.get('/', getCategories)

// POST /api/categories - 创建分类
router.post('/', authenticate, createCategory)

// PUT /api/categories/:id - 更新分类
router.put('/:id', authenticate, updateCategory)

// DELETE /api/categories/:id - 删除分类
router.delete('/:id', authenticate, deleteCategory)

module.exports = router
