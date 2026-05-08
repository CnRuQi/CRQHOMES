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
  closeDb
}
