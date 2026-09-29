const { body, param, query, validationResult } = require('express-validator')
const { AppError } = require('./error')
const { normalizeTags } = require('../utils/helpers')

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

// 文章字段规则：create 与 update 共用同一份，避免两处规则各自漂移
// （历史上曾出现「新建校验了、编辑没校验」的缺口，去重是治本手段）
const postFieldRules = [
  body('title')
    .isString()
    .withMessage('标题必须是字符串')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ max: 200 })
    .withMessage('标题不能超过200个字符'),
  body('content').custom((value, { req }) => {
    // 草稿（status=0）允许正文为空，发布时必须非空
    // 更新接口允许省略正文，由控制器保留数据库中的原值；新建文章仍要求发布正文
    if (value === undefined && (String(req.body.status) === '0' || req.params?.id)) return true
    if (value === undefined) throw new Error('内容不能为空')
    if (typeof value !== 'string') throw new Error('正文必须是字符串')
    if (String(req.body.status) === '0') return true
    if (!value.trim()) throw new Error('内容不能为空')
    return true
  }),
  body('summary')
    .optional()
    .isString()
    .withMessage('摘要必须是字符串')
    .bail()
    .isLength({ max: 500 })
    .withMessage('摘要不能超过500个字符'),
  body('category_id')
    .notEmpty()
    .withMessage('请选择分类')
    .bail()
    .isInt()
    .withMessage('分类ID必须是整数'),
  body('tags')
    .optional()
    .isString()
    .withMessage('标签必须是字符串')
    .bail()
    .custom((value) => {
      normalizeTags(value)
      return true
    }),
  body('cover_image')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('封面图必须是字符串')
    .bail()
    .isLength({ max: 500 })
    .withMessage('封面图不能超过500个字符')
    .matches(/^(https?:\/\/|\/uploads\/)/)
    .withMessage('封面图必须是 http(s) 链接或 /uploads/ 路径'),
  body('is_top').optional().isIn([0, 1, true, false]).withMessage('置顶值无效'),
  body('status').optional().isIn([0, 1]).withMessage('状态值无效'),
  // 发布时间必须可解析，否则 julianday() 排序、归档分组、sitemap lastmod 会连锁出错。
  // 控制器落库前会统一转成 UTC ISO 8601，这里只负责拦截完全无法解析的值
  body('published_at')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('发布时间必须是字符串')
    .bail()
    .isISO8601()
    .withMessage('发布时间必须是合法的 ISO 8601 时间'),
]

// 文章验证规则
const postRules = {
  create: [...postFieldRules, validate],
  update: [param('id').isInt().withMessage('文章ID必须是整数'), ...postFieldRules, validate],
  getById: [param('id').isInt().withMessage('文章ID必须是整数'), validate],
  list: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    query('status').optional({ checkFalsy: true }).isIn(['0', '1']).withMessage('状态值无效'),
    query('category')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('分类参数无效')
      .bail()
      .isLength({ max: 50 })
      .withMessage('分类参数过长'),
    query('tag')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('标签参数无效')
      .bail()
      .isLength({ max: 50 })
      .withMessage('标签参数过长'),
    query('sort').optional({ checkFalsy: true }).isIn(['recent']).withMessage('排序参数无效'),
    query('keyword')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('关键词必须是字符串')
      .bail()
      .isLength({ max: 100 })
      .withMessage('关键词不能超过100个字符'),
    validate,
  ],
  adminList: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize')
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage('每页数量必须在0-50之间（0表示不分页）'),
    query('status').optional({ checkFalsy: true }).isIn(['0', '1']).withMessage('状态值无效'),
    query('category')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('分类参数无效')
      .bail()
      .isLength({ max: 50 })
      .withMessage('分类参数过长'),
    query('tag')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('标签参数无效')
      .bail()
      .isLength({ max: 50 })
      .withMessage('标签参数过长'),
    query('sort').optional({ checkFalsy: true }).isIn(['recent']).withMessage('排序参数无效'),
    query('keyword')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('关键词必须是字符串')
      .bail()
      .isLength({ max: 100 })
      .withMessage('关键词不能超过100个字符'),
    validate,
  ],
  archive: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    validate,
  ],
  sortOrder: [
    body('posts')
      .isArray({ min: 1, max: 1000 })
      .withMessage('排序数据必须是非空数组且不超过1000条'),
    body('posts.*.id').isInt({ min: 1 }).withMessage('文章ID必须是正整数'),
    body('posts.*.sort_order').isInt().withMessage('排序值必须是整数'),
    validate,
  ],
  search: [
    query('keyword')
      .optional()
      .isString()
      .withMessage('搜索关键词必须是字符串')
      .bail()
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
      .isString()
      .withMessage('用户名必须是字符串')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('用户名不能为空')
      .isLength({ min: 3, max: 30 })
      .withMessage('用户名长度必须在3-30之间'),
    body('password')
      .isString()
      .withMessage('密码必须是字符串')
      .bail()
      .notEmpty()
      .withMessage('密码不能为空')
      .isLength({ min: 6 })
      .withMessage('密码长度不能少于6位')
      .custom((value) => Buffer.byteLength(value, 'utf-8') <= 72)
      .withMessage('密码过长（加密算法最多处理72字节），请缩短后重试'),
    validate,
  ],
  changePassword: [
    body('oldPassword')
      .isString()
      .withMessage('旧密码必须是字符串')
      .bail()
      .notEmpty()
      .withMessage('旧密码不能为空'),
    body('newPassword')
      .isString()
      .withMessage('新密码必须是字符串')
      .bail()
      .notEmpty()
      .withMessage('新密码不能为空')
      .isLength({ min: 6 })
      .withMessage('新密码长度不能少于6位')
      // bcrypt 只处理前 72 字节，超长部分会被静默截断。按 UTF-8 字节数而非字符数
      // 校验，与 create-admin.js 的 PASSWORD_MAX_BYTES 同一口径（中文密码尤其要按字节算）
      .custom((value) => Buffer.byteLength(value, 'utf-8') <= 72)
      .withMessage('新密码过长（加密算法最多处理72字节），请缩短后重试'),
    validate,
  ],
  updateProfile: [
    body('nickname')
      .optional()
      .isString()
      .withMessage('昵称必须是字符串')
      .bail()
      .trim()
      .isLength({ max: 50 })
      .withMessage('昵称不能超过50个字符'),
    // 仅允许站内 /uploads/ 路径：放行任意 / 开头会连 //evil.com 这类协议相对 URL 一起通过
    body('avatar')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('头像必须是字符串')
      .bail()
      .isLength({ max: 500 })
      .withMessage('头像路径过长')
      .matches(/^\/uploads\//)
      .withMessage('头像必须是 /uploads/ 下的站内路径'),
    validate,
  ],
}

// 分类验证规则
const categoryRules = {
  create: [
    body('name')
      .isString()
      .withMessage('分类名称必须是字符串')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('分类名称不能为空')
      .isLength({ max: 50 })
      .withMessage('分类名称不能超过50个字符'),
    body('slug')
      .isString()
      .withMessage('分类别名必须是字符串')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('分类别名不能为空')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('分类别名只能包含小写字母、数字和连字符')
      .isLength({ max: 50 })
      .withMessage('分类别名不能超过50个字符'),
    body('sort').optional({ checkFalsy: true }).isInt().withMessage('排序值必须是整数'),
    body('description')
      .optional()
      .isString()
      .withMessage('分类描述必须是字符串')
      .bail()
      .isLength({ max: 200 })
      .withMessage('分类描述不能超过200个字符'),
    validate,
  ],
  update: [
    param('id').isInt().withMessage('分类ID必须是整数'),
    body('name')
      .isString()
      .withMessage('分类名称必须是字符串')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('分类名称不能为空')
      .isLength({ max: 50 })
      .withMessage('分类名称不能超过50个字符'),
    body('slug')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('分类别名必须是字符串')
      .bail()
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('分类别名只能包含小写字母、数字和连字符')
      .isLength({ max: 50 })
      .withMessage('分类别名不能超过50个字符'),
    body('description')
      .optional()
      .isString()
      .withMessage('分类描述必须是字符串')
      .bail()
      .isLength({ max: 200 })
      .withMessage('分类描述不能超过200个字符'),
    body('sort').optional({ checkFalsy: true }).isInt().withMessage('排序值必须是整数'),
    validate,
  ],
  delete: [param('id').isInt().withMessage('分类ID必须是整数'), validate],
}

module.exports = {
  postRules,
  authRules,
  categoryRules,
}
