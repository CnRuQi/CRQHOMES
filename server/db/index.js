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
      console.log('添加 slug 字段...')
      database.exec('ALTER TABLE posts ADD COLUMN slug TEXT')
      database.exec("UPDATE posts SET slug = 'post-' || id WHERE slug IS NULL OR slug = ''")
      console.log('  ✓ slug 字段已添加')
    }
  } catch (_e) {
    // 表可能还不存在，忽略错误
  }

  database.exec(schema)
  console.log('数据库初始化完成')

  return database
}

function closeDb() {
  if (db) {
    db.close()
    db = null
    console.log('数据库连接已关闭')
  }
}

module.exports = {
  getDb,
  initDb,
  closeDb,
}
