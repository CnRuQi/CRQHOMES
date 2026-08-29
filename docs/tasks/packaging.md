# 打包升级文件

> 步骤化的任务指南，AI Agent 可按此流程执行。
>
> 适用：每次发版时生成部署产物。命令可直接复制执行。

---

## 前置条件

- 全部改动已在工作区跑通（`npm run lint`、`npm test`）
- 已确定目标版本号，并已更新 `README.md` 第 7 行与 `docs/releases/` 下的 Release Notes

---

## 产物说明

| 产物 | 内容 | 用途 |
|------|------|------|
| `server.tar.gz` | 后端代码（排除 `node_modules`、`.env`、`uploads/` 图片） | 覆盖服务器 `server/` |
| `dist.tar.gz` | 前端生产构建（`index.html` + `assets/`） | 覆盖站点 `dist/` |
| `data.tar.gz` | 数据库 `data/blog.db`（**可选**） | 仅数据迁移 / 新站初始化 / 恢复 |

> 三个产物都在 `.gitignore` 中，不进版本库。

---

## 步骤

### 1. 跑通检查

```bash
npm run lint          # 0 error
npm run format:check  # 全部符合 Prettier
npm test              # 后端 30 + 前端 23
```

> 后端测试在本机**必须用 Node 24**（`D:\Program Files\nodejs`）。`better-sqlite3` 由 Node 24 编译（ABI 137），
> 默认 Node 22（ABI 127）会报 `NODE_MODULE_VERSION` 不匹配。这是本地环境问题，与代码无关；
> CI 用 `npm ci` 重新编译原生模块，不受影响。
>
> 若 `npx vitest` 无输出且 exit 1，加管道即可：`npx vitest run 2>&1 | cat`

### 2. 备份旧产物

```bash
mkdir -p /tmp/pkgbak && cp server.tar.gz dist.tar.gz /tmp/pkgbak/
```

### 3. 构建前端

```bash
cd client && npm run build
```

> - `Editor` chunk 约 884 kB，超 500 kB 的警告是既有现象，不是新引入的问题
> - 服务器内存小会在构建时 OOM：加 swap，或本地构建后只上传 `dist/`
> - 宝塔会在 `client/dist` 生成加锁的 `.user.ini`，重新构建前需
>   `chattr -i dist/.user.ini && rm -f dist/.user.ini`

### 4. 打前端包

```bash
cd client && tar -czf ../dist.tar.gz dist
```

必须在 `client/` 目录下执行——包内根目录是 `dist/`，不能是 `client/dist/`。

### 5. 打后端包

```bash
cd <项目根目录>
tar -cf server.tar --exclude='server/node_modules' --exclude='server/.env' \
  --exclude='server/uploads/*' server
tar -rf server.tar server/uploads/.gitkeep
gzip -f server.tar
```

三个排除项的含义与注意事项：

| 排除项 | 原因 |
|--------|------|
| `server/node_modules` | 服务器已有依赖，且体积巨大；依赖变化时应在服务器 `npm install` |
| `server/.env` | 含 `JWT_SECRET` 等密钥，绝不能进包。不会误伤 `.env.example` |
| `server/uploads/*` | 真实上传图片。服务器上的图片是权威数据，不能被旧包覆盖 |

**为什么要绕一圈追加 `.gitkeep`**：`--exclude='server/uploads/*'` 会把 `uploads/.gitkeep` 一起排掉，
而这个占位文件决定了服务器解压后 `uploads/` 目录是否存在。已 gzip 的归档不能用 `tar -r` 追加，
所以先生成未压缩的 `server.tar`、追加后再压缩。

**排除模式不要加 `./` 前缀**：打包参数是 `server`，成员名是 `server/...`，带 `./` 的模式匹配不上，排除会静默失效。

### 6. 校验产物

```bash
# 条目清单与上一版比对（应完全一致，除非本次新增/删除了源文件）
diff <(tar -tzf /tmp/pkgbak/server.tar.gz | sort) <(tar -tzf server.tar.gz | sort)

# 敏感内容排查：应只剩 uploads/ 与 uploads/.gitkeep 两行
tar -tzf server.tar.gz | grep -E "node_modules|/\.env$|uploads/"

# 前端包根目录确认：dist/ + dist/index.html + dist/assets/
tar -tzf dist.tar.gz | grep -v "assets/"
```

基线参考（v1.3.3）：`server.tar.gz` 45 条目 / 69 KB，`dist.tar.gz` 151 条目 / 910 KB。

**构建产物抽检**——确认本次改动真的进了包，别只看构建成功：

```bash
cd client/dist/assets
grep -rlF "本次新增的界面文案" *.js
```

对于没有测试覆盖的模板改动，可以直接查编译结果。例如统计数字应从
`{{ x.value }}` 编译为 `toDisplayString(unref(x))`，在 chunk 里表现为 `c(m(b))`。

### 7. 服务器覆盖升级

```bash
cp -r data data.bak                 # 1. 先备份数据库
tar -xzf server.tar.gz              # 2. 解压覆盖 server/
pm2 restart blog-server             #    （宝塔：面板重启 Node 项目）
tar -xzf dist.tar.gz                # 3. 解压覆盖站点 dist/
```

- 前端覆盖后要求用户 **Ctrl+F5** 强制刷新一次，否则会命中旧的带 hash 资源
- 仅当 `package.json` 依赖变化时才需要在服务器 `npm install`
- 仅当 schema 变化时才需要数据迁移（迁移逻辑内联在 `initDb()`，启动自动执行）
- `data.tar.gz` 平时**不要**附带，只在明确需要恢复/迁移时单独给出

---

## 常见坑

| 现象 | 原因与处理 |
|------|-----------|
| 排除规则没生效，包里仍有 `node_modules` | 排除模式写了 `./server/node_modules`，去掉 `./` 前缀 |
| `tar -r` 报 "Cannot append to compressed archive" | gzip 过的归档不能追加，需按第 5 步先建未压缩 tar |
| 解压后 `server/uploads/` 目录丢失 | `.gitkeep` 被 `server/uploads/*` 一起排掉了 |
| 覆盖后前端仍是旧版 | 浏览器缓存，Ctrl+F5；或确认站点根目录指向的是被覆盖的那个 `dist/` |
| 后端测试报 NODE_MODULE_VERSION 不匹配 | 用了 Node 22，切 Node 24 运行 |

---

## 检查清单

- [ ] `npm run lint` / `npm run format:check` / `npm test` 全部通过
- [ ] `README.md` 版本号已更新，`docs/releases/` 已新增对应 Release Notes
- [ ] 旧产物已备份到 `/tmp/pkgbak/`
- [ ] 重新构建前端（`npm run build`），而非直接打旧的 `dist/`
- [ ] `server.tar.gz` 中无 `node_modules`、无 `.env`、无上传图片，且含 `uploads/.gitkeep`
- [ ] `dist.tar.gz` 根目录为 `dist/`
- [ ] 已抽检构建产物中确实包含本次改动
- [ ] 升级前已备份服务器数据库
