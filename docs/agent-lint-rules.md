# Agent 错误提示参考

> 当 ESLint 自定义规则报错时，Agent 可按此文档定位问题和修复方案。

---

## custom-rules/no-direct-db-in-routes

**问题：** Routes 文件中直接导入了 `../db` 模块。

**修复：**
1. 将 db 相关代码移到对应的 controller 文件中
2. 在 controller 中导入 `const { getDb } = require('../db')`
3. 在 route 中只调用 controller 方法

**示例：**
```javascript
// 错误：routes/sitemap.js
const { getDb } = require('../db')  // 禁止

// 正确：controllers/sitemapController.js
const { getDb } = require('../db')  // 允许

// 正确：routes/sitemap.js
const { getSitemapData } = require('../controllers/sitemapController')
```

**参考：** `docs/architecture.md` → 依赖方向

---

## custom-rules/require-input-validation

**问题：** POST/PUT/PATCH 路由缺少输入验证中间件。

**修复：**
1. 在 `server/middleware/validator.js` 中定义验证规则
2. 在路由中添加规则中间件

**示例：**
```javascript
// 错误
router.post('/', authenticate, controller.create)

// 正确
router.post('/', authenticate, postRules.create, controller.create)
```

**参考：** `server/middleware/validator.js`、`docs/tasks/new-api.md`

---

## custom-rules/no-sql-concat

**问题：** SQL 查询中使用了字符串拼接，存在注入风险。

**修复：**
使用参数化查询，用 `?` 占位符替代拼接。

**示例：**
```javascript
// 错误
db.prepare(`SELECT * FROM posts WHERE id = ${id}`).get()
db.prepare('SELECT * FROM posts WHERE title = "' + title + '"').get()

// 正确
db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
db.prepare('SELECT * FROM posts WHERE title = ?').get(title)
```

**参考：** `docs/core-beliefs.md` → 信念 1（安全第一）

---

## custom-rules/require-auth-middleware

**问题：** POST/PUT/DELETE 路由缺少 `authenticate` 认证中间件。

**修复：**
在路由定义中添加 `authenticate` 中间件。

**示例：**
```javascript
// 错误
router.post('/', postRules.create, controller.create)

// 正确
router.post('/', authenticate, postRules.create, controller.create)
```

**例外：** 登录路由 `/login` 不需要 authenticate。

**参考：** `server/middleware/auth.js`、`docs/tasks/new-api.md`
