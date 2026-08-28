const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const {
  login,
  logout,
  getProfile,
  changePassword,
  updateProfile,
} = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { authRules } = require('../middleware/validator')

// 登录速率限制：15分钟内最多5次尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  limit: 5, // 最多5次
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// 账号维度登录限制：同一用户名 15 分钟内失败 5 次后锁定
// IP 维度限流可被伪造 X-Forwarded-For 绕过（反代追加模式下 req.ip 取客户端可伪造的最左值），
// 这是唯一不依赖代理配置正确性的防爆破层。代价是恶意输错密码可把该账号锁 15 分钟（DoS 烦扰），
// 换来单账号无法被 IP 轮换爆破，单人博客下是正确取舍
const loginUsernameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  limit: 5,
  keyGenerator: (req) => String(req.body?.username || '').trim().toLowerCase(),
  // 只统计失败尝试，正常登录不消耗次数
  skipSuccessfulRequests: true,
  message: {
    code: 429,
    message: '该账号登录尝试次数过多，请15分钟后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// 密码修改速率限制：1小时内最多3次
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  limit: 3,
  message: {
    code: 429,
    message: '密码修改次数过多，请1小时后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /api/auth/login - 登录（IP 维度 + 账号维度双重限流，先过验证器保证 username 合法）
router.post('/login', loginLimiter, authRules.login, loginUsernameLimiter, login)

// POST /api/auth/logout - 登出（清除 cookie，无需认证）
router.post('/logout', logout)

// GET /api/auth/profile - 获取当前用户信息
router.get('/profile', authenticate, getProfile)

// PUT /api/auth/password - 修改密码
router.put('/password', authenticate, passwordLimiter, authRules.changePassword, changePassword)

// PUT /api/auth/profile - 更新个人信息
router.put('/profile', authenticate, authRules.updateProfile, updateProfile)

module.exports = router
