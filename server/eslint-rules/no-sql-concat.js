/**
 * no-sql-concat
 *
 * 禁止在 SQL 查询中使用字符串拼接。
 * 检测模板字符串中直接将用户输入拼入 SQL WHERE/VALUES 子句的模式。
 *
 * AGENT FIX: 使用参数化查询，用 ? 占位符替代拼接。
 * 参考: docs/core-beliefs.md → 信念 1（安全第一）
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止 SQL 字符串拼接，必须使用参数化查询',
      category: 'Security',
    },
    messages: {
      noSqlConcat:
        '检测到 SQL 字符串拼接，存在注入风险。' +
        '请使用参数化查询（? 占位符）。' +
        '示例: db.prepare("SELECT * FROM posts WHERE id = ?").get(id)',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.getSourceCode()

    // SQL 子句关键字，用于识别 SQL 查询上下文
    const sqlClausePattern =
      /SELECT\s|INSERT\sINTO|UPDATE\s|DELETE\sFROM|WHERE\s|VALUES\s\(|SET\s|FROM\s|JOIN\s/i

    // 危险的拼接模式：表达式直接出现在 SQL 子句中
    const dangerousConcatPattern = /WHERE\s+.*\$\{|VALUES\s*\(.*\$\{|SET\s+.*\$\{|=.*\$\{/i

    return {
      // 检测模板字符串中的危险 SQL 拼接
      TemplateLiteral(node) {
        const text = sourceCode.getText(node)

        // 必须是 SQL 查询上下文
        if (!sqlClausePattern.test(text)) return

        // 必须有表达式插值
        if (node.expressions.length === 0) return

        // 检查是否有危险的拼接模式（表达式出现在值位置）
        if (dangerousConcatPattern.test(text)) {
          context.report({
            node,
            messageId: 'noSqlConcat',
          })
        }
      },
    }
  },
}
