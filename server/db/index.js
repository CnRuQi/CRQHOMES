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

function migrateLegacySchema(database) {
  const runMigrations = database.transaction(() => {
    const postColumns = database.prepare('PRAGMA table_info(posts)').all()
    const postColumnNames = postColumns.map((column) => column.name)

    if (postColumnNames.includes('id')) {
      if (!postColumnNames.includes('slug')) {
        console.info('添加 slug 字段...')
        database.exec('ALTER TABLE posts ADD COLUMN slug TEXT')
      }

      const posts = database.prepare('SELECT id, slug FROM posts ORDER BY id ASC').all()
      const usedSlugs = new Set()
      const updateSlug = database.prepare('UPDATE posts SET slug = ? WHERE id = ?')

      for (const post of posts) {
        const existingSlug = post.slug === null || post.slug === undefined ? '' : String(post.slug)
        const baseSlug = existingSlug.trim() || `post-${post.id}`
        let slug = baseSlug
        let suffix = 1
        while (usedSlugs.has(slug)) {
          slug = `${baseSlug}-${suffix}`
          suffix++
        }
        usedSlugs.add(slug)

        if (post.slug !== slug) {
          updateSlug.run(slug, post.id)
        }
      }

      // 旧版本创建的是非唯一 idx_posts_slug；重建为唯一索引前先清理两种历史名称。
      database.exec('DROP INDEX IF EXISTS idx_posts_slug')
      database.exec('DROP INDEX IF EXISTS idx_posts_slug_unique')
      database.exec('CREATE UNIQUE INDEX idx_posts_slug_unique ON posts(slug)')
      console.info('  ✓ slug 字段及唯一索引已就绪')
    }

    const userColumns = database.prepare('PRAGMA table_info(users)').all()
    const userColumnNames = userColumns.map((column) => column.name)
    if (userColumnNames.includes('id') && !userColumnNames.includes('token_version')) {
      console.info('添加 users.token_version 字段...')
      database.exec('ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0')
      database.exec('UPDATE users SET token_version = 0 WHERE token_version IS NULL')
      console.info('  ✓ token_version 字段已添加')
    }
  })

  runMigrations()
}

function initDb(database = getDb()) {
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  // 旧库迁移必须在 schema 建表前完成，失败直接抛出，避免启动在半迁移状态下继续运行。
  migrateLegacySchema(database)

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
