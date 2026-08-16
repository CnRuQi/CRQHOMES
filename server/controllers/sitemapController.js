const { getDb } = require('../db')

// 获取 sitemap 数据
function getSitemapData(req) {
  const db = getDb()
  const siteUrl = req.protocol + '://' + req.get('host')

  const posts = db
    .prepare(
      `
    SELECT id, slug, updated_at, published_at 
    FROM posts 
    WHERE status = 1 
    ORDER BY published_at DESC
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
