# 安全修复

> 步骤化的任务指南，AI Agent 可按此流程执行。

---

## 常见安全问题

### 1. XSS（跨站脚本攻击）

**问题：** 用户输入被直接渲染到页面。

**修复：**
```vue
<!-- 错误 -->
<div v-html="userInput"></div>

<!-- 正确 -->
<div>{{ userInput }}</div>
```

**规则：** 禁止使用 `v-html`，使用 Vue 模板绑定。

### 2. SQL 注入

**问题：** SQL 查询使用字符串拼接。

**修复：**
```javascript
// 错误
db.prepare(`SELECT * FROM posts WHERE id = ${id}`).get()

// 正确
db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
```

**规则：** 所有 SQL 必须使用 `?` 参数化查询。

### 3. 文件上传漏洞

**问题：** 未验证上传文件的类型和大小。

**修复：**
```javascript
// 在 routes/upload.js 中验证
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError('不支持的文件类型', 400))
    }
  }
})
```

### 4. JWT 密钥泄露

**问题：** JWT 密钥硬编码在代码中。

**修复：**
```javascript
// 使用环境变量
const secret = process.env.JWT_SECRET
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('生产环境必须设置 JWT_SECRET')
}
```

### 5. 未验证输入

**问题：** POST/PUT 请求未验证输入数据。

**修复：**
```javascript
// 在 middleware/validator.js 中添加验证
const validatePost = [
  body('title').trim().notEmpty().withMessage('标题不能为空'),
  body('title').isLength({ max: 200 }).withMessage('标题最多200字符'),
  body('content').trim().notEmpty().withMessage('内容不能为空'),
]
```

---

## 安全检查清单

在修复安全问题后，检查：

- [ ] 所有 SQL 使用参数化查询
- [ ] 没有使用 `v-html`
- [ ] 上传文件验证了类型和大小
- [ ] JWT 密钥来自环境变量
- [ ] 所有写操作有输入验证
- [ ] 密码使用 bcrypt 加密
- [ ] 有速率限制保护
- [ ] 使用 Helmet 安全头
