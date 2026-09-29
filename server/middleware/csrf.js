const cookie = require('cookie')
const { URL } = require('url')
const config = require('../config')
const { AppError } = require('./error')

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getOrigin(value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.origin
  } catch (_error) {
    return ''
  }
}

function csrfProtection(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) return next()

  const headers = req.headers || {}
  const cookies = cookie.parse(headers.cookie || '')
  const hasCookieToken = Boolean(cookies[config.cookie.name])
  const hasBearerToken = String(headers.authorization || '').startsWith('Bearer ')
  const path = (req.originalUrl || req.path || '').split('?')[0]
  const isLoginOrLogout = /^\/api\/auth\/(login|logout)\/?$/.test(path)

  if (hasBearerToken && !hasCookieToken) return next()
  if (!hasCookieToken && !isLoginOrLogout) return next()

  const source = headers.origin || headers.referer
  if (source) {
    if (config.csrf.allowedOrigins.includes(getOrigin(source))) return next()
    return next(new AppError('请求来源不受信任', 403))
  }

  if (headers['sec-fetch-site'] === 'same-origin') return next()
  next(new AppError('缺少有效的请求来源', 403))
}

module.exports = { csrfProtection }
