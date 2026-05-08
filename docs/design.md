# 🎨 设计规范文档

> 个人博客系统 - 玻璃拟态暗黑主题

---

## 一、设计理念

| 关键词 | 说明 |
|--------|------|
| 明亮 | 浅色背景营造清爽感 |
| 通透 | 玻璃拟态带来层次感 |
| 克制 | 留白适度，不喧宾夺主 |
| 精致 | 细节打磨，提升品质感 |

---

## 二、配色方案

### 主色调

```
┌─────────────────────────────────────────────────────────────┐
│  Primary Palette                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██ #6366F1  (Indigo-500)     主色 - 按钮、链接、强调      │
│  ██ #818CF8  (Indigo-400)     主色浅 - Hover、图标          │
│  ██ #4F46E5  (Indigo-600)     主色深 - 按钮按下状态         │
│                                                             │
│  ██ #8B5CF6  (Violet-500)     辅助色 - 渐变、光晕           │
│  ██ #A78BFA  (Violet-400)     辅助色浅 - 特殊装饰           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 背景色系

```
┌─────────────────────────────────────────────────────────────┐
│  Background Layers                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██ #FFFFFF  (纯白)           页面底层背景                  │
│  ██ #F8FAFC  (最浅)           主背景色 (Slate-50)           │
│  ██ #F1F5F9  (浅)             次级背景 (Slate-100)          │
│  ██ #E2E8F0  (中)             卡片悬停 (Slate-200)          │
│                                                             │
│  ░░ rgba(255,255,255,0.7)     玻璃背景默认                  │
│  ░░ rgba(255,255,255,0.8)     玻璃背景悬浮                  │
│  ░░ rgba(255,255,255,0.9)     玻璃背景选中                  │
│                                                             │
│  ░░ rgba(0,0,0,0.02)          微弱阴影背景                  │
│  ░░ rgba(0,0,0,0.05)          卡片背景                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 文字色系

```
┌─────────────────────────────────────────────────────────────┐
│  Text Hierarchy                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██ #0F172A  (Slate-900)      主标题、重要文字              │
│  ██ #1E293B  (Slate-800)      正文、卡片标题                │
│  ██ #334155  (Slate-700)      次要文字、描述                │
│  ██ #475569  (Slate-600)      辅助信息、时间戳              │
│  ██ #64748B  (Slate-500)      禁用状态、极弱信息            │
│  ██ #94A3B8  (Slate-400)      占位符、最弱文字              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 功能色

```
┌─────────────────────────────────────────────────────────────┐
│  Semantic Colors                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██ #22C55E  (Green-500)      成功、已发布、在线            │
│  ██ #F59E0B  (Amber-500)      警告、草稿、待处理            │
│  ██ #EF4444  (Red-500)        错误、删除、危险操作          │
│  ██ #3B82F6  (Blue-500)       信息、链接、提示              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 渐变色

```
┌─────────────────────────────────────────────────────────────┐
│  Gradients                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  文字渐变 (标题)                                            │
│  linear-gradient(135deg, #4F46E5, #7C3AED, #6366F1)        │
│                                                             │
│  背景光晕 (装饰)                                            │
│  radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%) │
│                                                             │
│  按钮渐变 (特殊按钮)                                        │
│  linear-gradient(135deg, #6366F1, #8B5CF6)                 │
│                                                             │
│  边框渐变 (卡片装饰)                                        │
│  linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、背景装饰

### 光晕效果

```css
/* 主标题光晕 */
.hero-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.06) 0%,
    rgba(139, 92, 246, 0.04) 30%,
    transparent 70%
  );
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

/* 卡片悬浮光晕 */
.card-glow {
  position: absolute;
  inset: -1px;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.1),
    rgba(139, 92, 246, 0.1)
  );
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.card:hover .card-glow {
  opacity: 1;
}
```

### 网格背景

```css
/* 科技感网格 */
.grid-background {
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* 点阵背景 */
.dot-background {
  background-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.03) 1px,
    transparent 1px
  );
  background-size: 30px 30px;
}
```

### 噪点纹理

```css
/* 微妙噪点 */
.noise-texture::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
}
```

---

## 四、间距系统

### 基础间距

```
┌─────────────────────────────────────────────────────────────┐
│  Spacing Scale                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  --spacing-xs:   4px     极小间距 (图标与文字)              │
│  --spacing-sm:   8px     小间距 (组件内部)                  │
│  --spacing-md:   16px    中间距 (组件之间)                  │
│  --spacing-lg:   24px    大间距 (区块之间)                  │
│  --spacing-xl:   32px    超大间距 (主要区块)                │
│  --spacing-2xl:  48px    巨大间距 (页面分区)                │
│  --spacing-3xl:  64px    超巨大 (Hero区域)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 垂直节奏

```
┌─────────────────────────────────────────────────────────────┐
│  页面垂直布局                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  导航栏  64px                           │               │
│  ├─────────────────────────────────────────┤               │
│  │  间距 48px                              │               │
│  ├─────────────────────────────────────────┤               │
│  │  Hero区域                               │               │
│  │  标题 + 副标题                          │               │
│  │  高度约 120-160px                       │               │
│  ├─────────────────────────────────────────┤               │
│  │  间距 32-40px (紧凑)                    │               │
│  ├─────────────────────────────────────────┤               │
│  │  内容区域                               │               │
│  │  卡片网格 / 空状态                      │               │
│  ├─────────────────────────────────────────┤               │
│  │  间距 64px                              │               │
│  ├─────────────────────────────────────────┤               │
│  │  页脚                                   │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、组件规范

### 导航栏

```css
/* 导航栏 */
.navbar {
  height: 64px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* 导航链接 - 当前状态 */
.nav-link.active {
  color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 6px 16px;
  border-radius: 8px;
  /* 不再使用下划线 */
}

/* 管理按钮 */
.admin-btn {
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.admin-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
}
```

### 文章卡片

```css
.post-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.post-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 0 40px rgba(99, 102, 241, 0.06);
}

/* 卡片封面 */
.card-cover {
  height: 200px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
}

/* 卡片标题 */
.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片摘要 */
.card-summary {
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.6;
}
```

### 空状态

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px dashed rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  text-align: center;
}

/* 空状态图标/插画 */
.empty-state-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  opacity: 0.6;
}

/* 空状态标题 */
.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 8px;
}

/* 空状态描述 */
.empty-state-desc {
  color: #64748B;
  font-size: 0.95rem;
  margin-bottom: 24px;
  max-width: 360px;
}

/* 空状态按钮 */
.empty-state-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  transition: all 0.2s ease;
}

.empty-state-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
}
```

### 按钮

```css
/* 主按钮 */
.btn-primary {
  padding: 10px 20px;
  background: #6366F1;
  color: white;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #4F46E5;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}

/* 次按钮 */
.btn-secondary {
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #1E293B;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.15);
}

/* 危险按钮 */
.btn-danger {
  padding: 10px 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #DC2626;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}
```

### 标签

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 20px;
  font-size: 0.8rem;
  color: #6366F1;
  transition: all 0.2s ease;
}

.tag:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}
```

### 分割线

```css
/* 默认分割线 */
.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
}

/* 强调分割线 */
.divider-emphasis {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(99, 102, 241, 0.2),
    transparent
  );
}
```

### 分页

```css
.pagination-btn {
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  color: #475569;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.25);
  color: #1E293B;
}

.pagination-btn.active {
  background: #6366F1;
  border-color: #6366F1;
  color: white;
}
```

---

## 六、字体排版

### 字体栈

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 
               sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

### 字号层级

```
┌─────────────────────────────────────────────────────────────┐
│  Typography Scale                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hero标题     3.5rem / 56px   font-weight: 800  行高: 1.1  │
│  页面标题     2rem   / 32px   font-weight: 700  行高: 1.2  │
│  区块标题     1.5rem / 24px   font-weight: 600  行高: 1.3  │
│  卡片标题     1.25rem/ 20px   font-weight: 600  行高: 1.4  │
│  正文         1rem   / 16px   font-weight: 400  行高: 1.6  │
│  小字         0.875rem/14px   font-weight: 400  行高: 1.5  │
│  标签         0.8rem / 12.8px font-weight: 500  行高: 1.4  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 七、圆角系统

```
┌─────────────────────────────────────────────────────────────┐
│  Border Radius                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  --radius-sm:    6px     小组件 (标签、小按钮)              │
│  --radius-md:    10px    中组件 (按钮、输入框)              │
│  --radius-lg:    16px    大组件 (卡片、模态框)              │
│  --radius-xl:    20px    特大 (空状态、特殊卡片)            │
│  --radius-full:  9999px  圆形 (头像、圆角标签)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 八、阴影系统

```css
:root {
  /* 基础阴影 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 16px 40px rgba(0, 0, 0, 0.12);
  
  /* 发光阴影 */
  --shadow-glow-sm: 0 0 16px rgba(99, 102, 241, 0.1);
  --shadow-glow-md: 0 0 24px rgba(99, 102, 241, 0.15);
  --shadow-glow-lg: 0 0 40px rgba(99, 102, 241, 0.2);
}
```

---

## 九、动效规范

### 缓动函数

```css
:root {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 时长

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

### AOS 动画配置

```javascript
AOS.init({
  duration: 800,        // 动画时长
  easing: 'ease-out',   // 缓动
  once: true,           // 只播放一次
  offset: 60,           // 触发偏移
  delay: 100            // 基础延迟
})
```

### 卡片入场动画

```
┌─────────────────────────────────────────────────────────────┐
│  卡片入场动画序列                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  卡片 1  ──────────────┐                                   │
│  卡片 2  ──────────────────────┐                           │
│  卡片 3  ────────────────────────────┐                     │
│  卡片 4  ──────────────────────────────────┐               │
│                                                             │
│  每张卡片延迟 100ms，从下方淡入上移                         │
│  初始状态: opacity: 0, translateY: 30px                     │
│  结束状态: opacity: 1, translateY: 0                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 十、响应式断点

```css
/* 移动端 */
@media (max-width: 640px) { }

/* 平板 */
@media (max-width: 768px) { }

/* 小桌面 */
@media (max-width: 1024px) { }

/* 大桌面 */
@media (min-width: 1280px) { }
```

---

## 十一、页面配色示意

### 首页布局

```
┌─────────────────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓  ✦ Blog              首页  分类  归档    [管理]  ▓▓  │ ← 玻璃导航栏
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                                             │
│                        ◐ 光晕背景                          │
│                                                             │
│                      B l o g                                │ ← 渐变大标题
│                   记录生活，分享技术                        │ ← 深灰色副标题
│                                                             │
│           ┌──────────────┐  ┌──────────────┐               │
│           │ ▓▓▓▓▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓▓▓▓▓ │               │
│           │ ▓▓▓封面图▓▓▓ │  │ ▓▓▓封面图▓▓▓ │               │ ← 玻璃卡片
│           │ ▓▓▓▓▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓▓▓▓▓ │               │
│           ├──────────────┤  ├──────────────┤               │
│           │ 分类    日期 │  │ 分类    日期 │               │
│           │ 文章标题     │  │ 文章标题     │               │
│           │ 摘要文字... │  │ 摘要文字... │               │
│           │ #标签 #标签  │  │ #标签 #标签  │               │
│           └──────────────┘  └──────────────┘               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │ ← 微弱分割线
│                                                             │
│     导航          管理                                      │
│     首页          后台登录                                  │ ← 页脚
│     归档                                                   │
│                                                             │
│           © 2024 Blog. All rights reserved.                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

颜色标注:
██ #F8FAFC  页面背景
██ #0F172A  标题文字
██ #475569  副标题/次要文字
██ #6366F1  主色调 (按钮/链接/光晕)
██ #4F46E5  主色深 (Hover)
██ rgba(255,255,255,0.8)  玻璃卡片背景
██ rgba(0,0,0,0.06)  边框/分割线
```

### 空状态

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           ┌─────────────────────────────────┐               │
│           │                                 │               │
│           │        ┌─────────────┐          │               │
│           │        │             │          │               │
│           │        │   📝 SVG    │          │               │ ← 大尺寸SVG插画
│           │        │   插画      │          │               │
│           │        │             │          │               │
│           │        └─────────────┘          │               │
│           │                                 │               │
│           │        还没有文章               │               │ ← 标题
│           │                                 │               │
│           │    开始创作你的第一篇博客吧     │               │ ← 描述文字
│           │                                 │               │
│           │      [+ 发布文章]               │               │ ← 主按钮
│           │                                 │               │
│           └─────────────────────────────────┘               │
│              ↑ 虚线边框 + 微弱背景                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 十二、CSS 变量汇总

```css
:root {
  /* 主色 */
  --color-primary: #6366F1;
  --color-primary-light: #818CF8;
  --color-primary-dark: #4F46E5;
  --color-accent: #8B5CF6;
  --color-accent-light: #A78BFA;
  
  /* 背景 */
  --bg-primary: #F8FAFC;
  --bg-secondary: #F1F5F9;
  --bg-tertiary: #E2E8F0;
  --bg-card: rgba(255, 255, 255, 0.8);
  --bg-card-hover: rgba(255, 255, 255, 0.95);
  --bg-glass: rgba(255, 255, 255, 0.7);
  --bg-glass-hover: rgba(255, 255, 255, 0.85);
  
  /* 文字 */
  --text-primary: #0F172A;
  --text-secondary: #1E293B;
  --text-muted: #475569;
  --text-disabled: #94A3B8;
  
  /* 边框 */
  --border-default: rgba(0, 0, 0, 0.06);
  --border-hover: rgba(0, 0, 0, 0.12);
  --border-active: rgba(99, 102, 241, 0.4);
  
  /* 功能色 */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #3B82F6;
}
```

---

> 📌 本文档作为博客系统的设计参考，所有组件样式应遵循此规范。
