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
    // 固定 HS256 算法，防算法混淆攻击
    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] })

    // 查询用户是否存在
    const db = getDb()
    const user = db
      .prepare('SELECT id, username, nickname, avatar, token_version FROM users WHERE id = ?')
      .get(decoded.userId)

    if (!user) {
      throw new AppError('用户不存在', 401)
    }

    // 改密后 token_version 会递增，token 里签发时的 tv 落后即视为失效。
    // 旧 token 没有 tv 字段时按 0 处理，因此加这个字段不会强制已登录用户重新登录
    const { token_version: tokenVersion, ...safeUser } = user
    if (Number(decoded.tv ?? 0) !== Number(tokenVersion ?? 0)) {
      throw new AppError('认证令牌已失效，请重新登录', 401)
    }

    // 挂载用户信息（剔除 token_version，它只是内部校验字段，无需暴露给上层）
    req.user = safeUser
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
