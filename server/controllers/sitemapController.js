const { getDb } = require('../db')
const config = require('../config')

// 获取 sitemap 数据
function getSitemapData(req) {
  const db = getDb()
  // 优先使用 SITE_URL 配置，避免 Host 头注入；未配置时回退请求 Host
  const siteUrl = config.siteUrl || req.protocol + '://' + req.get('host')

  const posts = db
    .prepare(
      `
    SELECT id, slug,
      strftime('%Y-%m-%dT%H:%M:%SZ', COALESCE(updated_at, published_at)) as lastmod
    FROM posts 
    WHERE status = 1 
    ORDER BY julianday(published_at) DESC
  `
    )
    .all()

  const categories = db
    .prepare(
      `
    SELECT slug 
    FROM categories 
    ORDER BY sort ASC
  `
    )
    .all()

  return { siteUrl, posts, categories }
}

module.exports = { getSitemapData }
