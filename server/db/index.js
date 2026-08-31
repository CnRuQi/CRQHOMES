const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const config = require('../config')

let db = null

function getDb() {
  if (db) return db

  const dbPath = config.db.path
  const dbDir = path.dirname(dbPath)

  // 确保数据库目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  db = new Database(dbPath)

  // 启用 WAL 模式提高性能
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  // 写锁被其他进程占用时最多等 5 秒再报 SQLITE_BUSY（默认为 0，即立即失败）。
  // 同进程内 better-sqlite3 是同步的、写操作天然串行；这里防的是跨进程写者，
  // 例如服务运行时执行 create-admin / import-data，或部署时新旧进程短暂并存
  db.pragma('busy_timeout = 5000')

  return db
}

function initDb() {
  const database = getDb()
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  // 先检查 posts 表是否有 slug 列，如果没有则添加
  try {
    const columns = database.prepare('PRAGMA table_info(posts)').all()
    const columnNames = columns.map((col) => col.name)
    if (columnNames.includes('id') && !columnNames.includes('slug')) {
      console.info('添加 slug 字段...')
      database.exec('ALTER TABLE posts ADD COLUMN slug TEXT')
      database.exec("UPDATE posts SET slug = 'post-' || id WHERE slug IS NULL OR slug = ''")
      console.info('  ✓ slug 字段已添加')
    }
  } catch (_e) {
    // 表可能还不存在，忽略错误
  }

  // 迁移：users 表加 token_version（改密后用于让旧 token 失效）
  try {
    const columns = database.prepare('PRAGMA table_info(users)').all()
    const columnNames = columns.map((col) => col.name)
    if (columnNames.includes('id') && !columnNames.includes('token_version')) {
      console.info('添加 users.token_version 字段...')
      database.exec('ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0')
      database.exec('UPDATE users SET token_version = 0 WHERE token_version IS NULL')
      console.info('  ✓ token_version 字段已添加')
    }
  } catch (_e) {
    // 表可能还不存在，忽略错误
  }

  database.exec(schema)
  console.info('数据库初始化完成')

  return database
}

function closeDb() {
  if (db) {
    db.close()
    db = null
    console.info('数据库连接已关闭')
  }
}

module.exports = {
  getDb,
  initDb,
  closeDb,
}
