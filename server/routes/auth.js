const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const { login, getProfile, changePassword, updateProfile } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { authRules } = require('../middleware/validator')

// 登录速率限制：15分钟内最多5次尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// 密码修改速率限制：1小时内最多3次
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3,
  message: {
    code: 429,
    message: '密码修改次数过多，请1小时后再试'
  }
})

// POST /api/auth/login - 登录
router.post('/login', loginLimiter, authRules.login, login)

// GET /api/auth/profile - 获取当前用户信息
router.get('/profile', authenticate, getProfile)

// PUT /api/auth/password - 修改密码
router.put('/password', authenticate, passwordLimiter, authRules.changePassword, changePassword)

// PUT /api/auth/profile - 更新个人信息
router.put('/profile', authenticate, authRules.updateProfile, updateProfile)

module.exports = router
