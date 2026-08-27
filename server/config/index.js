const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const config = {
  // 服务配置
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  // Nginx 反代时设为 1 信任所有代理（限流/防刷识别真实 IP）；
  // 也可配置具体代理 IP 列表（逗号分隔，如 127.0.0.1,10.0.0.1），仅信任这些代理，防 XFF 伪造
  trustProxy:
    process.env.TRUST_PROXY === '1'
      ? true
      : process.env.TRUST_PROXY
        ? process.env.TRUST_PROXY.split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : false,

  // JWT 配置
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      (() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('生产环境必须设置 JWT_SECRET 环境变量')
        }
        console.warn('⚠️ 警告: 使用默认 JWT_SECRET，请在生产环境设置环境变量')
        return 'dev-secret-key-only-for-development'
      })(),
    expiresIn: '24h',
  },

  // 站点基础 URL（sitemap 生成使用；建议生产显式配置，避免依赖请求 Host 头）
  siteUrl: process.env.SITE_URL || '',

  // 认证 Cookie 配置（httpOnly，防 XSS 窃取）
  cookie: {
    name: 'token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24h，与 jwt expiresIn 保持一致
    },
  },

  // 数据库配置（无环境变量时基于 __dirname 解析，避免受启动目录影响）
  db: {
    // 环境变量路径基于 server 目录解析（与 .env.example 的 ../data/blog.db 语义一致），
    // 避免受启动目录影响在仓库外建出第二个数据库
    path: process.env.DB_PATH
      ? path.resolve(__dirname, '..', process.env.DB_PATH)
      : path.resolve(__dirname, '..', '..', 'data', 'blog.db'),
  },

  // 上传配置
  upload: {
    dir: process.env.UPLOAD_DIR
      ? path.resolve(__dirname, '..', process.env.UPLOAD_DIR)
      : path.resolve(__dirname, '..', 'uploads'),
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
}

// 生产环境强制校验 JWT 密钥强度，防止弱密钥被暴力猜测
if (config.env === 'production' && config.jwt.secret.length < 32) {
  throw new Error('生产环境 JWT_SECRET 长度必须不少于 32 个字符')
}

module.exports = config
