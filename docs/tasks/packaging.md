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
| `server.tar.gz` | 后端代码（排除 `node_modules`、真实 `.env*`、数据库和上传图片；保留 `.env.example`） | 覆盖服务器 `server/` |
| `dist.tar.gz` | 前端生产构建（`index.html` + `assets/`） | 覆盖站点 `dist/` |
| `data.tar.gz` | 数据库 `data/blog.db`（**可选**） | 仅数据迁移 / 新站初始化 / 恢复 |

> 三个产物都在 `.gitignore` 中，不进版本库。

---

## 步骤

### 1. 跑通检查

```bash
npm run lint          # 0 error
npm run format:check  # 全部符合 Prettier
npm test              # 当前发布基线：后端 83 + 前端 50
```

> 项目最低要求 Node 20。若出现 `NODE_MODULE_VERSION` 不匹配，说明当前 `node_modules` 是由其他 Node ABI 安装或编译的；切换到受支持的 Node 版本后，在对应 package 目录重新执行 `npm ci`。
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
  --exclude='server/.env.*' \
  --exclude='server/uploads/*' server
tar -rf server.tar server/uploads/.gitkeep server/.env.example
gzip -f server.tar
```

排除项的含义与注意事项：

| 排除项 | 原因 |
|--------|------|
| `server/node_modules` | 服务器已有依赖，且体积巨大；依赖变化时应在服务器 `npm install` |
| `server/.env`、`server/.env.*` | 本地运行配置可能含密钥，不能进包。`.env.example` 会在归档时单独加入 |
| `server/uploads/*` | 真实上传图片。服务器上的图片是权威数据，不能被旧包覆盖 |

**为什么要绕一圈追加文件**：排除规则会把 `uploads/.gitkeep` 和 `.env.example` 一起排掉；前者保证上传目录存在，后者是安全的配置模板。已 gzip 的归档不能用 `tar -r` 追加，所以先生成未压缩的 `server.tar`、追加后再压缩。

**排除模式不要加 `./` 前缀**：打包参数是 `server`，成员名是 `server/...`，带 `./` 的模式匹配不上，排除会静默失效。

### 6. 校验产物

```bash
# 条目清单与上一版比对（应完全一致，除非本次新增/删除了源文件）
diff <(tar -tzf /tmp/pkgbak/server.tar.gz | sort) <(tar -tzf server.tar.gz | sort)

# 环境文件排查：只允许 server/.env.example，不得出现其他 .env 或 .env.*
if tar -tzf server.tar.gz | grep -E "/\.env($|\.)" | grep -v "/\.env\.example$"; then
  echo "发现不应打包的环境文件" >&2
  exit 1
fi

# 上传目录排查：仅允许 uploads/ 与 uploads/.gitkeep
tar -tzf server.tar.gz | grep -E "node_modules|uploads/"

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

## 文件级最小增量升级（可选）

适用于带宽紧张且只改了少量后端源文件的场景。

**前提**：用 `git diff --name-only <上一发版commit> -- server/` 拿到准确的改动清单，
不要凭记忆列。**前端不存在文件级增量**——构建产物带内容 hash，文件名随内容变，
必须用完整 `dist.tar.gz` 覆盖。

### 后端增量

```bash
# 本地：按改动清单打小包，保持 server/ 路径结构，服务器解压即落到对应位置
tar -czf server-incremental.tar.gz \
  server/db/schema.sql server/db/index.js server/middleware/auth.js

# 服务器（站点根目录）：覆盖后重启触发 initDb() 迁移
tar -xzf server-incremental.tar.gz
pm2 restart blog-server
```

**规则**：

1. 相互依赖的文件必须同时到位。例如 `schema.sql` 与 `db/index.js`（迁移逻辑）分开传，
   中途状态会让新库建表缺列
2. 有 schema 变更时，覆盖后必须重启触发迁移，并按第 7 步先备份数据库
3. 拿不准就退回标准全量包——它对 `data/`、`uploads/`、`.env` 同样零接触，
   且第 6 步的条目 diff 可以防漏传

---

## 常见坑

| 现象 | 原因与处理 |
|------|-----------|
| 排除规则没生效，包里仍有 `node_modules` | 排除模式写了 `./server/node_modules`，去掉 `./` 前缀 |
| `tar -r` 报 "Cannot append to compressed archive" | gzip 过的归档不能追加，需按第 5 步先建未压缩 tar |
| 解压后 `server/uploads/` 目录丢失 | `.gitkeep` 被 `server/uploads/*` 一起排掉了 |
| 覆盖后前端仍是旧版 | 浏览器缓存，Ctrl+F5；或确认站点根目录指向的是被覆盖的那个 `dist/` |
| 后端测试报 NODE_MODULE_VERSION 不匹配 | 确认使用 Node 20+，并在 `server/` 目录重新执行 `npm ci` |

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
