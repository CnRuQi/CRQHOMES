/**
 * no-direct-db-in-routes
 *
 * Routes 文件中禁止直接导入或调用 db 模块。
 * 数据库操作必须放在 controllers 层。
 *
 * AGENT FIX: 将 db 相关代码移到对应的 controller 文件中。
 * 参考: docs/architecture.md → 依赖方向
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在 routes 文件中直接导入 db 模块',
      category: 'Architecture',
    },
    messages: {
      noDbInRoutes:
        'Routes 文件中禁止直接导入 db 模块。' +
        '请将数据库操作移到对应的 controller 中。' +
        '参考: docs/architecture.md',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename()
    const isRouteFile = /[\\/]routes[\\/]/.test(filename)

    if (!isRouteFile) return {}

    return {
      ImportDeclaration(node) {
        if (node.source.value.includes('/db') || node.source.value === '../db') {
          context.report({
            node,
            messageId: 'noDbInRoutes',
          })
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal' &&
          (node.arguments[0].value.includes('/db') || node.arguments[0].value === '../db')
        ) {
          context.report({
            node,
            messageId: 'noDbInRoutes',
          })
        }
      },
    }
  },
}
