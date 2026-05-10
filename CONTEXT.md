# 项目记忆文档 - 披花沐雪

> 最后更新：2026-05-10
>
> 记忆文档位置：`docs/{更改主题}-{时间}.md`

## 最近修改

1. **2026-05-10 11:16** - 添加 express-validator 输入验证
2. **2026-05-10** - 更新 README.md 和 project.md 同步代码结构
3. **2026-05-10** - 添加 CONTEXT.md 项目记忆文档
4. **2026-05-10** - 创建 start.bat/start.ps1 启动脚本

## 项目概述

- **名称**：披花沐雪 (One Last Kiss for the Beautiful World)
- **类型**：个人博客系统
- **版本**：v1.0.0
- **仓库**：https://github.com/CnRuQi/CnRuQi.git

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | Vue 3 + Vite | ^3.5 / ^6.0 |
| 状态管理 | Pinia | ^2.3 |
| 后端 | Express | ^5.2 |
| 数据库 | SQLite (better-sqlite3) | ^12.9 |
| 认证 | JWT + bcrypt | ^9.0 / ^3.0 |

## 项目结构

```
├── server/          # Express 后端
│   ├── controllers/ # auth, post, category
│   ├── routes/      # auth, post, category, upload
│   ├── middleware/   # auth, error
│   └── db/          # SQLite 初始化/迁移
├── client/          # Vue 3 前端
│   ├── src/views/   # Home, Post, Archives, admin/*
│   ├── src/api/     # axios 封装
│   └── src/stores/  # auth, post
└── data/            # blog.db
```

## 关键决策记录

1. **配色方案**：「枯木冷茶」莫兰迪灰褐色系
2. **UI 风格**：玻璃拟态 + AOS 动画
3. **数据库**：SQLite 轻量级，适合 2核2G 服务器
4. **编辑器**：md-editor-v3 (Markdown WYSIWYG)

## 启动方式

```bash
# Windows
start.bat

# 手动
cd server && npm run dev
cd client && npm run dev
```

## 访问地址

- 前端：http://localhost:5173
- 后端：http://localhost:3000
- 后台：http://localhost:5173/admin
- 管理员：CnRuQi / crq123456

## 待办事项

- [x] 添加输入验证 (express-validator) - 已完成 2026-05-10
- [ ] 优化错误提示 (toast 替代 alert)
- [ ] 加强登录速率限制
- [ ] 考虑 httpOnly cookie 存储 token

## 代码审查发现

- SQL 查询正确使用参数化
- JWT 认证流程完整
- 前端路由守卫正常
- ✅ 已添加 express-validator 输入验证
