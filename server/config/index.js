const path = require('path')
const { URL } = require('url')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const DEFAULT_JWT_SECRET = 'your-super-secret-key-change-this-in-production'
const EXAMPLE_JWT_SECRET = 'REPLACE_WITH_RANDOM_64_HEX_CHARACTERS'
const PLACEHOLDER_JWT_SECRETS = ['change-me', 'replace-me', 'your-secret']

function parseTrustProxy(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw || raw === '0' || raw.toLowerCase() === 'false') return false
  if (raw === '1' || raw.toLowerCase() === 'true') return true

  const entries = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (entries.length === 1 && /^\d+$/.test(entries[0])) {
    return Number(entries[0])
  }

  return entries
}

function normalizeSiteUrl(value, env) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) {
    if (env === 'production') {
      throw new Error('生产环境必须设置 SITE_URL 环境变量')
    }
    return ''
  }

  let parsed
  try {
    parsed = new URL(raw)
  } catch (_error) {
    throw new Error('SITE_URL 必须是有效的绝对 URL')
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('SITE_URL 必须使用 http 或 https 协议且不能包含认证信息')
  }

  return parsed.toString().replace(/\/+$/, '')
}

function getJwtSecret(environment, env) {
  const secret = typeof environment.JWT_SECRET === 'string' ? environment.JWT_SECRET.trim() : ''

  if (!secret) {
    if (env === 'test') return 'test-only-jwt-secret'
    throw new Error('必须设置 JWT_SECRET 环境变量')
  }

  if (
    [DEFAULT_JWT_SECRET, EXAMPLE_JWT_SECRET, ...PLACEHOLDER_JWT_SECRETS].includes(secret) ||
    /^(your|replace|change)[-_ ]/i.test(secret)
  ) {
    throw new Error('JWT_SECRET 不能使用示例占位值')
  }

  if (env === 'production' && secret.length < 32) {
    throw new Error('生产环境 JWT_SECRET 长度必须不少于 32 个字符')
  }

  return secret
}

function createConfig(environment = process.env) {
  const env = String(environment.NODE_ENV || 'development')
    .trim()
    .toLowerCase()
  const jwtSecret = getJwtSecret(environment, env)

  return {
    // 服务配置
    env,
    port: parseInt(environment.PORT, 10) || 3000,
    // Nginx 反代时设为 1 信任所有代理（限流/防刷识别真实 IP）；
    // 也可配置具体代理 IP 列表（逗号分隔，如 127.0.0.1,10.0.0.1），仅信任这些代理，防 XFF 伪造
    trustProxy: parseTrustProxy(environment.TRUST_PROXY),

    // JWT 配置
    jwt: {
      secret: jwtSecret,
      expiresIn: '24h',
    },

    // 站点基础 URL（sitemap 生成使用；生产环境必须显式配置）
    siteUrl: normalizeSiteUrl(environment.SITE_URL, env),

    // 认证 Cookie 配置（httpOnly，防 XSS 窃取）
    cookie: {
      name: 'token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env === 'production',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24h，与 jwt expiresIn 保持一致
      },
    },

    // 数据库配置（无环境变量时基于 __dirname 解析，避免受启动目录影响）
    db: {
      // 环境变量路径基于 server 目录解析（与 .env.example 的 ../data/blog.db 语义一致），
      // 避免受启动目录影响在仓库外建出第二个数据库
      path: environment.DB_PATH
        ? path.resolve(__dirname, '..', environment.DB_PATH)
        : path.resolve(__dirname, '..', '..', 'data', 'blog.db'),
    },

    // 上传配置
    upload: {
      dir: environment.UPLOAD_DIR
        ? path.resolve(__dirname, '..', environment.UPLOAD_DIR)
        : path.resolve(__dirname, '..', 'uploads'),
      maxSize: parseInt(environment.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },

    // CORS 配置
    cors: {
      origin: environment.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  }
}

const config = createConfig()

module.exports = { ...config, createConfig }
