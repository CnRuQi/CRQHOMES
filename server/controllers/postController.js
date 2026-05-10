const { getDb } = require('../db')
const { AppError } = require('../middleware/error')
const { success, paginate, parsePagination, parseTags } = require('../utils/helpers')

// 格式化 IP 地址（处理 IPv6 格式）
function normalizeIp(ip) {
  if (!ip) return 'unknown'
  // 移除 IPv6 前缀 ::ffff:
  return ip.replace(/^::ffff:/, '')
}

// 浏览量防刷：检查是否在5分钟内浏览过
function hasRecentlyViewed(db, ip, postId) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const record = db.prepare(
    'SELECT id FROM view_tracking WHERE ip_address = ? AND post_id = ? AND viewed_at > ?'
  ).get(ip, postId, fiveMinutesAgo)
  return !!record
}

// 记录浏览
function recordView(db, ip, postId) {
  db.prepare(
    'INSERT OR REPLACE INTO view_tracking (ip_address, post_id, viewed_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
  ).run(ip, postId)
}

// 清理过期浏览记录（保留最近24小时的记录）
function cleanupOldViews(db) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  db.prepare('DELETE FROM view_tracking WHERE viewed_at < ?').run(oneDayAgo)
}

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

    // 增加浏览量（同 IP 同文章 5 分钟内不重复计数）
    const clientIp = normalizeIp(req.ip || req.connection.remoteAddress)
    if (!hasRecentlyViewed(db, clientIp, id)) {
      db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id)
      post.views += 1
      recordView(db, clientIp, id)
      // 定期清理过期记录
      if (Math.random() < 0.01) { // 1% 概率清理
        cleanupOldViews(db)
      }
    }
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

// 搜索文章（标题+摘要）
function searchPosts(req, res, next) {
  try {
    const { page, pageSize, offset } = parsePagination(req.query)
    const { keyword } = req.query
    const db = getDb()

    if (!keyword || keyword.trim() === '') {
      return success(res, { list: [], pagination: { total: 0, page, pageSize, totalPages: 0 } })
    }

    const searchKeyword = `%${keyword.trim()}%`

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 1 AND (p.title LIKE ? OR p.summary LIKE ?)
    `
    const { total } = db.prepare(countSql).get(searchKeyword, searchKeyword)

    // 查询列表
    const listSql = `
      SELECT 
        p.id, p.title, p.summary, p.cover_image, p.tags, 
        p.is_top, p.views, p.sort_order, p.published_at, p.created_at,
        c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 1 AND (p.title LIKE ? OR p.summary LIKE ?)
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `
    const list = db.prepare(listSql).all(searchKeyword, searchKeyword, pageSize, offset)

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

// 获取文章统计（后台 Dashboard）
function getStats(req, res, next) {
  try {
    const db = getDb()

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalPosts,
        SUM(views) as totalViews,
        SUM(CASE WHEN is_top = 1 THEN 1 ELSE 0 END) as topPosts
      FROM posts
    `).get()

    success(res, {
      totalPosts: stats.totalPosts || 0,
      totalViews: stats.totalViews || 0,
      topPosts: stats.topPosts || 0
    })
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
  updateSortOrder,
  getStats,
  searchPosts
}
