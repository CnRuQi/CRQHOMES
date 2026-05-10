const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const config = require('./config')
const { initDb } = require('./db')
const { errorHandler, notFound } = require('./middleware/error')

// 路由
const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/post')
const categoryRoutes = require('./routes/category')
const uploadRoutes = require('./routes/upload')

// 初始化数据库
initDb()

const app = express()

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// CORS
app.use(cors(config.cors))

// 解析请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  etag: true,
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  }
}))

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

// 启动服务器
app.listen(config.port, () => {
  console.log(`服务器运行在 http://localhost:${config.port}`)
  console.log(`环境: ${config.env}`)
})

// 优雅关闭
process.on('SIGINT', () => {
  const { closeDb } = require('./db')
  closeDb()
  process.exit(0)
})

module.exports = app
