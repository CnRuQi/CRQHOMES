/**
 * require-auth-middleware
 *
 * POST/PUT/DELETE 路由必须包含 authenticate 中间件。
 * 登录路由（/login）除外。
 *
 * AGENT FIX: 在路由定义中添加 authenticate 中间件。
 * 参考: docs/tasks/new-api.md → 步骤 4
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '写操作路由必须包含认证中间件（登录除外）',
      category: 'Security',
    },
    messages: {
      missingAuth:
        '写操作路由 ({{method}}) 缺少 authenticate 认证中间件。' +
        '请在路由中添加 authenticate。' +
        '参考: server/middleware/auth.js 和 docs/tasks/new-api.md',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename()
    const isRouteFile = /[\\/]routes[\\/]/.test(filename)

    if (!isRouteFile) return {}

    return {
      CallExpression(node) {
        // 检测 router.post(), router.put(), router.delete()
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'router' &&
          node.callee.property.type === 'Identifier' &&
          ['post', 'put', 'delete'].includes(node.callee.property.name)
        ) {
          const method = node.callee.property.name
          const args = node.arguments

          // 获取路径参数
          const pathArg = args[0]
          let pathStr = ''
          if (pathArg && pathArg.type === 'Literal') {
            pathStr = pathArg.value
          }

          // 登录路由豁免
          if (pathStr === '/login') return

          // 检查中间件中是否包含 authenticate
          const middlewares = args.slice(1)
          const hasAuth = middlewares.some((arg) => {
            if (arg.type === 'Identifier' && arg.name === 'authenticate') {
              return true
            }
            return false
          })

          if (!hasAuth) {
            context.report({
              node,
              messageId: 'missingAuth',
              data: { method },
            })
          }
        }
      },
    }
  },
}
