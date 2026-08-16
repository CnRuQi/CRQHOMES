const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { upload, uploadImage, handleMulterError } = require('../controllers/uploadController')

// POST /api/upload/image - 上传图片
router.post('/image', authenticate, upload.single('image'), uploadImage)

// 错误处理
router.use(handleMulterError)

module.exports = router
