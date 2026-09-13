# 项目文档

> `docs/` 只保存项目 Markdown 文档。个人文档、数据库、上传文件和构建产物不属于这里，相关忽略规则见根目录 `.gitignore`。

## 从这里开始

- [README.md](../README.md)：项目概览、安装、启动、部署和 API 说明
- [AGENTS.md](../AGENTS.md)：仓库级开发约束、当前审计进度和提交前底线
- [agent-workflow.md](agent-workflow.md)：从任务确认到提交前检查的工作流程
- [2026-09-12 后续审计计划](superpowers/plans/2026-09-12-next-audit-steps.md)：本轮浏览器回归、性能、CI、依赖、数据库和发布验证记录

## 规范与参考

| 文档                                       | 用途                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)         | 系统边界、依赖方向、数据库和安全架构约束。当前 controllers 通过 `server/db/index.js` 执行参数化 SQL，独立数据访问层仍是后续整理目标。 |
| [conventions.md](conventions.md)           | Vue、Express、API、命名、Git 和格式化规范                                                                                             |
| [core-beliefs.md](core-beliefs.md)         | 安全、分层、可测试性和错误处理等长期开发原则                                                                                          |
| [design.md](design.md)                     | 颜色、字体、纹理、按钮和响应式设计规范                                                                                                |
| [agent-lint-rules.md](agent-lint-rules.md) | 自定义 ESLint 规则的错误含义、修复方向和参考文件                                                                                      |

## 任务指引

新增或修改功能前，先阅读 [agent-workflow.md](agent-workflow.md)，再按任务类型选择对应指引：

- [新增 API 端点](tasks/new-api.md)
- [新增 Vue 组件](tasks/new-component.md)
- [数据库迁移](tasks/db-migration.md)
- [安全修复](tasks/security-fix.md)
- [打包升级文件](tasks/packaging.md)

## 审计记录

以下报告保留历史问题、修复状态和验证上下文，不因当前问题已经修复而删除：

- [2026-08-29 第一轮代码审查](audits/code-review-2026-08-29.md)
- [2026-08-31 第二轮代码审查](audits/code-review-2026-08-31-round2.md)
- [2026-09-13 浏览器与工程回归基线](audits/browser-baseline-2026-09-13.md)

## 发布说明

版本变更记录按版本保存在 [releases/](releases/)：

- [v2.0.0](releases/v2.0.0.md)
- [v1.4.1](releases/v1.4.1.md)
- [v1.4.0](releases/v1.4.0.md)
- [v1.3.3](releases/v1.3.3.md)
- [v1.3.2](releases/v1.3.2.md)
- [v1.3.0](releases/v1.3.0.md)
- [v1.2.1](releases/v1.2.1.md)
- [v1.2.0](releases/v1.2.0.md)

## 审计计划

- [全面审计修复总计划](superpowers/plans/2026-09-12-full-audit-remediation.md)：记录本轮修复范围、最终状态和未重放的历史流程步骤
- [后续审计计划](superpowers/plans/2026-09-12-next-audit-steps.md)：记录浏览器回归、性能、CI、依赖、数据库和发布验证

## 维护规则

- 稳定的规范文档放在 `docs/` 根目录；审计记录放在 `docs/audits/`；任务指引放在 `docs/tasks/`；发布说明放在 `docs/releases/`；执行计划放在 `docs/superpowers/plans/`。
- 新增文档后同步更新本索引和必要的根目录说明。
- 删除文档前先用 `rg` 检查代码、CI、发布说明和其他文档的引用，并确认不再需要历史追溯。
- 当前仓库没有 `docx/` 文件夹，也没有 `.docx` 或 `.doc` 文件；本次整理未发现可安全删除的项目文档。
