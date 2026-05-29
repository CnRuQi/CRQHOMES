# Agent 工作流程

> AI Agent 在此项目中工作的标准流程。

---

## 开始工作前

1. **读取 AGENTS.md** — 了解项目结构和规则
2. **确认任务类型** — 查找对应的 `docs/tasks/*.md`
3. **运行检查** — `.\scripts\agent-check.ps1` 确认当前状态

---

## 编码过程中

### 新增 API 端点
1. 阅读 `docs/tasks/new-api.md`
2. 在 controller 中编写业务逻辑
3. 在 `middleware/validator.js` 中添加验证规则
4. 在 route 中注册（必须包含 authenticate + 验证中间件）
5. 自定义规则会自动拦截违规行为

### 新增 Vue 组件
1. 阅读 `docs/tasks/new-component.md`
2. 使用 `<script setup>` 语法
3. Props 声明类型和默认值
4. 禁止 `v-html`

### 修改数据库
1. 阅读 `docs/tasks/db-migration.md`
2. 更新 `db/schema.sql`
3. 更新 `db/migrate.js`（幂等检查）
4. SQL 必须使用 `?` 参数化查询

### 修复安全问题
1. 阅读 `docs/tasks/security-fix.md`
2. 按清单逐项检查

---

## 提交前

### 自动检查
```powershell
.\scripts\agent-check.ps1
```

### 自动修复
```powershell
.\scripts\agent-fix.ps1
```

### 手动检查清单
- [ ] `npm run lint` 无 error
- [ ] `npm run format:check` 通过
- [ ] `npm test` 全部通过
- [ ] 无安全隐患（XSS、SQL 注入、文件上传漏洞）

---

## ESLint 自定义规则

当自定义规则报错时，错误信息包含修复指导。详细参考：`docs/agent-lint-rules.md`

| 规则 | 拦截内容 |
|------|---------|
| `no-direct-db-in-routes` | routes 中导入 db |
| `require-input-validation` | 写操作缺少验证 |
| `no-sql-concat` | SQL 字符串拼接 |
| `require-auth-middleware` | 写操作缺少认证 |

---

## CI/CD 流水线

Push 或 PR 到 main 分支时自动运行：
1. Lint 检查（前端 + 后端）
2. 格式检查
3. 测试（前端 + 后端）
4. 前端构建

详见 `.github/workflows/ci.yml`

---

## 定期保洁

每周一凌晨自动运行：
1. ESLint 自动修复
2. Prettier 格式化
3. 测试验证
4. 如有变更，自动创建 PR

详见 `.github/workflows/code-cleanup.yml`
