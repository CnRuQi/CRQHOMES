# Full Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复本轮全量审计发现的生产安全、数据完整性、公开接口资源、响应式界面、无障碍和运维一致性问题，并为每项行为建立回归验证。

**Architecture:** 保留现有 Vue 3 + Express 5 + SQLite 分层，不做无关重构。后端先统一配置 fail-closed 和输入/半更新契约，再修正迁移与公开查询边界；前端集中修复编辑器布局、主题 token、语义结构和可访问名称；每个任务以独立测试和质量门禁结束。

**Tech Stack:** Vue 3 Composition API、Vite、Express 5、express-validator、better-sqlite3、Vitest、DOMPurify、axe、agent-browser。

**Spec:** `AGENTS.md`、`docs/core-beliefs.md`、`docs/architecture.md`，以及本任务中的 2026-09-12 全量审计结论。

**Status (2026-09-13):** 产品行为、回归测试和最终质量门禁已完成并纳入 v2.0.0。当前 43 个步骤中 34 个已由代码或最终证据核验；剩余 9 个未勾选步骤是历史过程步骤（先运行红测、每个任务单独提交），本轮未重放，已采用一次整合提交，不代表产品功能仍有缺口。

## Global Constraints

- 保留现有用户改动；不得使用 `git reset --hard` 或 `git checkout --` 覆盖工作树。
- 所有写接口继续满足「认证 + 输入验证」，所有 SQL 使用参数化查询。
- 默认使用 CommonJS 后端、ESM 前端、Vue `<script setup>`，不引入新的运行时依赖。
- 生产配置必须 fail-closed；不得把开发默认密钥、请求 Host 或未验证对象写入生产行为。
- 明确区分字段“未提供”和“主动清空”；更新接口的回归测试必须覆盖两种情况。
- 数据库迁移必须可重复执行、失败可观测；正式操作前先备份数据库并在副本上验证。
- 每项代码改动完成后先跑对应的聚焦测试，再跑全量 lint、format、test 和 client build。
- 不把 `npm audit --offline` 结果表述成最新联网漏洞库结论；联网失败时明确记录限制。

---

### Task 1: Harden Runtime Configuration and Deployment Boundaries

**Files:**
- Modify: `server/config/index.js:6-75`
- Modify: `server/app.js:20-23`
- Modify: `server/controllers/sitemapController.js:5-8`
- Modify: `server/controllers/uploadController.js:132-134`
- Modify: `server/.env.example:5-27`
- Test: `server/__tests__/config.test.js`
- Test: `server/__tests__/sitemap.test.js`
- Test: existing upload/controller coverage or a new focused upload URL test

**Interfaces:**
- `config.trustProxy` is the exact value consumed by Express `app.set('trust proxy', ...)`.
- `config.siteUrl` is a validated absolute site URL in production; production sitemap generation never falls back to `req.get('host')`.
- Upload responses always expose a URL rooted at `/uploads/`, regardless of whether `UPLOAD_DIR` is inside or outside `server/`.

- [x] **Step 1: Write failing configuration tests**

  Add tests that load `server/config/index.js` with isolated environment variables and assert:

  - missing `JWT_SECRET` outside the test environment throws during startup;
  - the known `.env.example` value is rejected;
  - a production secret shorter than 32 characters is rejected;
  - production without `SITE_URL` is rejected;
  - `TRUST_PROXY=127.0.0.1,10.0.0.1` becomes the same two-entry trust list.

- [ ] **Step 2: Run the focused tests and verify they fail**

  Run:

  ```bash
  cd server
  npx vitest run __tests__/config.test.js
  ```

  Expected: the new fail-closed assertions fail against the current default-secret and site-URL behavior.

- [x] **Step 3: Implement fail-closed configuration**

  Keep local test loading possible, but require an explicit non-placeholder `JWT_SECRET` in every non-test environment. Keep the 32-character production minimum and reject the exact example value. Require a valid absolute `SITE_URL` in production and allow Host fallback only for development.

  Replace the hard-coded proxy hop:

  ```js
  if (config.trustProxy) {
    app.set('trust proxy', config.trustProxy)
  }
  ```

  Build upload URLs from the configured upload root:

  ```js
  const relativePath = path.relative(uploadDir, req.file.path)
  const url = '/uploads/' + relativePath.replace(/\\\\/g, '/')
  ```

  Update `.env.example` to use an unmistakable placeholder plus an explicit generation command, and document the production requirements.

- [x] **Step 4: Add regression tests for sitemap and external uploads**

  Assert that a production sitemap uses the configured `SITE_URL` even when the request carries `Host: evil.example`. Assert that an upload stored in an absolute external directory returns `/uploads/YYYYMM/file.ext`, not a drive-letter or parent-relative path.

- [x] **Step 5: Run the focused backend checks**

  Run:

  ```bash
  cd server
  npm test -- --runInBand
  npm run lint
  ```

  Expected: configuration, sitemap, upload, and existing backend tests pass with exit code 0.

- [ ] **Step 6: Commit the isolated configuration change**

  ```bash
  git add server/config/index.js server/app.js server/controllers/sitemapController.js server/controllers/uploadController.js server/.env.example server/__tests__
  git commit -m "fix: fail closed on production configuration"
  ```

### Task 2: Enforce API Types and Correct Partial Update Semantics

**Files:**
- Modify: `server/middleware/validator.js:19-53,128-183`
- Modify: `server/controllers/postController.js:399-484`
- Modify: `server/controllers/categoryController.js:30-94`
- Modify: `server/controllers/authController.js:139-151`
- Modify: `server/utils/helpers.js:42-50`
- Test: `server/__tests__/validator.test.js`
- Test: `server/__tests__/postController.test.js`
- Test: category/profile focused tests if not already present

**Interfaces:**
- Create validation requires string values for textual fields and applies the same maximums used by the database contract.
- Update validation keeps title/category requirements for backward compatibility, but optional content, summary, cover, tags, status, publish time, and pin fields preserve existing values when omitted.
- Explicit empty strings are valid only where clearing is part of the documented contract; they are never confused with omitted fields.

- [x] **Step 1: Add failing validator tests**

  Cover these exact payloads:

  - post `title`, `content`, `summary`, `tags`, and `cover_image` as objects or arrays are rejected with 400;
  - category create `description: {}` is rejected with 400;
  - profile `nickname: {}` and `nickname: []` are rejected with 400;
  - tags have a total length, item count, and per-item length limit.

- [x] **Step 2: Add failing controller regression tests**

  Seed a post with non-empty summary, cover, tags, content, status, and pin state. Assert that an update omitting optional fields preserves all of them. Assert that explicit empty summary, cover, or tags clears only the explicitly submitted field.

  Add draft cases:

  - an existing draft updated without content preserves its content;
  - an existing draft updated without status preserves draft status;
  - an explicit draft update with empty content is accepted and stores empty content;
  - a publish update with the effective content empty returns 400.

- [ ] **Step 3: Run focused tests and verify the new cases fail**

  ```bash
  cd server
  npx vitest run __tests__/validator.test.js __tests__/postController.test.js
  ```

- [x] **Step 4: Implement strict validation**

  Put `.isString()` before `.trim()` or length checks for every textual request field. Give category-create `description` the same string and maximum-length rule as category-update. Apply bounded tag normalization in one helper so API, storage, and response behavior use the same limits.

- [x] **Step 5: Implement effective-value updates**

  Extend the existing-post query to load every field needed for preservation. Use explicit undefined checks:

  ```js
  const hasValue = (value) => value !== undefined
  const nextContent = hasValue(content) ? content : existingPost.content
  const nextSummary = hasValue(summary) ? summary : existingPost.summary
  const nextCover = hasValue(cover_image) ? cover_image : existingPost.cover_image
  const nextTags = hasValue(tags) ? normalizeTags(tags) : existingPost.tags
  const nextCategory = hasValue(category_id) ? category_id : existingPost.category_id
  ```

  Validate the effective status and effective content, then use those effective values in the parameterized update. Keep explicit empty strings meaningful where the API documents clearing.

- [x] **Step 6: Run focused tests and lint**

  ```bash
  cd server
  npx vitest run __tests__/validator.test.js __tests__/postController.test.js
  npm run lint
  ```

  Expected: all malformed-type, preservation, clearing, and draft tests pass with no lint errors.

- [ ] **Step 7: Commit the API contract change**

  ```bash
  git add server/middleware/validator.js server/controllers/postController.js server/controllers/categoryController.js server/controllers/authController.js server/utils/helpers.js server/__tests__
  git commit -m "fix: validate API types and preserve omitted fields"
  ```

### Task 3: Make Legacy Database Migration Safe and Uniquely Addressable

**Files:**
- Modify: `server/db/index.js:32-65`
- Modify: `server/db/schema.sql:44-50`
- Test: `server/__tests__/db.test.js`

**Interfaces:**
- `initDb()` is idempotent for current and legacy schemas.
- Every non-null post slug is unique after migration.
- A real migration failure aborts initialization and remains visible in logs/tests.

- [x] **Step 1: Add a legacy-schema migration test**

  Create an in-memory legacy `posts` table without `slug`, insert rows whose generated slugs would collide, run initialization, and assert:

  - `slug` exists;
  - duplicate values were deterministically suffixed;
  - inserting another duplicate slug raises the unique constraint;
  - running initialization a second time changes nothing.

- [x] **Step 2: Add a migration-error test**

  Use a deliberately invalid migration state or a mocked failing database operation and assert that `initDb()` throws instead of silently continuing.

- [ ] **Step 3: Run the focused database tests and verify they fail**

  ```bash
  cd server
  npx vitest run __tests__/db.test.js
  ```

- [x] **Step 4: Implement transactional slug migration**

  Remove broad empty catches. Inspect the legacy table, assign `post-\${id}`-style values, resolve collisions in stable id order, drop the old non-unique slug index if present, and create a unique slug index inside a transaction. Keep the current schema declaration aligned with the migration index.

- [x] **Step 5: Run database tests and an integrity check**

  ```bash
  cd server
  npx vitest run __tests__/db.test.js
  node -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); db.close()"
  ```

  On a staging copy of a real database, also run `PRAGMA integrity_check` and inspect duplicate slugs before deployment.

- [ ] **Step 6: Commit the migration change**

  ```bash
  git add server/db/index.js server/db/schema.sql server/__tests__/db.test.js
  git commit -m "fix: enforce slug uniqueness during legacy migration"
  ```

### Task 4: Bound Public Reads and Preserve Archive Completeness

**Files:**
- Modify: `server/middleware/validator.js:61-95`
- Modify: `server/routes/post.js:26-33`
- Modify: `server/controllers/postController.js:541-601`
- Modify: `server/utils/helpers.js:27-39`
- Modify: `client/src/api/post.js`
- Modify: `client/src/views/Archives.vue`
- Test: `server/__tests__/postController.test.js` and focused route/validator tests

**Interfaces:**
- Public `GET /api/posts` accepts only bounded positive page sizes; admin-only listing retains an explicit no-pagination rule.
- Search has a documented public rate limit and bounded query cost.
- Archives either paginate end-to-end or return an explicit completeness signal; older posts are never silently omitted.

- [x] **Step 1: Add failing public-query tests**

  Assert that public `pageSize=0` returns 400 while admin `pageSize=0` remains valid. Assert that search rejects oversized tags/keywords and that the archive response exposes all rows across pages.

- [x] **Step 2: Implement separate list validation**

  Split public and admin list rules. Keep `pageSize: 1..50` for public requests and a dedicated `pageSize=0` allowance only for the authenticated admin route. Make `parsePagination` reject rather than silently reinterpret invalid public values.

- [x] **Step 3: Add search rate limiting**

  Add an `express-rate-limit` limiter to the public search route with a bounded window suitable for a personal blog, for example 300 requests per 15 minutes per trusted client IP. Keep the existing account and login limiters unchanged. Document that a multi-process deployment needs a shared rate-limit store.

- [x] **Step 4: Remove archive truncation**

  Prefer a paginated archive response with `page`, `pageSize`, `total`, and `totalPages`; update `Archives.vue` to request and navigate pages. If product design rejects pagination, return `truncated: true` and `total` and display the condition instead of silently dropping rows.

- [x] **Step 5: Run focused API tests**

  ```bash
  npm test -- --runInBand
  ```

  Expected: public limits, search limiting, and archive completeness tests pass.

- [ ] **Step 6: Commit the public-read change**

  ```bash
  git add server/middleware/validator.js server/routes/post.js server/controllers/postController.js server/utils/helpers.js client/src/api/post.js client/src/views/Archives.vue server/__tests__
  git commit -m "fix: bound public reads and paginate archives"
  ```

### Task 5: Repair Editor Responsiveness, Theme Contrast, and Accessibility

**Files:**
- Modify: `client/src/views/admin/Editor.vue:1-138,371-536`
- Modify: `client/src/components/MarkdownEditor.vue:1-215`
- Modify: `client/src/assets/css/glass.css:1-113`
- Modify: `client/src/assets/css/variables.css:75-113`
- Modify: `client/src/components/PostCard.vue:82-202`
- Modify: `client/src/views/DefaultLayout.vue:1-13`
- Modify: `client/src/views/Home.vue`, `Post.vue`, `Archives.vue`, `Search.vue`
- Modify: `client/src/views/admin/Layout.vue`, `Login.vue`, `Dashboard.vue`, `Posts.vue`, `Categories.vue`
- Test: `client/src/__tests__` as appropriate
- Verify: agent-browser screenshots and axe scans at desktop and mobile widths

**Interfaces:**
- Exactly one page-level `main` landmark exists per layout.
- Every icon-only control has a name and state; every form control has an associated label.
- The editor fits within the viewport at 320, 375, 414, and 768 CSS pixels.
- Dark-mode cards use dark backgrounds and readable foreground tokens.

- [x] **Step 1: Capture failing browser assertions**

  Start the API and Vite client in isolated ports, then use agent-browser to assert:

  ```js
  document.documentElement.scrollWidth === window.innerWidth
  ```

  Record the current 957-pixel editor overflow at 320/375/414/768. Run axe on home, login, dashboard, posts, categories, and editor pages and save the violation counts as regression evidence.

- [x] **Step 2: Fix editor layout constraints**

  Set `min-width: 0` and `max-width: 100%` on the editor page, grid children, and Markdown editor root. Ensure the third-party editor does not impose a fixed minimum width. At small widths wrap or stack the toolbar and preview, and keep action buttons inside the available grid columns. Do not rely on global `overflow-x: hidden` as the fix.

- [x] **Step 3: Fix dark-mode token usage**

  Replace hard-coded light backgrounds in `.glass-card`, `.post-card`, and admin cards with `var(--bg-card)`/theme-specific tokens. Recalculate text, status, pin, muted, and footer colors against both light and dark backgrounds; verify normal text is at least 4.5:1 and large text at least 3:1.

- [x] **Step 4: Repair landmarks and form semantics**

  Keep `main` in `DefaultLayout.vue` and change nested page-level `main` elements to `section`; add `main` to the standalone admin login. Make the admin top-bar title the page `h1`, with child headings below it. Add `aria-label` and `aria-pressed`/ `aria-expanded` where appropriate, associate labels using stable `for`/ `id` pairs, name the generated Markdown textbox, and give the empty drag column an accessible header.

- [x] **Step 5: Resolve the Markdown HTML policy**

  Do not leave an inline `eslint-disable` exception. The preferred implementation is a token/VNode Markdown renderer that ignores raw HTML tokens and only renders the allowlisted Markdown nodes, links, and images; this removes the `v-html` boundary while preserving Vue text escaping. If the product explicitly keeps the DOMPurify exception instead, move it into one audited component, restrict URL protocols and attributes, add the corresponding security tests, and update `AGENTS.md`, `docs/core-beliefs.md`, and the custom lint rule in the same change so the rule and implementation no longer contradict each other.

- [x] **Step 6: Re-run visual and accessibility verification**

  At 320, 375, 414, 768, and 1440 widths verify no horizontal overflow, all editor actions are visible, and dark cards are readable. Re-run axe and require zero critical/serious violations; manually keyboard-test login, navigation collapse, editor controls, upload, and modal close.

- [ ] **Step 7: Run client checks and commit**

  ```bash
  npm run lint
  npm run format:check
  npm test
  cd client
  npm run build
  ```

  ```bash
  git add client/src
  git commit -m "fix: make admin UI responsive and accessible"
  ```

### Task 6: Tighten CI, Dependency Hygiene, Performance, and Documentation

**Files:**
- Modify: `.github/workflows/code-cleanup.yml:27-38`
- Modify: `client/vite.config.js`
- Modify: `README.md:93,133,145-157,265-274`
- Modify: `docs/core-beliefs.md:33-40` or introduce a real data-access boundary before retaining that rule
- Modify: `docs/architecture.md` if the actual controller/data-access design remains unchanged
- Verify: `client/package.json`, `client/package-lock.json`

**Interfaces:**
- The cleanup workflow cannot report success when lint or formatting fails.
- Documentation describes the files that actually exist and the architecture the code enforces.
- A clean `npm ci` has no extraneous production dependency.

- [x] **Step 1: Make CI failures blocking**

  Remove `|| true` from lint and format steps. Keep auto-fixing separate from verification, or run the fix and then run blocking lint/format checks before creating a pull request. Add a build assertion to the cleanup workflow if it is intended to validate release readiness.

- [x] **Step 2: Reduce editor bundle cost**

  Inspect the dependency graph behind `Editor-Bwfe8nUL.js`. Lazy-load the editor and language/highlight modules by route, configure deliberate Rollup manual chunks only where it improves caching, and keep the existing 500 kB warning visible rather than raising the warning threshold.

- [x] **Step 3: Clean dependency state**

  Run `cd client && npm prune` in a disposable install environment, confirm `glightbox` is absent from `npm ls --depth=0`, and change `package.json` only if source imports prove the dependency is required. Do not commit `node_modules`.

- [x] **Step 4: Align documentation and architecture**

  Remove or restore the stale `start.bat` reference. Document the final production requirements for `NODE_ENV`, `JWT_SECRET`, `SITE_URL`, `TRUST_PROXY`, HTTPS, and upload paths. Either move controller SQL into a data-access module or revise the architecture/core-belief text so it matches the existing repository.

- [ ] **Step 5: Run CI-equivalent checks and commit**

  ```bash
  npm ci
  cd server
  npm ci
  npm run lint
  npm test
  cd ../client
  npm ci
  npm run lint
  npm test
  npm run build
  ```

  ```bash
  git add .github/workflows client/vite.config.js client/package.json client/package-lock.json README.md docs
  git commit -m "chore: align CI dependencies and project documentation"
  ```

### Task 7: Release Gate and Evidence Package

**Files:**
- Verify all modified files from Tasks 1-6
- Create only when required: `docs/releases/<next-version>.md`

- [x] **Step 1: Run all local gates**

  ```bash
  npm run lint
  npm run format:check
  npm test
  cd client
  npm run build
  cd ..
  git diff --check
  ```

- [x] **Step 2: Run dependency checks with an explicit limitation**

  Run `npm audit --offline` in root, `server`, and `client`. If the online registry cannot be reached, record that the zero-vulnerability result comes from the local cache and schedule an online audit in CI.

- [x] **Step 3: Run end-to-end security and workflow checks**

  In an isolated database and upload directory verify login/logout, expired token handling, post create/update/delete, draft/publish transitions, view-count de-duplication, illegal uploads, external upload URL mapping, malformed JSON types, public page limits, sitemap Host isolation, and all responsive/axe checks.

- [x] **Step 4: Validate migration on a database copy**

  Back up the real database, run the migration against the copy, execute `PRAGMA integrity_check`, inspect slug uniqueness and row counts, and only then schedule the production restart.

- [x] **Step 5: Inspect the final worktree**

  Confirm no `.env`, database, upload image, browser state, or build cache is staged. Confirm `.agent-browser` and temporary audit processes are absent. Preserve unrelated user changes.

- [x] **Step 6: Publish the remediation summary**

  Record changed behavior, migration instructions, required environment variables, test counts, build output, remaining accepted risks, and the offline audit limitation in the release notes.

## Final Status

- 34/43 steps are checked against the implementation and final verification evidence.
- The nine unchecked steps are the original plan's red-test replay and per-task isolated-commit checkpoints. They were not reconstructed after the work was implemented; the full change set is submitted as the v2.0.0 release commit.
- No product behavior, test, migration, browser, or release-evidence task remains open for v2.0.0.
