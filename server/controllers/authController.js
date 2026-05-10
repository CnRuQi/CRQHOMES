const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const { getDb } = require('../db')
const { AppError } = require('../middleware/error')
const { success } = require('../utils/helpers')

// 登录
async function login(req, res, next) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400)
    }

    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

    if (!user) {
      throw new AppError('用户名或密码错误', 401)
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new AppError('用户名或密码错误', 401)
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    // 设置 httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    })

    success(res, {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar
      }
    }, '登录成功')
  } catch (error) {
    next(error)
  }
}

// 获取当前用户信息
function getProfile(req, res, next) {
  try {
    success(res, { user: req.user })
  } catch (error) {
    next(error)
  }
}

// 修改密码
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      throw new AppError('旧密码和新密码不能为空', 400)
    }

    if (newPassword.length < 6) {
      throw new AppError('新密码长度不能少于6位', 400)
    }

    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isPasswordValid) {
      throw new AppError('旧密码错误', 400)
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, req.user.id)

    success(res, null, '密码修改成功')
  } catch (error) {
    next(error)
  }
}

// 更新个人信息
async function updateProfile(req, res, next) {
  try {
    const { nickname, avatar } = req.body
    const db = getDb()

    const newNickname = nickname !== undefined && nickname !== '' ? nickname : req.user.nickname
    const newAvatar = avatar !== undefined && avatar !== '' ? avatar : req.user.avatar

    db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newNickname, newAvatar, req.user.id)

    const updatedUser = db.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?')
      .get(req.user.id)

    success(res, { user: updatedUser }, '个人信息更新成功')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  login,
  getProfile,
  changePassword,
  updateProfile
}
