const { getDb } = require('../db')
const { AppError } = require('../middleware/error')
const { success, paginate, parsePagination, parseTags } = require('../utils/helpers')

// 获取文章列表（前台）
function getPosts(req, res, next) {
  try {
    const { page, pageSize, offset } = parsePagination(req.query)
    const { category, tag, keyword } = req.query
    const db = getDb()

    let where = 'WHERE p.status = 1'
    const params = []

    if (category) {
      where += ' AND c.slug = ?'
      params.push(category)
    }

    if (tag) {
      where += ' AND p.tags LIKE ?'
      params.push(`%${tag}%`)
    }

    if (keyword) {
      where += ' AND (p.title LIKE ? OR p.summary LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
    `
    const { total } = db.prepare(countSql).get(...params)

    // 查询列表
    const listSql = `
      SELECT 
        p.id, p.title, p.summary, p.cover_image, p.tags, 
        p.is_top, p.views, p.sort_order, p.published_at, p.created_at, p.updated_at,
        c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.is_top DESC, p.sort_order DESC, p.published_at DESC
      LIMIT ? OFFSET ?
    `
    const list = db.prepare(listSql).all(...params, pageSize, offset)

    // 解析标签
    const formattedList = list.map(post => ({
      ...post,
      tags: parseTags(post.tags)
    }))

    paginate(res, { list: formattedList, total, page, pageSize })
  } catch (error) {
    next(error)
  }
}

// 获取文章详情
function getPost(req, res, next) {
  try {
    const { id } = req.params
    const db = getDb()

    const post = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.status = 1
    `).get(id)

    if (!post) {
      throw new AppError('文章不存在', 404)
    }

    // 增加浏览量
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id)
    post.views += 1
    post.tags = parseTags(post.tags)

    success(res, { post })
  } catch (error) {
    next(error)
  }
}

// 获取所有文章（后台管理）
function getAllPosts(req, res, next) {
  try {
    const { page, pageSize, offset } = parsePagination(req.query)
    const { status, category, keyword } = req.query
    const db = getDb()

    let where = 'WHERE 1=1'
    const params = []

    if (status !== undefined && status !== '') {
      where += ' AND p.status = ?'
      params.push(parseInt(status, 10))
    }

    if (category) {
      where += ' AND c.slug = ?'
      params.push(category)
    }

    if (keyword) {
      where += ' AND (p.title LIKE ? OR p.summary LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
    `
    const { total } = db.prepare(countSql).get(...params)

    const listSql = `
      SELECT 
        p.id, p.title, p.summary, p.cover_image, p.tags,
        p.is_top, p.status, p.views, p.sort_order, p.published_at, p.created_at, p.updated_at,
        c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.is_top DESC, p.sort_order DESC, p.published_at DESC
      LIMIT ? OFFSET ?
    `
    const list = db.prepare(listSql).all(...params, pageSize, offset)

    const formattedList = list.map(post => ({
      ...post,
      tags: parseTags(post.tags)
    }))

    paginate(res, { list: formattedList, total, page, pageSize })
  } catch (error) {
    next(error)
  }
}

// 创建文章
function createPost(req, res, next) {
  try {
    const { title, content, summary, cover_image, category_id, tags, is_top, status, published_at } = req.body

    if (!title || !content) {
      throw new AppError('标题和内容不能为空', 400)
    }

    const db = getDb()

    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '')

    const result = db.prepare(`
      INSERT INTO posts (title, content, summary, cover_image, category_id, tags, is_top, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      content,
      summary || '',
      cover_image || '',
      category_id || null,
      tagsStr,
      is_top ? 1 : 0,
      status !== undefined ? status : 1,
      published_at || new Date().toISOString()
    )

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid)
    post.tags = parseTags(post.tags)

    success(res, { post }, '文章创建成功')
  } catch (error) {
    next(error)
  }
}

// 更新文章
function updatePost(req, res, next) {
  try {
    const { id } = req.params
    const { title, content, summary, cover_image, category_id, tags, is_top, status, published_at } = req.body
    const db = getDb()

    const existingPost = db.prepare('SELECT id FROM posts WHERE id = ?').get(id)
    if (!existingPost) {
      throw new AppError('文章不存在', 404)
    }

    if (!title || !content) {
      throw new AppError('标题和内容不能为空', 400)
    }

    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '')

    db.prepare(`
      UPDATE posts 
      SET title = ?, content = ?, summary = ?, cover_image = ?, 
          category_id = ?, tags = ?, is_top = ?, status = ?, published_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title,
      content,
      summary || '',
      cover_image || '',
      category_id || null,
      tagsStr,
      is_top ? 1 : 0,
      status !== undefined ? status : 1,
      published_at || new Date().toISOString(),
      id
    )

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
    post.tags = parseTags(post.tags)

    success(res, { post }, '文章更新成功')
  } catch (error) {
    next(error)
  }
}

// 删除文章
function deletePost(req, res, next) {
  try {
    const { id } = req.params
    const db = getDb()

    const existingPost = db.prepare('SELECT id FROM posts WHERE id = ?').get(id)
    if (!existingPost) {
      throw new AppError('文章不存在', 404)
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(id)

    success(res, null, '文章删除成功')
  } catch (error) {
    next(error)
  }
}

// 切换置顶状态
function toggleTop(req, res, next) {
  try {
    const { id } = req.params
    const db = getDb()

    const post = db.prepare('SELECT id, is_top FROM posts WHERE id = ?').get(id)
    if (!post) {
      throw new AppError('文章不存在', 404)
    }

    const newIsTop = post.is_top ? 0 : 1
    db.prepare('UPDATE posts SET is_top = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newIsTop, id)

    success(res, { is_top: newIsTop }, newIsTop ? '已置顶' : '已取消置顶')
  } catch (error) {
    next(error)
  }
}

// 获取归档列表
function getArchives(req, res, next) {
  try {
    const db = getDb()

    const posts = db.prepare(`
      SELECT 
        id, title, created_at
      FROM posts 
      WHERE status = 1
      ORDER BY created_at DESC
    `).all()

    // 按年月分组
    const archives = {}
    posts.forEach(post => {
      const date = new Date(post.created_at)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = `${year}-${month.toString().padStart(2, '0')}`

      if (!archives[key]) {
        archives[key] = { year, month, posts: [] }
      }
      archives[key].posts.push(post)
    })

    success(res, { archives: Object.values(archives) })
  } catch (error) {
    next(error)
  }
}

// 更新文章排序
function updateSortOrder(req, res, next) {
  try {
    const { posts } = req.body
    const db = getDb()

    const updateStmt = db.prepare('UPDATE posts SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')

    const transaction = db.transaction((items) => {
      for (const item of items) {
        updateStmt.run(item.sort_order, item.id)
      }
    })

    transaction(posts)

    success(res, null, '排序更新成功')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getPosts,
  getPost,
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  toggleTop,
  getArchives,
  updateSortOrder
}
