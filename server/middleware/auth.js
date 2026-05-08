const jwt = require('jsonwebtoken')
const config = require('../config')
const { getDb } = require('../db')
const { AppError } = require('./error')

// 验证 JWT Token
function authenticate(req, res, next) {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('未提供认证令牌', 401)
    }

    const token = authHeader.split(' ')[1]

    // 验证 token
    const decoded = jwt.verify(token, config.jwt.secret)

    // 查询用户是否存在
    const db = getDb()
    const user = db.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?').get(decoded.userId)

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

// 可选认证（不强制要求登录）
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, config.jwt.secret)

      const db = getDb()
      const user = db.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?').get(decoded.userId)

      if (user) {
        req.user = user
      }
    }
  } catch (error) {
    // 忽略认证错误，继续处理请求
  }
  next()
}

module.exports = {
  authenticate,
  optionalAuth
}
