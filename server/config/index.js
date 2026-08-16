const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const config = {
  // 服务配置
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  // Nginx 反代时设为 1，express-rate-limit 与浏览量防刷才能识别真实客户端 IP
  trustProxy: process.env.TRUST_PROXY === '1',

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
    path: process.env.DB_PATH
      ? path.resolve(process.env.DB_PATH)
      : path.resolve(__dirname, '..', '..', 'data', 'blog.db'),
  },

  // 上传配置
  upload: {
    dir: process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
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
