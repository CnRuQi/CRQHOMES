const { getDb } = require('../db')
const { AppError } = require('../middleware/error')
const { success } = require('../utils/helpers')

// 获取所有分类（前台）
function getCategories(req, res, next) {
  try {
    const db = getDb()

    const categories = db.prepare(`
      SELECT 
        c.id, c.name, c.slug, c.description, c.sort,
        COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON p.category_id = c.id AND p.status = 1
      GROUP BY c.id
      ORDER BY c.sort ASC, c.created_at ASC
    `).all()

    success(res, { categories })
  } catch (error) {
    next(error)
  }
}

// 创建分类
function createCategory(req, res, next) {
  try {
    const { name, slug, description, sort } = req.body

    if (!name || !slug) {
      throw new AppError('分类名称和别名不能为空', 400)
    }

    const db = getDb()

    // 检查别名是否已存在
    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)
    if (existing) {
      throw new AppError('分类别名已存在', 400)
    }

    const result = db.prepare(
      'INSERT INTO categories (name, slug, description, sort) VALUES (?, ?, ?, ?)'
    ).run(name, slug, description || '', sort || 0)

    const category = db.prepare('SELECT * FROM categories WHERE id = ?')
      .get(result.lastInsertRowid)

    success(res, { category }, '分类创建成功')
  } catch (error) {
    next(error)
  }
}

// 更新分类
function updateCategory(req, res, next) {
  try {
    const { id } = req.params
    const { name, slug, description, sort } = req.body
    const db = getDb()

    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id)
    if (!existing) {
      throw new AppError('分类不存在', 404)
    }

    if (!name || !slug) {
      throw new AppError('分类名称和别名不能为空', 400)
    }

    // 检查别名是否被其他分类使用
    const slugExists = db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(slug, id)
    if (slugExists) {
      throw new AppError('分类别名已存在', 400)
    }

    db.prepare(
      'UPDATE categories SET name = ?, slug = ?, description = ?, sort = ? WHERE id = ?'
    ).run(name, slug, description || '', sort || 0, id)

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)

    success(res, { category }, '分类更新成功')
  } catch (error) {
    next(error)
  }
}

// 删除分类
function deleteCategory(req, res, next) {
  try {
    const { id } = req.params
    const db = getDb()

    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id)
    if (!existing) {
      throw new AppError('分类不存在', 404)
    }

    const { count } = db.prepare('SELECT COUNT(*) as count FROM posts WHERE category_id = ?').get(id)
    if (count > 0) {
      throw new AppError(`该分类下还有 ${count} 篇文章，请先移除或转移文章`, 400)
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id)

    success(res, null, '分类删除成功')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
}
