const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const config = require('../config')
const { authenticate } = require('../middleware/auth')
const { AppError } = require('../middleware/error')
const { success } = require('../utils/helpers')

const router = express.Router()

// 确保上传目录存在
const uploadDir = path.resolve(config.upload.dir)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 按年月创建子目录
    const date = new Date()
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`
    const dir = path.join(uploadDir, yearMonth)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(path.basename(file.originalname))
    const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`
    cb(null, uniqueName)
  }
})

// 文件过滤
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('不支持的文件类型', 400), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize
  }
})

// POST /api/upload/image - 上传图片
router.post('/image', authenticate, upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('请选择要上传的文件', 400)
    }

    // 生成访问 URL
    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path)
    const url = `/${relativePath.replace(/\\/g, '/')}`

    success(res, {
      url,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }, '上传成功')
  } catch (error) {
    next(error)
  }
})

// 错误处理
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: `文件大小不能超过 ${config.upload.maxSize / 1024 / 1024}MB`
      })
    }
  }
  next(error)
})

module.exports = router
