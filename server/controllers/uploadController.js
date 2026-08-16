const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const config = require('../config')
const { AppError } = require('../middleware/error')
const { success } = require('../utils/helpers')

// 文件签名验证
const MAGIC_BYTES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
}

// MIME 类型对应的安全扩展名（不信任客户端提供的 originalname）
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
}

function verifyFileType(filePath, claimedMimetype) {
  const expected = MAGIC_BYTES[claimedMimetype]
  if (!expected) return false

  let fd
  try {
    fd = fs.openSync(filePath, 'r')
    const buffer = Buffer.alloc(12)
    fs.readSync(fd, buffer, 0, 12, 0)

    if (!expected.every((byte, i) => buffer[i] === byte)) {
      return false
    }

    // webp 需额外校验第 8-12 字节为 "WEBP"，避免任意 RIFF 容器（WAV/AVI）绕过
    if (claimedMimetype === 'image/webp') {
      const webpMagic = [0x57, 0x45, 0x42, 0x50] // "WEBP"
      return webpMagic.every((byte, i) => buffer[8 + i] === byte)
    }

    return true
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd)
    }
  }
}

// 确保上传目录存在
const uploadDir = path.resolve(config.upload.dir)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = new Date()
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`
    const dir = path.join(uploadDir, yearMonth)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    cb(null, dir)
  },
  filename: (req, file, cb) => {
    // 扩展名由服务端根据 MIME 决定，杜绝客户端通过 originalname 注入危险扩展名
    const ext = EXT_BY_MIME[file.mimetype] || '.bin'
    const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`
    cb(null, uniqueName)
  },
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
    fileSize: config.upload.maxSize,
  },
})

// 上传图片处理
function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('请选择要上传的文件', 400)
    }

    // 验证文件实际类型
    if (!verifyFileType(req.file.path, req.file.mimetype)) {
      fs.unlinkSync(req.file.path)
      throw new AppError('文件内容与声明的类型不匹配', 400)
    }

    // 生成访问 URL
    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path)
    const url = `/${relativePath.replace(/\\/g, '/')}`

    success(
      res,
      {
        url,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      '上传成功'
    )
  } catch (error) {
    next(error)
  }
}

// Multer 错误处理
function handleMulterError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(`文件大小不能超过 ${config.upload.maxSize / 1024 / 1024}MB`, 400))
    }
  }
  next(error)
}

module.exports = { upload, uploadImage, handleMulterError }
