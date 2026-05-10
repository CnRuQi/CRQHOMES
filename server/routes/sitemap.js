const express = require('express')
const router = express.Router()
const { getDb } = require('../db')

// GET /sitemap.xml
router.get('/', (req, res) => {
  try {
    const db = getDb()
    const siteUrl = req.protocol + '://' + req.get('host')
    
    // 获取所有已发布的文章
    const posts = db.prepare(`
      SELECT id, updated_at, published_at 
      FROM posts 
      WHERE status = 1 
      ORDER BY published_at DESC
    `).all()
    
    // 获取所有分类
    const categories = db.prepare(`
      SELECT slug 
      FROM categories 
      ORDER BY sort ASC
    `).all()

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/archives</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`

    // 添加分类页面
    categories.forEach(cat => {
      xml += `
  <url>
    <loc>${siteUrl}/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    // 添加文章页面
    posts.forEach(post => {
      const lastmod = post.updated_at || post.published_at
      xml += `
  <url>
    <loc>${siteUrl}/post/${post.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    })

    xml += '\n</urlset>'

    res.type('application/xml')
    res.send(xml)
  } catch (error) {
    console.error('生成 sitemap 失败:', error)
    res.status(500).send('Internal Server Error')
  }
})

module.exports = router
