const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const config = require('../config')

function migrate() {
  console.log('开始数据库迁移...\n')
  
  const dbPath = config.db.path
  const dbDir = path.dirname(dbPath)

  // 确保数据库目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  try {
    // 检查字段是否存在
    const columns = db.prepare("PRAGMA table_info(posts)").all()
    const columnNames = columns.map(col => col.name)
    
    console.log('当前 posts 表字段:', columnNames.join(', '))

    // 如果表不存在，创建完整的表
    if (!columnNames.includes('id')) {
      console.log('创建 posts 表...')
      db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          summary TEXT,
          cover_image TEXT,
          category_id INTEGER,
          tags TEXT,
          is_top INTEGER DEFAULT 0,
          status INTEGER DEFAULT 1,
          views INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
      `)
      console.log('  ✓ posts 表已创建')
    } else {
      // 添加缺失的字段
      if (!columnNames.includes('sort_order')) {
        console.log('添加 sort_order 字段...')
        // 使用临时表方式添加字段
        db.exec(`
          CREATE TABLE posts_temp AS SELECT 
            id, title, content, summary, cover_image, category_id, tags,
            is_top, status, views, 0 as sort_order, 
            created_at as published_at, created_at, updated_at
          FROM posts
        `)
        db.exec('DROP TABLE posts')
        db.exec(`
          CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            summary TEXT,
            cover_image TEXT,
            category_id INTEGER,
            tags TEXT,
            is_top INTEGER DEFAULT 0,
            status INTEGER DEFAULT 1,
            views INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
          )
        `)
        db.exec(`
          INSERT INTO posts (id, title, content, summary, cover_image, category_id, tags, is_top, status, views, sort_order, published_at, created_at, updated_at)
          SELECT id, title, content, summary, cover_image, category_id, tags, is_top, status, views, sort_order, published_at, created_at, updated_at FROM posts_temp
        `)
        db.exec('DROP TABLE posts_temp')
        console.log('  ✓ sort_order 字段已添加')
      }

      if (!columnNames.includes('published_at')) {
        console.log('添加 published_at 字段...')
        db.exec(`
          CREATE TABLE posts_temp AS SELECT 
            id, title, content, summary, cover_image, category_id, tags,
            is_top, status, views, sort_order, 
            created_at as published_at, created_at, updated_at
          FROM posts
        `)
        db.exec('DROP TABLE posts')
        db.exec(`
          CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            summary TEXT,
            cover_image TEXT,
            category_id INTEGER,
            tags TEXT,
            is_top INTEGER DEFAULT 0,
            status INTEGER DEFAULT 1,
            views INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
          )
        `)
        db.exec(`
          INSERT INTO posts (id, title, content, summary, cover_image, category_id, tags, is_top, status, views, sort_order, published_at, created_at, updated_at)
          SELECT id, title, content, summary, cover_image, category_id, tags, is_top, status, views, sort_order, published_at, created_at, updated_at FROM posts_temp
        `)
        db.exec('DROP TABLE posts_temp')
        console.log('  ✓ published_at 字段已添加')
      }
    }

    // 创建索引
    console.log('创建索引...')
    db.exec('CREATE INDEX IF NOT EXISTS idx_posts_sort_order ON posts(sort_order)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at)')
    console.log('  ✓ 索引已创建')

    console.log('\n✅ 数据库迁移完成！')

  } catch (error) {
    console.error('迁移失败:', error.message)
  } finally {
    db.close()
  }
}

migrate()
