# 项目开发计划

> 披花沐雪 - One Last Kiss for the Beautiful World
> Vue3 + Node.js + SQLite
> 当前版本：v1.0.2

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
| Vue 3 | ^3.5 | 框架 |
| Vite | ^6.0 | 构建工具 |
| Vue Router | ^4.5 | 路由 |
| Pinia | ^2.3 | 状态管理 |
| Axios | ^1.7 | HTTP请求 |
| AOS | ^2.3 | 滚动动画 |
| GLightbox | ^3.3 | 图片灯箱 |
| md-editor-v3 | ^5.5 | Markdown编辑器 |
| highlight.js | ^11.11 | 代码高亮 |
| marked | ^18.0 | Markdown解析 |
| vuedraggable | ^4.1 | 拖拽排序 |
| dayjs | ^1.11 | 日期处理 |
| NProgress | ^0.2 | 进度条 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 22+ | 运行时 |
| Express | ^5.2 | Web框架 |
| better-sqlite3 | ^12.9 | 数据库 |
| jsonwebtoken | ^9.0 | JWT认证 |
| bcryptjs | ^3.0 | 密码加密 |
| multer | ^2.1 | 文件上传 |
| helmet | ^8.1 | 安全头 |
| cors | ^2.8 | 跨域 |
| express-rate-limit | ^8.5 | 速率限制 |

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
HTMLsite/
├── server/                          # 后端
│   ├── config/
│   │   └── index.js                 # 配置文件
│   ├── controllers/
│   │   ├── authController.js        # 认证控制器
│   │   ├── categoryController.js    # 分类控制器
│   │   └── postController.js        # 文章控制器
│   ├── db/
│   │   ├── index.js                 # 数据库连接
│   │   ├── schema.sql               # 建表语句
│   │   ├── init.js                  # 初始化脚本
│   │   ├── create-admin.js          # 创建管理员
│   │   ├── import-data.js           # 导入数据
│   │   └── migrate.js               # 数据库迁移
│   ├── middleware/
│   │   ├── auth.js                  # JWT验证中间件
│   │   └── error.js                 # 错误处理中间件
│   ├── routes/
│   │   ├── auth.js                  # 认证路由
│   │   ├── category.js              # 分类路由
│   │   ├── post.js                  # 文章路由
│   │   └── upload.js                # 上传路由
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
│   │   │   ├── category.js          # 分类API
│   │   │   ├── post.js              # 文章API
│   │   │   └── upload.js            # 上传API
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
│   │   │   ├── Icon.vue             # 图标组件
│   │   │   └── MarkdownEditor.vue   # 编辑器
│   │   ├── router/
│   │   │   └── index.js             # 路由配置
│   │   ├── stores/
│   │   │   ├── auth.js              # 认证状态
│   │   │   └── post.js              # 文章状态
│   │   ├── views/
│   │   │   ├── Home.vue             # 首页
│   │   │   ├── Post.vue             # 文章详情
│   │   │   ├── Archives.vue         # 归档页
│   │   │   ├── NotFound.vue         # 404页面
│   │   │   └── admin/
│   │   │       ├── Layout.vue       # 后台布局
│   │   │       ├── Login.vue        # 登录页
│   │   │       ├── Dashboard.vue    # 仪表盘
│   │   │       ├── Posts.vue        # 文章列表
│   │   │       ├── Editor.vue       # 编辑文章
│   │   │       └── Categories.vue   # 分类管理
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── data/                            # 数据库目录
│   └── blog.db                      # SQLite数据库
├── docs/                            # 文档目录
│   ├── design.md                    # 设计规范
│   └── DEPLOY.md                    # 部署文档
├── start.bat                        # Windows启动脚本
├── start.ps1                        # PowerShell启动脚本
├── project.md                       # 本文件
├── README.md                        # 项目说明
└── .gitignore
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
    sort_order INTEGER DEFAULT 0,
    published_at DATETIME,
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
| GET | /api/posts | 文章列表（支持分页、分类筛选） | ❌ |
| GET | /api/posts/:id | 文章详情（增加浏览量） | ❌ |
| POST | /api/posts | 创建文章 | ✅ |
| PUT | /api/posts/:id | 更新文章 | ✅ |
| DELETE | /api/posts/:id | 删除文章 | ✅ |
| PUT | /api/posts/:id/top | 切换置顶 | ✅ |
| PUT | /api/posts/reorder | 更新排序 | ✅ |

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

## 六、开发状态

### ✅ 已完成

- [x] 项目初始化
- [x] 后端基础搭建
- [x] 数据库设计与实现
- [x] 认证模块（JWT）
- [x] 文章 CRUD 接口
- [x] 分类 CRUD 接口
- [x] 文件上传功能
- [x] 前端基础搭建
- [x] 路由配置
- [x] 状态管理
- [x] 前台页面（首页、详情、归档）
- [x] 后台管理（登录、仪表盘、文章管理、分类管理）
- [x] 玻璃拟态样式
- [x] AOS 动画效果
- [x] 响应式布局
- [x] 拖拽排序功能
- [x] Markdown 编辑器
- [x] 代码高亮显示
- [x] 安全加固（XSS防护、输入验证、速率限制）
- [x] 认证系统重构（httpOnly cookie）
- [x] 浏览量防刷（数据库持久化）
- [x] 统计 API（Dashboard 数据）
- [x] view_tracking 表（浏览记录持久化）

### 📋 待完成

- [ ] RSS 订阅功能
- [ ] 文章搜索功能
- [ ] 标签云页面
- [ ] 访客统计
- [ ] SEO 优化
- [ ] 暗色模式

---

## 七、启动方式

### Windows 启动脚本
```cmd
start.bat
```

### PowerShell 启动脚本
```powershell
.\start.ps1
```

### 手动启动
```bash
# 终端1：启动后端
cd server
npm run dev

# 终端2：启动前端
cd client
npm run dev
```

### 访问地址
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000
- 后台管理：http://localhost:5173/admin

---

## 八、检查清单

### 开发前
- [x] Node.js 18+ 已安装
- [x] Git 已安装
- [x] VS Code 已安装
- [x] VS Code 插件已安装（Volar, ESLint, Prettier）

### 开发完成
- [x] 所有功能测试通过
- [x] 代码无 ESLint 错误
- [x] 响应式布局正常
- [x] 安全配置正确

### 部署前
- [x] 前端已构建
- [x] 环境变量已配置
- [x] 数据库已初始化
- [x] 管理员账号已创建

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

> 📌 本文件记录项目完整开发计划，开发过程中请逐步完成各项任务并打勾标记。
