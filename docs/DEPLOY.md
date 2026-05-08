# 部署文档

## 服务器要求

| 项目 | 最低要求 |
|------|----------|
| CPU | 2核 |
| 内存 | 2GB |
| 带宽 | 5Mbps |
| 系统 | Ubuntu 20.04+ / CentOS 7+ |
| Node.js | 18+ |

## 部署步骤

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx
```

### 2. 上传项目

```bash
# 方式一：使用 Git
git clone <your-repo-url> /var/www/blog

# 方式二：使用 SCP
scp -r ./blog/* user@server:/var/www/blog/
```

### 3. 安装依赖

```bash
# 进入项目目录
cd /var/www/blog

# 安装后端依赖
cd server
npm install --production

# 安装前端依赖并构建
cd ../client
npm install
npm run build
```

### 4. 配置环境变量

```bash
# 编辑后端环境变量
cd /var/www/blog/server
cp .env.example .env
nano .env
```

修改以下配置：
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-strong-random-secret-key
DB_PATH=../data/blog.db
UPLOAD_DIR=./uploads
CORS_ORIGIN=https://your-domain.com
```

### 5. 初始化数据库

```bash
cd /var/www/blog/server
node db/init.js

# 创建管理员账号
node db/create-admin.js
```

### 6. 启动后端服务

```bash
cd /var/www/blog/server

# 使用 PM2 启动
pm2 start app.js --name blog-server

# 设置开机自启
pm2 startup
pm2 save

# 常用命令
pm2 status        # 查看状态
pm2 logs          # 查看日志
pm2 restart all   # 重启服务
```

### 7. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/blog
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 前端静态文件
    root /var/www/blog/client/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件
    location /uploads {
        alias /var/www/blog/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. 配置 SSL（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## Docker 部署（可选）

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制后端
COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY server/ ./server/

# 复制前端构建产物
COPY client/dist/ ./client/dist/

# 创建数据目录
RUN mkdir -p /app/data /app/server/uploads

EXPOSE 3000

CMD ["node", "server/app.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  blog:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/server/uploads
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    restart: unless-stopped
```

启动：
```bash
docker-compose up -d
```

## 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 2. 权限问题
```bash
# 修改目录权限
sudo chown -R www-data:www-data /var/www/blog
sudo chmod -R 755 /var/www/blog
```

### 3. 数据库备份
```bash
# 备份
cp /var/www/blog/data/blog.db /backup/blog_$(date +%Y%m%d).db

# 定时备份（添加到 crontab）
0 2 * * * cp /var/www/blog/data/blog.db /backup/blog_$(date +\%Y\%m\%d).db
```

### 4. 查看日志
```bash
# PM2 日志
pm2 logs blog-server

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 更新部署

```bash
cd /var/www/blog

# 拉取最新代码
git pull

# 更新后端依赖
cd server && npm install --production

# 重新构建前端
cd ../client && npm install && npm run build

# 重启后端
pm2 restart blog-server
```
