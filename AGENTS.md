# AGENTS.md - 披花沐雪开发指南

## 项目概览
Vue 3 + Express 5 + SQLite 个人博客系统。前端 Vite 构建，后端 REST API，数据存储在 `data/blog.db`。

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
  db/            schema.sql、init.js、migrate.js
  config/        环境变量读取
client/          Vue 3 前端
  src/api/       Axios 封装（auth、post、category、upload）
  src/stores/    Pinia 状态（auth、post）
  src/views/     页面视图（Home、Post、Archives、admin/*）
  src/components/通用组件（Navbar、PostCard、Footer、Icon、Toast）
```

详细架构：`docs/architecture.md`

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
- 数据库迁移   → `docs/tasks/db-migration.md`
- 安全修复     → `docs/tasks/security-fix.md`

## 禁止事项
- 禁止 `v-html`（防 XSS），使用 Vue 模板绑定
- 禁止 SQL 字符串拼接（防注入），使用参数化查询 `?` 占位
- 禁止前端硬编码密钥或 token
- 禁止删除 ESLint / Prettier 配置文件
- 禁止在 route 文件中直接写数据库逻辑

以上规则由 ESLint 自定义规则强制执行。报错时参考：`docs/agent-lint-rules.md`

## 数据库
SQLite，表结构见 `server/db/schema.sql`。4 张核心表：
- `users` - 管理员
- `posts` - 文章
- `categories` - 分类
- `view_tracking` - 浏览防刷记录
