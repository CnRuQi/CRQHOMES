# 设计审计记录 — 2026-10-01

> 范围：`client/` 全站视觉与交互系统（前台 8 个视图 + 后台 7 个视图 + 5 个全局样式表 + 组件层），
> 目标：以 Awwwards / Webby / FWA 的品质标准，从**排版、留白、视觉层级、色彩、动效、微交互、响应式、原创性**
> 八个维度逐项自检并修正，循环迭代。
>
> 方法：静态审计（全文通读 + 令牌/字面量/断点/交互元素的机械化 grep），
> 逐项判断后修改，再复查。**本轮没有运行 lint / vitest / vite build，也没有浏览器回归**（原因见文末「验证状态」）。

---

## 一、不可破坏的测试契约（本次改动全程遵守）

`client/src/__tests__/` 的 10 个测试文件不会加载全局 CSS，因此改样式是安全的；
但类名、id、aria、标签类型、文本与调用参数是锚点。本次改动逐条核对过：

- `PostCard`：`<h2 class="card-title">`、`<span class="placeholder-icon" aria-hidden="true">`、
  封面 `<img>` 必须真的被移除（`v-if/v-else`，不能只用 CSS 隐藏）、
  `.card-cover.placeholder.image-fallback` + `role="img"` + `aria-label="封面图片加载失败"` 原样保留。
- `Dashboard`：`h2.section-title` 恰好两个，顺序为「最近文章」「快捷操作」。
- `Posts`：`.drag-handle` 必须是 `<button type="button">`，`aria-label` 含「使用上/下方向键移动」，
  拖拽持久化载荷与 `updateSortOrder` 调用次数不变。
- `admin/Layout`：`.collapse-btn` 的 `aria-label === '收起侧边栏'`，内部保留真实 `<span aria-hidden="true">`。
- `MarkdownEditor`：`.md-editor-toolbar-wrapper` 的 `tabindex=0` / `role=region` / `aria-label` 与 `.cm-content` 的 `aria-label` 不变。
- `Search`：`.search-input` 双向绑定、`.search-results` 仅在有效结果时存在、`p.load-error[role="alert"]`、300ms 防抖；
  `?q=[...]` 数组参数视为非法。
- 列表视图（Home / Archives / Categories / Posts）：`loadError` 分支必须早于空状态分支。
- `Categories`：`#category-name` 是弹窗首个焦点、`form button[type="submit"]` 是最后一个可 Tab 元素、保存后焦点回到 `.page-header` 内首个按钮。
- `Categories` / `Editor` / `Dashboard` / `Posts` 的**页面标题标签**无测试断言 → 由 `h2` 提升为 `h1` 是安全的。
- `Icon.vue` 由 `<img>` 改为 `<span>`：测试里只有 `.card-cover img` 与 `MarkdownContent` 的 `img[loading=lazy]`，
  与图标无关；36 处 `<Icon>` 全部传绑定值 `:size="N"`。

---

## 二、逐维度发现与处置

### 1. 排版

| 发现                                                                                 | 处置                                                                     |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `--spacing-3xl` 被 `Home.vue` 使用却从未定义（永远走 fallback 64px）                  | 新令牌体系重新定义，别名层 `--spacing-*` 全部重映射到 `--space-*`         |
| 后台顶栏把 `route.meta.title` 渲染成 `<h1 class="page-title">`，与页面自身标题**重复** | 顶栏改 `<span class="topbar-location" aria-hidden="true">`，只在窄屏出现 |
| 后台页面标题是 `h2`，而页内小标题是 `h3`（跳级）                                       | 页面标题统一 `h1`；`Categories` 的 `h3` 分类名/弹窗标题、`Editor` 的卡片标题改 `h2` |
| 站名 `font-size: 1.3125rem`、页脚站名 `1.1875rem` 硬编码（后者正是 `--fs-lg` 的最大值） | 改 `var(--fs-xl)` / `var(--fs-lg)`，中文站名回到流体字号                   |
| 文章标题与后台大数字各写一个 `clamp()`                                                | 收进令牌：`--fs-article` / `--fs-stat` / `--fs-stat-lead`                 |
| 两个 spinner 时长不一（0.75s / 0.8s）                                                 | 统一 `--dur-spin: 800ms`                                                  |

复查：全站 `.vue` 文件中 `font-size:` 字面量 **0 处**；字号全部走令牌。

### 2. 留白

| 发现                                                           | 处置                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| 后台侧栏收起宽度 `70px` 在两条规则里重复，且比 2.5rem 折叠按钮窄 | 单个 `--sidebar-w-collapsed: 4.5rem`（72px），两处引用同一变量     |
| 区块间距在断点处突跳                                           | `--space-section` / `-sm` / `--space-block` 改为流体 `clamp()`     |
| 页脚底部与 iOS home indicator 重叠                             | 页脚底部内边距加入 `--safe-bottom`                                |
| 卡片行高不一致（页脚不贴底）                                   | `.card-body` 改列向 flex + `.card-footer { margin-top: auto }`     |

### 3. 视觉层级

| 发现                                                                                             | 处置                                                                 |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 首页 Hero 与列表之间没有层级过渡                                                                  | 扉页式 Hero：眉标 + 发丝线 + 衬线大标题 + 印章，底部发丝线收口        |
| 归档页把 API 的 `pagination.total`（年-月**桶**数）当作文章数展示                                  | 新增 `groupedByYear` 与 `postCount` computed，年份侧标 + 月份横线小标 |
| `Dashboard` 在顶栏不再承担标题后没有 `h1`                                                         | 补 `.page-header > h1.page-title`（不影响冻结的 `h2.section-title`）  |
| 卡片标题悬停无反馈                                                                                | 标题下 2.5rem 墨线，分类胶囊用 `--tint-primary`                      |

### 4. 色彩

| 发现                                                                                                                                                                            | 处置                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 旧模板遗留的 `rgba(163,166,156,…)`（旧主色 #A3A69C）散落在按钮、tag、分页、空状态、shimmer、`@media (hover:none)` 等处                                                            | 全部删除，统一走 `--tint-primary-*` / 状态令牌；全站仅剩两处刻意保留的字面量（照片压边、打印块） |
| `--text-disabled`（`--ink-400`）在宣纸白上只有 **4.23:1**，而它承载的是页脚备案、时间戳、提示语等真实文字                                                                        | 新增 `--ink-350 #6a6d66`，比值 **4.82:1**（一处令牌改动修好 21 个调用点）                 |
| **图标在双主题下都不可靠**：`sun/moon/search` 写 `currentColor` 经 `<img>` 解析成黑色；`#515151` 在 `#141513` 上过暗；`check/alert/close/info` 是白描边，在浅色玻璃面上几乎看不见；`Post.vue` / `Dashboard.vue` / `Navbar.vue` 里三处 `.icon` 颜色规则**实际从未生效** | `Icon.vue` 改为 CSS 掩模：`<span>` + `background-color: currentColor` + `mask-image: var(--icon-src)`，22 个来源不一的 SVG 统一成同一支墨色剪影 |

复查：`.vue` 文件中的颜色字面量只剩 `PostCard.vue` 的照片压边（刻意的深色 scrim，压在图片上，不该跟随主题）。

### 5. 动效

| 发现                                                                                                              | 处置                                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 依赖 AOS（现成库）+ 从模板继承的 `.animate-*` / `.delay-100..500` / `.hover-lift/-scale/-glow` / `.list-*` 死代码   | grep 确认 0 引用后整体删除；改为自研揭示系统（`reveal.js` + `[data-reveal]`）                     |
| 揭示动画 640ms，长列表显得拖沓                                                                                     | 透明度/位移降到 `--dur-slow` 420ms；`mask` 保留 880ms，`blur` 保留 640ms                          |
| 错峰按 DOM 顺序预先算好，第 9 张以后的卡片会带着 490ms 延迟才动                                                    | 改为**揭示那一刻按观察批次**计算（70ms/档、上限 7 档）                                            |
| 脚本失败时内容永久隐藏                                                                                            | 初始隐藏态挂在 `.js-reveal` 之下；`IntersectionObserver` 缺失或 `prefers-reduced-motion` 时全部直接可见 |
| 打印时未滚动到的元素停在 `opacity: 0`                                                                             | 打印块内强制可见（`!important`，只作用于 `@media print`）                                        |

### 6. 微交互

| 发现                                                                          | 处置                                                                                                     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 只有 `.btn` / `.pagination-btn` / `.tag` 等少数元素有按压反馈                  | `main.css` 增加统一按压块，`nav-link / menu-item / archive-item / post-item / action-item / tab-btn / top-btn / close-btn / collapse-btn / clear-btn` 全覆盖 |
| 移动端抽屉只能点遮罩关闭，键盘用户关闭后焦点丢失                              | 前台与后台抽屉都支持 `Esc` 关闭，并把焦点交还触发按钮                                                    |
| 后台抽屉关闭时只是 `translateX(-100%)`，屏幕外链接仍在 Tab 顺序里              | 收起态加 `visibility: hidden` + `pointer-events: none`，并用 `visibility 0s linear var(--dur-slow)` 让动画不被截断 |
| 清除搜索按钮缺少 `type="button"`，搜索框缺语义                                | 补 `type="button"`、`role="search"`、`enterkeyhint="search"`                                              |
| 正文页没有阅读位置反馈                                                        | 新增阅读进度墨线：页头下缘 2px，`transform: scaleX()` 绘制、rAF 合并滚动、`Teleport` 到 body（避免被路由过渡的 transform 变成相对内容区固定）、打印不印 |
| 原生控件（勾选框、日期图标）在深色主题里是系统蓝/近黑不可见                    | `accent-color`、`caret-color` 跟随主色；日期图标深色下 `filter: invert(1)`；补 `.form-check` 表单模式样式 |

### 7. 响应式

| 发现                                                                                | 处置                                                                    |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `100vh` 在移动端浏览器里高于可见区域                                                | `App.vue` / `DefaultLayout.vue` / `Login.vue` / 后台 `Layout.vue` 四处补 `100dvh` 兜底 |
| 后台 `z-index` 出现 1002/1003 裸值，与其他位置的令牌体系不一致                        | 改 `--z-sticky` / `--z-overlay` / `calc(var(--z-overlay) + 1)`           |
| 正文中的宽表格（5–6 列中文）在窄屏被 `overflow: hidden` 静默裁掉一半内容             | `display: block` + `overflow-x: auto`，行仍由匿名表格盒布局，视觉不变    |
| 纸上不能横向滚动：宽代码块与宽表格会被裁掉右半边                                     | 打印段里代码块改 `white-space: pre-wrap`，表格缩到 9pt 并允许跨页续排    |
| 需要确认不存在固定宽度溢出                                                          | grep 复核：`.vue` 内无 >160px 的固定 `width`/`min-width`；网格列全部 `auto-fill/auto-fit` 或带断点 |

### 8. 原创性

没有使用任何模板类名、UI 组件库或现成动画库；版式语言全部来自「纸 / 墨 / 印 / 线」：

- 首页扉页式 Hero +「披花沐雪」四字印章（−7°，本地关键帧入场，避免与全局 reveal 的 `transform` 复位冲突）；
- 归档页编年体（年份粘性侧标、月份横线、条目只留「日」）；
- 404 用 `-webkit-text-stroke` 做镂空数字，并保留不依赖描边的兜底色；
- 正文页阅读进度是一条墨线；`figcaption` 用衬线斜体；`hr` 是 3.5rem 的墨痕而不是整行分割线；
- 纸纹、墨洗渐变（`.glass-gradient`）、发丝线（`--border-hairline`）构成统一的材质层；
- 后台沿用同一套纸墨，但更紧凑（表头小字大写 + 发丝线分隔 + 拖拽手柄不加投影）。

---

## 三、取舍记录（单一系统性修复 > 局部补丁）

| 问题                                     | 选择的修法                                  | 为什么不是局部补丁                                   |
| ---------------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| 21 处偏低对比度的三级文字                | 调一个令牌 `--ink-350`                      | 逐个改调用点会留下不一致，且下次仍会犯                |
| 22 个来源不一的图标在双主题下颜色失控    | `Icon.vue` 改 CSS 掩模                      | 逐个改 SVG 的 `fill` 只能修一半（描边型图标改不动），且丢失 `color` 能力 |
| 打印时揭示元素不可见、界面外壳全上纸     | 增加一个 `@media print` 段 + 令牌压黑       | 逐页写打印样式不可维护                                |
| 长列表错峰延迟随 DOM 顺序线性增长        | 把错峰移到「揭示那一刻」                    | 调小步长只能缓解，不能消除                            |
| 死代码（AOS 兼容类、`animate-*`、重复 spinner 时长） | 一次删净                        | 保留两套写法会让后来者不知道该以哪套为准              |

---

## 四、验证状态（重要）

**本轮没有执行任何命令验证**：本会话的 shell 在受限沙箱下每次调用都以
`exit code 3221225794`（`0xC0000142 STATUS_DLL_INIT_FAILED`）失败，
`lint` / `vitest` / `vite build` / 浏览器回归都无法运行；文件工具正常，所以上述改动均为「静态审计 + 代码级复核」。

已完成的静态复核：

- 全站 `rgba(163, 166, 156` / `data-aos` / `console.log` / `TODO` **0 命中**（仅 `reveal.js` 注释中说明为何弃用 AOS）。
- `.vue` 文件中字体字号字面量 0 处；`transition: all` 0 处。
- `!important` 仅存于：`MarkdownEditor.vue`（约 45 处，覆盖 md-editor-v3 供应商样式）、
  `animations.css` 的 reduced-motion/reduced-transparency 段、后台 `Layout.vue` 的 `.main-wrapper { margin-left: 0 !important }`（需压过 `.expanded`）与新增的打印段。
- 断点清单：768/769（移动边界）、480、1024（编辑器）、900（后台数据卡）、359（极窄屏），以及 reduced-motion / reduced-contrast / reduced-transparency / hover:none / hover:hover。
- 图标掩模技术上 `mask-image` 读取 SVG 的 alpha 通道，实心填充与描边型图标都能出剪影；已带 `-webkit-` 前缀。

**尚未验证、需要一次真实运行才能确认的项**：

1. `npm run lint`（ESLint 9 + eslint-plugin-vue）是否全绿——新增了 `Teleport`、`onUnmounted`、`requestAnimationFrame` 等用法。
2. `npm test`（client 10 文件 / 50 例）——重点是 `Icon.vue` 由 `<img>` 改 `<span>`、`Post.vue` 新增 `Teleport`、
   后台 `Layout.vue` 新增键盘监听后，是否触及任何断言。
3. `npm run build` 与浏览器回归（320/375/414/768/1440 CSS px、双主题、打印预览）。
4. 视觉细节需人眼确认：印章角度与位置、阅读进度墨线的对齐、后台 `<h1>` 替换后的字重节奏、深色主题图标明度。

---

## 五、后续建议

1. 在具备完整权限的环境里依次跑 `npm run format` → `npm run lint` → `npm test` → `npm run build`，然后做一次 5 档宽度 × 双主题的浏览器回归与打印预览。
2. 把本轮改动整理进 `docs/releases/`（建议随下一个版本号发布），`docs/design.md` 已同步为当前令牌体系。
3. 剩余可选优化（本轮判断为「不构成明显短板」，故未做）：文章目录（长文 TOC，需要解析标题）、
   编辑器懒加载 chunk 体积（约 882 kB，不影响首页）、`aos` 依赖若确认无用可在下一次依赖整理时随 lockfile 一起移除。
