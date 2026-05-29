# 新增 Vue 组件

> 步骤化的任务指南，AI Agent 可按此流程执行。

---

## 前置条件
- 明确组件的用途、Props、Events
- 确定是页面组件（views）还是通用组件（components）

---

## 步骤

### 1. 确定组件类型

| 类型 | 位置 | 用途 |
|------|------|------|
| 页面组件 | `client/src/views/` | 一个路由对应一个页面 |
| 通用组件 | `client/src/components/` | 可复用的 UI 组件 |
| 后台页面 | `client/src/views/admin/` | 后台管理页面 |

### 2. 创建组件文件

```vue
<!-- client/src/components/MyComponent.vue -->
<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['update', 'delete'])

// 状态
const loading = ref(false)

// 计算属性
const displayTitle = computed(() => props.title.toUpperCase())

// 方法
function handleClick() {
  emit('update', { id: 1 })
}
</script>

<template>
  <div class="my-component">
    <h2>{{ displayTitle }}</h2>
    <p>Count: {{ count }}</p>
    <button @click="handleClick" :disabled="loading">
      {{ loading ? '处理中...' : '点击' }}
    </button>
  </div>
</template>

<style scoped>
.my-component {
  padding: 16px;
}
</style>
```

### 3. 注册路由（如果是页面组件）

在 `client/src/router/index.js` 中添加：

```javascript
{
  path: '/my-page',
  name: 'MyPage',
  component: () => import('@/views/MyPage.vue'),
  meta: { title: '我的页面' }
}
```

### 4. 使用组件

在父组件中引入使用：

```vue
<script setup>
import MyComponent from '@/components/MyComponent.vue'
</script>

<template>
  <MyComponent title="Hello" :count="5" @update="handleUpdate" />
</template>
```

---

## 组件规范

| 规则 | 说明 |
|------|------|
| 使用 `<script setup>` | 不用 Options API |
| Props 声明类型 | 使用 `defineProps` 并声明类型和默认值 |
| 禁用 `v-html` | 防 XSS，使用文本绑定 `{{ }}` |
| Scoped 样式 | 默认使用 `<style scoped>` |
| 组件名多单词 | 避免与 HTML 元素冲突 |

---

## 检查清单

- [ ] 使用 `<script setup>` 语法
- [ ] Props 有类型声明和默认值
- [ ] 没有使用 `v-html`
- [ ] 样式使用 `scoped`
- [ ] 组件名是多单词（PascalCase）
- [ ] 事件命名清晰（`update:modelValue`）
