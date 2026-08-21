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

// 解析分页参数；pageSize=0 表示不分页（返回全部）
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const rawPageSize = parseInt(query.pageSize, 10)
  let pageSize
  if (rawPageSize === 0) {
    pageSize = null
  } else {
    pageSize = Math.min(50, Math.max(1, rawPageSize || 10))
  }
  const offset = pageSize ? (page - 1) * pageSize : 0

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
