const express = require('express')
const router = express.Router()
const { login, getProfile, changePassword, updateProfile } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

// POST /api/auth/login - 登录
router.post('/login', login)

// GET /api/auth/profile - 获取当前用户信息
router.get('/profile', authenticate, getProfile)

// PUT /api/auth/password - 修改密码
router.put('/password', authenticate, changePassword)

// PUT /api/auth/profile - 更新个人信息
router.put('/profile', authenticate, updateProfile)

module.exports = router
