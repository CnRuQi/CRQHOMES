// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// 404 处理
function notFound(req, res, next) {
  const error = new AppError(`接口不存在: ${req.originalUrl}`, 404)
  next(error)
}

// 错误处理中间件
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500
  let message = err.message || '服务器内部错误'

  // SQLite 约束错误
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = 400
    message = '数据已存在'
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

  // 开发环境输出错误堆栈
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err)
  }

  res.status(statusCode).json({
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

module.exports = {
  AppError,
  notFound,
  errorHandler
}
