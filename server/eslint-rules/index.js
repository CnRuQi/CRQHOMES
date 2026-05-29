/**
 * 披花沐雪自定义 ESLint 规则
 *
 * 这些规则为 AI Agent 提供架构约束和安全防护。
 * 每条规则的错误信息都包含修复指导和参考链接。
 */

module.exports = {
  'no-direct-db-in-routes': require('./no-direct-db-in-routes'),
  'require-input-validation': require('./require-input-validation'),
  'no-sql-concat': require('./no-sql-concat'),
  'require-auth-middleware': require('./require-auth-middleware'),
}
