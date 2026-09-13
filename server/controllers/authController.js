const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const { getDb } = require('../db')
const { AppError } = require('../middleware/error')
const { success } = require('../utils/helpers')

// 用户不存在时也要跑一次 bcrypt.compare，让「用户不存在」与「密码错误」的
// 响应时间一致，避免通过耗时差异枚举用户名。这里比对的是一个预计算的哑哈希，
// 结果必然为 false，只用它的耗时
const TIMING_DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

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
      // 不提前返回：用哑哈希消耗与真实校验相当的 CPU 时间后再报同样的错
      await bcrypt.compare(password, TIMING_DUMMY_HASH)
      throw new AppError('用户名或密码错误', 401)
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new AppError('用户名或密码错误', 401)
    }

    // 生成 JWT
    // tv = 签发时的 token_version，改密后该值会递增，旧 token 随即失效
    const token = jwt.sign(
      { userId: user.id, username: user.username, tv: Number(user.token_version ?? 0) },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    )

    // 通过 httpOnly cookie 下发 token，前端 JS 无法读取，防 XSS 窃取
    res.cookie(config.cookie.name, token, config.cookie.options)

    success(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      },
      '登录成功'
    )
  } catch (error) {
    next(error)
  }
}

// 登出（清除认证 cookie）
function logout(req, res, next) {
  try {
    res.clearCookie(config.cookie.name, {
      httpOnly: config.cookie.options.httpOnly,
      sameSite: config.cookie.options.sameSite,
      secure: config.cookie.options.secure,
      path: config.cookie.options.path,
    })

    success(res, null, '登出成功')
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

    // token_version 自增：其他设备上 tv 落后的旧 token 会被 authenticate 拒绝。
    // 旧 token 没有 tv 字段时按 0 处理，所以升级本身不会踢掉既有登录态
    const nextTokenVersion = Number(user.token_version ?? 0) + 1

    db.prepare(
      "UPDATE users SET password = ?, token_version = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?"
    ).run(hashedPassword, nextTokenVersion, req.user.id)

    // 重新下发带新 tv 的 cookie：当前会话保持登录，其他设备被踢下线
    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username, tv: nextTokenVersion },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    )
    res.cookie(config.cookie.name, token, config.cookie.options)

    success(res, null, '密码修改成功')
  } catch (error) {
    next(error)
  }
}

// 更新个人信息
async function updateProfile(req, res, next) {
  try {
    const { nickname, avatar } = req.body

    if (nickname !== undefined && typeof nickname !== 'string') {
      throw new AppError('昵称必须是字符串', 400)
    }
    if (avatar !== undefined && typeof avatar !== 'string') {
      throw new AppError('头像必须是字符串', 400)
    }

    const db = getDb()

    // undefined = 未提供（保留原值）；空串 = 清空该字段（与分类的半更新语义一致）
    const newNickname = nickname !== undefined ? nickname : req.user.nickname
    const newAvatar = avatar !== undefined ? avatar : req.user.avatar

    db.prepare(
      "UPDATE users SET nickname = ?, avatar = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?"
    ).run(newNickname, newAvatar, req.user.id)

    const updatedUser = db
      .prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?')
      .get(req.user.id)

    success(res, { user: updatedUser }, '个人信息更新成功')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  login,
  logout,
  getProfile,
  changePassword,
  updateProfile,
}
