# 新增 API 端点

> 步骤化的任务指南，AI Agent 可按此流程执行。

---

## 前置条件
- 明确新 API 的用途、路径、HTTP 方法
- 确认是否需要认证

---

## 步骤

### 1. 定义数据库操作（如需要）

如果新 API 需要数据库操作，在 `server/db/` 中添加或修改：

```javascript
// server/db/index.js 中添加新方法
function getNewResource(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM table WHERE id = ?').get(id)
}
```

**规则：** SQL 必须使用 `?` 参数化查询。

### 2. 创建 Controller 函数

在 `server/controllers/` 对应文件中添加：

```javascript
// server/controllers/xxxController.js
function createResource(req, res, next) {
  try {
    // 1. 验证输入（已在 middleware/validator.js 中处理）
    const { name } = req.body
    
    // 2. 业务逻辑
    const result = db.createResource(name)
    
    // 3. 返回响应
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

module.exports = { createResource }
```

### 3. 添加输入验证（如需要）

在 `server/middleware/validator.js` 中添加：

```javascript
const validateResource = [
  body('name').trim().notEmpty().withMessage('名称不能为空'),
  body('name').isLength({ max: 100 }).withMessage('名称最多100字符'),
]
```

### 4. 注册路由

在 `server/routes/` 对应文件中添加：

```javascript
// server/routes/xxx.js
const { authenticate } = require('../middleware/auth')
const { validateResource } = require('../middleware/validator')
const controller = require('../controllers/xxxController')

router.post('/', authenticate, validateResource, controller.createResource)
```

### 5. 添加前端 API 调用

在 `client/src/api/` 对应文件中添加：

```javascript
// client/src/api/xxx.js
export function createResource(data) {
  return api.post('/resources', data)
}
```

### 6. 测试

- 使用 Postman 或 Apifox 测试 API
- 验证输入验证是否生效
- 验证错误处理是否正确

---

## 检查清单

- [ ] SQL 使用参数化查询
- [ ] Controller 有 try-catch 错误处理
- [ ] 输入验证在 middleware 中定义
- [ ] 需要认证的路由添加了 `authenticate` 中间件
- [ ] 响应格式符合 `success()` / `paginate()` 规范
- [ ] 前端 API 调用使用统一的 `api` 实例
