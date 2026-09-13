# 披花沐雪

> One Last Kiss for the Beautiful World

一个现代化的个人博客系统，采用「枯木冷茶」(Zen Wood) 配色方案，支持文章管理、暗色模式、动画效果和响应式布局，前后端分离，安全优先。

**当前版本：v2.0.0**

> 说明：v2.0.0 收录 2026-09-12 至 2026-09-13 的全面审计修复、浏览器回归和发布验证。详细变更见 [`docs/releases/v2.0.0.md`](docs/releases/v2.0.0.md)，工程证据见 [`docs/audits/browser-baseline-2026-09-13.md`](docs/audits/browser-baseline-2026-09-13.md)。

## 当前审计进度

v2.0.0 已完成：生产配置 fail-closed、sitemap 和上传 URL 边界、参数化输入验证、文章半更新语义、草稿/发布校验、slug 唯一迁移、公开列表边界、搜索限流、归档分页，以及前台/后台的响应式、主题和无障碍修复。

前端 Markdown 内容现由 `MarkdownContent.vue` 以 Vue VNode 渲染，原始 HTML 被忽略，链接协议受限并经过 DOMPurify 防御；没有使用 `v-html`。后台编辑器按路由懒加载，公开路由不加载编辑器 chunk。全量测试共 106 个用例通过，浏览器矩阵和 axe 回归结果均为 0 个 violation/incomplete；编辑器 chunk 仍有约 877.38 kB 的 Vite warning，详见 v2.0.0 Release Notes。

## 功能特性

| 特性            | 说明                                                                                  |
| --------------- | ------------------------------------------------------------------------------------- |
| 枯木冷茶主题    | 中性克制的莫兰迪灰褐色系，如书房禅茶室的安静感                                        |
| 暗色模式        | 跟随系统主题 + 手动切换，核心页面提供双主题样式                                       |
| 响应式布局      | 移动端优先优化，触控反馈、底部弹出式模态框、安全区适配                                |
| 滚动位置记忆    | 列表→详情→返回精确恢复滚动位置（手机端体验）                                          |
| SVG 图标系统    | 全套 SVG 图标，构建期静态打包，生产环境稳定                                           |
| 文章管理        | 增删改查、置顶、草稿、全量列表拖拽排序（不分页、可跨任意位置）、自定义发布时间        |
| Markdown 编辑器 | 所见即所得，支持代码高亮与图片上传，未保存离开提醒                                    |
| 全文搜索        | 标题 + 摘要 + 正文搜索，高亮显示、防竞态                                              |
| SEO 优化        | meta 标签、Open Graph、动态 sitemap.xml                                               |
| 用户认证        | JWT + bcrypt，httpOnly cookie 下发（前端不可读，防 XSS 窃取）                         |
| 安全防护        | SQL 参数化、输入验证、DOMPurify 消毒、上传魔数+文件结构校验、速率限制、Helmet、CORS   |
| 动画系统        | AOS 滚动动画、页面过渡、菜单交错动画、统计数字计数滚动，尊重 `prefers-reduced-motion` |
| 性能优化        | SQLite 轻量级数据库（WAL 模式），浏览量防刷持久化                                     |

## 技术栈

### 前端

| 技术                  | 版本      | 说明                                       |
| --------------------- | --------- | ------------------------------------------ |
| Vue 3                 | ^3.5      | 渐进式 JavaScript 框架（`<script setup>`） |
| Vite                  | ^6.0      | 前端构建工具                               |
| Vue Router            | ^4.5      | 官方路由管理器                             |
| Pinia                 | ^2.3      | 状态管理                                   |
| Axios                 | ^1.7      | HTTP 客户端（withCredentials）             |
| AOS                   | ^2.3      | 滚动动画库                                 |
| md-editor-v3          | ^5.5      | Markdown 编辑器                            |
| marked                | ^18       | 公开 Markdown 解析（编辑器高亮由 md-editor-v3 按需加载） |
| DOMPurify             | ^3.4      | HTML 消毒（防 XSS）                        |
| vuedraggable          | ^4.1      | 后台拖拽排序                               |
| @vueuse/head          | ^2.0      | SEO meta 管理                              |
| dayjs                 | ^1.11     | 日期处理                                   |

### 后端

| 技术                    | 版本            | 说明                          |
| ----------------------- | --------------- | ----------------------------- |
| Node.js                 | 18+（推荐 20+） | JavaScript 运行时             |
| Express                 | ^5.2            | Web 框架                      |
| better-sqlite3          | ^12.9           | SQLite 数据库                 |
| jsonwebtoken + bcryptjs | ^9 / ^3         | JWT 认证与密码加密            |
| cookie                  | ^0.7            | Cookie 解析（httpOnly token） |
| multer                  | ^2.1            | 文件上传（魔数校验）          |
| helmet / cors           | ^8 / ^2.8       | 安全头与跨域                  |
| express-rate-limit      | ^8.5            | 速率限制                      |
| express-validator       | ^7.3            | 输入验证                      |

## 项目结构

```
HTMLsite/
├── server/                      # 后端服务（CommonJS）
│   ├── config/index.js          # 环境变量读取（含 cookie/trustProxy 配置）
│   ├── controllers/             # 业务逻辑（auth/post/category/upload/sitemap）
│   ├── routes/                  # 路由定义（仅做映射）
│   ├── middleware/              # auth(认证) / error(错误) / validator(验证)
│   ├── db/                      # schema.sql、init、create-admin、import-data
│   ├── utils/helpers.js         # 响应/分页/标签工具
│   ├── eslint-rules/            # 自定义 ESLint 规则（架构与安全约束）
│   ├── __tests__/               # 后端单元测试
│   └── uploads/                 # 上传目录（已 gitignore）
│
├── client/                      # 前端应用（ESM）
│   ├── public/                  # 静态资源（favicon、robots）
│   ├── src/
│   │   ├── api/                 # Axios 封装（auth/post/category/upload）
│   │   ├── assets/              # CSS 设计系统 / SVG 图标 / 工具函数
│   │   ├── components/          # 通用组件（Navbar/PostCard/Icon/MarkdownEditor/...）
│   │   ├── composables/         # useSeo / useTheme / useToast
│   │   ├── router/              # 路由 + 守卫 + 滚动位置记忆
│   │   ├── stores/              # Pinia（auth/post）
│   │   ├── views/               # 前台页面 + admin/ 后台页面
│   │   └── __tests__/           # 前端单元测试
│   ├── index.html
│   └── vite.config.js           # 代理 /api、/uploads 到后端
│
├── data/                        # SQLite 数据库（已 gitignore）
├── docs/                        # 项目文档，入口为 docs/README.md
├── scripts/                     # agent-check / agent-fix（一键检查与修复）
├── .github/workflows/           # CI（lint/format/test/build）与定期保洁
├── AGENTS.md                    # AI Agent 开发指南
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18（推荐 20+）
- npm >= 9

### 安装步骤

```bash
# 1. 安装后端依赖
cd server
npm install

# 2. 配置环境变量（复制模板并按需修改）
cp .env.example .env

# 3. 安装前端依赖
cd ../client
npm install

# 4. 初始化数据库（自动建表）
cd ../server
npm run db:init

# 5. 创建管理员账号（交互式）
npm run create-admin

# 可选：导入示例数据（会清空现有文章/分类）
npm run db:import
```

### 启动开发

```bash
# 手动启动（两个终端）
cd server && npm run dev     # 终端 1：后端
cd client && npm run dev     # 终端 2：前端
```

访问：

- 前端：http://localhost:5173
- 后端 API：http://localhost:3000
- 后台管理：http://localhost:5173/admin

## 环境变量配置

`server/.env`：

```bash
# 服务配置
NODE_ENV=development            # production 时强制 JWT_SECRET ≥32 字符
PORT=3000

# JWT 密钥（生产环境必须是随机非占位值，且 ≥32 字符）
# 生成：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=REPLACE_WITH_RANDOM_64_HEX_CHARACTERS

# 数据库路径
DB_PATH=../data/blog.db

# 上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880           # 5MB

# CORS 配置
CORS_ORIGIN=http://localhost:5173

# 反向代理（仅在代理会覆盖而非追加 X-Forwarded-For 时设为 1；
# 更稳妥可填具体代理 IP 列表，如 127.0.0.1,10.0.0.1，仅信任这些代理）
TRUST_PROXY=1

# 站点基础 URL（生产环境必填有效的 http(s) 绝对 URL，避免依赖 Host 请求头）
SITE_URL=https://your-domain.com
```

## 构建部署

### 构建前端

```bash
cd client
npm run build     # 产物在 client/dist/（index.html + assets/）
```

### 服务器部署

#### 方式一：PM2

```bash
cd client && npm run build
cd ../server && pm2 start app.js --name blog-server && pm2 save
```

#### 方式二：宝塔面板

1. 上传源码（**不要上传** `node_modules`、`.env`、`data/`、`uploads/`）
2. Node 项目管理：启动 `server/app.js`（配置 `.env`）
3. 网站：站点根目录指向 `client/dist`，Nginx 增加：

```nginx
# 后端 API 反向代理
location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # TRUST_PROXY=1 时必须使用覆盖式转发，不能追加客户端可伪造的 XFF
    proxy_set_header X-Forwarded-For $remote_addr;
    # 必须：否则 req.protocol 取不到 https，sitemap.xml 会生成 http 链接
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 上传图片静态伺服（^~ 防止被图片缓存正则劫持）
location ^~ /uploads {
    alias /www/wwwroot/your-path/server/uploads/;
    expires 30d;
    add_header X-Content-Type-Options nosniff;
}

# Sitemap（后端动态生成）
location = /sitemap.xml {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
}

# Vue Router history 模式
location / {
    try_files $uri $uri/ /index.html;
}
```

> 部署注意：
>
> - 认证使用 httpOnly cookie，生产环境 cookie 带 `Secure` 标志，**必须 HTTPS**，否则登录后刷新即掉登录
> - 低内存服务器构建前端可能 OOM：加 swap（`fallocate -l 2G /swapfile && mkswap /swapfile && swapon /swapfile`）或在本地构建后上传 `dist/`
> - 宝塔会在 `client/dist` 生成 `.user.ini` 并加锁，构建前需 `chattr -i dist/.user.ini && rm -f dist/.user.ini`

## API 文档

响应统一格式：

```json
{ "code": 200, "message": "success", "data": { ... } }
```

| 方法            | 路径                  | 说明                                                         | 认证 |
| --------------- | --------------------- | ------------------------------------------------------------ | ---- |
| POST            | /api/auth/login       | 管理员登录（httpOnly cookie 下发 token）                     | ❌   |
| POST            | /api/auth/logout      | 登出（清除 cookie）                                          | ❌   |
| GET             | /api/auth/profile     | 获取当前用户信息                                             | ✅   |
| PUT             | /api/auth/password    | 修改密码（限流 3 次/小时）                                   | ✅   |
| PUT             | /api/auth/profile     | 更新昵称/头像                                                | ✅   |
| GET             | /api/posts            | 文章列表（分页/分类/标签/关键词筛选，公开 pageSize 为 1-50） | ❌   |
| GET             | /api/posts/search     | 全文搜索（标题+摘要+正文，单 IP 15 分钟最多 300 次）         | ❌   |
| GET             | /api/posts/archives   | 按月归档（分页返回 total/totalPages）                        | ❌   |
| GET             | /api/posts/:idOrSlug  | 文章详情（浏览量防刷计数）                                   | ❌   |
| GET             | /api/posts/admin      | 后台文章列表（含草稿）                                       | ✅   |
| GET             | /api/posts/admin/:id  | 后台单篇（含草稿）                                           | ✅   |
| POST            | /api/posts            | 创建文章                                                     | ✅   |
| PUT             | /api/posts/:id        | 更新文章                                                     | ✅   |
| DELETE          | /api/posts/:id        | 删除文章                                                     | ✅   |
| PUT             | /api/posts/:id/top    | 切换置顶                                                     | ✅   |
| PUT             | /api/posts/sort       | 批量更新排序                                                 | ✅   |
| GET             | /api/posts/stats      | 文章统计（仪表盘）                                           | ✅   |
| GET             | /api/categories       | 分类列表（含文章数）                                         | ❌   |
| POST/PUT/DELETE | /api/categories(/:id) | 分类增删改                                                   | ✅   |
| POST            | /api/upload/image     | 上传图片（MIME 魔数校验）                                    | ✅   |
| GET             | /api/health           | 健康检查                                                     | ❌   |
| GET             | /sitemap.xml          | 站点地图（动态生成）                                         | ❌   |

## 安全设计

| 层   | 措施                                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| 认证 | JWT + bcrypt；token 经 **httpOnly + SameSite=Lax** cookie 下发，前端 JS 不可读；生产强制密钥 ≥32 字符；登录限流 5 次/15 分钟 |
| 注入 | 全部 SQL 参数化（`?` 占位）；自定义 ESLint 规则在编译期拦截拼接                                                              |
| XSS  | 禁用 `v-html`；Markdown 经过原始 HTML 拒绝、协议限制、DOMPurify 和 Vue VNode 渲染                                            |
| 上传 | MIME 白名单 + 文件魔数校验（webp 双重校验）+ 扩展名由服务端决定 + 大小限制                                                   |
| 输出 | Helmet 安全头、生产环境 500 不泄漏内部信息、静态文件 nosniff                                                                 |
| 输入 | express-validator 全量校验，自定义规则强制写接口必须「认证 + 验证」                                                          |

## 开发规范

```bash
npm run lint        # 全量 lint（前后端 + 自定义安全规则）
npm run format      # Prettier 格式化
npm test            # 全量测试（前后端）
npm run lint:fix    # 自动修复 lint
```

- 依赖方向：routes → middleware/controllers → `server/db/index.js`；当前 SQL 主要由 controllers 执行，独立数据访问层仍在后续计划中（详见 `docs/architecture.md`）
- 代码规范：`docs/conventions.md`；核心信念：`docs/core-beliefs.md`
- AI Agent 开发指引：`AGENTS.md` + `docs/tasks/*.md`

## 文档与个人文件

项目文档统一放在 `docs/`，分类和入口见 [`docs/README.md`](docs/README.md)：架构、规范和设计资料位于根目录，审计记录位于 `docs/audits/`，任务指引、发布说明和后续计划位于对应子目录。个人 `.docx`、数据库、上传文件、环境变量和压缩包均由 `.gitignore` 排除。

## 隐私与仓库提交

以下内容已被 `.gitignore` 排除，**不会进入 git 仓库**：

| 内容                                          | 规则                                  |
| --------------------------------------------- | ------------------------------------- |
| `server/.env`（含 JWT_SECRET 等）             | `.env`                                |
| 数据库 `data/*.db(-wal/-shm)`                 | `data/*.db*`                          |
| 上传图片 `server/uploads/*`                   | `server/uploads/*`（保留 `.gitkeep`） |
| 依赖 `node_modules/`、构建产物 `client/dist/` | 对应目录规则                          |
| 部署打包产物 `*.tar.gz` 等                    | `*.tar.gz` `*.zip` `*.rar`            |


## 更新日志

各版本更新内容请查看 [GitHub Releases](https://github.com/CnRuQi/CRQHOMES/releases)。

## 开源协议

本项目采用 [Apache License 2.0](LICENSE)，允许商用、修改、分发（需保留版权声明与 NOTICE 信息）。

## 致谢

- [Vue.js](https://vuejs.org/) · [Express](https://expressjs.org/) · [Vite](https://vitejs.dev/)
- [AOS](https://michalsnik.github.io/aos/) · [md-editor-v3](https://imzbf.github.io/md-editor-v3/) · [DOMPurify](https://github.com/cure53/DOMPurify)

---

如有问题或建议，欢迎提 Issue。
