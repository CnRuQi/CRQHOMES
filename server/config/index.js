const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

module.exports = {
  // 服务配置
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

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

  // 数据库配置
  db: {
    path: path.resolve(process.env.DB_PATH || '../data/blog.db'),
  },

  // 上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
}
