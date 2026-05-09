# 🎨 设计规范文档

> 个人博客系统 - 「枯木冷茶」(Zen Wood) 配色方案

---

## 一、设计理念

| 关键词 | 说明 |
|--------|------|
| 虚怀 | 中性克制，不喧宾夺主 |
| 禅意 | 安静感，如书房或茶室 |
| 专注 | 让读者注意力集中在文字 |
| 耐看 | 高级感，持久不厌倦 |

---

## 二、配色方案

### 核心色板

```
┌─────────────────────────────────────────────────────────────┐
│  Zen Wood Core                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██ #A3A69C  (枯叶茶)         主色 - 按钮、激活态、重点强调   │
│  ██ #C4C6BF  (苍石灰)         辅助色 - 图标、特殊边框         │
│  ██ #82857C  (冷茶深)         深色态 - 按钮按下、深度交互     │
│                                                             │
│  ██ #DEDFD9  (浅檀香)         极浅装饰色 - 背景光晕           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 背景层级

```
┌─────────────────────────────────────────────────────────────┐
│  Paper & Stone Layers                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██ #F5F5F3  (宣纸白)         页面底层背景 (微暖的灰白)      │
│  ██ #EBEBE8  (洗砚灰)         次级背景 / 侧边栏              │
│                                                             │
│  ░░ rgba(255, 255, 255, 0.6)  玻璃背景默认 (透明和纸感)      │
│  ░░ rgba(245, 245, 243, 0.8)  玻璃背景悬浮                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 文字层级

```
┌─────────────────────────────────────────────────────────────┐
│  Ink & Charcoal                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██ #383936  (玄炭色)         主标题、重要正文 (非纯黑)       │
│  ██ #575954  (深苔褐)         次要文字、卡片描述              │
│  ██ #888A83  (冷烟灰)         占位符、页脚辅助文字            │
│  ██ #B5B7B0  (薄雾灰)         禁用状态、微弱标注              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 功能色

```
┌─────────────────────────────────────────────────────────────┐
│  Semantic Colors (降噪处理)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██ #9BA38E  (墨绿)           成功、已发布、在线              │
│  ██ #C7B38D  (沉香黄)         警告、草稿、待处理              │
│  ██ #B38F8F  (绛红)           错误、删除、危险操作            │
│  ██ #8FA1B3  (远山蓝)         信息、链接、提示                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、字体规范

### 字体组合

```
┌─────────────────────────────────────────────────────────────┐
│  Typography - 宋体 + 黑体                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  标题字体    Playfair Display + Noto Serif SC               │
│              优雅衬线体，文人气韵                            │
│                                                             │
│  正文字体    Source Sans 3 + Noto Sans SC                   │
│              清晰无衬线体，阅读舒适                          │
│                                                             │
│  代码字体    JetBrains Mono                                 │
│              现代等宽体                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 字体加载

使用国内镜像加速加载：
```html
<link href="https://fonts.loli.net/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

## 四、和纸纹理

枯木色系适合加入颗粒感，让网页看起来像触感温润的纸张。

```css
/* 为 Body 添加微小的纸质纤维感 */
body::before {
  content: "";
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
}
```

---

## 五、按钮规范

摒弃发光阴影，回归沉稳的实体投影。

```css
.btn-zen {
  background-color: var(--color-primary);
  color: white;
  border: 1px solid var(--color-primary-dark);
  box-shadow: var(--shadow-btn);
  transition: all 0.3s ease;
}

.btn-zen:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(1px);
  box-shadow: none;
}
```

---

## 六、CSS 变量汇总

```css
:root {
  /* 主色调 - 枯木冷茶 */
  --color-primary: #A3A69C;
  --color-primary-light: #C4C6BF;
  --color-primary-dark: #82857C;
  --color-accent: #DEDFD9;
  
  /* 背景 - 宣纸/洗砚 */
  --bg-primary: #F5F5F3;
  --bg-secondary: #EBEBE8;
  --bg-tertiary: #E0E0DD;
  --bg-card: rgba(255, 255, 255, 0.65);
  --bg-card-hover: rgba(255, 255, 255, 0.9);
  --bg-glass: rgba(255, 255, 255, 0.6);
  --bg-glass-hover: rgba(245, 245, 243, 0.8);
  
  /* 文字 - 墨色系 */
  --text-primary: #383936;
  --text-secondary: #575954;
  --text-muted: #888A83;
  --text-disabled: #B5B7B0;
  
  /* 边框 */
  --border-default: rgba(163, 166, 156, 0.2);
  --border-hover: rgba(163, 166, 156, 0.4);
  --border-active: rgba(163, 166, 156, 0.6);

  /* 功能色 */
  --color-success: #9BA38E;
  --color-warning: #C7B38D;
  --color-danger: #B38F8F;
  --color-info: #8FA1B3;
}
```

---

## 七、搭配建议

- **配图风格**：降低饱和度，或加 `grayscale(20%)` 滤镜
- **图标建议**：线条稍粗（2px），颜色使用 `--text-secondary`
- **动画风格**：克制、平缓，避免过于花哨的效果
