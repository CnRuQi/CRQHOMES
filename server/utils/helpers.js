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
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  })
}

// 解析分页参数
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize, 10) || 10))
  const offset = (page - 1) * pageSize

  return { page, pageSize, offset }
}

// 解析标签字符串
function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

module.exports = {
  success,
  paginate,
  parsePagination,
  parseTags,
}
