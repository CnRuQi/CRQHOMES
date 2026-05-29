const { body, param, query, validationResult } = require('express-validator')
const { AppError } = require('./error')

// 处理验证结果
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((err) => err.msg)
      .join(', ')
    throw new AppError(message, 400)
  }
  next()
}

// 文章验证规则
const postRules = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('标题不能为空')
      .isLength({ max: 200 })
      .withMessage('标题不能超过200个字符'),
    body('content').notEmpty().withMessage('内容不能为空'),
    body('summary').optional().isLength({ max: 500 }).withMessage('摘要不能超过500个字符'),
    body('category_id').optional({ nullable: true }).isInt().withMessage('分类ID必须是整数'),
    body('tags').optional().isString().withMessage('标签必须是字符串'),
    body('is_top').optional().isIn([0, 1, true, false]).withMessage('置顶值无效'),
    body('status').optional().isIn([0, 1]).withMessage('状态值无效'),
    validate,
  ],
  update: [
    param('id').isInt().withMessage('文章ID必须是整数'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('标题不能为空')
      .isLength({ max: 200 })
      .withMessage('标题不能超过200个字符'),
    body('content').notEmpty().withMessage('内容不能为空'),
    body('summary').optional().isLength({ max: 500 }).withMessage('摘要不能超过500个字符'),
    body('category_id').optional({ nullable: true }).isInt().withMessage('分类ID必须是整数'),
    body('tags').optional().isString().withMessage('标签必须是字符串'),
    body('is_top').optional().isIn([0, 1, true, false]).withMessage('置顶值无效'),
    body('status').optional().isIn([0, 1]).withMessage('状态值无效'),
    validate,
  ],
  getById: [param('id').isInt().withMessage('文章ID必须是整数'), validate],
  list: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    validate,
  ],
  sortOrder: [
    body('posts').isArray({ min: 1 }).withMessage('排序数据必须是非空数组'),
    body('posts.*.id').isInt({ min: 1 }).withMessage('文章ID必须是正整数'),
    body('posts.*.sort_order').isInt().withMessage('排序值必须是整数'),
    validate,
  ],
  search: [
    query('keyword')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('搜索关键词不能超过100个字符'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    validate,
  ],
}

// 认证验证规则
const authRules = {
  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('用户名不能为空')
      .isLength({ min: 3, max: 30 })
      .withMessage('用户名长度必须在3-30之间'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空')
      .isLength({ min: 6 })
      .withMessage('密码长度不能少于6位'),
    validate,
  ],
  changePassword: [
    body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
    body('newPassword')
      .notEmpty()
      .withMessage('新密码不能为空')
      .isLength({ min: 6 })
      .withMessage('新密码长度不能少于6位'),
    validate,
  ],
  updateProfile: [
    body('nickname').optional().isLength({ max: 50 }).withMessage('昵称不能超过50个字符'),
    body('avatar')
      .optional()
      .custom((value) => {
        if (!value || value.trim() === '') return true
        if (value.includes('..')) throw new Error('路径不允许包含 ..')
        if (value.startsWith('/') || value.startsWith('./')) return true
        throw new Error('头像必须是相对路径')
      }),
    validate,
  ],
}

// 分类验证规则
const categoryRules = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('分类名称不能为空')
      .isLength({ max: 50 })
      .withMessage('分类名称不能超过50个字符'),
    body('slug')
      .trim()
      .notEmpty()
      .withMessage('分类别名不能为空')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('分类别名只能包含小写字母、数字和连字符')
      .isLength({ max: 50 })
      .withMessage('分类别名不能超过50个字符'),
    body('sort').optional().isInt().withMessage('排序值必须是整数'),
    validate,
  ],
  update: [
    param('id').isInt().withMessage('分类ID必须是整数'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('分类名称不能为空')
      .isLength({ max: 50 })
      .withMessage('分类名称不能超过50个字符'),
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('分类别名只能包含小写字母、数字和连字符')
      .isLength({ max: 50 })
      .withMessage('分类别名不能超过50个字符'),
    validate,
  ],
  delete: [param('id').isInt().withMessage('分类ID必须是整数'), validate],
}

module.exports = {
  postRules,
  authRules,
  categoryRules,
  validate,
}
