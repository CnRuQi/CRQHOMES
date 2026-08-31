# 第二轮代码审查报告 — 披花沐雪

> 审查日期：2026-08-31
> 触发：第一轮（`docs/code-review-2026-08-29.md`）修复完成后的复查
> 范围：**全量**——除第一轮已覆盖的 server 后端与 client 主要视图外，本轮补齐了第一轮未覆盖的
> `components/{Icon,PostCard,EmptyState,SkeletonCard,Footer}.vue`、全部 admin 视图、
> `NotFound.vue`、`server/db/{create-admin,import-data}.js`、测试文件与构建配置
> 分级：**严重 0 / 中等 2 / 建议 9**

## 修复状态（同日更新，两批共 14 项全部完成）

第一批修复 3 项（M1 / M2 / 一致性·3），第二批把 A1-A9 与一致性专项**全部**修完。
验证：lint 0 error 0 warning、`format:check` 通过、后端 35 项测试通过、前端 24 项测试通过。

| 编号 | 状态 | 说明 |
|------|------|------|
| M1 导入脚本无护栏 | ✅ 已修 | `confirmDestructiveImport()`：生产环境直接拒绝；非交互终端拒绝（不挂起）；交互环境要求输入站点名确认；自动化走 `IMPORT_FORCE=1`。护栏在 `initDb()` **之前**，被拒时不创建库文件 |
| M2 导入丢失发布时间 | ✅ 已修 | 8 篇示例数据全部补 `published_at`（UTC ISO，按 id 递增）；INSERT 加字段并做 `toISOString()` 兜底 |
| 一致性·3 排序无兜底 | ✅ 已修 | 常量 `TIME_ORDER_EXPR`，列表与归档共用，补 1 项后端测试 |
| A1 try 内 exit 跳过 finally | ✅ 已修 | `create-admin.js` 校验失败改 `throw`，catch 里 `process.exitCode = 1`，finally 正常关闭连接与 readline |
| A2 readline 私有 API | ✅ 已修 | `questionHidden` 检测 `rl._writeToOutput` 是否存在：存在则屏蔽回显，不存在降级为正常回显而不是崩溃 |
| A3 密码无上限 | ✅ 已修 | 加 `PASSWORD_MAX_BYTES = 72`（bcrypt 截断阈值），按 UTF-8 字节数校验 |
| A4 导入残留孤儿防刷记录 | ✅ 已修 | 导入事务内一并 `DELETE FROM view_tracking` |
| A5 initDb 在 try 外 | ✅ 已修 | `initDb()` / `getDb()` 移入 try，失败也走 `closeDb()` 收尾 |
| A6 浏览量与防刷记录不原子 | ✅ 已修 | `getPost` 里计数与 `recordView` 包进同一事务 |
| A7 改密后旧 JWT 仍有效 | ✅ 已修 | users 表加 `token_version`（schema + 迁移）；JWT 带 `tv`；`authenticate` 比对；改密递增并重签 cookie（当前会话保持、其他设备被踢）。**7 项临时实测全过**（含旧 token 兼容、防伪造 tv） |
| A8 登录时序侧信道 | ✅ 已修 | 用户不存在时用预计算哑哈希跑一次 `bcrypt.compare` 再报同样的错，消除耗时差 |
| A9 前后端错误文案耦合 | ✅ 已修 | `AppError` 支持 `data` 并透传；`deleteCategory` 带 `postCount`；前端拦截器透传 `data`，`Categories.vue` 优先读字段、正则仅作降级 |
| 一致性·1 CLI 退出风格 | ✅ 已修 | 两脚本统一 `process.exitCode` |
| 一致性·2 滚动锁重复 | ✅ 已修 | `setBodyScrollLock` 抽到 `assets/js/utils.js`，Navbar / Layout 改为复用，Categories 模态框打开时加锁、卸载时释放 |
| 一致性·4 reduced-motion 快照 | ✅ 已修 | `useCountUp` 改为响应式并监听 `change`，运行期间切换系统设置立即生效；切到「减少」时直接落终值 |

**关键实测**（临时脚本验证后即删，未触及 `data/blog.db`）：
① M1 三层护栏：生产环境拒绝且不建库 / 非交互拒绝不挂起 / `IMPORT_FORCE=1` 导入成功且 8 篇时间全为 UTC ISO；
② A7 七项：旧式 token 兼容、`req.user` 不泄漏 `token_version`、改密后旧 token 拒、新 token 过、
用户不存在拒、伪造更高 `tv` 也拒（只认完全匹配）。

## 结论速览

第一轮的核心业务代码问题已全部修复，本轮**未发现新的严重问题**。新发现的 2 条中等项全部落在
**一次性 CLI 脚本**（`db/import-data.js`）上，不影响线上运行时。业务代码中新增的均为建议级。

| 维度 | 评价 | 说明 |
|------|------|------|
| 逻辑正确性 | 优 | 第一轮的 S1/M1 修复经测试与实测验证有效，未引入回归 |
| 边界与异常 | 良 | 共享校验链、marked 导出形态均已实测；CLI 脚本的异常路径偏弱 |
| 错误处理 | 良 | 业务层统一走 `next(error)`；CLI 脚本存在 `process.exit` 跳过 finally |
| 性能与资源 | 良 | 无新增泄漏；后台仍为全量拉取（按体量评估可接受） |
| 安全性 | 优 | 无注入、无 XSS、无越权；仅剩两个极低风险的加固点 |
| 可维护性 | 良 | 上一轮的去重已见效；CLI 脚本与业务代码质量有落差 |
| 一致性 | 良 | 存在若干跨模块的零散不一致，见建议项 |

---

## 严重

**已检查，无异常。**

本轮逐行复查了第一轮修复后的 `postController.js`（`updatePost` 的 status 半更新联动、
`deletePost` 的事务、`getArchives` 的 julianday 排序与 LIMIT、`searchPosts` 的复用、
`getPost` 的 WeakMap 语句缓存）与 `validator.js`（共享 `postFieldRules`），逻辑均正确。

---

## 中等

### M1. `db:import` 无确认即清空全站文章，且没有生产环境保护

- **位置**：`server/db/import-data.js:224-236`（`importData()` 内）
- **成因**：脚本在事务中直接执行 `DELETE FROM posts` 与 `DELETE FROM categories`，
  执行前没有任何确认提示，也不检查 `NODE_ENV`。该命令已注册为 `npm run db:import`，
  在生产服务器上误敲一次就会执行。
- **影响**：全站文章与分类被清空且**不可恢复**（脚本自身不备份，项目也没有别的备份机制）。
  这是当前代码里唯一一处「一条命令造成不可逆数据丢失」的路径。
- **建议**（三选一，按性价比排序）：
  1. 最小改动——在删除前加交互式确认，并要求输入站点标识：

     ```js
     if (process.env.NODE_ENV === 'production') {
       console.error('拒绝在生产环境执行导入：该操作会清空全部文章且不可恢复')
       process.exit(1)
     }
     console.log('警告：本操作将清空全部文章与分类，且不可恢复。')
     const answer = await question('请输入站点标题「披花沐雪」以继续: ')
     if (answer.trim() !== '披花沐雪') { console.log('已取消'); return }
     ```
  2. 删除前自动备份：`fs.copyFileSync(dbPath, dbPath + '.bak-' + Date.now())`
  3. 把该脚本从 `package.json` 的 scripts 中移除，改为需显式 `node server/db/import-data.js` 执行
- **是否必须修复**：建议修复。不阻塞发版，但风险与修复成本不成比例。

### M2. 导入数据丢失原始发布时间，归档与排序失真

- **位置**：`server/db/import-data.js:251-254`（`insertPost` 的 INSERT 语句）
- **成因**：INSERT 的字段列表里没有 `published_at`，该列落到 schema 的默认值
  `strftime('%Y-%m-%dT%H:%M:%fZ','now')`，也就是**导入那一刻**。
  脚本里 4 篇文章（第 11-222 行）也确实都没有 `published_at` 字段。
- **影响**：导入后所有文章的发布时间都等于导入时刻，归档页会全部挤进同一个月份分组，
  列表按 `published_at` 排序也失去意义。与上一轮刚统一的「`published_at` 是文章固有属性」
  语义相矛盾。
- **建议**：给 `posts` 数组每篇补上 `published_at`（UTC ISO 串），并加入 INSERT：

  ```js
  INSERT INTO posts (id, title, slug, content, summary, cover_image,
                     category_id, is_top, status, views, published_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ```
  注意 `sort_order` 同样没导入，会落到默认值 0；若需要保持列表顺序应一并处理。
- **是否必须修复**：建议修复。仅影响这个开发用脚本，但会让导入结果明显不对。

---

## 建议

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| A1 | `server/db/create-admin.js:46,50,54,66` | try 块内多处 `process.exit(1)`，会跳过 `finally` 中的 `closeDb()` 与 `rl.close()`。进程退出时 OS 会回收资源、WAL 有日志保护所以不会损坏数据，但属于反模式 | 改为 `throw new Error(msg)`，让 catch 统一打印并由 `process.exitCode = 1` 收尾（与 `import-data.js:287` 的写法对齐） |
| A2 | `server/db/create-admin.js:25-26` | 用 `rl._writeToOutput` 这个 readline 私有 API 实现密码不回显，Node 升级可能失效 | 可接受，但建议加兜底：`const writeToOutput = rl._writeToOutput \|\| (() => {})`，避免恢复时写入 undefined |
| A3 | `server/db/create-admin.js:52-55` | 密码只校验下限（6 位），无上限。bcrypt 会在 72 字节处截断，前后端行为一致所以**不会**导致无法登录，但用户可能误以为设置了超长密码 | 加一个 `PASSWORD_MAX = 72` 上限校验，并提示「超出部分会被忽略」 |
| A4 | `server/db/import-data.js:235` | `DELETE FROM posts` 后未清理 `view_tracking`，留下孤儿行（与上一轮已修的 `deletePost` 是同类问题） | 在同一事务里加 `db.prepare('DELETE FROM view_tracking').run()` |
| A5 | `server/db/import-data.js:227-228` | `initDb()` 在 try 之外，失败时不会被 catch，堆栈直接抛出且 `closeDb()` 不执行 | 把 `initDb()` / `getDb()` 移入 try |
| A6 | `server/controllers/postController.js:246-252` | 浏览量 +1 与 `recordView` 未在同一事务。better-sqlite3 同步执行、Node 单线程，中间无 await，所以实际不会交错；但若 `recordView` 抛错（如磁盘满），会出现「计数已 +1、防刷记录没写」 | 用 `db.transaction(() => { ... })()` 包起来，与 `deletePost` 的做法一致 |
| A7 | `server/controllers/authController.js:80-111` | 修改密码后，旧 JWT 在剩余有效期内仍然可用（最长 24h）。单管理员个人博客风险有限，但改密通常是为了应对泄露 | 维护一个 `tokenVersion` 或改密后写入用户级的 `password_changed_at`，在 `authenticate` 里比对 `iat` |
| A8 | `server/controllers/authController.js:18-27` | 用户不存在时直接返回，不执行 `bcrypt.compare`，存在可枚举用户名的时序侧信道 | 用一个预计算的 dummy hash 执行 compare 后再返回同样错误，消除时间差 |
| A9 | `client/src/views/admin/Categories.vue:198` | 用正则 `/该分类下还有 (\d+) 篇文章/` 匹配后端中文错误文案来提取数量，耦合了服务端字符串 | 后端改为返回结构化错误（如 `{ code: 400, data: { postCount: 3 } }`），前端读字段；短期可保留正则作降级 |

---

## 一致性专项

1. **两个 CLI 脚本的错误退出风格不一致**：`create-admin.js` 用 `process.exit(1)`，`import-data.js`
   用 `process.exitCode = 1`。后者更正确（允许 finally 执行），建议统一到后者。
2. **模态框的滚动锁不一致**：`Navbar.vue:84-88` 与 `Layout.vue:135-139` 各自实现了一份
   `setBodyScrollLock`（html + body 双锁，逻辑完全相同），而 `Categories.vue` 的模态框打开时
   **没有**加锁。建议把 `setBodyScrollLock` 抽到 `assets/js/utils.js` 复用，并在模态框打开时调用。
3. **列表接口的时间排序没有兜底**：`getArchives` 用了
   `julianday(COALESCE(published_at, created_at))`，而 `executePostListQuery` 用的是
   `julianday(p.published_at)`。若某篇已发布文章的 `published_at` 为 NULL（直接改库或旧逻辑遗留），
   前者会回退到 `created_at`，后者会把该行排到末尾。建议统一为 `COALESCE` 形式。
4. **`useCountUp` 的 `prefersReducedMotion`**：`useCountUp.js:12-13` 在 setup 期求值一次，
   运行期间用户修改系统「减少动效」设置不生效（`Dashboard.vue` 的 4 个统计数字都受影响）。
   与 `App.vue:27` 的 `reduceMotionQuery` 是同一类问题，建议像 `useTheme.js:40-54` 那样加监听。

---

## 本轮做的实测验证

这几项都是「看起来可疑、但不实测无法定论」的点，全部验证完毕：

1. **`marked` v18 的导出形态** ✅
   `import { marked } from 'marked'` 实测 `typeof marked === 'function'`，`marked.use` 与
   `marked.parse` 均存在，`marked('# hi')` 正常返回 `'<h1>hi</h1>\n'`。
   → 上一轮 M5 把配置抽到 `assets/js/markdown.js` 后，`Post.vue` 的 `marked(content)` 调用安全。
   （这一处没有被任何测试覆盖，值得留意。）

2. **共享 `ValidationChain` 实例无状态污染** ✅
   上一轮 M6 让 `create` 与 `update` 共用同一批 chain。实测 9 个跨路由、交替成功/失败的请求，
   校验状态无串味；顺带确认 `isISO8601()` 对 `2026-08-29T22:30`（datetime-local）与
   `2026-08-29T14:30:00.000Z`（UTC ISO）都能通过，对 `not-a-date` 会拦截。

3. **`vite.config.js` 里的 `__dirname`** ✅
   `client/package.json` 是 `"type": "module"`，但 Vite 在 bundle 配置文件时会注入
   `__dirname` / `__filename` / `import.meta.url` 的 define，因此可用；且历史构建记录为成功。

4. **存量 `published_at` 格式** ⚠️ 修正了上一轮的一处推断
   实测 `data/blog.db`：`posts` / `users` / `categories` / `view_tracking` **全部 0 行**，
   表结构是最新的（含 `slug` 列）。也就是说本地是全新空库，**不存在**上一轮报告末尾提到的
   「历史数据格式混用需要迁移」的问题。该结论已同步修正到第一轮报告的「总体评价」章节，
   并给出判断是否真需要迁移的 SQL。

5. **`server/.env.example` 的部署说明** ✅
   `TRUST_PROXY` 的注释准确说明了「覆盖式 vs 追加式」转发头的区别与安全影响，
   这是反向代理下 IP 识别最常见的坑，文档到位。

---

## 未覆盖

- `client/src/assets/css/*.css` 与全部组件内 `<style scoped>`：本轮未逐行审查样式代码。
  样式本身不承载逻辑，风险面低；如需要可另开一轮专门检查响应式断点与主题变量的一致性。
- `server/eslint-rules/*.js` 的规则实现：上一轮已读 `no-sql-concat` 与 `no-direct-db-in-routes`，
  本轮未重读 `require-auth-middleware` / `require-input-validation` 的细节实现。
  这两条是启发式检测（规则注释里已自述可能漏报），但当前所有路由都实际带了 `authenticate`
  与校验中间件，ESLint 也是全绿的。

---

## 总体评价

第一轮修完之后，核心业务代码**没有出现新的严重问题**，也没有发现修复引入的回归——这一点是
通过实测而非推理确认的（marked 调用形态、共享校验链、lint/format/34+24 项测试）。

**推荐的三项已全部修复完毕**（详见上文「修复状态」表）。M1 消除的正是整个仓库唯一一处
「一条命令造成不可逆损失」的路径；M2 让导入能保留发布时间；列表与归档的排序收敛到同一个常量
`TIME_ORDER_EXPR`，从根上杜绝两处再次漂移。

本报告列出的全部问题（2 条中等、9 条建议、一致性专项 4 条）**至此已全部修复**。两轮合计
29 项（第一轮 12 + 第二轮 17）。剩余的只有两轮报告中明确标注「评估后不做」的事项：接口限流
（M8 部分，个人博客体量不需要）与 CSS 样式审查（不承载逻辑）。

需要留意的一个**行为变更**：A7 落地后，修改密码会使其他设备上的旧登录态失效（当前会话因
重签 cookie 不受影响）。`schema.sql` 与 `initDb()` 的迁移会在下次启动时自动为存量
`users` 表补 `token_version` 列，旧 token 按 tv=0 处理，升级不会强制已登录用户重新登录。
