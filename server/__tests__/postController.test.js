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
let createPost
let getAllPosts
let getArchives
let dbModulePath
let originalDbModule = null

beforeAll(() => {
  // 内存库 + schema
  db = new Database(':memory:')
  const schema = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf-8')
  db.exec(schema)

  // postController 是 CJS 且内部 require('../db') 时解构 getDb，
  // 因此用 require.cache 把 db 模块替换为内存库（vi.mock 对 CJS require 不生效）
  dbModulePath = require.resolve('../db')
  originalDbModule = require.cache[dbModulePath]
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
  createPost = controller.createPost
  getAllPosts = controller.getAllPosts
  getArchives = controller.getArchives
})

afterAll(() => {
  // 恢复 db 模块缓存，避免污染同 worker 内其他测试文件
  if (originalDbModule) {
    require.cache[dbModulePath] = originalDbModule
  } else {
    delete require.cache[dbModulePath]
  }
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

  it('排序数据包含不存在的文章时返回 400', () => {
    const a = insertPost()
    const res = makeRes()
    let nextError = null
    updateSortOrder(
      {
        body: {
          posts: [
            { id: a.id, sort_order: 1 },
            { id: 999999, sort_order: 2 },
          ],
        },
      },
      res,
      (error) => {
        nextError = error
      }
    )
    expect(nextError).not.toBeNull()
    expect(nextError.statusCode).toBe(400)
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

  it('转草稿保留 published_at，重新发布时恢复原时间', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('时间分类', 'time-cat')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'time-cat'").get()
    const post = insertPost({ updatedAt: '2026-01-01 00:00:00' })
    const original = '2026-05-01T10:00:00.000Z'
    db.prepare('UPDATE posts SET published_at = ? WHERE id = ?').run(original, post.id)

    const body = {
      title: post.title,
      content: '正文',
      category_id: cat.id,
      is_top: 0,
    }

    // 转草稿：发布时间属于文章固有属性，不得清空
    let nextError = null
    updatePost({ params: { id: post.id }, body: { ...body, status: 0 } }, makeRes(), (e) => {
      nextError = e
    })
    expect(nextError).toBeNull()
    let row = db.prepare('SELECT published_at FROM posts WHERE id = ?').get(post.id)
    expect(row.published_at).toBe(original)

    // 重新发布：恢复原时间，而不是重置为当前时间
    updatePost({ params: { id: post.id }, body: { ...body, status: 1 } }, makeRes(), (e) => {
      nextError = e
    })
    expect(nextError).toBeNull()
    row = db.prepare('SELECT published_at FROM posts WHERE id = ?').get(post.id)
    expect(row.published_at).toBe(original)
  })

  it('省略 status 时保留原状态（草稿不会被静默发布）', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('状态分类', 'status-cat')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'status-cat'").get()
    const post = insertPost({ updatedAt: '2026-01-01 00:00:00' })
    db.prepare('UPDATE posts SET status = 0, published_at = NULL WHERE id = ?').run(post.id)

    let nextError = null
    // 请求体不含 status：验证器把 status 标为 optional，省略是合法请求，
    // 此时必须保留草稿状态。若缺省为 1，草稿会被静默公开且不可逆
    updatePost(
      {
        params: { id: post.id },
        body: {
          title: '草稿改标题',
          content: '正文',
          category_id: cat.id,
          is_top: 0,
        },
      },
      makeRes(),
      (error) => {
        nextError = error
      }
    )
    expect(nextError).toBeNull()

    const after = db.prepare('SELECT status, published_at FROM posts WHERE id = ?').get(post.id)
    expect(after.status).toBe(0)
    expect(after.published_at).toBeNull()
  })

  it('草稿更新省略 status 和 content 时保留原有正文', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('状态分类2', 'status-cat-2')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'status-cat-2'").get()
    const post = insertPost({ updatedAt: '2026-01-01 00:00:00' })
    db.prepare('UPDATE posts SET status = 0 WHERE id = ?').run(post.id)

    let nextError = null
    // 省略 status 时，空内容校验必须沿用「文章本是草稿」这一事实
    updatePost(
      {
        params: { id: post.id },
        body: {
          title: '草稿改标题2',
          category_id: cat.id,
          is_top: 0,
        },
      },
      makeRes(),
      (error) => {
        nextError = error
      }
    )
    expect(nextError).toBeNull()

    const after = db.prepare('SELECT status, content FROM posts WHERE id = ?').get(post.id)
    expect(after.status).toBe(0)
    expect(after.content).toBe('测试内容')
  })

  it('省略可选字段时保留文章数据，显式空字符串才清空对应字段', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('保留分类', 'keep-cat')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'keep-cat'").get()
    const post = insertPost({ title: '保留字段', content: '原始正文' })
    db.prepare(
      'UPDATE posts SET summary = ?, cover_image = ?, tags = ?, status = 0, is_top = 1, category_id = ? WHERE id = ?'
    ).run('原始摘要', '/uploads/original.jpg', 'vue,node', cat.id, post.id)

    let nextError = null
    updatePost(
      {
        params: { id: post.id },
        body: { title: '更新标题', category_id: cat.id },
      },
      makeRes(),
      (error) => {
        nextError = error
      }
    )
    expect(nextError).toBeNull()

    let after = db
      .prepare(
        'SELECT title, content, summary, cover_image, tags, status, is_top FROM posts WHERE id = ?'
      )
      .get(post.id)
    expect(after).toMatchObject({
      title: '更新标题',
      content: '原始正文',
      summary: '原始摘要',
      cover_image: '/uploads/original.jpg',
      tags: 'vue,node',
      status: 0,
      is_top: 1,
    })

    nextError = null
    updatePost(
      {
        params: { id: post.id },
        body: {
          title: '再次更新',
          category_id: cat.id,
          summary: '',
          cover_image: '',
          tags: '',
        },
      },
      makeRes(),
      (error) => {
        nextError = error
      }
    )
    expect(nextError).toBeNull()

    after = db
      .prepare('SELECT content, summary, cover_image, tags, status, is_top FROM posts WHERE id = ?')
      .get(post.id)
    expect(after).toMatchObject({
      content: '原始正文',
      summary: '',
      cover_image: '',
      tags: '',
      status: 0,
      is_top: 1,
    })
  })

  it('显式发布时有效正文为空会返回 400', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('发布分类', 'publish-cat')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'publish-cat'").get()
    const post = insertPost({ title: '空正文草稿', content: '' })
    db.prepare('UPDATE posts SET status = 0, category_id = ? WHERE id = ?').run(cat.id, post.id)

    let nextError = null
    updatePost(
      {
        params: { id: post.id },
        body: { title: post.title, content: '', category_id: cat.id, status: 1 },
      },
      makeRes(),
      (error) => {
        nextError = error
      }
    )

    expect(nextError?.statusCode).toBe(400)
  })

  it('省略 is_top 时保留原置顶状态（置顶不会被静默取消）', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('置顶分类', 'top-cat')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'top-cat'").get()
    const post = insertPost({ updatedAt: '2026-01-01 00:00:00' })
    db.prepare('UPDATE posts SET is_top = 1 WHERE id = ?').run(post.id)

    let nextError = null
    // 请求体不含 is_top：验证器把 is_top 标为 optional，省略是合法请求，
    // 此时必须保留原置顶状态。若缺省走 normalizeTopFlag(undefined)=0，置顶会被静默取消
    updatePost(
      {
        params: { id: post.id },
        body: {
          title: '改标题但不动置顶',
          content: '正文',
          category_id: cat.id,
          status: 1,
        },
      },
      makeRes(),
      (error) => {
        nextError = error
      }
    )
    expect(nextError).toBeNull()

    const after = db.prepare('SELECT is_top FROM posts WHERE id = ?').get(post.id)
    expect(after.is_top).toBe(1)
  })
})

describe('createPost', () => {
  it('新建草稿（status=0）不写 published_at', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('草稿分类', 'draft-cat')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'draft-cat'").get()
    const res = makeRes()
    let nextError = null
    let created = null
    res.json = (payload) => {
      created = payload.data.post
    }
    createPost(
      {
        body: {
          title: '草稿文章',
          content: '',
          category_id: cat.id,
          status: 0,
        },
      },
      res,
      (error) => {
        nextError = error
      }
    )
    expect(nextError).toBeNull()
    expect(created).not.toBeNull()
    expect(created.status).toBe(0)
    expect(created.published_at).toBeNull()
  })

  it('草稿请求体省略 content 字段时不报错且落库为空串', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('草稿分类2', 'draft-cat-2')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'draft-cat-2'").get()
    const res = makeRes()
    let nextError = null
    let created = null
    res.json = (payload) => {
      created = payload.data.post
    }
    createPost(
      {
        body: {
          title: '无正文字段草稿',
          category_id: cat.id,
          status: 0,
        },
      },
      res,
      (error) => {
        nextError = error
      }
    )
    expect(nextError).toBeNull()
    expect(created).not.toBeNull()
    const row = db.prepare('SELECT content FROM posts WHERE id = ?').get(created.id)
    expect(row.content).toBe('')
  })

  it('published_at 落库前统一转为 UTC ISO 8601', () => {
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('ISO分类', 'iso-cat')
    const cat = db.prepare("SELECT id FROM categories WHERE slug = 'iso-cat'").get()
    const res = makeRes()
    let created = null
    res.json = (payload) => {
      created = payload.data.post
    }
    // 前端 datetime-local 提交的是「本地时间、无时区」串
    const localInput = '2026-08-29T22:30'
    let nextError = null
    createPost(
      {
        body: {
          title: '时间规范化文章',
          content: '内容',
          category_id: cat.id,
          status: 1,
          published_at: localInput,
        },
      },
      res,
      (error) => {
        nextError = error
      }
    )
    expect(nextError).toBeNull()

    const row = db.prepare('SELECT published_at FROM posts WHERE id = ?').get(created.id)
    // 必须是带 Z 的 UTC 串，且能还原出用户选定的同一时刻（断言与时区无关）
    expect(row.published_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(row.published_at).toBe(new Date(localInput).toISOString())
  })
})

describe('getAllPosts', () => {
  it('published_at 缺失的文章按 created_at 参与排序，不会被甩到末尾', () => {
    // A：没有发布时间，但创建时间更晚
    const a = insertPost({ updatedAt: '2026-06-01 00:00:00' })
    db.prepare('UPDATE posts SET published_at = NULL, created_at = ? WHERE id = ?').run(
      '2026-06-01T00:00:00.000Z',
      a.id
    )
    // B：发布时间更早
    const b = insertPost({ updatedAt: '2026-01-01 00:00:00' })
    db.prepare('UPDATE posts SET published_at = ?, created_at = ? WHERE id = ?').run(
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
      b.id
    )

    const res = makeRes()
    let payload = null
    res.json = (p) => {
      payload = p
    }
    let nextError = null
    getAllPosts({ query: { sort: 'recent', pageSize: '0' } }, res, (error) => {
      nextError = error
    })
    expect(nextError).toBeNull()

    const ids = payload.data.list.map((p) => p.id)
    // 若排序直接用 julianday(p.published_at)，A 的 NULL 会被甩到末尾，此断言失败。
    // 与归档接口（getArchives）的 COALESCE 语义保持一致
    expect(ids.indexOf(a.id)).toBeGreaterThanOrEqual(0)
    expect(ids.indexOf(a.id)).toBeLessThan(ids.indexOf(b.id))
  })
})

describe('getArchives', () => {
  it('returns complete paginated archives without silently dropping older posts', () => {
    const createdIds = []
    for (let index = 0; index < 55; index++) {
      const post = insertPost({ title: `归档分页-${index}`, content: `内容-${index}` })
      createdIds.push(post.id)
      db.prepare('UPDATE posts SET published_at = ?, status = 1 WHERE id = ?').run(
        `2099-01-01T00:00:${String(index).padStart(2, '0')}.000Z`,
        post.id
      )
    }

    const requestPage = (page) => {
      let payload = null
      let nextError = null
      getArchives(
        { query: { page: String(page), pageSize: '50' } },
        { json: (value) => (payload = value) },
        (error) => {
          nextError = error
        }
      )
      expect(nextError).toBeNull()
      return payload
    }

    const firstPage = requestPage(1)
    const secondPage = requestPage(2)
    const firstIds = firstPage.data.archives.flatMap((archive) =>
      archive.posts.map((post) => post.id)
    )
    const secondIds = secondPage.data.archives.flatMap((archive) =>
      archive.posts.map((post) => post.id)
    )
    const createdIdSet = new Set(createdIds)
    const paginatedCreatedIds = [...firstIds, ...secondIds].filter((id) => createdIdSet.has(id))

    expect(firstPage.data.pagination).toMatchObject({ page: 1, pageSize: 50 })
    expect(secondPage.data.pagination).toMatchObject({ page: 2, pageSize: 50 })
    expect(firstPage.data.pagination.total).toBeGreaterThanOrEqual(55)
    expect(new Set(paginatedCreatedIds)).toEqual(createdIdSet)
  })
})
