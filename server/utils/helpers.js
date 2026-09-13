// 成功响应
function success(res, data = null, message = '操作成功') {
  return res.json({
    code: 200,
    message,
    data,
  })
}

// 分页响应
function paginate(res, { list, total, page, pageSize }) {
  return res.json({
    code: 200,
    message: '获取成功',
    data: {
      list,
      pagination: {
        total,
        page,
        pageSize: pageSize ?? 0,
        totalPages: pageSize ? Math.ceil(total / pageSize) : 1,
      },
    },
  })
}

function paginationError(message) {
  const error = new Error(message)
  error.statusCode = 400
  return error
}

function parseQueryInteger(value, field) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw paginationError(`${field}必须是整数`)
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) {
    throw paginationError(`${field}超出允许范围`)
  }
  return parsed
}

// 解析分页参数；公开接口拒绝不分页和非法值，后台全量列表需显式允许 pageSize=0
function parsePagination(query = {}, { allowUnbounded = false, defaultPageSize = 10 } = {}) {
  const page =
    query.page === undefined || query.page === '' ? 1 : parseQueryInteger(query.page, '页码')
  if (page < 1) {
    throw paginationError('页码必须是正整数')
  }

  let pageSize
  if (query.pageSize === undefined || query.pageSize === '') {
    pageSize = defaultPageSize
  } else {
    const rawPageSize = parseQueryInteger(query.pageSize, '每页数量')
    if (rawPageSize === 0) {
      if (!allowUnbounded) {
        throw paginationError('公开接口不允许不分页')
      }
      pageSize = null
    } else {
      pageSize = rawPageSize
    }
  }

  if (pageSize !== null && (pageSize < 1 || pageSize > 50)) {
    throw paginationError('每页数量必须在1-50之间')
  }

  const offset = pageSize === null ? 0 : (page - 1) * pageSize
  if (!Number.isSafeInteger(offset)) {
    throw paginationError('分页范围超出允许范围')
  }

  return { page, pageSize, offset }
}

const TAG_MAX_COUNT = 20
const TAG_MAX_LENGTH = 50
const TAG_MAX_TOTAL_LENGTH = 500

// 统一规范化并限制标签，避免输入、数据库和响应各自采用不同规则
function normalizeTags(tags) {
  if (tags === undefined || tags === null || tags === '') return []

  const values = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',') : null
  if (!values) {
    throw new Error('标签必须是字符串')
  }

  const normalized = values
    .map((tag) => {
      if (typeof tag !== 'string') {
        throw new Error('标签必须是字符串')
      }
      return tag.trim()
    })
    .filter(Boolean)

  if (normalized.length > TAG_MAX_COUNT) {
    throw new Error(`标签数量不能超过${TAG_MAX_COUNT}个`)
  }
  if (normalized.some((tag) => tag.length > TAG_MAX_LENGTH)) {
    throw new Error(`单个标签不能超过${TAG_MAX_LENGTH}个字符`)
  }
  if (normalized.join(',').length > TAG_MAX_TOTAL_LENGTH) {
    throw new Error(`标签总长度不能超过${TAG_MAX_TOTAL_LENGTH}个字符`)
  }

  return normalized
}

// 解析数据库中的标签字符串；与写入前使用同一套规范化规则
function parseTags(tags) {
  return normalizeTags(tags)
}

module.exports = {
  success,
  paginate,
  parsePagination,
  normalizeTags,
  parseTags,
}
