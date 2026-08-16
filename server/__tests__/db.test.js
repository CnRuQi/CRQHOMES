import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ESM 测试环境下 __dirname 可能未定义，显式推导
const __dirname = dirname(fileURLToPath(import.meta.url))

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
