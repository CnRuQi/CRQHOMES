<template>
  <div class="markdown-editor">
    <MdEditorV3
      v-model="content"
      :preview="true"
      :htmlPreview="true"
      :toolbarsExclude="['github', 'mermaid']"
      @onUploadImg="handleUploadImage"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { uploadImage } from '@/api/upload'

const MdEditorV3 = MdEditor

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const content = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

async function handleUploadImage(files, callback) {
  const res = await Promise.all(
    files.map(async (file) => {
      const res = await uploadImage(file)
      return res.data.url
    })
  )
  callback(res)
}
</script>

<style scoped>
.markdown-editor {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: var(--bg-card);
}

/* 覆盖 md-editor-v3 的默认 CSS 变量 */
.markdown-editor :deep(.md-editor) {
  --md-bk-color: transparent !important;
  --md-color: #5C6055 !important;
  --md-bk-color-outstand: rgba(255, 252, 248, 0.8) !important;
  --md-color-selected: #96A48B !important;
  --md-border-color: rgba(150, 164, 138, 0.15) !important;
  
  background-color: transparent !important;
  color: #5C6055 !important;
  border: none !important;
}

/* 工具栏 - 燕麦色背景 */
.markdown-editor :deep(.md-editor-toolbar) {
  background-color: rgba(255, 252, 248, 0.8) !important;
  border-bottom: 1px solid rgba(150, 164, 138, 0.15) !important;
  backdrop-filter: blur(10px);
}

/* 工具栏图标 - 使用 color 属性（currentColor） */
.markdown-editor :deep(.md-editor-toolbar-item) {
  color: #5C6055 !important;
  transition: all 0.2s ease;
}

.markdown-editor :deep(.md-editor-toolbar-item:hover) {
  color: #96A48B !important;
  background-color: rgba(150, 164, 138, 0.1) !important;
  border-radius: 6px;
}

.markdown-editor :deep(.md-editor-toolbar-item.active) {
  color: #96A48B !important;
  background-color: rgba(150, 164, 138, 0.15) !important;
}

/* 修复分割线颜色 */
.markdown-editor :deep(.md-editor-toolbar-divider) {
  background-color: rgba(150, 164, 138, 0.2) !important;
}

/* 内容区域 */
.markdown-editor :deep(.md-editor-content) {
  background-color: transparent !important;
}

/* 编辑区 */
.markdown-editor :deep(.md-editor-input) {
  color: #3D4035 !important;
  background-color: transparent !important;
  font-family: var(--font-sans);
}

/* 预览区 */
.markdown-editor :deep(.md-editor-preview-wrapper) {
  border-left: 1px solid rgba(150, 164, 138, 0.15) !important;
  background: rgba(255, 255, 255, 0.4) !important;
}

.markdown-editor :deep(.md-editor-preview) {
  color: #5C6055 !important;
}

.markdown-editor :deep(.md-editor-preview h1),
.markdown-editor :deep(.md-editor-preview h2),
.markdown-editor :deep(.md-editor-preview h3) {
  color: #3D4035 !important;
}

.markdown-editor :deep(.md-editor-preview h1) {
  border-bottom-color: rgba(150, 164, 138, 0.2) !important;
}

.markdown-editor :deep(.md-editor-preview a) {
  color: #7B8B6F !important;
}

.markdown-editor :deep(.md-editor-preview code) {
  background-color: rgba(150, 164, 138, 0.1) !important;
  color: #5C6055 !important;
  border-radius: 4px;
}

.markdown-editor :deep(.md-editor-preview pre) {
  background-color: rgba(150, 164, 138, 0.08) !important;
  border-radius: 8px;
  border: 1px solid rgba(150, 164, 138, 0.15);
}

.markdown-editor :deep(.md-editor-preview pre code) {
  background-color: transparent !important;
}

.markdown-editor :deep(.md-editor-preview blockquote) {
  border-left-color: #96A48B !important;
  background-color: rgba(150, 164, 138, 0.05) !important;
  color: #8D948D !important;
}

.markdown-editor :deep(.md-editor-preview table th) {
  background-color: rgba(240, 235, 229, 0.8) !important;
  color: #3D4035 !important;
}

.markdown-editor :deep(.md-editor-preview table td) {
  border-color: rgba(150, 164, 138, 0.15) !important;
}

.markdown-editor :deep(.md-editor-preview img) {
  border-radius: 8px;
  max-width: 100%;
}

.markdown-editor :deep(.md-editor-preview hr) {
  border-color: rgba(150, 164, 138, 0.2) !important;
}

/* 滚动条样式 */
.markdown-editor :deep(.md-editor-input::-webkit-scrollbar),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.markdown-editor :deep(.md-editor-input::-webkit-scrollbar-thumb),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar-thumb) {
  background: rgba(150, 164, 138, 0.3);
  border-radius: 3px;
}

.markdown-editor :deep(.md-editor-input::-webkit-scrollbar-track),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar-track) {
  background: transparent;
}
</style>
