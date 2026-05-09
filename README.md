# 披花沐雪

> One Last Kiss for the Beautiful World

一个现代化的个人博客系统，采用「枯木冷茶」(Zen Wood) 配色方案，支持文章管理、动画效果和响应式布局。

**当前版本：v1.0.0**

## ✨ 功能特性

| 特性 | 说明 |
|------|------|
| 枯木冷茶主题 | 中性克制的莫兰迪灰褐色系，如书房禅茶室的安静感 |
| SVG 图标系统 | 全套 SVG 图标，清晰锐利，风格统一 |
| 响应式布局 | 移动端友好，CSS Grid 卡片式网格布局 |
| 文章管理 | 支持增删改查、文章置顶、草稿箱 |
| 拖拽排序 | 后台拖拽文章排序，前台同步更新 |
| 发布时间 | 可自定义文章发布时间 |
| AOS 滚动动画 | 卡片淡入淡出，平滑过渡效果 |
| Markdown 编辑器 | 所见即所得，支持代码高亮 |
| 后台管理系统 | 完整的管理面板，文章 CRUD |
| 用户认证 | JWT + bcrypt 安全登录 |
| 安全防护 | CORS、Helmet、速率限制 |
| 性能优化 | SQLite 轻量级数据库，内存占用低 |

## 🛠️ 技术栈

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue 3 | ^3.4 | 渐进式 JavaScript 框架 |
| Vue Router | ^4.2 | 官方路由管理器 |
| Pinia | ^2.1 | 状态管理 |
| Axios | ^1.6 | HTTP 客户端 |
| AOS | ^2.3 | 滚动动画库 |
| GLightbox | ^3.2 | 图片灯箱 |
| md-editor-v3 | ^4.0 | Markdown 编辑器 |
| Prism.js | ^1.29 | 代码语法高亮 |

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 22+ | JavaScript 运行时 |
| Express | ^4.18 | Web 框架 |
| better-sqlite3 | ^9.0 | SQLite 数据库 |
| jsonwebtoken | ^9.0 | JWT 认证 |
| bcryptjs | ^2.4 | 密码加密 |
| multer | ^1.4 | 文件上传 |
| helmet | ^7.0 | 安全头 |
| cors | ^2.8 | 跨域处理 |

## 📁 项目结构

```
blog/
├── server/                     # 后端服务
│   ├── config/                 # 配置文件
│   │   └── index.js
│   ├── db/                     # 数据库
│   │   ├── index.js
│   │   └── schema.sql
│   ├── middleware/              # 中间件
│   │   ├── auth.js             # JWT 验证
│   │   └── error.js            # 错误处理
│   ├── routes/                 # 路由
│   │   ├── auth.js             # 认证路由
│   │   ├── post.js             # 文章路由
│   │   └── upload.js           # 上传路由
│   ├── controllers/            # 控制器
│   │   ├── authController.js
│   │   └── postController.js
│   ├── uploads/                # 上传目录
│   ├── app.js                  # Express 入口
│   └── package.json
│
├── client/                     # 前端应用
│   ├── public/                 # 静态资源
│   ├── src/
│   │   ├── api/                # API 请求
│   │   ├── assets/             # 样式资源
│   │   ├── components/         # 组件
│   │   │   ├── Navbar.vue
│   │   │   ├── PostCard.vue
│   │   │   ├── Footer.vue
│   │   │   └── MarkdownEditor.vue
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # Pinia 状态
│   │   ├── views/              # 页面视图
│   │   │   ├── Home.vue
│   │   │   ├── Post.vue
│   │   │   └── admin/
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── data/                       # SQLite 数据库
│   └── blog.db
├── docs/                       # 项目文档
│   ├── API.md                  # API 文档
│   └── DEPLOY.md               # 部署文档
├── .env.example                # 环境变量示例
├── .gitignore
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0
- Git

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-username/blog-system.git
cd blog-system

# 2. 安装后端依赖
cd server
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改配置

# 4. 安装前端依赖
cd ../client
npm install

# 5. 初始化数据库
cd ../server
npm run db:init

# 6. 创建管理员账号
npm run create-admin
```

### 启动开发

```bash
# 终端 1：启动后端
cd server
npm run dev

# 终端 2：启动前端
cd client
npm run dev
```

访问：
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000
- 后台管理：http://localhost:5173/admin

## ⚙️ 环境变量配置

在 `server/.env` 文件中配置：

```bash
# 服务配置
NODE_ENV=development
PORT=3000

# JWT 密钥（请修改为随机字符串）
JWT_SECRET=your-super-secret-key-change-this

# 数据库路径
DB_PATH=../data/blog.db

# 上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

## 📦 构建部署

### 构建前端

```bash
cd client
npm run build
```

生成的静态文件在 `client/dist/` 目录。

### 服务器部署

#### 方式一：PM2 部署（推荐）

```bash
# 1. 安装 PM2
npm install -g pm2

# 2. 构建前端
cd client
npm run build

# 3. 启动后端
cd ../server
pm2 start app.js --name blog-server

# 4. 设置开机自启
pm2 startup
pm2 save
```

#### 方式二：Docker 部署

```bash
# 构建镜像
docker build -t blog-system .

# 运行容器
docker run -d \
  --name blog \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./uploads:/app/uploads \
  blog-system
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/blog/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件
    location /uploads {
        alias /var/www/blog/server/uploads;
        expires 30d;
    }
}
```

## 📚 API 文档

详见 [API.md](./docs/API.md)

### 主要接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 管理员登录 | ❌ |
| GET | /api/posts | 获取文章列表 | ❌ |
| GET | /api/posts/:id | 获取文章详情 | ❌ |
| POST | /api/posts | 创建文章 | ✅ |
| PUT | /api/posts/:id | 更新文章 | ✅ |
| DELETE | /api/posts/:id | 删除文章 | ✅ |
| POST | /api/upload | 上传图片 | ✅ |

## 🎨 设计风格

### 玻璃拟态 (Glassmorphism)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### AOS 动画

```vue
<template>
  <div data-aos="fade-up" data-aos-duration="800">
    卡片内容
  </div>
</template>
```

## 📝 更新日志

### v1.0.0 (2026-5-8)

- ✨ 初始版本发布
- ✨ 玻璃拟态设计风格
- ✨ 文章 CRUD 功能
- ✨ AOS 滚动动画
- ✨ 后台管理系统
- ✨ JWT 用户认证
- ✨ 图片上传功能
- ✨ 响应式布局

## 📄 开源协议

[MIT License](LICENSE)

## 🙏 致谢

- [Vue.js](https://vuejs.org/)
- [Express](https://expressjs.com/)
- [AOS](https://michalsnik.github.io/aos/)
- [GLightbox](https://biati-digital.github.io/glightbox/)

---

如有问题或建议，欢迎提 [Issue](https://github.com/your-username/blog-system/issues)
