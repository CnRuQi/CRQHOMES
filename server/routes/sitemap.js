const express = require('express')
const router = express.Router()
const { getSitemapData } = require('../controllers/sitemapController')

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// GET /sitemap.xml
router.get('/', (req, res) => {
  try {
    const { siteUrl, posts, categories } = getSitemapData(req)

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(siteUrl)}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(siteUrl)}/archives</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`

    categories.forEach((cat) => {
      xml += `
  <url>
    <loc>${escapeXml(siteUrl)}/category/${escapeXml(cat.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    posts.forEach((post) => {
      const lastmod = post.updated_at || post.published_at
      xml += `
  <url>
    <loc>${escapeXml(siteUrl)}/post/${escapeXml(post.slug)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
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
