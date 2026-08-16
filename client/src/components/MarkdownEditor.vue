<template>
  <div class="markdown-editor">
    <MdEditorV3
      v-model="content"
      :preview="true"
      :html-preview="false"
      :toolbars-exclude="['github', 'mermaid']"
      @on-upload-img="handleUploadImage"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { uploadImage } from '@/api/upload'
import { useToast } from '@/composables/useToast'

const MdEditorV3 = MdEditor
const toast = useToast()

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const content = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

async function handleUploadImage(files, callback) {
  try {
    // 逐文件捕获错误，单文件失败不影响其他文件
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const res = await uploadImage(file)
          return res.data.url
        } catch (error) {
          console.error('图片上传失败:', error)
          return null
        }
      })
    )

    const urls = results.filter(Boolean)
    if (urls.length < files.length) {
      toast.error('部分图片上传失败，请重试')
    }
    // 始终调用 callback，避免编辑器上传 loading 状态卡死
    callback(urls)
  } catch (_error) {
    toast.error('图片上传失败，请重试')
    callback([])
  }
}
</script>

<style scoped>
.markdown-editor {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(163, 166, 156, 0.15);
}

/* 覆盖 md-editor-v3 的默认 CSS 变量 */
.markdown-editor :deep(.md-editor) {
  --md-bk-color: transparent !important;
  --md-color: var(--text-secondary) !important;
  --md-bk-color-outstand: var(--bg-secondary) !important;
  --md-color-selected: var(--color-primary) !important;
  --md-border-color: var(--border-color) !important;

  background-color: transparent !important;
  color: var(--text-secondary) !important;
  border: none !important;
}

/* 工具栏 - 宣纸色背景 */
.markdown-editor :deep(.md-editor-toolbar) {
  background-color: var(--bg-secondary) !important;
  border-bottom: 1px solid var(--border-color) !important;
}

/* 工具栏图标 - 使用 color 属性 */
.markdown-editor :deep(.md-editor-toolbar-item) {
  color: var(--text-secondary) !important;
  transition: all 0.2s ease;
}

.markdown-editor :deep(.md-editor-toolbar-item:hover) {
  color: var(--text-muted) !important;
  background-color: rgba(163, 166, 156, 0.1) !important;
  border-radius: 6px;
}

.markdown-editor :deep(.md-editor-toolbar-item.active) {
  color: var(--text-muted) !important;
  background-color: rgba(163, 166, 156, 0.15) !important;
}

/* 修复分割线颜色 */
.markdown-editor :deep(.md-editor-toolbar-divider) {
  background-color: var(--border-color) !important;
}

/* 内容区域 */
.markdown-editor :deep(.md-editor-content) {
  background-color: transparent !important;
}

/* 编辑区 */
.markdown-editor :deep(.md-editor-input) {
  color: var(--text-primary) !important;
  background-color: transparent !important;
  font-family: var(--font-sans);
}

/* 预览区 */
.markdown-editor :deep(.md-editor-preview-wrapper) {
  border-left: 1px solid var(--border-color) !important;
  background: rgba(255, 255, 255, 0.4) !important;
}

.markdown-editor :deep(.md-editor-preview) {
  color: var(--text-secondary) !important;
}

.markdown-editor :deep(.md-editor-preview h1),
.markdown-editor :deep(.md-editor-preview h2),
.markdown-editor :deep(.md-editor-preview h3) {
  color: var(--text-primary) !important;
}

.markdown-editor :deep(.md-editor-preview h1) {
  border-bottom-color: var(--border-color) !important;
}

.markdown-editor :deep(.md-editor-preview a) {
  color: var(--text-muted) !important;
}

.markdown-editor :deep(.md-editor-preview code) {
  background-color: rgba(163, 166, 156, 0.1) !important;
  color: var(--text-secondary) !important;
  border-radius: 4px;
}

.markdown-editor :deep(.md-editor-preview pre) {
  background-color: rgba(163, 166, 156, 0.06) !important;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.markdown-editor :deep(.md-editor-preview pre code) {
  background-color: transparent !important;
}

.markdown-editor :deep(.md-editor-preview blockquote) {
  border-left-color: var(--color-primary) !important;
  background-color: rgba(163, 166, 156, 0.05) !important;
  color: var(--text-disabled) !important;
}

.markdown-editor :deep(.md-editor-preview table th) {
  background-color: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
}

.markdown-editor :deep(.md-editor-preview table td) {
  border-color: var(--border-color) !important;
}

.markdown-editor :deep(.md-editor-preview img) {
  border-radius: 8px;
  max-width: 100%;
}

.markdown-editor :deep(.md-editor-preview hr) {
  border-color: rgba(163, 166, 156, 0.15) !important;
}

/* 滚动条样式 */
.markdown-editor :deep(.md-editor-input::-webkit-scrollbar),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.markdown-editor :deep(.md-editor-input::-webkit-scrollbar-thumb),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar-thumb) {
  background: rgba(163, 166, 156, 0.25);
  border-radius: 3px;
}

.markdown-editor :deep(.md-editor-input::-webkit-scrollbar-track),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar-track) {
  background: transparent;
}
</style>
