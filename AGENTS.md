# AGENTS.md - 披花沐雪开发指南

> 本文件是仓库级开发约束。v2.0.0 全面审计修复已完成并进入发布，后续维护以当前代码、审计证据和发布说明为准。

## 项目概览

Vue 3 + Express 5 + SQLite 个人博客系统。前端 Vite 构建，后端 REST API，数据存储在 `data/blog.db`。

## 当前审计进度（2026-09-13，v2.0.0）

### 已完成

- 生产配置改为 fail-closed：生产环境要求非占位 `JWT_SECRET`、不少于 32 个字符的密钥和有效 `SITE_URL`；`TRUST_PROXY` 支持明确的代理范围。
- 修正上传 URL、sitemap 的站点 URL来源、数据库 slug 迁移和唯一性约束，并补充迁移失败可观测性。
- 收紧文章、分类、个人资料和标签输入类型；文章更新区分“未提供”和“主动清空”，草稿/发布状态按有效值校验。
- 限制公开列表和搜索资源消耗；搜索增加限流，归档接口和前端支持分页，避免静默遗漏旧文章。
- 修复前台重复 `main`、登录表单语义、后台编辑器移动端布局、主题基础 token 和页面横向溢出问题。
- 前台文章使用 `MarkdownContent.vue` 以 Vue VNode 渲染，原始 HTML 被忽略，链接经过协议限制和 DOMPurify 防御；禁止 `v-html`。
- 新增后端配置、sitemap、上传、验证器、数据库、文章更新和 Markdown 安全回归测试。
- 完成后台真实流程、键盘排序、真实 Markdown、图片失败状态、暗色主题和空/错误状态的浏览器回归；CI 检查改为阻断式，并完成依赖树、数据库副本和发布证据核验。

### 已验证

- 后端 7 个测试文件、71 个用例通过；前端 6 个测试文件、35 个用例通过，共 106 个用例通过；`lint`、`format:check` 和构建均退出 0。
- Light 主题 8 个路由在 320、375、414、768、1440 CSS 像素宽度通过回归；Dark 主题关键页面、真实 Markdown、图片加载失败、键盘排序均通过；axe violations/incomplete 均为 0。
- root、server、client 的 `npm ci`、`npm ls` 和 `npm audit --offline` 已执行；离线审计结果来自本机缓存，不能替代联网漏洞库结论。
- 数据库副本迁移两次幂等，`PRAGMA integrity_check` 为 `ok`，行数保持 `users=1`、`posts=3`、`categories=2`，重复 slug 查询为空。

### 已知保留项

- 编辑器已按路由懒加载，但独立压缩 chunk 仍约 877.38 kB，Vite 保留 500 kB warning；这不影响公开首页加载，后续可继续拆分。
- `npm audit --offline` 只反映本机缓存结果，联网漏洞审计仍由 CI 负责。
- controllers 当前仍通过 `server/db/index.js` 获取连接并执行参数化 SQL；独立 data-access 层是后续架构整理目标，不作为 v2.0.0 的未修复缺陷。

审计执行清单和回填说明保存在：`docs/superpowers/plans/2026-09-12-full-audit-remediation.md`、`docs/superpowers/plans/2026-09-12-next-audit-steps.md`；浏览器与工程证据保存在：`docs/audits/browser-baseline-2026-09-13.md`。
文档目录索引：`docs/README.md`。

## 核心信念

- 安全优先，绝不引入 XSS / SQL 注入风险
- 前后端分离，前端只通过 `/api/*` 通信
- 所有写操作必须验证输入
- 代码变更必须通过 lint 和测试

完整信念：`docs/core-beliefs.md`

## 项目结构

```
server/          Express 后端
  controllers/   业务逻辑（auth、post、category）
  routes/        路由定义 → 调用 controller
  middleware/    auth.js(认证)、error.js(错误)、validator.js(验证)
  db/            schema.sql、index.js、init.js、create-admin.js、import-data.js
  config/        环境变量读取
client/          Vue 3 前端
  src/api/       Axios 封装（auth、post、category、upload）
  src/stores/    Pinia 状态（auth、post）
  src/views/     页面视图（Home、Post、Archives、admin/*）
  src/components/通用组件（Navbar、PostCard、Footer、Icon、Toast）
```

详细架构：`docs/architecture.md`；完整文档索引：`docs/README.md`

## 代码规范

- ESLint + Prettier 强制执行，提交前必须通过
- Vue 3 Composition API + `<script setup>`
- CommonJS（后端）/ ESM（前端）
- 命名：组件 PascalCase，文件 camelCase

完整规范：`docs/conventions.md`

## 开发命令

```bash
npm run lint          # 全量 lint
npm run format        # 格式化
npm test              # 全量测试
npm run lint:fix      # 自动修复
```

## 常见任务指引

- 新增 API 端点 → `docs/tasks/new-api.md`
- 新增 Vue 组件 → `docs/tasks/new-component.md`
- 数据库迁移 → `docs/tasks/db-migration.md`
- 安全修复 → `docs/tasks/security-fix.md`
- 打包升级文件 → `docs/tasks/packaging.md`

## 禁止事项

- 禁止 `v-html`（防 XSS），使用 Vue 模板绑定
- 禁止 SQL 字符串拼接（防注入），使用参数化查询 `?` 占位
- 禁止前端硬编码密钥或 token
- 禁止删除 ESLint / Prettier 配置文件
- 禁止在 route 文件中直接写数据库逻辑

以上规则由 ESLint 自定义规则强制执行。报错时参考：`docs/agent-lint-rules.md`

补充说明：当前 `routes/` 不直接访问数据库，`controllers/` 通过 `server/db/index.js` 获取连接并执行参数化 SQL；“所有 SQL 集中在独立 db 数据访问层”仍是后续架构整理目标，不能在文档中当作当前事实。

## 数据库

SQLite，表结构见 `server/db/schema.sql`。4 张核心表：

- `users` - 管理员
- `posts` - 文章
- `categories` - 分类
- `view_tracking` - 浏览防刷记录

## 生产配置底线

- `NODE_ENV=production` 时必须设置有效的 `SITE_URL`，只能使用 `http` 或 `https` 绝对 URL，不能带用户名、密码、查询串或片段。
- `JWT_SECRET` 必须是随机、非占位值，生产环境长度至少 32 个字符；可用 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 生成。
- `CORS_ORIGIN` 应设置为实际前端源；启用 `TRUST_PROXY` 前必须确认代理会覆盖而不是追加伪造的 `X-Forwarded-For`。
- 生产认证 cookie 带 `Secure` 标志，站点必须通过 HTTPS 提供；上传目录默认是 `server/uploads/`，通过 `/uploads/` 静态路径访问。
- 不要把 `.env`、SQLite 数据库、真实上传文件、浏览器状态和构建产物加入提交。

## 文档与个人文件

- 项目文档统一放在 `docs/`，当前采用 Markdown；文档分类和入口见 `docs/README.md`。架构、规范等稳定参考资料位于根目录，审计记录位于 `docs/audits/`，任务指引、发布说明和执行计划位于对应子目录。
- `.gitignore` 忽略个人 `.docx`、压缩包、`.env`、数据库和上传内容。当前仓库没有 `docx/` 文件夹，也没有可供清理的 `.docx` 文件；未经确认不要删除 `docs/` 下的 Markdown 资料。
