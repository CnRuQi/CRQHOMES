const { getDb } = require('../db')
const config = require('../config')

// 获取 sitemap 数据
function getSitemapData(req) {
  const db = getDb()
  // 生产配置在启动时必须提供 SITE_URL，运行时也不接受请求 Host 作为兜底。
  // 开发环境保留 Host 回退，方便本地预览 sitemap。
  if (config.env === 'production' && !config.siteUrl) {
    throw new Error('生产环境必须配置 SITE_URL')
  }
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
