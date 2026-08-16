const jwt = require('jsonwebtoken')
const cookie = require('cookie')
const config = require('../config')
const { getDb } = require('../db')
const { AppError } = require('./error')

// 从请求中提取 token（优先 httpOnly cookie，其次 Authorization header）
function extractToken(req) {
  const cookies = cookie.parse(req.headers.cookie || '')
  if (cookies[config.cookie.name]) {
    return cookies[config.cookie.name]
  }

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }

  return null
}

// 验证 JWT Token
function authenticate(req, res, next) {
  try {
    const token = extractToken(req)
    if (!token) {
      throw new AppError('未提供认证令牌', 401)
    }

    // 验证 token
    const decoded = jwt.verify(token, config.jwt.secret)

    // 查询用户是否存在
    const db = getDb()
    const user = db
      .prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?')
      .get(decoded.userId)

    if (!user) {
      throw new AppError('用户不存在', 401)
    }

    // 将用户信息挂载到请求对象
    req.user = user
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError('无效的认证令牌', 401))
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('认证令牌已过期', 401))
    } else {
      next(error)
    }
  }
}

module.exports = {
  authenticate,
}
