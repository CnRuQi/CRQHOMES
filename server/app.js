const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const config = require('./config')
const { initDb } = require('./db')
const { errorHandler, notFound } = require('./middleware/error')

// 路由
const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/post')
const categoryRoutes = require('./routes/category')
const uploadRoutes = require('./routes/upload')
const sitemapRoutes = require('./routes/sitemap')

// 初始化数据库
initDb()

const app = express()

// 信任反向代理（宝塔/Nginx 反代时设置 TRUST_PROXY=1，用于正确识别客户端 IP 和限流）
if (config.trustProxy) {
  app.set('trust proxy', 1)
}

// 安全中间件
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// API 响应禁止缓存（列表/搜索等动态数据不应在浏览器或代理中滞留）
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// CORS
app.use(cors(config.cors))

// 解析请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件
app.use(
  '/uploads',
  express.static(config.upload.dir, {
    maxAge: '30d',
    etag: true,
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff')
    },
  })
)

// Sitemap
app.use('/sitemap.xml', sitemapRoutes)

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/upload', uploadRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理
app.use(notFound)

// 错误处理
app.use(errorHandler)

// 启动服务器（监听端口占用等错误，避免进程异常崩溃）
const server = app.listen(config.port, () => {
  console.log(`服务器运行在 http://localhost:${config.port}`)
  console.log(`环境: ${config.env}`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${config.port} 已被占用，请更换 PORT 或停止占用进程后重试`)
  } else {
    console.error('服务器启动失败:', error.message)
  }
  process.exit(1)
})

// 每小时清理一次过期浏览记录
const { cleanupOldViews } = require('./controllers/postController')
const { getDb } = require('./db')
setInterval(
  () => {
    try {
      cleanupOldViews(getDb())
    } catch (error) {
      console.error('清理浏览记录失败:', error)
    }
  },
  60 * 60 * 1000
)

// 优雅关闭
process.on('SIGINT', () => {
  const { closeDb } = require('./db')
  closeDb()
  process.exit(0)
})

module.exports = app
