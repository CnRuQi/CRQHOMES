const { getDb } = require('../db')
const { AppError } = require('../middleware/error')
const { success, paginate, parsePagination, parseTags } = require('../utils/helpers')

// 归档接口一次性返回的文章上限。
// 个人博客远达不到这个量级，设限只为兜住文章数增长后的全量加载（无分页的一次性 SELECT）
const ARCHIVE_MAX_POSTS = 500

// 排序用的时间表达式：published_at 缺失时回退 created_at。
// 列表与归档必须用同一套语义，否则同一批数据在两处的先后次序会对不上
// （直接排 published_at 会把 NULL 行甩到末尾，而归档的 COALESCE 不会）
const TIME_ORDER_EXPR = 'julianday(COALESCE(p.published_at, p.created_at))'

// 格式化 IP 地址（处理 IPv6 格式）
function normalizeIp(ip) {
  if (!ip) return 'unknown'
  // 移除 IPv6 前缀 ::ffff:
  return ip.replace(/^::ffff:/, '')
}

// 转义 LIKE 查询中的特殊字符
function escapeLike(str) {
  return str.replace(/[\\%_]/g, '\\$&')
}

// 标准化置顶标记为 0/1（兼容字符串 "0"/"false" 等，避免真值判断误判）
function normalizeTopFlag(value) {
  return Number(value) === 1 || value === true ? 1 : 0
}

// 规范化时间为 UTC ISO 8601（兼容 SQLite CURRENT_TIMESTAMP 的无时区 UTC 格式）
function toIso(value) {
  if (!value) return value
  const str = String(value)
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)
    ? str.replace(' ', 'T') + 'Z'
    : str
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

// 规范化发布时间为 UTC ISO 8601（published_at 列只允许这一种格式）
// 前端 datetime-local 提交的是「本地时间、无时区」串（如 2026-08-29T22:30），
// 直接落库会让 SQLite 把它当 UTC 解析，导致 julianday() 排序、归档分组、
// sitemap lastmod 在中国时区下整体偏移。这里统一转成带 Z 的 UTC 串。
// 无法解析时返回 null（由调用方决定回退策略），绝不把脏值写进库里
function normalizePublishedAt(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// 校验分类是否存在（避免外键冲突返回 500）
function assertCategoryExists(db, categoryId) {
  if (categoryId === undefined || categoryId === null || categoryId === '') return
  const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId)
  if (!category) {
    throw new AppError('所选分类不存在', 400)
  }
}

// 生成 slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

// 确保 slug 唯一
function ensureUniqueSlug(db, slug, excludeId = null) {
  const baseSlug = slug || 'post'
  let finalSlug = baseSlug
  let counter = 1
  while (true) {
    const existing = db
      .prepare('SELECT id FROM posts WHERE slug = ? AND id != ?')
      .get(finalSlug, excludeId || 0)
    if (!existing) return finalSlug
    finalSlug = `${baseSlug}-${counter}`
    counter++
  }
}

// 浏览量防刷：检查是否在5分钟内浏览过
function hasRecentlyViewed(db, ip, postId) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const record = db
    .prepare('SELECT id FROM view_tracking WHERE ip_address = ? AND post_id = ? AND viewed_at > ?')
    .get(ip, postId, fiveMinutesAgo)
  return !!record
}

// 记录浏览（统一使用 ISO 时间字符串，与 hasRecentlyViewed/cleanupOldViews 的比较格式一致）
function recordView(db, ip, postId) {
  db.prepare(
    'INSERT OR REPLACE INTO view_tracking (ip_address, post_id, viewed_at) VALUES (?, ?, ?)'
  ).run(ip, postId, new Date().toISOString())
}

// 清理过期浏览记录（保留最近24小时的记录）
function cleanupOldViews(db) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  db.prepare('DELETE FROM view_tracking WHERE viewed_at < ?').run(oneDayAgo)
}

// 构建文章查询条件
// searchContent: 关键词是否额外匹配正文。仅搜索接口需要（列表接口只匹配标题+摘要）
function buildPostQueryConditions(query, options = {}) {
  const { category, tag, keyword, status } = query
  const { includeStatus = true, defaultStatus = null, searchContent = false } = options

  let where = 'WHERE 1=1'
  const params = []

  if (includeStatus && status !== undefined && status !== '') {
    where += ' AND p.status = ?'
    params.push(parseInt(status, 10))
  } else if (defaultStatus !== null) {
    where += ' AND p.status = ?'
    params.push(defaultStatus)
  }

  if (category) {
    where += ' AND c.slug = ?'
    params.push(category)
  }

  if (tag) {
    where += " AND p.tags LIKE ? ESCAPE '\\'"
    params.push(`%${escapeLike(tag)}%`)
  }

  if (keyword) {
    const escaped = `%${escapeLike(keyword)}%`
    where += searchContent
      ? " AND (p.title LIKE ? ESCAPE '\\' OR p.summary LIKE ? ESCAPE '\\' OR p.content LIKE ? ESCAPE '\\')"
      : " AND (p.title LIKE ? ESCAPE '\\' OR p.summary LIKE ? ESCAPE '\\')"
    params.push(escaped, escaped)
    if (searchContent) params.push(escaped)
  }

  return { where, params }
}

// 执行文章列表查询（orderBy: 'default'=置顶优先排序 | 'recent'=按发布时间）
function executePostListQuery(db, where, params, pageSize, offset, orderBy = 'default') {
  const countSql = `
    SELECT COUNT(*) as total
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    ${where}
  `
  const { total } = db.prepare(countSql).get(...params)

  const orderClause =
    orderBy === 'recent'
      ? `ORDER BY ${TIME_ORDER_EXPR} DESC`
      : `ORDER BY p.is_top DESC, p.sort_order DESC, ${TIME_ORDER_EXPR} DESC`
  const listSqlBase = `
    SELECT 
      p.id, p.slug, p.title, p.summary, p.cover_image, p.tags, 
      p.is_top, p.status, p.views, p.sort_order, p.published_at, p.created_at, p.updated_at,
      c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    ${where}
    ${orderClause}
  `
  const list =
    pageSize === null
      ? db.prepare(listSqlBase).all(...params)
      : db.prepare(`${listSqlBase} LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  const formattedList = list.map((post) => ({
    ...post,
    published_at: toIso(post.published_at),
    created_at: toIso(post.created_at),
    updated_at: toIso(post.updated_at),
    tags: parseTags(post.tags),
  }))

  return { list: formattedList, total }
}

// 获取文章列表（前台）
function getPosts(req, res, next) {
  try {
    const { page, pageSize, offset } = parsePagination(req.query)
    const db = getDb()

    const { where, params } = buildPostQueryConditions(req.query, {
      includeStatus: false,
      defaultStatus: 1,
    })

    const { list, total } = executePostListQuery(db, where, params, pageSize, offset)

    paginate(res, { list, total, page, pageSize })
  } catch (error) {
    next(error)
  }
}

// 文章详情的两条查询按 db 实例缓存预编译语句，避免每次请求重复解析 SQL。
// 用 WeakMap 以 db 为键：连接关闭重建（closeDb）后旧条目随 db 一起被回收，无需手动失效
const postDetailStatements = new WeakMap()

function getPostDetailStatements(db) {
  let stmts = postDetailStatements.get(db)
  if (!stmts) {
    stmts = {
      bySlug: db.prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM posts p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ? AND p.status = 1`
      ),
      byId: db.prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM posts p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ? AND p.status = 1`
      ),
    }
    postDetailStatements.set(db, stmts)
  }
  return stmts
}

// 获取文章详情
function getPost(req, res, next) {
  try {
    const { idOrSlug } = req.params
    const db = getDb()

    // 先按 slug 查询（纯数字标题生成的 slug 如 "123" 也能访问），再回退 id 兼容旧链接。
    // 不能用单条 OR 查询替代：SQL 的 OR 无法表达「slug 命中优先于 id 命中」的优先级
    const stmts = getPostDetailStatements(db)
    let post = stmts.bySlug.get(idOrSlug)
    // 绝大多数请求在 bySlug 就已命中，只有纯数字的旧链接才需要第二次查询
    if (!post && /^\d+$/.test(idOrSlug)) {
      post = stmts.byId.get(Number(idOrSlug))
    }

    if (!post) {
      throw new AppError('文章不存在', 404)
    }

    // 增加浏览量（同 IP 同文章 5 分钟内不重复计数）。
    // 计数与防刷记录放在同一事务：若中途失败，会出现「已 +1 但没写防刷记录」，
    // 导致同一个人下次访问被重复计数
    const clientIp = normalizeIp(req.ip || req.socket.remoteAddress)
    if (!hasRecentlyViewed(db, clientIp, post.id)) {
      db.transaction(() => {
        db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id)
        recordView(db, clientIp, post.id)
      })()
      post.views += 1
    }
    post.published_at = toIso(post.published_at)
    post.created_at = toIso(post.created_at)
    post.updated_at = toIso(post.updated_at)
    post.tags = parseTags(post.tags)

    success(res, { post })
  } catch (error) {
    next(error)
  }
}

// 获取单篇文章（后台管理，含草稿，不计数浏览量）
function getPostForAdmin(req, res, next) {
  try {
    const { id } = req.params
    const db = getDb()

    const post = db
      .prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM posts p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`
      )
      .get(id)

    if (!post) {
      throw new AppError('文章不存在', 404)
    }

    post.published_at = toIso(post.published_at)
    post.created_at = toIso(post.created_at)
    post.updated_at = toIso(post.updated_at)
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
    const orderBy = req.query.sort === 'recent' ? 'recent' : 'default'
    const db = getDb()

    const { where, params } = buildPostQueryConditions(req.query, {
      includeStatus: true,
    })

    const { list, total } = executePostListQuery(db, where, params, pageSize, offset, orderBy)

    paginate(res, { list, total, page, pageSize })
  } catch (error) {
    next(error)
  }
}

// 创建文章
function createPost(req, res, next) {
  try {
    const {
      title,
      content,
      summary,
      cover_image,
      category_id,
      tags,
      is_top,
      status,
      published_at,
    } = req.body

    if (!title) {
      throw new AppError('标题不能为空', 400)
    }
    // 草稿（status=0）允许正文为空，发布时必须非空
    if (Number(status) !== 0 && !content) {
      throw new AppError('内容不能为空', 400)
    }

    if (!category_id) {
      throw new AppError('请选择分类', 400)
    }

    const db = getDb()
    assertCategoryExists(db, category_id || null)
    const slug = ensureUniqueSlug(db, generateSlug(title))
    const tagsStr = Array.isArray(tags) ? tags.join(',') : tags || ''

    // 新文章 sort_order 取当前最大值 +1，保证发布后排在列表最前可见
    // （排序为 sort_order DESC，默认 0 会掉到所有手动排序文章之后）
    const { maxSort } = db
      .prepare('SELECT COALESCE(MAX(sort_order), 0) as maxSort FROM posts')
      .get()
    const sortOrder = maxSort + 1

    // 新建没有「原值」可保留，缺省即发布是合理默认。
    // 与 updatePost 不同：那里省略 status 表示「不改状态」，必须保留原值
    const postStatus = status !== undefined ? status : 1
    const nowIso = new Date().toISOString()
    // 草稿不写发布时间（保留 NULL），发布时间在真正发布时才确定
    const publishedAt =
      Number(postStatus) === 1 ? normalizePublishedAt(published_at) || nowIso : null

    const result = db
      .prepare(
        `
      INSERT INTO posts (title, slug, content, summary, cover_image, category_id, tags, is_top, status, sort_order, published_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        title,
        slug,
        content || '',
        summary || '',
        cover_image || '',
        category_id || null,
        tagsStr,
        normalizeTopFlag(is_top),
        postStatus,
        sortOrder,
        publishedAt,
        nowIso
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
    const {
      title,
      content,
      summary,
      cover_image,
      category_id,
      tags,
      is_top,
      status,
      published_at,
    } = req.body
    const db = getDb()
    assertCategoryExists(db, category_id || null)

    const existingPost = db
      .prepare('SELECT id, title, slug, status, published_at FROM posts WHERE id = ?')
      .get(id)
    if (!existingPost) {
      throw new AppError('文章不存在', 404)
    }

    if (!title) {
      throw new AppError('标题不能为空', 400)
    }

    // 未提供 status 时保留原值，与分类 updateCategory、个人资料 updateProfile 的
    // 「半更新语义」保持一致。这里若缺省为 1，则「省略 status 的更新」会把草稿
    // 静默转为已发布——内容对外可见且不可逆，而验证器是把 status 标为 optional 的，
    // 省略它是完全合法的请求
    const postStatus = status !== undefined ? status : existingPost.status

    // 草稿（postStatus=0）允许正文为空，发布时必须非空。
    // 必须用生效后的 postStatus 判断，否则 status 省略时会误要求草稿补正文
    if (Number(postStatus) !== 0 && !content) {
      throw new AppError('内容不能为空', 400)
    }

    if (!category_id) {
      throw new AppError('请选择分类', 400)
    }

    // 如果标题变化，重新生成 slug
    let slug = existingPost.slug
    if (title !== existingPost.title) {
      slug = ensureUniqueSlug(db, generateSlug(title), id)
    }

    const tagsStr = Array.isArray(tags) ? tags.join(',') : tags || ''

    const nowIso = new Date().toISOString()
    // 转草稿不再清空 published_at：发布时间是文章的固有属性，重新发布时应恢复原值，
    // 否则归档分组与 sitemap 的 lastmod 会跳变。
    // 优先级：本次显式提交 > 原有发布时间 > 发布态兜底为当前时间
    const publishedAt =
      normalizePublishedAt(published_at) ||
      normalizePublishedAt(existingPost.published_at) ||
      (Number(postStatus) === 1 ? nowIso : null)

    db.prepare(
      `
      UPDATE posts 
      SET title = ?, slug = ?, content = ?, summary = ?, cover_image = ?, 
          category_id = ?, tags = ?, is_top = ?, status = ?, published_at = ?,
          updated_at = ?
      WHERE id = ?
    `
    ).run(
      title,
      slug,
      content || '',
      summary || '',
      cover_image || '',
      category_id || null,
      tagsStr,
      normalizeTopFlag(is_top),
      postStatus,
      publishedAt,
      nowIso,
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

    // view_tracking.post_id 没有外键级联，文章删除后对应记录会成为孤儿。
    // 24 小时清理任务最终也会带走它们，但显式清理能让表里始终只留有效文章的记录。
    // 两步放在同一事务里，避免出现「文章没了、防刷记录还在」的中间态
    db.transaction(() => {
      db.prepare('DELETE FROM posts WHERE id = ?').run(id)
      db.prepare('DELETE FROM view_tracking WHERE post_id = ?').run(id)
    })()

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
    // 置顶属于元数据操作，不改变内容，不应刷新「最后更新于」
    db.prepare('UPDATE posts SET is_top = ? WHERE id = ?').run(newIsTop, id)

    success(res, { is_top: newIsTop }, newIsTop ? '已置顶' : '已取消置顶')
  } catch (error) {
    next(error)
  }
}

// 获取归档列表
function getArchives(req, res, next) {
  try {
    const db = getDb()

    // 排序用 julianday() 而非裸列：裸列是字符串比较，一旦列内混有
    // 「无时区的 datetime-local 串」与「带 Z 的 UTC 串」，跨格式比较结果就是错的。
    // 与列表接口（executePostListQuery）保持同一套时间语义
    const posts = db
      .prepare(
        `
      SELECT 
        id, slug, title, published_at, created_at
      FROM posts p
      WHERE p.status = 1
      ORDER BY ${TIME_ORDER_EXPR} DESC
      LIMIT ?
    `
      )
      .all(ARCHIVE_MAX_POSTS)

    // 按年月分组（与列表按 published_at 排序保持一致）
    const archives = {}
    posts.forEach((post) => {
      const date = new Date(toIso(post.published_at || post.created_at))
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

// 搜索文章（标题+摘要+正文）
function searchPosts(req, res, next) {
  try {
    const { page, pageSize, offset } = parsePagination(req.query)
    const db = getDb()

    // 验证器已保证 keyword 是字符串（?keyword=a&keyword=b 这类数组形式会被 isString 拦下）
    const keyword = (req.query.keyword || '').trim()
    if (!keyword) {
      return paginate(res, { list: [], total: 0, page, pageSize })
    }

    // 复用列表接口的查询构造与结果归一化：过去这里另写了一份 count + list SQL，
    // 既重复又漏掉 updated_at 的时间规范化，与列表接口行为不一致
    const { where, params } = buildPostQueryConditions(
      { ...req.query, keyword },
      { includeStatus: false, defaultStatus: 1, searchContent: true }
    )

    const { list, total } = executePostListQuery(db, where, params, pageSize, offset, 'recent')

    paginate(res, { list, total, page, pageSize })
  } catch (error) {
    next(error)
  }
}

// 更新文章排序
function updateSortOrder(req, res, next) {
  try {
    const { posts } = req.body
    const db = getDb()

    // 校验所有文章 id 存在，避免部分 id 静默 no-op 造成「排序成功但未生效」
    const ids = posts.map((item) => item.id)
    // 使用 json_each 完全参数化，避免动态拼占位符
    const { c: foundCount } = db
      .prepare('SELECT COUNT(*) as c FROM posts WHERE id IN (SELECT value FROM json_each(?))')
      .get(JSON.stringify(ids))
    if (foundCount !== ids.length) {
      throw new AppError('排序数据中包含不存在的文章', 400)
    }

    // 排序属于元数据操作，不改变内容，不应刷新「最后更新于」
    const updateStmt = db.prepare('UPDATE posts SET sort_order = ? WHERE id = ?')

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

    // 注意：totalPosts 为全部文章数（含草稿），如需「已发布数」请按 status = 1 统计
    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as totalPosts,
        SUM(views) as totalViews,
        SUM(CASE WHEN is_top = 1 THEN 1 ELSE 0 END) as topPosts
      FROM posts
    `
      )
      .get()

    success(res, {
      totalPosts: stats.totalPosts || 0,
      totalViews: stats.totalViews || 0,
      topPosts: stats.topPosts || 0,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getPosts,
  getPost,
  getPostForAdmin,
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  toggleTop,
  getArchives,
  updateSortOrder,
  getStats,
  searchPosts,
  cleanupOldViews,
}
