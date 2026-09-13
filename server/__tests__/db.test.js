import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

// ESM 测试环境下 __dirname 可能未定义，显式推导
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { initDb } = require('../db')

let db

beforeAll(() => {
  db = new Database(':memory:')
  const schema = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf-8')
  db.exec(schema)
})

afterAll(() => {
  if (db) db.close()
})

describe('Database Schema', () => {
  it('creates users table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .all()
    expect(tables).toHaveLength(1)
  })

  it('creates posts table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'")
      .all()
    expect(tables).toHaveLength(1)
  })

  it('creates categories table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'")
      .all()
    expect(tables).toHaveLength(1)
  })

  it('creates view_tracking table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='view_tracking'")
      .all()
    expect(tables).toHaveLength(1)
  })
})

describe('Users CRUD', () => {
  it('inserts a user', () => {
    const result = db
      .prepare('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)')
      .run('admin', 'hashedpass', '管理员')
    expect(result.changes).toBe(1)
    expect(result.lastInsertRowid).toBeGreaterThan(0)
  })

  it('reads a user', () => {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin')
    expect(user).toBeDefined()
    expect(user.username).toBe('admin')
    expect(user.nickname).toBe('管理员')
  })

  it('enforces unique username', () => {
    expect(() => {
      db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', 'otherpass')
    }).toThrow()
  })
})

describe('Categories CRUD', () => {
  it('inserts a category', () => {
    const result = db
      .prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)')
      .run('技术', 'tech', '技术文章')
    expect(result.changes).toBe(1)
  })

  it('reads a category', () => {
    const cat = db.prepare('SELECT * FROM categories WHERE slug = ?').get('tech')
    expect(cat).toBeDefined()
    expect(cat.name).toBe('技术')
  })
})

describe('Posts CRUD', () => {
  it('inserts a post', () => {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('tech')
    const result = db
      .prepare(
        'INSERT INTO posts (title, content, summary, category_id, status) VALUES (?, ?, ?, ?, ?)'
      )
      .run('测试文章', '文章内容', '摘要', cat.id, 1)
    expect(result.changes).toBe(1)
  })

  it('reads a post with category join', () => {
    const post = db
      .prepare(
        `
      SELECT p.*, c.name as category_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 1
    `
      )
      .get()
    expect(post).toBeDefined()
    expect(post.title).toBe('测试文章')
    expect(post.category_name).toBe('技术')
  })

  it('defaults views to 0', () => {
    const post = db.prepare('SELECT views FROM posts WHERE title = ?').get('测试文章')
    expect(post.views).toBe(0)
  })
})

describe('Foreign Key Constraints', () => {
  it('sets category_id to NULL when category is deleted', () => {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('tech')
    db.prepare('DELETE FROM categories WHERE id = ?').run(cat.id)
    const post = db.prepare('SELECT category_id FROM posts WHERE title = ?').get('测试文章')
    expect(post.category_id).toBeNull()
  })
})

function createLegacyPostsTable(database, { withSlug = false } = {}) {
  database.exec(`
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      ${withSlug ? 'slug TEXT,' : ''}
      content TEXT NOT NULL,
      summary TEXT,
      cover_image TEXT,
      category_id INTEGER,
      tags TEXT,
      is_top INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      views INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      published_at DATETIME,
      created_at DATETIME,
      updated_at DATETIME
    )
  `)
}

describe('Legacy post slug migration', () => {
  it('adds deterministic unique slugs to a legacy table without slug', () => {
    const legacyDb = new Database(':memory:')
    createLegacyPostsTable(legacyDb)
    legacyDb
      .prepare('INSERT INTO posts (id, title, content) VALUES (?, ?, ?)')
      .run(1, '第一篇', '内容')
    legacyDb
      .prepare('INSERT INTO posts (id, title, content) VALUES (?, ?, ?)')
      .run(2, '第二篇', '内容')

    initDb(legacyDb)

    expect(
      legacyDb
        .prepare('PRAGMA table_info(posts)')
        .all()
        .map((column) => column.name)
    ).toContain('slug')
    expect(legacyDb.prepare('SELECT id, slug FROM posts ORDER BY id').all()).toEqual([
      { id: 1, slug: 'post-1' },
      { id: 2, slug: 'post-2' },
    ])
    expect(() =>
      legacyDb
        .prepare('INSERT INTO posts (title, slug, content) VALUES (?, ?, ?)')
        .run('重复', 'post-1', '内容')
    ).toThrow()

    const before = legacyDb.prepare('SELECT id, slug FROM posts ORDER BY id').all()
    initDb(legacyDb)
    expect(legacyDb.prepare('SELECT id, slug FROM posts ORDER BY id').all()).toEqual(before)

    legacyDb.close()
  })

  it('resolves duplicate legacy slugs in stable id order', () => {
    const legacyDb = new Database(':memory:')
    createLegacyPostsTable(legacyDb, { withSlug: true })
    legacyDb.prepare('CREATE INDEX idx_posts_slug ON posts(slug)').run()
    const insert = legacyDb.prepare(
      'INSERT INTO posts (id, title, slug, content) VALUES (?, ?, ?, ?)'
    )
    insert.run(1, '第一篇', 'same', '内容')
    insert.run(2, '第二篇', 'same', '内容')
    insert.run(3, '第三篇', '', '内容')

    initDb(legacyDb)

    expect(legacyDb.prepare('SELECT id, slug FROM posts ORDER BY id').all()).toEqual([
      { id: 1, slug: 'same' },
      { id: 2, slug: 'same-1' },
      { id: 3, slug: 'post-3' },
    ])
    const indexes = legacyDb.prepare('PRAGMA index_list(posts)').all()
    const slugIndex = indexes.find((index) => index.name === 'idx_posts_slug_unique')
    expect(slugIndex?.unique).toBe(1)

    const before = legacyDb.prepare('SELECT id, slug FROM posts ORDER BY id').all()
    initDb(legacyDb)
    expect(legacyDb.prepare('SELECT id, slug FROM posts ORDER BY id').all()).toEqual(before)

    legacyDb.close()
  })

  it('surfaces an invalid migration state instead of swallowing the error', () => {
    const invalidDb = new Database(':memory:')
    invalidDb.exec('CREATE TABLE posts (id INTEGER PRIMARY KEY, slug TEXT)')

    expect(() => initDb(invalidDb)).toThrow()

    invalidDb.close()
  })
})
