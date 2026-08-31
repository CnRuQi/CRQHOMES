const config = require('../config')

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, data = null) {
    super(message)
    this.statusCode = statusCode
    // 结构化附加信息（如「该分类下还有几篇文章」）。
    // 前端应读字段判断，而不是去正则匹配 message 里的中文文案
    this.data = data
    Error.captureStackTrace(this, this.constructor)
  }
}

// 404 处理
function notFound(req, res, next) {
  const error = new AppError(`接口不存在: ${req.originalUrl}`, 404)
  next(error)
}

// 错误处理中间件
function errorHandler(err, req, res, _next) {
  // 响应已开始发送后再 status() 会抛 ERR_HTTP_HEADERS_SENT，转交 Express 默认处理
  if (res.headersSent) {
    return _next(err)
  }

  let statusCode = err.statusCode || 500
  let message = err.message || '服务器内部错误'

  // SQLite 约束错误
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = 400
    message = '数据已存在'
  } else if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    statusCode = 400
    message = '关联数据不存在'
  } else if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    statusCode = 400
    message = '必填字段缺失'
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = '无效的认证令牌'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = '认证令牌已过期'
  }

  // 非操作型错误（500）在生产环境不泄漏内部信息
  if (statusCode >= 500 && config.env !== 'development') {
    message = '服务器内部错误'
  }

  // 开发环境输出错误堆栈
  if (config.env === 'development') {
    console.error('Error:', err)
  }

  res.status(statusCode).json({
    code: statusCode,
    message,
    // 结构化附加数据也透传给前端。它不是内部错误细节，而是前端需要的业务信息，
    // 因此生产环境同样保留（只有 stack 才按环境裁剪）
    ...(err.data ? { data: err.data } : {}),
    ...(config.env === 'development' && { stack: err.stack }),
  })
}

module.exports = {
  AppError,
  notFound,
  errorHandler,
}
