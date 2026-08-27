import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createRequire } from 'module'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ESM 测试环境下 __dirname 可能未定义，显式推导
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

let db
let updateSortOrder
let toggleTop
let updatePost

beforeAll(() => {
  // 内存库 + schema
  db = new Database(':memory:')
  const schema = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf-8')
  db.exec(schema)

  // postController 是 CJS 且内部 require('../db') 时解构 getDb，
  // 因此用 require.cache 把 db 模块替换为内存库（vi.mock 对 CJS require 不生效）
  const dbModulePath = require.resolve('../db')
  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: { getDb: () => db },
  }

  const controller = require('../controllers/postController.js')
  updateSortOrder = controller.updateSortOrder
  toggleTop = controller.toggleTop
  updatePost = controller.updatePost
})

afterAll(() => {
  if (db) db.close()
})

function insertPost(overrides = {}) {
  const result = db
    .prepare(
      `INSERT INTO posts (title, slug, content, summary, category_id, tags, is_top, status, sort_order, updated_at)
       VALUES (?, ?, ?, '', NULL, '', 0, 1, 0, ?)`
    )
    .run(
      overrides.title || '测试文章',
      overrides.slug || 'post-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      overrides.content || '测试内容',
      overrides.updatedAt || '2026-01-01 00:00:00'
    )
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid)
}

function makeRes() {
  return { json: () => {} }
}

describe('updateSortOrder', () => {
  it('更新 sort_order 但不刷新 updated_at', () => {
    const a = insertPost({ updatedAt: '2026-01-01 00:00:00' })
    const b = insertPost({ updatedAt: '2026-02-02 00:00:00' })

    const res = makeRes()
    let nextError = null
    updateSortOrder(
      {
        body: {
          posts: [
            { id: a.id, sort_order: 2 },
            { id: b.id, sort_order: 1 },
          ],
        },
      },
      res,
      (error) => {
        nextError = error
      }
    )

    expect(nextError).toBeNull()

    const a2 = db.prepare('SELECT * FROM posts WHERE id = ?').get(a.id)
    const b2 = db.prepare('SELECT * FROM posts WHERE id = ?').get(b.id)
    expect(a2.sort_order).toBe(2)
    expect(b2.sort_order).toBe(1)
    // 排序是元数据操作，不得改变「最后更新于」
    expect(a2.updated_at).toBe('2026-01-01 00:00:00')
    expect(b2.updated_at).toBe('2026-02-02 00:00:00')
  })
})

describe('toggleTop', () => {
  it('切换置顶但不刷新 updated_at', () => {
    const post = insertPost({ updatedAt: '2026-03-03 00:00:00' })

    const res = makeRes()
    let nextError = null
    toggleTop({ params: { id: post.id } }, res, (error) => {
      nextError = error
    })

    expect(nextError).toBeNull()

    const after = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id)
    expect(after.is_top).toBe(1)
    expect(after.updated_at).toBe('2026-03-03 00:00:00')
  })
})

describe('updatePost', () => {
  it('编辑内容时仍然刷新 updated_at（防止误伤）', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('测试分类', 'test-cat')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'test-cat'").get()
    const post = insertPost({ updatedAt: '2020-01-01 00:00:00' })

    const res = makeRes()
    let nextError = null
    updatePost(
      {
        params: { id: post.id },
        body: {
          title: '编辑后的标题',
          content: '编辑后的内容',
          category_id: cat.id,
          is_top: 0,
          status: 1,
        },
      },
      res,
      (error) => {
        nextError = error
      }
    )

    expect(nextError).toBeNull()

    const after = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id)
    expect(after.title).toBe('编辑后的标题')
    expect(after.updated_at).not.toBe('2020-01-01 00:00:00')
  })
})
