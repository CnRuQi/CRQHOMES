# 架构约束文档

> 披花沐雪 - 系统架构与依赖方向

---

## 一、整体架构

```
┌─────────────────────────────────────────────────┐
│                   浏览器                         │
│              Vue 3 SPA (Vite)                    │
└─────────────┬───────────────────────────────────┘
              │ HTTP (localhost:5173 → :3000)
              │ /api/* + /uploads/*
┌─────────────▼───────────────────────────────────┐
│              Express 5 Server                    │
│  ┌──────────┬──────────┬──────────┬───────────┐ │
│  │  routes  │  middle  │  ctrl    │  utils    │ │
│  │  auth    │  auth    │  auth    │  helpers  │ │
│  │  post    │  error   │  post    │           │ │
│  │  category│  validat │  category│           │ │
│  │  upload  │          │          │           │ │
│  │  sitemap │          │          │           │ │
│  └────┬─────┴──────────┴────┬─────┴───────────┘ │
│       │                     │                    │
│  ┌────▼─────────────────────▼─────────────────┐ │
│  │         better-sqlite3 (db/)               │ │
│  │         data/blog.db                       │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 二、依赖方向（严格单向）

```
routes → controllers → db
  ↓          ↓
middleware  utils
```

| 规则 | 说明 |
|------|------|
| routes 只做路由映射 | 禁止在 route 中写业务逻辑或 SQL |
| controllers 处理业务 | 可调用 db、utils，不可调用 routes |
| middleware 前置处理 | auth、validation、error 处理 |
| db 层封装数据操作 | 所有 SQL 集中在此，禁止散落在其他层 |
| utils 纯函数工具 | 无副作用，不依赖其他层 |

**禁止的依赖方向：**
- db → controllers（禁止）
- routes → db（禁止，必须经过 controller）
- middleware → controllers（禁止）

---

## 三、前后端分层

### 前端（client/）

```
views/ → components/
  ↓         ↓
stores/ ← api/
  ↓
router/
```

| 层 | 职责 | 示例 |
|----|------|------|
| views/ | 页面级组件，一个路由对应一个 | Home.vue、Post.vue |
| components/ | 可复用 UI 组件 | Navbar.vue、PostCard.vue |
| stores/ | Pinia 状态管理 | auth.js、post.js |
| api/ | Axios HTTP 请求封装 | post.js、auth.js |
| router/ | 路由配置和守卫 | index.js |

**约束：**
- views 不可被其他 views 引用
- components 不可直接调用 api，通过 props/emit 或 store
- api 层统一在 `api/index.js` 配置 Axios 实例

### 后端（server/）

| 层 | 职责 | 文件 |
|----|------|------|
| routes/ | URL → controller 映射 | auth.js、post.js |
| controllers/ | 业务逻辑处理 | authController.js |
| middleware/ | 请求预处理 | auth.js、error.js |
| db/ | 数据库操作封装 | index.js、schema.sql |
| config/ | 环境变量管理 | index.js |
| utils/ | 通用工具函数 | helpers.js |

---

## 四、数据库约束

### 表关系

```
users (1) ──────── (N) posts    [作者，当前单用户]
categories (1) ── (N) posts    [分类，外键 category_id]
posts (1) ──────── (N) view_tracking  [浏览记录]
```

### SQL 规则

1. **所有 SQL 必须参数化**：使用 `?` 占位符，禁止字符串拼接
2. **外键约束**：`posts.category_id → categories.id ON DELETE SET NULL`
3. **软删除**：`posts.status` 字段（1=发布，0=草稿），不物理删除
4. **索引**：高频查询字段必须有索引（status、is_top、category_id、created_at）

---

## 五、安全架构

| 层 | 安全措施 | 实现位置 |
|----|---------|---------|
| 传输 | HTTPS（生产环境） | Nginx 配置 |
| 认证 | JWT Bearer Token | middleware/auth.js |
| 输入 | express-validator | middleware/validator.js |
| 输出 | Helmet 安全头 | app.js |
| 存储 | bcrypt 密码加密 | controllers/authController.js |
| 上传 | MIME 类型白名单 + 大小限制 | routes/upload.js |
| 速率 | express-rate-limit | app.js |

---

## 六、前端状态流

```
用户操作 → view → store action → api 调用 → 后端 API
                                    ↓
                              store mutation → 响应式 UI 更新
```

- 认证状态：`stores/auth.js` 管理用户信息（token 由后端 httpOnly cookie 维护，前端不可读）
- 文章数据：`stores/post.js` 管理文章列表和当前文章
- 路由守卫：`router/index.js` 检查 `requiresAuth` meta
