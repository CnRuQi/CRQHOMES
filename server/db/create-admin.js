const bcrypt = require('bcryptjs')
const { getDb, initDb, closeDb } = require('./index')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// 与登录验证器 authRules.login 保持一致，避免创建出永远无法登录的账号
const USERNAME_MIN = 3
const USERNAME_MAX = 30
const PASSWORD_MIN = 6

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

// 密码输入不回显：临时屏蔽 readline 的输出（提示符与键入字符都由它写出），
// 提示符改由 stdout 直接输出，输完再补一个换行
function questionHidden(prompt) {
  return new Promise((resolve) => {
    const writeToOutput = rl._writeToOutput
    rl._writeToOutput = () => {}
    process.stdout.write(prompt)
    rl.question('', (answer) => {
      rl._writeToOutput = writeToOutput
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

async function createAdmin() {
  try {
    console.log('=== 创建管理员账号 ===\n')

    const username = (await question('请输入用户名: ')).trim()
    const password = await questionHidden('请输入密码: ')
    const nickname = (await question('请输入昵称 (可选，直接回车跳过): ')).trim()

    if (!username || !password) {
      console.error('用户名和密码不能为空！')
      process.exit(1)
    }
    if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
      console.error(`用户名长度必须在 ${USERNAME_MIN}-${USERNAME_MAX} 之间！`)
      process.exit(1)
    }
    if (password.length < PASSWORD_MIN) {
      console.error(`密码长度不能少于 ${PASSWORD_MIN} 位！`)
      process.exit(1)
    }

    // 初始化数据库
    initDb()
    const db = getDb()

    // 检查用户是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existingUser) {
      console.error(`用户 "${username}" 已存在！`)
      process.exit(1)
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 插入用户
    const result = db
      .prepare('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)')
      .run(username, hashedPassword, nickname || username)

    console.log(`\n管理员账号创建成功！`)
    console.log(`用户ID: ${result.lastInsertRowid}`)
    console.log(`用户名: ${username}`)
    console.log(`昵称: ${nickname || username}`)
  } catch (error) {
    console.error('创建管理员失败:', error.message)
    process.exit(1)
  } finally {
    closeDb()
    rl.close()
  }
}

createAdmin()
