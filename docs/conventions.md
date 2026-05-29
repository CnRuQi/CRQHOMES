# 代码规范

> 披花沐雪 - 代码风格和组织规范

---

## 一、通用规范

### 文件组织

| 规则 | 说明 |
|------|------|
| 一个文件一个职责 | 不在一个文件中混合多种功能 |
| 文件名 camelCase | `postController.js`、`authStore.js` |
| 组件文件 PascalCase | `PostCard.vue`、`Navbar.vue` |
| 测试文件 | `*.test.js` 或 `*.spec.js`，与源文件同目录或 `__tests__/` |

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `getPostById`、`isAuthenticated` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`、`JWT_SECRET` |
| 组件 | PascalCase | `PostCard`、`MarkdownEditor` |
| CSS 类名 | kebab-case | `glass-card`、`nav-link` |
| 数据库表 | snake_case | `view_tracking`、`category_id` |
| API 路径 | kebab-case | `/api/posts`、`/api/auth/login` |

---

## 二、前端规范（Vue 3）

### 组件结构

```vue
<script setup>
// 1. 导入
import { ref, onMounted } from 'vue'
import { usePostStore } from '@/stores/post'

// 2. Store / Props
const postStore = usePostStore()

// 3. 响应式状态
const loading = ref(false)

// 4. 计算属性
const posts = computed(() => postStore.posts)

// 5. 方法
async function fetchPosts() { ... }

// 6. 生命周期
onMounted(() => { fetchPosts() })
</script>

<template>
  <!-- 使用 Composition API 的响应式数据 -->
</template>

<style scoped>
/* 组件样式 */
</style>
```

### Vue 规则

| 规则 | 说明 |
|------|------|
| 使用 `<script setup>` | 不用 Options API |
| Props 声明类型 | 使用 `defineProps` 并声明类型 |
| 禁用 `v-html` | 防 XSS，使用文本绑定 |
| 组件名多单词 | 避免与 HTML 元素冲突 |
| Scoped 样式 | 默认使用 `<style scoped>` |

### 前端文件组织

```
src/
  api/          # Axios 请求封装（按资源分文件）
  assets/       # 静态资源（CSS、图片）
  components/   # 可复用组件
  router/       # 路由配置
  stores/       # Pinia 状态管理
  views/        # 页面组件
    admin/      # 后台管理页面
```

---

## 三、后端规范（Express）

### 路由文件结构

```javascript
const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { validatePost } = require('../middleware/validator')
const postController = require('../controllers/postController')

// 公开路由
router.get('/', postController.getPosts)
router.get('/:id', postController.getPostById)

// 需要认证的路由
router.post('/', authenticate, validatePost, postController.createPost)
router.put('/:id', authenticate, validatePost, postController.updatePost)
router.delete('/:id', authenticate, postController.deletePost)

module.exports = router
```

### Controller 文件结构

```javascript
const { getDb } = require('../db')
const { AppError } = require('../middleware/error')
const { success, paginate } = require('../utils/helpers')

// 获取列表
function getPosts(req, res, next) {
  try {
    // 1. 解析参数
    // 2. 查询数据库
    // 3. 返回结果
    res.json(success(data))
  } catch (error) {
    next(error)
  }
}

module.exports = { getPosts, getPostById, createPost }
```

### 后端规则

| 规则 | 说明 |
|------|------|
| CommonJS | 使用 `require` / `module.exports` |
| 错误处理 | 使用 try-catch + `next(error)` |
| 参数化查询 | SQL 使用 `?` 占位符 |
| 控制器导出 | 每个函数单独导出 |
| 环境变量 | 通过 `config/index.js` 统一管理 |

---

## 四、API 规范

### 响应格式

```json
// 成功
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 分页
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}

// 错误
{
  "code": 400,
  "message": "错误描述"
}
```

### HTTP 方法

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 查询 | `GET /api/posts` |
| POST | 创建 | `POST /api/posts` |
| PUT | 更新 | `PUT /api/posts/:id` |
| DELETE | 删除 | `DELETE /api/posts/:id` |

---

## 五、Git 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>
```

### Type 类型

| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 |
| docs | 文档 |
| style | 格式（不影响功能） |
| refactor | 重构 |
| test | 测试 |
| chore | 构建/工具 |

---

## 六、ESLint 规则概要

### 核心规则

- `no-console`: warn（开发允许，生产警告）
- `no-unused-vars`: error（未使用变量必须清理）
- `no-eval`: error（禁止 eval）
- `vue/no-v-html`: error（禁止 v-html）

### Prettier 规则

- 无分号
- 单引号
- 2 空格缩进
- 行宽 100
- 尾逗号 es5

详见 `.prettierrc` 配置文件。
