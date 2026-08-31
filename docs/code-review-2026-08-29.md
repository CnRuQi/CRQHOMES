# 代码审查报告 — 披花沐雪

> 审查日期：2026-08-29
> 审查范围：`server/` 全量（app、config、db、middleware、controllers、routes、utils、eslint-rules）与 `client/src` 全量（api、stores、router、composables、components、views）
> 审查方式：逐文件通读 + 交叉验证（已对疑似问题做二次取证，排除了 3 个误报：路由组件复用导致分类切换不刷新、`server/eslint.config.js` 缺失、`.env` 入库）
> 分级：**严重 1 / 中等 8 / 轻微 9**

## 修复状态（2026-08-29 同日更新）

已按优先级实施修复，**12 项全部落地**（含 S1、M1）。验证：lint 0 error 0 warning、`format:check` 通过、后端 34 项测试通过、前端 24 项测试通过。共新增 5 个测试用例守住各行为变更。

| 编号 | 状态 | 说明 |
|------|------|------|
| M7 `busy_timeout` | ✅ 已修 | `db/index.js` 加 `busy_timeout = 5000` |
| M2 `published_at` 校验与时区 | ✅ 已修 | 验证器加 `isISO8601`；新增 `normalizePublishedAt()`，落库统一为 UTC ISO。补 1 项后端测试 |
| M4 转草稿保留发布时间 | ✅ 已修 | 草稿不再清空 `published_at`；前端弹窗措辞同步。补 1 项后端测试 |
| M3 归档排序语义 | ✅ 已修 | 改用 `julianday(COALESCE(published_at, created_at))` |
| M8 归档条数上限 | ✅ 已修 | 新增 `ARCHIVE_MAX_POSTS = 500` 并加 `LIMIT ?`（限流部分按评估暂不做） |
| M6 规则与查询去重 | ✅ 已修 | `validator.js` 抽 `postFieldRules`；`searchPosts` 复用 `executePostListQuery`，顺带补上 `updated_at` 归一化 |
| M5 `marked` 全局污染 | ✅ 已修 | 新建 `client/src/assets/js/markdown.js` 承载一次性配置 |
| L8 首帧闪错误态 | ✅ 已修 | `Post.vue` 的 `loading` 初值改 `true` |
| L5 `getPost` 预编译 | ✅ 已修 | 用 `WeakMap` 按 db 实例缓存语句，保留 slug 优先语义 |
| L6 `view_tracking` 孤儿 | ✅ 已修 | 删除文章时同事务清理防刷记录 |
| **S1 status 缺省即发布** | ✅ 已修 | `updatePost` 改为保留原状态（`status !== undefined ? status : existingPost.status`），`existingPost` 的 SELECT 补 `status` 字段，空内容校验同步改用生效后的 `postStatus`。补 2 项后端测试 |
| M1 路由守卫 401 判定 | ✅ 已修 | `router/index.js` 改读 `error?.code === 401`；拦截器抛的是 `{code, message}` 普通对象，没有 `response` 字段 |
| M8 接口限流部分 | ⏸ 评估后不做 | 个人博客体量下暂不需要 |
| L1 / L2 / L3 / L4 / L7 / L9 | ⏸ 暂不处理 | 均为低概率或纯风格问题 |

> 注：上表「位置」中的行号指向**审查当时**的代码，修复后已有偏移，请以问题标题为准。

## 结论速览

| 维度 | 评价 | 关键问题 |
|------|------|----------|
| 正确性 | 良 | 更新接口 status 缺省即发布；`published_at` 未校验；归档排序依赖裸列字符串 |
| 安全性 | 优 | 无注入、无 XSS、无密钥泄漏。唯一缺口是公开接口无全局限流 |
| 性能 | 良 | 后台全量拉取文章、`search` 全文 LIKE 无索引、`marked` 全局重复注册 |
| 可维护性 | 中 | 验证规则与查询构造存在两处大段重复 |
| 一致性 | 良 | 时间规范化逻辑散落三处；sitemap 的 XML 拼装越层放在 router |

**未覆盖部分**：`client/src/components/{Icon,Footer,PostCard,EmptyState,SkeletonCard}.vue`、`views/admin/{Dashboard,Categories,Layout}.vue`、`views/NotFound.vue`、`server/db/{create-admin,import-data}.js`、`server/__tests__/`、`client/src/__tests__/` 及全部 CSS。以上为纯展示层或一次性 CLI 脚本，风险面较低，如需可另行安排一轮。

---

## 严重

### S1. 更新文章时 `status` 缺省被当作「发布」，草稿可被静默公开

- **位置**：`server/controllers/postController.js:397`、`server/controllers/postController.js:400-401`；配合 `server/middleware/validator.js:78`（`body('status').optional()`）
- **成因**：`postStatus = status !== undefined ? status : 1`。验证器把 `status` 声明为 `optional`，因此 `PUT /api/posts/:id` 省略 `status` 是**合法请求**，服务端却把它解释为 `1`（发布）。第 381 行的空内容校验同样因此走「非草稿」分支（`Number(undefined) !== 0`），要求正文非空。
- **影响**：对一篇草稿执行不含 `status` 的更新，会立即把它转为已发布并写入发布时间——内容对外可见。当前前端 `Editor.vue` 总是显式提交 `status`，所以线上暂未触发；但这是 API 契约层面的缺陷，任何脚本化调用（自动保存、第三方客户端、未来的批量操作）都会踩中，且**内容公开是不可逆的**。同一写法在 `createPost:316` 也存在，但新建默认发布属合理默认，不算缺陷。
- **建议**：与项目其余接口（分类 `updateCategory`、资料 `updateProfile`）保持一致的「半更新语义」——未提供时保留原值：

  ```js
  const postStatus = status !== undefined ? status : existingPost.status
  ```
  注意 `existingPost` 当前只 SELECT 了 `id, title, slug, published_at`（:370-372），需补上 `status`。发布时间分支同步改为按 `postStatus` 判定，避免取不到原值时回落到 `nowIso`。
- **是否必须修复**：**必须**。改动小、风险低，但后果不可逆。

---

## 中等

### M1. 路由守卫的 401 判定永远为假，「会话过期」被误报成「连不上服务器」

- **位置**：`client/src/router/index.js:151`；对照 `client/src/api/index.js:63-66`
- **成因**：守卫读 `error?.response?.status === 401`，而响应拦截器把错误**归一成了普通对象** `{ code: status, message }`，不存在 `response` 字段。`unauthorized` 因此恒为 `false`，三元表达式永远走到 `reason: 'offline'`。
- **影响**：与 `b0b68b6`（「router 守卫：fetchUser 失败按 401 分流」）的修复意图完全相反——真实会话过期时登录页显示「无法连接服务器，请稍后重试」，用户会反复刷新而不是重新登录。路由保护本身仍然有效，所以不是安全问题，但刚修完的功能处于失效状态。
- **建议**：改用拦截器实际抛出的字段，与 `Editor.vue:248` 的写法对齐：

  ```js
  const unauthorized = error?.code === 401
  ```
  更彻底的做法是让拦截器抛出带 `response` 的AxiosError，但那会牵动所有 catch 点，性价比低。
- **是否必须修复**：**必须**（一行改动，恢复已声明的行为）。

### M2. `published_at` 缺少服务端校验，且时区语义在前后端不一致

- **位置**：`server/controllers/postController.js:319`、`400-401`；`server/middleware/validator.js`（create/update 规则中均无 `published_at`）；`client/src/views/admin/Editor.vue:220-226`、`310-313`
- **成因**：`published_at` 直接取自 `req.body` 写入数据库，验证器完全没有约束它。编辑器提交的是 `datetime-local` 的**本地时间无时区串**（如 `2026-08-29T22:30`），而服务端默认写入的是带 `Z` 的 UTC ISO 串（如 `2026-08-29T14:30:00.000Z`），同一列里两种格式并存。
- **影响**：
  1. 任意字符串都能入库（参数化查询不防语义污染），使 `julianday(p.published_at)` 返回 NULL、sitemap 的 `strftime` 输出无效 `lastmod`、归档分组算出 `NaN-NaN`；
  2. 本地时间串被 SQLite 当作 UTC 解析，`julianday` 排序与 sitemap `lastmod` 在中国时区下最多偏移 8 小时，同一天内的文章先后次序会错；
  3. `toIso()`（:23-31）只归一化「空格分隔」的旧格式，对 `datetime-local` 串不做处理，格式混用被一路带到了前端。
- **建议**：在 `postRules.create/update` 增加 `body('published_at').optional({ checkFalsy: true }).isISO8601()`；在 controller 落库前统一 `new Date(published_at).toISOString()`，保证该列恒为 UTC ISO 8601。前端 `Editor.vue` 保持本地时间展示即可（`fetchPost` 回填时做本地转换，现状已正确）。
- **是否必须修复**：**建议修复**。写入端收口后可一次性消除排序、归档、sitemap 三处的隐性偏差。

### M3. 归档按裸列 `published_at` 做字符串排序，且无分页全量加载

- **位置**：`server/controllers/postController.js:480-490`
- **成因**：`ORDER BY published_at DESC` 走的是**字符串比较**，而列表接口用的是 `ORDER BY julianday(p.published_at) DESC`（:136-137）。两处的排序语义不一致；列中一旦出现 M2 所述的混合格式（含历史 `YYYY-MM-DD HH:MM:SS`），字符串比较会把所有「空格格式」的行排到「T 格式」之前（空格 0x20 < `T` 0x54），归档的年月分组随之错乱。同时该查询没有 `LIMIT`，一次性取出全部文章再在 JS 里分组。
- **影响**：文章量增长后归档接口内存与响应体线性膨胀；存在历史数据时分组顺序与列表不一致。
- **建议**：排序改为 `ORDER BY julianday(COALESCE(published_at, created_at)) DESC`，与列表接口统一；待 M2 收口后可进一步改为直接排裸列。若文章量可能上千，补上 `LIMIT`/分页。
- **是否必须修复**：建议修复（排序语义统一属低成本收益）。

### M4. 文章转草稿会清空 `published_at`，原发布时间不可恢复

- **位置**：`server/controllers/postController.js:400-401`
- **成因**：`Number(postStatus) === 1 ? ... : null`——只要状态是草稿就把 `published_at` 写成 NULL。前端 `Editor.vue:281-287` 已有确认弹窗告知用户，所以这是**已知的有意取舍**。
- **影响**：草稿重新发布时，发布时间变成「当前时间」而非原始发布时间（`published_at || existingPost.published_at || nowIso` 里的 `existingPost.published_at` 已是 NULL）。文章 URL 里的 slug 未变，但对外展示的发布时间被重置，sitemap 的 `lastmod` 也随之跳变。
- **建议**：若这是产品意图（重新发布=重新计时），建议在代码注释里写明并同步到 `docs/`；若不是，改为保留原值、仅用 `status` 控制可见性：

  ```js
  const publishedAt = published_at || existingPost.published_at || (Number(postStatus) === 1 ? nowIso : null)
  ```
- **是否必须修复**：不必（产品决策），但需明确记录，否则后续维护者会当成 bug 反复修。

### M5. `marked.use()` 在组件 setup 内调用，污染全局并随导航单调增长

- **位置**：`client/src/views/Post.vue:132-147`
- **成因**：`marked.use()` 修改的是 marked 的**全局默认配置与扩展栈**。写在 `<script setup>` 里意味着每次组件实例化（每进入一次文章详情）就注册一遍 `markedHighlight` 扩展和 `breaks/gfm` 选项。文章详情页在 `DefaultLayout.vue` 中以 `:key="route.path"` 渲染，路径变化即重建实例。
- **影响**：扩展数组随访问次数单调增长，是缓慢的内存泄漏；渲染时遍历的扩展链变长，长会话下解析性能下降；全局配置被单一组件持有，属于隐式全局状态。
- **建议**：把 marked 的配置抽成模块级一次性初始化，例如在 `client/src/assets/js/markdown.js` 中导出已配置好的 `marked`，`Post.vue` 直接 import。这也是 `docs/conventions.md` 里「一个文件一个职责」的应有之义。
- **是否必须修复**：建议修复。

### M6. 验证规则与查询构造存在两处大段重复

- **位置**：`server/middleware/validator.js:19-49` 与 `50-81`（`postRules.create` / `postRules.update`）；`server/controllers/postController.js:525-556`（`searchPosts`）对照 `125-162`（`executePostListQuery`）
- **成因**：create 与 update 的 8 条字段规则逐字重复，唯一差异是 update 多了 `param('id')`；`searchPosts` 另起炉灶手写了一遍 count + list 双查询，没复用已有的 `executePostListQuery`。
- **影响**：字段规则需要同步改两处，遗漏即产生「新建校验了、编辑没校验」的缺口；`searchPosts` 也不像列表那样做 `toIso` 归一化 `updated_at`（:551-556 只处理了 `published_at`/`created_at`），行为与列表接口不一致。
- **建议**：

  ```js
  const postFieldRules = [ /* 8 条字段规则 */ ]
  const postRules = {
    create: [...postFieldRules, validate],
    update: [param('id').isInt()..., ...postFieldRules, validate],
    ...
  }
  ```
  `searchPosts` 改为复用 `executePostListQuery`（给它加一个 keyword 条件即可），顺带补齐 `updated_at` 的归一化。
- **是否必须修复**：建议修复（纯结构性重构，无行为风险，能防住未来的校验缺口）。

### M7. 缺少 `busy_timeout`，跨进程写库会直接 500

- **位置**：`server/db/index.js:19-23`
- **成因**：连接建立后只设置了 `journal_mode = WAL` 与 `foreign_keys = ON`，未设置 `busy_timeout`（默认为 0）。同进程内 better-sqlite3 是同步的，写操作天然串行；但只要出现第二个写者——例如服务运行时执行 `npm run create-admin`、`db/import-data.js`，或部署时新旧进程短暂并存——后到者不会等待，而是立刻抛 `SQLITE_BUSY`。
- **影响**：管理操作与线上请求争抢写锁时，接口以 500 失败，且 `errorHandler` 会把这类非操作型错误吞成「服务器内部错误」，排查成本高。
- **建议**：`db.pragma('busy_timeout = 5000')`。一行改动，消除整类偶发故障。
- **是否必须修复**：建议修复。

### M8. 公开接口无全局速率限制，搜索走无索引全文 LIKE

- **位置**：`server/app.js`（仅在 `routes/auth.js:15-57` 对登录/改密做了限流）；`server/controllers/postController.js:530、542`
- **成因**：限流只覆盖了认证类接口。搜索接口对 `title/summary/content` 三列做 `LIKE '%kw%'` 前置通配符，无法使用任何索引，必然全表扫描；关键词长度已限制在 100 字符（`validator.js:113`），`pageSize` 上限 50。
- **影响**：单机博客体量下影响有限，但一次搜索的成本随文章数与正文长度线性增长，廉价的并发请求即可放大成可用性问题。
- **建议**：在 `app.js` 加一层宽松的全局限流（例如 15 分钟 300 次）兜底，再给 `/api/posts/search` 单独收紧。若搜索变慢，可考虑 SQLite FTS5 虚表替代 LIKE。
- **是否必须修复**：非必须，建议排期。

---

## 轻微

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| L1 | `server/controllers/uploadController.js:38` | `fs.readSync` 的返回值未校验，API 契约允许短读。一旦发生，缓冲区尾部是 0，JPEG/PNG 的尾部校验会误判为非法文件，拒绝正常上传（概率低但难复现） | 既然本就要整文件入内存，直接 `fs.readFileSync(filePath)`，代码更短且无此隐患 |
| L2 | `server/controllers/uploadController.js:133-134` | URL 由 `path.relative(server目录, filePath)` 推导。若 `UPLOAD_DIR` 配到 `server/` 之外，会产出 `../` 开头的 URL，`/uploads` 静态路由服务不到，上传「成功但图片裂」 | 把「相对站点根的路径计算」收敛为一个函数，并在 `config` 中校验 `UPLOAD_DIR` 必须位于 `server/` 内 |
| L3 | `server/db/index.js:34-45`、`server/app.js:16` | 迁移用 `try/catch(_e)` 空吞一切异常（表不存在与真实失败无法区分）；`initDb()` 在模块加载期执行，属于 import 副作用，测试与复用都要连带承担 | catch 内判断具体错误码；`initDb()` 改由入口显式调用或加幂等守卫 |
| L4 | `server/middleware/validator.js:5-15` | `validate` 用 `throw` 而非 `next(error)`。Express 会捕获同步抛出所以能工作，但与项目其余中间件（`auth.js`、`error.js`）的错误传递风格不一致 | 改为 `return next(new AppError(message, 400))`，与 `middleware/auth.js:49` 对齐 |
| L5 | `server/controllers/postController.js:190-205` | `getPost` 先按 slug 查、未命中再按 id 查，两次往返。slug 有唯一索引（`schema.sql:48`），绝大多数请求第一次就命中 | 可接受；若要优化，可先 `/^\d+$/.test()` 判断再决定查哪张索引 |
| L6 | `server/controllers/postController.js:446` | 删除文章后 `view_tracking` 中该文章的记录成为孤儿（`schema.sql:51-57` 未对 `post_id` 建外键） | 在删除事务里一并 `DELETE FROM view_tracking WHERE post_id = ?`，或给表补外键 + `ON DELETE CASCADE` |
| L7 | `server/controllers/postController.js:6-10`、`212` | `normalizeIp` 对拿不到 IP 的情况返回字符串 `'unknown'`，所有这类请求共用一个防刷键，互相压制计数；同一 NAT 出口的多个读者也共享计数，浏览量系统性偏低 | 可接受（防刷与准确统计本就是取舍）。建议在注释里写明这一取舍，避免被误当 bug |
| L8 | `client/src/views/Post.vue:118`、`client/src/views/Home.vue:26,82` | `loading` 初值为 `false`，`onMounted` 前的首帧会走 `v-else` 分支闪现「文章不存在」；首页骨架屏数量 `18` 与请求 `pageSize: 18` 各写一遍，是典型的魔法数字重复 | `loading` 初值改 `true`；把 `18` 提为常量 `PAGE_SIZE` |
| L9 | `client/src/composables/useCountUp.js:12-13` | `prefersReducedMotion` 在 setup 期求值一次，运行期间用户修改系统「减少动效」设置不生效 | 与 `useTheme.js:40-54` 一样加 `matchMedia` 监听；同理 `App.vue:27` 的 `reduceMotionQuery` 也只在 init 时读了一次 |

---

## 一致性专项

整体风格统一度高：后端 CommonJS + controller/route/middleware 分层清晰，前端全部 `<script setup>` + camelCase + kebab-case 类名，`docs/conventions.md` 的约定基本被遵守，自定义 ESLint 规则（`server/eslint.config.mjs` 已正确挂载 4 条）也确实拦住了分层与鉴权问题。以下几处是例外：

1. **时间规范化逻辑散落三处**：`postController.js:23-31` 的 `toIso`、`client/src/assets/js/utils.js:9-13` 的 `normalizeDate`、`sitemapController.js:14` 的 SQL `strftime`。三者在做同一件事的不同切片，是 M2/M3 问题的根因。建议确立「数据库恒存 UTC ISO 8601」这一条硬规则，其余两处退化为纯格式化。
2. **sitemap 的 XML 拼装放在了 router 层**（`server/routes/sitemap.js:5-61`）。项目连「route 里不准 import db」都写了 ESLint 规则，却在 route 里塞了 50 行模板拼装与 `escapeXml`，分层上偏严 others、偏松自己。建议把 XML 生成移到 `sitemapController.js`，router 只留一行调用。
3. **错误对象形态不统一**：拦截器抛 `{ code, message }` 普通对象，导致 `error.response.status`（router 守卫）与 `error.code`（Editor）两种读法并存——M1 即由此产生。建议在 `docs/conventions.md` 中明确「API 错误一律读 `error.code`」。
4. **删除类操作缺少统一的软删除/级联约定**：文章删除留下 `view_tracking` 孤儿（L6），而分类删除做了文章数检查（`categoryController.js:115-120`）。两种资源两种策略，建议补一条约定。

---

## 总体评价

这是一份**明显高于同类个人项目平均水平**的代码：注入防护（全量参数化、连 `IN` 子句都用 `json_each(?)` 参数化）、XSS 防护（DOMPurify + 禁用 `v-html`，仅一处白名单放行并补 `rel=noopener`）、认证设计（httpOnly cookie、固定 HS256、密钥强度校验、IP+账号双维度限流）、上传安全（服务端决定扩展名 + 魔数与尾部结构双重校验）都做对了，且大量注释写清了「为什么这么做」而非「做了什么」——竞态序号、滚动位置恢复、主题落盘时机等细节的注释质量尤其好，看得出是踩过坑之后沉淀的。

本轮修复已覆盖上述两项必修项（S1 / M1），并按 M2 → M7 → M6 的主线推进完毕：`published_at` 的写入端收口消除了排序、归档、sitemap 三处隐性偏差，`busy_timeout` 一行消除整类偶发 500，验证规则的去重则防止未来再长出「新建校验了、编辑没校验」这类缺口。

剩余未处理的 L1 / L2 / L3 / L4 / L7 / L9 均为低概率或纯风格问题，M8 的接口限流部分按个人博客的实际体量评估后不做——都不影响正确性，可以等业务真的需要时再说。**条件性的长期项**（第二轮审查实测修正）：本机 `data/blog.db` 经查为空库（`posts`/`users`/`categories`/`view_tracking` 均为 0 行），因此本地**不存在** `published_at` 的存量格式问题。若生产库在本轮修复之前已写入过数据，那些行仍是本地时间无时区串——`julianday()` 与 `toIso()` 都能正确解析、展示不受影响，但同日文章在跨时区部署下的先后次序可能有最多 8 小时偏差；只有在这种情况下才需要迁移。判断方法：`SELECT COUNT(*) FROM posts WHERE published_at IS NOT NULL AND published_at NOT LIKE '%Z'`，结果为 0 则无需处理。
