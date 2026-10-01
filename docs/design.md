# 设计规范文档

> 披花沐雪 — 「枯木冷茶」纸墨体系
> 本文档描述**当前代码里真实生效**的设计系统。
> 唯一事实来源是 [`client/src/assets/css/variables.css`](../client/src/assets/css/variables.css)；
> 组件只允许消费语义层令牌，禁止在组件里裸写颜色、字号与间距。

---

## 一、设计理念

| 关键词 | 说明                                       |
| ------ | ------------------------------------------ |
| 虚怀   | 中性克制，界面不喧宾夺主                   |
| 禅意   | 安静感，如书房或茶室                       |
| 专注   | 让读者注意力集中在文字                     |
| 耐看   | 高级感，持久不厌倦                         |
| 原创   | 纸、墨、印、线，而不是通用卡片＋投影模板   |

三条硬纪律：

1. **三层令牌**：原始层（纸/墨/苔色阶，按材质命名）→ 语义层（组件只消费这一层）→ 别名层（兼容历史命名）。
2. **动效只表达四件事**：进入、离开、强调、状态变化。时长与缓动只用令牌，禁止裸写 `ease`。
3. **中文优先**：正文行高 1.72、阅读栏宽 40rem（约 34–38 字），标题用衬线（Playfair Display + Noto Serif SC）。

---

## 二、色彩

### 原始层

| 家族      | 令牌                                                                 | 用途                     |
| --------- | -------------------------------------------------------------------- | ------------------------ |
| 纸 Paper  | `--paper-50 #fbfbf9` → `--paper-500 #b8b9b2`                          | 底色、分隔、玻璃面       |
| 墨 Ink    | `--ink-900 #22231f` → `--ink-300 #8f9289`（含 `--ink-350 #6a6d66`）   | 文字、描边、阴影         |
| 苔 Sage   | `--sage-900 #3a4237` → `--sage-100 #eef2ea`                          | 主色家族（饱和度刻意压低）|
| 点缀      | `--rose-600 #a46b6b` / `--gold-600 #8f7238`                           | 印章、置顶等暖色强调     |
| 功能      | `--green-600 #4f7957` / `--amber-700 #8b641a` / `--red-700 #813636` / `--blue-700 #426a86` | 成功/警告/危险/信息 |

### 语义层

- 主色：`--color-primary: var(--sage-600) #687064`，深色态 `--color-primary-dark: var(--sage-800) #4d574a`，按钮文字 `--on-primary #ffffff`。
- 背景：`--bg-primary #f5f5f3`（宣纸白）、`--bg-secondary #ebebe8`（洗砚灰）、`--bg-elevated #ffffff`（真正的浮起面）、`--bg-card/-glass` 由白色按透明度混合。
- 淡染：`--tint-primary-weak/-primary/-strong` 由主色 6%/11%/18% 混出，**所有 hover／激活底色统一走这一套**，不再散落 `rgba()`。
- 文字：`--text-primary #2d2e2b` / `--text-secondary #4a4c48` / `--text-muted #575a54` / `--text-disabled #6a6d66`。
- 描边：`--border-hairline/-subtle/-color/-hover/-active` 全部由墨色混出，保持同色相家族。

### 对比度（正文可读性证据）

| 组合                                      | 比值    | 结论           |
| ----------------------------------------- | ------- | -------------- |
| `--text-primary` on `--bg-primary`        | ≈13:1   | AAA            |
| `--text-secondary` on `--bg-primary`      | ≈10:1   | AAA            |
| `--text-muted` on `--bg-primary`          | 6.42:1  | AA             |
| `--text-disabled` on `--bg-primary`       | 4.82:1  | AA（达标线）   |
| 链接色 `--color-primary-dark` on `--bg-primary` | 6.92:1 | AA          |
| 白字 on `--color-primary`                 | 5.13:1  | AA             |
| 深色主题 `--text-disabled` on `--bg-primary` | 4.70:1 | AA           |

> 说明：`--text-disabled` 承载的不只是禁用控件（页脚备案、时间戳、提示语都在用它），
> 因此从 `--ink-400`（4.23:1，不达标）上调到新增的 `--ink-350`（4.82:1）。

### 双主题

同一令牌在 `[data-theme='dark']` 中覆写，实现「一令牌双主题」。
深色底 `--bg-primary #141513`，主色提亮为 `--color-primary #8fa389`、`--color-primary-dark #b6c4ae`，
按钮文字反转为 `--on-primary #12140f`。**属性名固定为 `data-theme`**（`client/index.html` 的内联脚本与 `useTheme.js` 都依赖它）。

---

## 三、排版

### 字体

```
标题   Playfair Display + Noto Serif SC     优雅衬线，文人气韵
正文   Source Sans 3 + Noto Sans SC         清晰无衬线，阅读舒适
代码   JetBrains Mono                       现代等宽
```

**字体只从 `client/index.html` 引入一次**（`fonts.loli.net` 国内镜像，`display=swap`）。
曾经 CSS 里写了 `'Noto Serif SC'` 却没有加载，导致全站中文落到系统兜底字体——这一条必须保持住。

### 流体字号

所有档位在 320px → 1280px 视口之间连续插值，**断点处不跳变**：

| 令牌       | 范围        | 语义别名                    |
| ---------- | ----------- | --------------------------- |
| `--fs-2xs` | 11 → 12 px  | —                           |
| `--fs-xs`  | 12 → 13 px  | `--fs-micro`                |
| `--fs-sm`  | 13 → 14 px  | `--fs-caption`              |
| `--fs-base`| 15 → 16 px  | `--fs-body`                 |
| `--fs-md`  | 16 → 17 px  | —                           |
| `--fs-lg`  | 17 → 19 px  | `--fs-lead`                 |
| `--fs-xl`  | 20 → 24 px  | `--fs-h4`                   |
| `--fs-2xl` | 24 → 32 px  | `--fs-h3`                   |
| `--fs-3xl` | 28 → 41 px  | `--fs-h2`                   |
| `--fs-4xl` | 34 → 52 px  | `--fs-h1`                   |
| `--fs-5xl` | 44 → 80 px  | `--fs-hero`                 |
| `--fs-6xl` | 56 → 128 px | `--fs-display`              |

两处展示性字号单独定义、组件只引用，避免每个组件各写一个 `clamp`：`--fs-article`（正文标题）、
`--fs-stat` / `--fs-stat-lead`（后台数据大数字）。

行高 `--leading-tight 1.14` / `--leading-snug 1.3` / `--leading-normal 1.5` / `--leading-relaxed 1.72`；
字距 `--tracking-tighter -0.022em` → `--tracking-widest 0.16em`。
标题自动 `text-wrap: balance`、段落 `text-wrap: pretty`（见 `reset.css`）。

---

## 四、间距与栅格

4px 基准：`--space-1 4px`、`-2 8`、`-3 12`、`-4 16`、`-5 20`、`-6 24`、`-8 32`、`-10 40`、`-12 48`、`-16 64`、`-20 80`、`-24 96`、`-32 128`。

区块级留白是**流体的**（随视口呼吸，而不是在断点处突跳）：

| 令牌                 | 范围          | 用途             |
| -------------------- | ------------- | ---------------- |
| `--space-gutter`     | 20 → 40 px    | 容器左右内边距   |
| `--space-section`    | 48 → 120 px   | 大区块上下留白   |
| `--space-section-sm` | 32 → 72 px    | 次级区块         |
| `--space-block`      | 24 → 44 px    | 块内间距         |

布局原语：`--max-width 1280px`、`--max-width-wide 1440px`、`--max-width-narrow 800px`（文章页）、
`--measure 40rem`（阅读栏宽）、`--grid-columns 12`、`--grid-gap`。
列表页统一用 `repeat(auto-fill, minmax(min(100%, 19rem), 1fr))`，不写死列数。

---

## 五、圆角 / 阴影 / 层级

圆角：`--radius-xs 3px` / `-sm 6` / `-md 10` / `-lg 14` / `-xl 20` / `--radius-full 999px`。
阴影统一**带色**（从 `--ink-900` 混出，避免纯黑阴影发脏）：`--shadow-xs/-sm/-md/-lg/-xl`，按钮另有 `--shadow-btn`（内高光 + 下沿投影）。
层级：`--z-base 0` / `--z-raised 10` / `--z-sticky 100` / `--z-header 200` / `--z-overlay 300` / `--z-modal 400` / `--z-toast 10000`。

---

## 六、动效

三条纪律（写在 `animations.css` 顶部）：

1. 每个动效必须回答「它在表达什么」；
2. 时长与缓动只用令牌；
3. **入场用 `--ease-out`（快起慢停），退场用 `--ease-in`**，绝不用 `ease-in-out` 做入场（会显得犹豫）。

时长：`--dur-instant 90ms` / `--fast 150` / `--normal 260` / `--slow 420` / `--slower 640` / `--reveal 880` / `--dur-spin 800`。
缓动：`--ease-standard` / `-out` / `-in` / `-in-out` / `-emphasis` / `--ease-spring`。

### 揭示系统（取代 AOS）

- 由 [`client/src/assets/js/reveal.js`](../client/src/assets/js/reveal.js) 用 `IntersectionObserver` 给元素加 `.is-revealed`。
- 初始隐藏态全部挂在 **`.js-reveal`** 之下：脚本没执行时页面完全可见，不会出现「JS 失败 → 内容永久空白」。
- 变体：`data-reveal="up|down|left|right|scale|mask|blur|rule|fade"`。
  `mask` 是墨线自上而下揭开，`rule` 是发丝线从左画出，`blur` 只用于画面级元素。
- 错峰在**揭示那一刻**按观察批次计算（`STAGGER_STEP 70ms`、上限 7 档），
  所以长列表第 9 张卡片不会带着 490ms 的延迟等一下才动。
- `prefers-reduced-motion: reduce` 时全部直接可见。

---

## 七、微交互

- **按压语言**：所有可点元素按下时 `transform: translateY(1px)`（触屏改为 `scale(0.97)`），过渡压到 `--dur-instant`。统一写在 `main.css` 的 `:where(...):active` 块里，`nav-link / menu-item / archive-item / post-item / action-item / tab-btn / top-btn / close-btn / collapse-btn / clear-btn` 全部覆盖。
- **悬停**：一律用 `--tint-primary-weak` 淡染底，而不是换一个颜色；卡片是 `translateY(-2px)` + 阴影加深。
- **焦点**：全局 `:focus-visible` 3px 主色描边 + 2px 偏移（`reset.css`）；表单控件另加 `0 0 0 3px var(--color-ring-soft)` 光环。
- **表单**：`caret-color` 与原生控件（勾选框、日期选择器）跟随主色。
- **抽屉**：移动端菜单支持点击遮罩、`Esc` 关闭，关闭后焦点回到触发按钮。

---

## 八、响应式

| 断点            | 说明                                                     |
| --------------- | -------------------------------------------------------- |
| `max-width: 768px` | 移动端主边界（配合 `min-width: 769px`）                |
| `max-width: 480px` | 单列化                                                 |
| `max-width: 1024px` | 后台编辑器两栏 → 单栏（内容驱动）                      |
| `max-width: 900px`  | 后台数据卡片换行（内容驱动）                           |
| `max-width: 359px`  | 极窄屏隐藏站名文字                                      |

模糊策略（性能优先）：移动端只做半透明背景；`min-width: 769px` 才启用 `backdrop-filter: blur(16px)`。
`prefers-reduced-transparency: reduce` 时全部退回不透明的 `--bg-elevated`。

高度与安全区：`100vh` 一律配一行 `100dvh` 兜底（移动端浏览器工具栏）；
页脚底部留出 `--safe-bottom`；`html` 有 `scroll-padding-top`，锚点不会被固定页头盖住。

---

## 九、无障碍

焦点可见（3px 描边）、跳到主要内容链接（`DefaultLayout`）、标题层级从 h1 起不跳级、
`prefers-reduced-motion` / `prefers-contrast: more` / `prefers-reduced-transparency` 三档适配、
抽屉关闭时 `visibility: hidden`（否则屏幕外的链接仍在 Tab 顺序里）。

**图标**：`Icon.vue` 把 SVG 当作 CSS `mask` 来用（`background-color: currentColor` + `mask-image: var(--icon-src)`），
所以 22 个来源不一的 SVG（有的写死 `#515151`、有的是白色描边、有的写 `currentColor`）在双主题下都变成同一支墨色剪影，
并且 `color` 规则真正生效。图标本身不再用 `<img>`：`<img>` 里的 `currentColor` 永远解析成黑色。

---

## 十、和纸纹理与打印

- 纸纹：`body::after` 一层 `feTurbulence` 噪点，`--grain-opacity` 浅色 0.022 / 深色 0.016，
  `pointer-events: none`，只在 `hover: hover` 且 `min-width: 768px` 时出现。
- 打印（`main.css` §7）：隐藏所有界面外壳与纸纹，令牌压回纯黑白，正文独占纸面，
  外部链接把地址印在括号里，代码/图表/引文不跨页断开，**未滚动到的揭示元素强制可见**。

---

## 十一、页面气质（原创性）

| 页面   | 手法                                                                                     |
| ------ | ---------------------------------------------------------------------------------------- |
| 首页   | 扉页式 Hero：眉标 + 发丝线 + 衬线大标题 + 「披花沐雪」四字印章（旋转 −7°，本地关键帧入场） |
| 归档   | 编年体：年份作粘性侧标，月份作横线小标，条目只留「日」                                    |
| 404    | 镂空数字（`-webkit-text-stroke`）+ 不依赖文字的兜底                                       |
| 正文   | 单栏 40rem，正文标题居中如扉页后收回；阅读进度是页头下缘的一条 2px 墨线                   |
| 后台   | 同一套纸墨，但更紧凑：表头小字大写、行分隔用发丝线、拖拽手柄与筛选栏不加卡片投影          |

---

## 十二、搭配建议

- **配图风格**：降低饱和度，或加 `grayscale(20%)` 滤镜。
- **图标**：跟随 `currentColor`，颜色交给上下文（正文用 `--text-secondary`，强调用主色）。
- **动画风格**：克制、平缓，避免与内容抢注意力；一条动效只讲一件事。
