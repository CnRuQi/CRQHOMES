# Full Audit Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已完成后端安全与数据完整性修复、前端基础响应式修复的基础上，完成真实浏览器回归、前端性能优化、CI/依赖/文档一致性检查，并形成可发布的审计证据。

**Architecture:** 保留 Vue 3 + Vite 前端、Express 5 + SQLite 后端和现有路由边界。后续先验证用户可见行为，再修复仍有证据支持的问题；性能和架构整理只改动明确影响首屏、维护性或安全边界的部分。所有数据库迁移都在副本上验证，个人文件和真实数据不进入仓库。

**Tech Stack:** Vue 3 Composition API、Vue Router、Vite、Express 5、better-sqlite3、express-validator、DOMPurify、Vitest、agent-browser、axe-core。

**Spec:** `AGENTS.md`、`docs/core-beliefs.md`、`docs/architecture.md`、现有审计记录，以及本仓库 2026-09-12 的全面审计结论。

**Status (2026-09-13):** 已完成并形成 v2.0.0 发布证据；发布说明见 `docs/releases/v2.0.0.md`，浏览器与工程证据见 `docs/audits/browser-baseline-2026-09-13.md`。

## Global Constraints

- 保留现有用户改动；不得使用 `git reset --hard` 或 `git checkout --` 覆盖工作树。
- 所有写接口继续满足认证和输入验证，所有 SQL 使用参数化查询。
- 不得恢复 `v-html`；Markdown 内容继续通过 allowlist、协议限制、DOMPurify 和 Vue VNode 渲染。
- 生产配置必须 fail-closed；不得把开发密钥、请求 Host 或未验证对象写入生产行为。
- 数据库迁移只对备份副本执行，迁移前记录文件校验信息，迁移后执行 `PRAGMA integrity_check` 并核对行数和 slug 唯一性。
- 删除文件前必须确认它不被代码、构建、发布文档或部署流程引用；当前未发现 `docx/` 文件夹，不能把 `docs/` 当作 `docx/` 删除。
- 每一项修复先运行聚焦验证，再运行根目录 lint、format、test 和客户端 build。
- `npm audit --offline` 只能作为本地缓存结果记录；联网失败时明确标注限制，并保留在线 CI 审计任务。

## Current Baseline

- 已完成：配置 fail-closed、SITE_URL/代理边界、上传 URL、参数化输入验证、文章半更新语义、草稿发布校验、slug 迁移唯一性、公开列表边界、搜索限流、归档分页。
- 已完成：重复 `main`、登录表单、编辑器移动端布局、主题基础 token、页面横向溢出和后台部分可访问性修复。
- 已完成：`client/src/components/MarkdownContent.vue` 的 Vue VNode 渲染；原始 HTML 被忽略，危险 URL 被清理；`client/src/__tests__/markdownContent.test.js` 当前覆盖 2 个安全用例。
- 最近证据：后端 7 个测试文件共 71 个用例通过；前端 6 个测试文件共 35 个用例通过；客户端 build 可完成但 `Editor` 压缩 chunk 约 877.38 kB。
- 浏览器基线：Light 主题 8 个路由覆盖 320、375、414、768、1440 CSS 像素；Dark 主题复查首页、真实文章页和登录页；axe violations/incomplete 均为 0，控制台无错误。
- 当前资料状态：仓库有 `docs/` Markdown 文档，没有 `docx/` 文件夹，也没有 `.docx`/`.doc` 文件；个人文档由 `.gitignore` 排除。

---

### Task 1: Complete Frontend Semantics and Theme Verification

**Files:**

- Verify and modify: `client/src/views/admin/Dashboard.vue`
- Verify and modify: `client/src/views/admin/Posts.vue`
- Verify and modify: `client/src/views/admin/Categories.vue`
- Verify and modify: `client/src/views/admin/Editor.vue`
- Verify and modify: `client/src/views/admin/Layout.vue`
- Verify and modify: `client/src/views/admin/Login.vue`
- Verify and modify: `client/src/components/MarkdownEditor.vue`
- Verify and modify: `client/src/assets/css/variables.css`
- Verify and modify: `client/src/assets/css/main.css`
- Verify and modify: `client/src/assets/css/glass.css`
- Test: `client/src/__tests__/markdownContent.test.js` and focused component tests under `client/src/__tests__/`

**Interfaces:**

- Each route has exactly one page-level `main` landmark.
- Every form control is named by a visible `label`, `aria-label`, or `aria-labelledby`; icon-only controls expose their current action and state.
- Cards, filters, tables, buttons, status tags, and editor panels use theme tokens rather than fixed light surfaces.
- At 320, 375, 414, and 768 pixels, content stays inside the viewport and clickable labels remain single-line affordances.

- [x] **Step 1: Capture a fresh browser baseline for all routes**

  Use the existing local services and `agent-browser` session. Visit `/`, `/archives`, `/search`, `/admin/login`, `/admin`, `/admin/posts`, `/admin/categories`, and `/admin/posts/create`. For each route and each width `320`, `375`, `414`, `768`, and `1440`, run:

  ```bash
  agent-browser --session htmlsite-cdp5 set viewport <width> 900
  agent-browser --session htmlsite-cdp5 eval "JSON.stringify({width:window.innerWidth,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,mains:document.querySelectorAll('main').length})"
  agent-browser --session htmlsite-cdp5 a11y --json
  agent-browser --session htmlsite-cdp5 errors
  ```

  Record route, width, document width, main count, axe violations, incomplete rules, and console errors in the audit notes before changing the related file.

- [x] **Step 2: Repair any remaining form and table semantics**

  For every label/control pair use a stable identifier:

  ```html
  <label for="field-id">字段名称</label> <input id="field-id" ... />
  ```

  For every toggle expose both action and state:

  ```html
  <button type="button" aria-pressed="false" aria-label="置顶：文章标题">...</button>
  ```

  For data tables use `scope="col"` on column headers. If a visual drag column has no visible title, include a visually hidden text label and confirm the drag-only workflow has a keyboard-accessible alternative or a documented follow-up issue.

- [x] **Step 3: Repair computed-color failures in both themes**

  Replace hard-coded light card surfaces with the existing tokens:

  ```css
  .admin-card {
    background: var(--bg-card);
    color: var(--text-primary);
    border-color: var(--border-color);
  }
  ```

  Check normal text at 4.5:1, large text and icons at 3:1, and focus indicators against the actual computed background in light and dark modes. Keep the page texture non-interactive and ensure it cannot cause text to inherit an indeterminate background.

- [x] **Step 4: Add focused regressions for repaired semantics**

  Mount the relevant components with Vue Test Utils and assert label association and state attributes. For Markdown, keep these assertions:

  ```js
  expect(wrapper.find('script').exists()).toBe(false)
  expect(wrapper.find('a').attributes('href')).toBeUndefined()
  expect(wrapper.find('img').attributes('loading')).toBe('lazy')
  ```

- [x] **Step 5: Run the focused client checks**

  ```bash
  cd client
  npx vitest run src/__tests__/markdownContent.test.js
  npx eslint src/
  npx prettier --check src/
  ```

  Continue only when the commands exit with code 0; warnings that represent an actual accessibility or formatting problem must be fixed rather than ignored.

---

### Task 2: Exercise Real Content and End-to-End Workflows

**Files:**

- Verify: `server/routes/*.js`, `server/controllers/*.js`, `server/middleware/*.js`
- Verify: `client/src/router/index.js`, `client/src/stores/*.js`, `client/src/api/*.js`
- Test: `server/__tests__/*.test.js`
- Evidence: local audit screenshots and browser console/network output outside production source

**Interfaces:**

- Public clients see only published posts and bounded list responses.
- Authenticated admin clients can create, edit, draft, publish, sort, pin, delete posts, and manage categories.
- Failed requests return a user-readable message without leaking stack traces or database details.

- [x] **Step 1: Prepare an isolated test database and upload directory**

  Copy only the schema or a backup database to a task-specific temporary directory. Set `DB_PATH` and `UPLOAD_DIR` to those paths, use a generated test secret, and do not point the test process at the real `data/blog.db` or `server/uploads/`.

- [x] **Step 2: Verify authentication and session boundaries**

  Exercise login success, wrong password, logout, expired token, missing token, and refresh after logout. Confirm the cookie is `httpOnly`, `SameSite=Lax`, and `Secure` in production configuration; confirm unauthenticated admin API calls return 401.

- [x] **Step 3: Verify post and category workflows**

  Create a valid draft, publish it, update only its title, explicitly clear summary/cover/tags, toggle pin, reorder, delete it, create a category, reject deletion of a category with posts, move or delete the posts, and delete the empty category. After each mutation reload the page and verify the persisted result.

- [x] **Step 4: Verify boundary and failure inputs**

  Send object/array values for textual fields, oversized tags, invalid status values, empty publish content, invalid IDs, invalid category IDs, dangerous cover URLs, malformed JSON, unsupported upload signatures, and oversized uploads. Assert 400 or 413 as appropriate and confirm the database has no partial mutation.

- [x] **Step 5: Verify public read completeness and abuse controls**

  Query public `pageSize=0`, negative page, oversized page size, oversized search text, archives across multiple pages, and repeated search requests. Confirm public invalid values are rejected, admin `pageSize=0` remains available, archive metadata describes the full result set, and the limiter eventually returns 429.

- [x] **Step 6: Save reproducible evidence for every remaining defect**

  For each defect capture the route, exact input, response status/body shape, screenshot or console error, and the smallest source location that owns the behavior. Do not record a defect solely from a speculative code pattern.

---

### Task 3: Split the Markdown Editor Bundle

**Files:**

- Modify: `client/src/views/admin/Editor.vue`
- Modify: `client/src/components/MarkdownEditor.vue`
- Modify: `client/src/assets/js/markdown.js`
- Modify: `client/src/router/index.js` only if route-level loading needs adjustment
- Modify: `client/vite.config.js` only when a measured chunking rule improves output
- Test: `client/src/__tests__/editor.test.js`

**Interfaces:**

- Editor route keeps the same form fields, emitted `v-model` value, upload behavior, and navigation guard.
- `MarkdownEditor` is loaded only when the editor route is rendered.
- The public post route does not download `md-editor-v3` or the full highlight language set before it needs them.

- [x] **Step 1: Record current build composition**

  Run:

  ```bash
  cd client
  npm run build
  ```

  Record the generated `Editor-*.js`, `Post-*.js`, and common chunks. Keep the existing 500 kB warning instead of raising `build.chunkSizeWarningLimit`.

- [x] **Step 2: Lazy-load the editor component inside the admin editor**

  Use an async component while retaining the same template name:

  ```js
  import { defineAsyncComponent } from 'vue'

  const MarkdownEditor = defineAsyncComponent(() => import('@/components/MarkdownEditor.vue'))
  ```

  Keep the current unit-test stub working and verify that the loading state does not discard the article content or navigation guard.

- [x] **Step 3: Keep language modules out of public chunks**

  Inspect the import graph from `client/src/assets/js/markdown.js`. Keep only the languages the editor actually advertises, or load optional highlighter language modules from the editor chunk. Do not replace the explicit allowlist with a dynamic arbitrary module path.

- [x] **Step 4: Compare the build and route requests**

  Build again and compare chunk sizes. Open `/` and `/post/<slug>` with the browser network log, then open `/admin/posts/create` and confirm the editor chunk is requested only on the editor route. The target is a public initial route without the approximately 877 kB editor chunk and no new runtime console errors.

- [x] **Step 5: Run editor tests and client build**

  ```bash
  cd client
  npx vitest run src/__tests__/editor.test.js
  npm run lint
  npm run build
  ```

---

### Task 4: Make CI, Dependencies, and Architecture Documentation Truthful

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/code-cleanup.yml`
- Verify or modify: `client/package.json`, `client/package-lock.json`, `server/package.json`, `server/package-lock.json`
- Modify: `docs/architecture.md`
- Modify: `docs/core-beliefs.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Verify: `.gitignore`

**Interfaces:**

- CI exits non-zero when lint, formatting, tests, or the client build fail.
- Documentation describes existing files, upload paths, environment requirements, and actual controller/database boundaries.
- A clean dependency install has no undeclared runtime dependency and no accidental `node_modules` changes.

- [x] **Step 1: Inspect both workflows before editing**

  Read `.github/workflows/ci.yml` and `.github/workflows/code-cleanup.yml`. Remove `|| true` only from verification commands, preserve any intentionally non-blocking notification step, and add a client build check to the release-quality workflow if it currently claims to validate release readiness.

- [x] **Step 2: Verify dependency ownership**

  In a disposable install environment run:

  ```bash
  cd client
  npm prune
  npm ls --depth=0
  rg -n "glightbox|md-editor-v3|highlight.js" src package.json
  ```

  Remove a package only when the source and lockfile prove it is unused; do not edit lockfiles by hand and do not commit `node_modules`.

- [x] **Step 3: Correct architecture statements**

  Keep the enforced rule that routes do not access the database. Either extract controller SQL into a dedicated data-access module with tests, or explicitly document that `controllers/` currently call `getDb()` and execute parameterized SQL, making the future extraction a separate task rather than a false current guarantee.

- [x] **Step 4: Reconcile deployment paths and environment docs**

  Keep these production requirements consistent in `AGENTS.md`, `README.md`, and `server/.env.example`: `NODE_ENV=production`, random `JWT_SECRET` of at least 32 characters, valid absolute `SITE_URL`, exact `CORS_ORIGIN`, deliberately scoped `TRUST_PROXY`, HTTPS for secure cookies, and `server/uploads/` served as `/uploads/`. Keep the statement that no `start.bat` exists.

- [x] **Step 5: Run CI-equivalent checks**

  ```bash
  npm ci
  npm run lint
  npm run format:check
  npm test
  cd client
  npm run build
  ```

---

### Task 5: Final Database, Security, and Release Evidence

**Files:**

- Verify: all modified files from Tasks 1-4
- Create only if a new version is actually approved: `docs/releases/<next-version>.md`
- Evidence: a temporary database backup/copy and local audit output outside tracked source

**Interfaces:**

- The release summary distinguishes verified behavior, unresolved risks, and checks that could not run because the network or credentials were unavailable.
- No sensitive local data is staged or included in an archive.

- [x] **Step 1: Validate migration on a copy**

  Back up the real database without modifying it, run `initDb()` against the copy, execute:

  ```sql
  PRAGMA integrity_check;
  SELECT slug, COUNT(*) FROM posts WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;
  ```

  Compare the pre- and post-migration post/category/user row counts and confirm the second initialization is idempotent.

- [x] **Step 2: Run dependency audits with explicit provenance**

  Run `npm audit --offline` at the root, `server`, and `client` when the local cache permits. Record whether the result is cache-only. If the registry is unreachable, leave the online audit in CI and do not call the offline result a current vulnerability report.

- [x] **Step 3: Run all local gates from a clean process state**

  ```bash
  npm run lint
  npm run format:check
  npm test
  cd client
  npm run build
  cd ..
  git diff --check
  git status --short
  ```

- [x] **Step 4: Inspect the final worktree**

  Confirm that `.env`, database files, real uploads, browser state, `node_modules`, `client/dist`, temporary screenshots, and audit caches are not staged. Preserve unrelated user changes and do not delete the `docs/` Markdown collection while the `docx/` path remains unconfirmed.

- [x] **Step 5: Publish the release evidence**

  用户已批准 v2.0.0。发布说明 `docs/releases/v2.0.0.md` 已记录变更行为、迁移说明、生产环境变量、部署包校验值、测试/构建结果、保留风险和离线审计限制。

## Completion Criteria

- [x] All frontend routes pass the required viewport and accessibility checks, with no unexplained console errors.
- [x] Real-content Markdown renders headings, links, images, lists, and code safely without raw HTML execution.
- [x] Public reads are bounded and archive results are complete across pages.
- [x] Editor loading is route-scoped and the public route no longer carries its large editor/highlight payload.
- [x] CI checks are blocking, dependency state is clean, and documentation matches the repository.
- [x] Full tests, lint, format, build, database-copy integrity check, and final worktree inspection have fresh evidence.
