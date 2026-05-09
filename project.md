# 项目开发计划

> 披花沐雪 - One Last Kiss for the Beautiful World
> Vue3 + Node.js + SQLite
> 当前版本：v1.0.0

---

## 一、项目概述

| 项目 | 说明 |
|------|------|
| 名称 | 披花沐雪 |
| 定位 | 个人博客系统，仅管理员发帖，无评论功能 |
| 服务器 | 2核2G 5Mbps |
| 风格 | 「枯木冷茶」(Zen Wood) 配色 + 玻璃拟态 + AOS动画 + SVG图标 |

---

## 二、技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.4 | 框架 |
| Vite | ^5.0 | 构建工具 |
| Vue Router | ^4.2 | 路由 |
| Pinia | ^2.1 | 状态管理 |
| Axios | ^1.6 | HTTP请求 |
| AOS | ^2.3 | 滚动动画 |
| GLightbox | ^3.2 | 图片灯箱 |
| md-editor-v3 | ^4.0 | Markdown编辑器 |
| dayjs | ^1.11 | 日期处理 |
| NProgress | ^0.2 | 进度条 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 22+ | 运行时 |
| Express | ^4.18 | Web框架 |
| better-sqlite3 | ^9.0 | 数据库 |
| jsonwebtoken | ^9.0 | JWT认证 |
| bcryptjs | ^2.4 | 密码加密 |
| multer | ^1.4 | 文件上传 |
| helmet | ^7.0 | 安全头 |
| cors | ^2.8 | 跨域 |
| express-rate-limit | ^7.0 | 速率限制 |

### 开发工具
| 工具 | 用途 |
|------|------|
| VS Code | 编辑器 |
| Volar插件 | Vue3支持 |
| ESLint | 代码检查 |
| Prettier | 代码格式化 |
| Postman/Apifox | API调试 |
| DB Browser for SQLite | 数据库管理 |
| Git | 版本控制 |

---

## 三、项目结构

```
blog/
├── server/                          # 后端
│   ├── config/
│   │   └── index.js                 # 配置文件
│   ├── db/
│   │   ├── index.js                 # 数据库连接
│   │   └── schema.sql               # 建表语句
│   ├── middleware/
│   │   ├── auth.js                  # JWT验证中间件
│   │   └── error.js                 # 错误处理中间件
│   ├── routes/
│   │   ├── auth.js                  # 认证路由
│   │   ├── post.js                  # 文章路由
│   │   └── upload.js                # 上传路由
│   ├── controllers/
│   │   ├── authController.js        # 认证控制器
│   │   └── postController.js        # 文章控制器
│   ├── utils/
│   │   └── helpers.js               # 工具函数
│   ├── uploads/                     # 上传目录
│   ├── app.js                       # Express入口
│   ├── package.json
│   └── .env.example
│
├── client/                          # 前端
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.js             # Axios封装
│   │   │   ├── auth.js              # 认证API
│   │   │   └── post.js              # 文章API
│   │   ├── assets/
│   │   │   ├── css/
│   │   │   │   ├── variables.css    # CSS变量
│   │   │   │   ├── reset.css        # 样式重置
│   │   │   │   ├── glass.css        # 玻璃拟态
│   │   │   │   ├── animations.css   # 动画样式
│   │   │   │   └── main.css         # 主样式
│   │   │   └── js/
│   │   │       └── utils.js         # 工具函数
│   │   ├── components/
│   │   │   ├── Navbar.vue           # 导航栏
│   │   │   ├── PostCard.vue         # 文章卡片
│   │   │   ├── Footer.vue           # 页脚
│   │   │   ├── Loading.vue          # 加载组件
│   │   │   └── MarkdownEditor.vue   # 编辑器
│   │   ├── composables/
│   │   │   └── useAuth.js           # 认证逻辑
│   │   ├── router/
│   │   │   └── index.js             # 路由配置
│   │   ├── stores/
│   │   │   ├── auth.js              # 认证状态
│   │   │   └── post.js              # 文章状态
│   │   ├── views/
│   │   │   ├── Home.vue             # 首页
│   │   │   ├── Post.vue             # 文章详情
│   │   │   ├── Category.vue         # 分类页
│   │   │   └── admin/
│   │   │       ├── Login.vue        # 登录页
│   │   │       ├── Dashboard.vue    # 仪表盘
│   │   │       ├── Posts.vue        # 文章列表
│   │   │       ├── Editor.vue       # 编辑文章
│   │   │       └── Settings.vue     # 设置
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── data/                            # 数据库目录
│   └── blog.db                      # SQLite数据库
├── docs/                            # 文档目录
│   ├── API.md                       # API文档
│   └── DEPLOY.md                    # 部署文档
├── project.md                       # 本文件
├── README.md                        # 项目说明
├── .gitignore
└── docker-compose.yml               # Docker配置(可选)
```

---

## 四、数据库设计

### users 表（管理员）
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### posts 表（文章）
```sql
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    cover_image TEXT,
    category TEXT,
    tags TEXT,
    is_top INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### categories 表（分类）
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    sort INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 五、API 接口设计

### 认证接口
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | ❌ |
| POST | /api/auth/logout | 登出 | ✅ |
| GET | /api/auth/profile | 获取个人信息 | ✅ |
| PUT | /api/auth/password | 修改密码 | ✅ |

### 文章接口
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/posts | 文章列表 | ❌ |
| GET | /api/posts/:id | 文章详情 | ❌ |
| POST | /api/posts | 创建文章 | ✅ |
| PUT | /api/posts/:id | 更新文章 | ✅ |
| DELETE | /api/posts/:id | 删除文章 | ✅ |
| PUT | /api/posts/:id/top | 切换置顶 | ✅ |

### 分类接口
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/categories | 分类列表 | ❌ |
| POST | /api/categories | 创建分类 | ✅ |
| PUT | /api/categories/:id | 更新分类 | ✅ |
| DELETE | /api/categories/:id | 删除分类 | ✅ |

### 上传接口
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/upload/image | 上传图片 | ✅ |

---

## 六、开发步骤

### 阶段一：项目初始化（预计30分钟）

- [ ] **1.1 创建项目目录**
  ```bash
  mkdir blog && cd blog
  mkdir server client data docs
  ```

- [ ] **1.2 初始化后端项目**
  ```bash
  cd server
  npm init -y
  npm install express better-sqlite3 jsonwebtoken bcryptjs multer helmet cors express-rate-limit dotenv
  npm install -D nodemon
  ```

- [ ] **1.3 初始化前端项目**
  ```bash
  cd ../client
  npm create vue@latest .
  npm install axios aos glightbox md-editor-v3 dayjs nprogress
  ```

- [ ] **1.4 配置 Git**
  ```bash
  cd ..
  git init
  # 创建 .gitignore
  ```

- [ ] **1.5 创建配置文件**
  - server/.env.example
  - server/config/index.js
  - client/vite.config.js

---

### 阶段二：后端基础搭建（预计60分钟）

- [ ] **2.1 数据库初始化**
  - 创建 db/schema.sql
  - 创建 db/index.js（SQLite连接）
  - 编写数据库初始化脚本

- [ ] **2.2 创建 Express 应用**
  - 创建 app.js（入口文件）
  - 配置中间件（cors, helmet, json, 静态文件）
  - 配置路由前缀

- [ ] **2.3 错误处理中间件**
  - 创建 middleware/error.js
  - 统一错误响应格式

- [ ] **2.4 创建管理员账号脚本**
  - 编写脚本创建默认管理员
  - bcrypt 加密密码

---

### 阶段三：认证模块（预计45分钟）

- [ ] **3.1 JWT 工具函数**
  - 生成 Token
  - 验证 Token

- [ ] **3.2 认证中间件**
  - 创建 middleware/auth.js
  - 验证请求头中的 Token

- [ ] **3.3 认证路由**
  - POST /api/auth/login
  - GET /api/auth/profile
  - PUT /api/auth/password

- [ ] **3.4 认证控制器**
  - 登录逻辑
  - 密码验证

---

### 阶段四：文章模块（预计60分钟）

- [ ] **4.1 文章模型**
  - 创建、查询、更新、删除
  - 分页查询
  - 置顶功能

- [ ] **4.2 文章路由**
  - GET /api/posts（列表，支持分页、分类筛选）
  - GET /api/posts/:id（详情，增加浏览量）
  - POST /api/posts（创建）
  - PUT /api/posts/:id（更新）
  - DELETE /api/posts/:id（删除）
  - PUT /api/posts/:id/top（切换置顶）

- [ ] **4.3 文章控制器**
  - 参数验证
  - 业务逻辑处理

---

### 阶段五：分类与上传模块（预计30分钟）

- [ ] **5.1 分类路由和控制器**
  - CRUD 接口

- [ ] **5.2 文件上传**
  - 配置 multer
  - 文件类型验证
  - 文件大小限制
  - 生成唯一文件名

---

### 阶段六：前端基础搭建（预计45分钟）

- [ ] **6.1 项目配置**
  - vite.config.js（代理配置）
  - 环境变量

- [ ] **6.2 Axios 封装**
  - 创建 api/index.js
  - 请求/响应拦截器
  - Token 自动携带
  - 错误处理

- [ ] **6.3 路由配置**
  - 创建 router/index.js
  - 前台路由（首页、详情、分类）
  - 后台路由（登录、仪表盘、文章管理）
  - 路由守卫

- [ ] **6.4 状态管理**
  - stores/auth.js（认证状态）
  - stores/post.js（文章状态）

- [ ] **6.5 全局样式**
  - variables.css（CSS变量）
  - reset.css（样式重置）

---

### 阶段七：前台页面开发（预计90分钟）

- [ ] **7.1 玻璃拟态样式**
  - 创建 glass.css
  - 导航栏样式
  - 卡片样式
  - 按钮样式

- [ ] **7.2 导航栏组件**
  - Navbar.vue
  - 响应式菜单
  - 滚动变色

- [ ] **7.3 文章卡片组件**
  - PostCard.vue
  - 封面图
  - 标题、摘要
  - 分类、日期
  - AOS 动画属性

- [ ] **7.4 首页**
  - Home.vue
  - CSS Grid 卡片布局
  - AOS 初始化
  - 分页加载

- [ ] **7.5 文章详情页**
  - Post.vue
  - Markdown 渲染
  - 代码高亮（Prism.js）
  - 图片灯箱（GLightbox）

- [ ] **7.6 页脚组件**
  - Footer.vue

- [ ] **7.7 动画效果**
  - animations.css
  - 页面过渡动画
  - 滚动位置记忆

---

### 阶段八：后台管理页面（预计90分钟）

- [ ] **8.1 登录页**
  - Login.vue
  - 玻璃拟态表单
  - 登录逻辑

- [ ] **8.2 后台布局**
  - AdminLayout.vue
  - 侧边栏
  - 顶栏

- [ ] **8.3 仪表盘**
  - Dashboard.vue
  - 文章统计
  - 最近文章

- [ ] **8.4 文章列表**
  - Posts.vue
  - 表格展示
  - 搜索筛选
  - 置顶/发布/删除操作

- [ ] **8.5 文章编辑器**
  - Editor.vue
  - MarkdownEditor 组件
  - 封面图上传
  - 分类选择
  - 标签输入
  - 保存草稿/发布

- [ ] **8.6 分类管理**
  - Categories.vue
  - 增删改查

---

### 阶段九：功能完善（预计45分钟）

- [ ] **9.1 NProgress 进度条**
  - 路由切换进度条

- [ ] **9.2 页面 Meta 信息**
  - 标题、描述

- [ ] **9.3 404 页面**
  - NotFound.vue

- [ ] **9.4 移动端适配**
  - 响应式测试
  - 触摸优化

- [ ] **9.5 性能优化**
  - 图片懒加载
  - 组件懒加载

---

### 阶段十：测试与部署（预计60分钟）

- [ ] **10.1 功能测试**
  - 登录/登出
  - 文章 CRUD
  - 图片上传
  - 响应式布局

- [ ] **10.2 构建前端**
  ```bash
  cd client
  npm run build
  ```

- [ ] **10.3 编写部署文档**
  - docs/DEPLOY.md

- [ ] **10.4 服务器部署**
  - 上传代码
  - 安装依赖
  - PM2 启动
  - Nginx 配置

- [ ] **10.5 域名配置**
  - 域名解析
  - SSL 证书（Let's Encrypt）

---

## 七、预计总时间

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| 一 | 项目初始化 | 30分钟 |
| 二 | 后端基础 | 60分钟 |
| 三 | 认证模块 | 45分钟 |
| 四 | 文章模块 | 60分钟 |
| 五 | 分类与上传 | 30分钟 |
| 六 | 前端基础 | 45分钟 |
| 七 | 前台页面 | 90分钟 |
| 八 | 后台管理 | 90分钟 |
| 九 | 功能完善 | 45分钟 |
| 十 | 测试部署 | 60分钟 |
| **合计** | | **约9小时** |

---

## 八、检查清单

### 开发前
- [ ] Node.js 18+ 已安装
- [ ] Git 已安装
- [ ] VS Code 已安装
- [ ] VS Code 插件已安装（Volar, ESLint, Prettier）

### 开发完成
- [ ] 所有功能测试通过
- [ ] 代码无 ESLint 错误
- [ ] 响应式布局正常
- [ ] 安全配置正确

### 部署前
- [ ] 前端已构建
- [ ] 环境变量已配置
- [ ] 数据库已初始化
- [ ] 管理员账号已创建

### 部署后
- [ ] 网站可正常访问
- [ ] 登录功能正常
- [ ] 文章发布正常
- [ ] 图片上传正常
- [ ] HTTPS 已配置

---

## 九、注意事项

### 安全相关
1. JWT 密钥必须使用强随机字符串
2. 密码必须 bcrypt 加密存储
3. 上传文件必须验证类型和大小
4. 生产环境必须配置 HTTPS
5. 定期备份数据库

### 性能相关
1. 图片上传后建议压缩
2. 使用 CDN 加速静态资源
3. SQLite 定期 VACUUM
4. 启用 Gzip 压缩

### 开发规范
1. 提交信息使用规范格式
2. 代码格式化使用 Prettier
3. 组件命名使用 PascalCase
4. 文件命名使用 camelCase

---

## 十、后续扩展（可选）

- [ ] RSS 订阅功能
- [ ] 文章搜索功能
- [ ] 标签云页面
- [ ] 文章归档页面
- [ ] 访客统计
- [ ] 评论系统（第三方）
- [ ] SEO 优化
- [ ] 暗色模式
- [ ] 多语言支持

---

> 📌 本文件记录项目完整开发计划，开发过程中请逐步完成各项任务并打勾标记。
