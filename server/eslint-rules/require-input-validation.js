/**
 * require-input-validation
 *
 * POST/PUT/PATCH 路由必须包含验证中间件。
 * 检测 router.post/put/patch 调用中是否包含 *Rules.xxx 或 validate 中间件。
 *
 * AGENT FIX: 在路由定义中添加验证规则中间件。
 * 参考: docs/tasks/new-api.md → 步骤 3
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'POST/PUT/PATCH 路由必须包含输入验证中间件',
      category: 'Security',
    },
    messages: {
      missingValidation:
        '写操作路由 ({{method}}) 缺少输入验证中间件。' +
        '请在路由中添加 validator 规则。' +
        '参考: server/middleware/validator.js 和 docs/tasks/new-api.md',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename()
    const isRouteFile = /[\\/]routes[\\/]/.test(filename)

    if (!isRouteFile) return {}

    return {
      CallExpression(node) {
        // 检测 router.post(), router.put(), router.patch()
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'router' &&
          node.callee.property.type === 'Identifier' &&
          ['post', 'put', 'patch'].includes(node.callee.property.name)
        ) {
          const method = node.callee.property.name
          const args = node.arguments

          // 跳过第一个参数（路径），检查后续参数
          const middlewares = args.slice(1)
          const hasValidation = middlewares.some((arg) => {
            // 检测 *Rules.xxx 模式
            if (
              arg.type === 'MemberExpression' &&
              arg.object.type === 'Identifier' &&
              /Rules$/.test(arg.object.name)
            ) {
              return true
            }
            // 检测 validate 函数
            if (arg.type === 'Identifier' && arg.name === 'validate') {
              return true
            }
            // 检测 body/param/query 调用（内联验证）
            if (
              arg.type === 'CallExpression' &&
              arg.callee.type === 'Identifier' &&
              ['body', 'param', 'query'].includes(arg.callee.name)
            ) {
              return true
            }
            // 检测 multer 上传中间件（upload.single/array/fields/none）
            if (
              arg.type === 'CallExpression' &&
              arg.callee.type === 'MemberExpression' &&
              arg.callee.property.type === 'Identifier' &&
              ['single', 'array', 'fields', 'none'].includes(arg.callee.property.name)
            ) {
              return true
            }
            return false
          })

          if (!hasValidation) {
            context.report({
              node,
              messageId: 'missingValidation',
              data: { method },
            })
          }
        }
      },
    }
  },
}
