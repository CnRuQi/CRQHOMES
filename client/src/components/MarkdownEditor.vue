<template>
  <div ref="editorRoot" class="markdown-editor">
    <MdEditorV3
      v-model="content"
      :preview="true"
      :html-preview="false"
      :sanitize="sanitizeHtml"
      :toolbars-exclude="['github', 'mermaid']"
      @on-upload-img="handleUploadImage"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import DOMPurify from 'dompurify'
import { uploadImage } from '@/api/upload'
import { useToast } from '@/composables/useToast'

const MdEditorV3 = MdEditor
const toast = useToast()
const editorRoot = ref(null)

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

// 预览 HTML 必须消毒，与前台 Post.vue 的 DOMPurify 约定保持一致（防 self-XSS）
function sanitizeHtml(html) {
  return DOMPurify.sanitize(html)
}

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

onMounted(() => {
  // CodeMirror owns the editable node, so label it after md-editor-v3 mounts.
  const root = editorRoot.value
  const input = root?.querySelector('.cm-content')
  if (input) input.setAttribute('aria-label', '文章内容')

  const toolbar = root?.querySelector('.md-editor-toolbar-wrapper')
  if (toolbar) {
    toolbar.setAttribute('tabindex', '0')
    toolbar.setAttribute('role', 'region')
    toolbar.setAttribute('aria-label', 'Markdown 编辑器工具栏')
  }
})
</script>

<style scoped>
/* ============================================================
   Markdown 编辑器：md-editor-v3 自带一套亮色皮肤，
   这里把它整体「翻译」成站点的纸与墨，而不是覆盖几个零散颜色。
   ============================================================ */
.markdown-editor {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}

/* 覆盖 md-editor-v3 的默认 CSS 变量 */
.markdown-editor :deep(.md-editor) {
  --md-bk-color: transparent !important;
  --md-color: var(--text-secondary) !important;
  --md-bk-color-outstand: var(--bg-secondary) !important;
  --md-color-selected: var(--color-primary) !important;
  --md-border-color: var(--border-hairline) !important;

  width: 100% !important;
  max-width: 100%;
  min-width: 0;
  background-color: transparent !important;
  color: var(--text-secondary) !important;
  border: none !important;
}

/* 工具栏 */
.markdown-editor :deep(.md-editor-toolbar) {
  min-width: max-content;
  background-color: var(--bg-secondary) !important;
  border-bottom: 1px solid var(--border-hairline) !important;
}

.markdown-editor :deep(.md-editor-toolbar-wrapper) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
}

.markdown-editor :deep(.md-editor-toolbar-wrapper:focus-visible) {
  outline: 3px solid var(--color-primary);
  outline-offset: -3px;
}

/* 工具栏图标 - 使用 color 属性 */
.markdown-editor :deep(.md-editor-toolbar-item) {
  flex: 0 0 auto;
  color: var(--text-secondary) !important;
  border-radius: var(--radius-xs);
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.markdown-editor :deep(.md-editor-toolbar-item:hover) {
  background-color: var(--tint-primary-weak) !important;
  color: var(--color-primary-dark) !important;
}

.markdown-editor :deep(.md-editor-toolbar-item.active) {
  background-color: var(--tint-primary) !important;
  color: var(--color-primary-dark) !important;
}

/* 修复分割线颜色 */
.markdown-editor :deep(.md-editor-toolbar-divider) {
  background-color: var(--border-color) !important;
}

/* 内容区域 */
.markdown-editor :deep(.md-editor-content) {
  width: 100%;
  min-width: 0;
  background-color: transparent !important;
}

.markdown-editor :deep(.md-editor-content-wrapper),
.markdown-editor :deep(.md-editor-input-wrapper),
.markdown-editor :deep(.md-editor-preview-wrapper) {
  min-width: 0;
}

/* 编辑区 */
.markdown-editor :deep(.md-editor-input) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  font-family: var(--font-sans);
}

/* 预览区 */
.markdown-editor :deep(.md-editor-preview-wrapper) {
  background: var(--bg-elevated) !important;
  border-left: 1px solid var(--border-hairline) !important;
}

.markdown-editor :deep(.md-editor-preview) {
  color: var(--text-secondary) !important;
  font-family: var(--font-sans);
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
  color: var(--color-primary-dark) !important;
}

.markdown-editor :deep(.md-editor-preview code) {
  background-color: var(--bg-secondary) !important;
  color: var(--text-secondary) !important;
  border-radius: var(--radius-xs);
}

.markdown-editor :deep(.md-editor-preview pre) {
  background-color: var(--bg-secondary) !important;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
}

.markdown-editor :deep(.md-editor-preview pre code) {
  background-color: transparent !important;
}

.markdown-editor :deep(.md-editor-preview blockquote) {
  background-color: var(--bg-secondary) !important;
  border-left-color: var(--color-primary) !important;
  color: var(--text-secondary) !important;
}

.markdown-editor :deep(.md-editor-preview table th) {
  background-color: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
}

.markdown-editor :deep(.md-editor-preview table td) {
  border-color: var(--border-hairline) !important;
}

.markdown-editor :deep(.md-editor-preview img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

.markdown-editor :deep(.md-editor-preview hr) {
  border-color: var(--border-color) !important;
}

/* 滚动条样式 */
.markdown-editor :deep(.md-editor-input::-webkit-scrollbar),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.markdown-editor :deep(.md-editor-input::-webkit-scrollbar-thumb),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar-thumb) {
  background: color-mix(in srgb, var(--text-disabled) 45%, transparent);
  border-radius: var(--radius-xs);
}

.markdown-editor :deep(.md-editor-input::-webkit-scrollbar-track),
.markdown-editor :deep(.md-editor-preview-wrapper::-webkit-scrollbar-track) {
  background: transparent;
}

@media (max-width: 768px) {
  .markdown-editor :deep(.md-editor-content-wrapper) {
    flex-direction: column;
  }

  .markdown-editor :deep(.md-editor-input-wrapper),
  .markdown-editor :deep(.md-editor-preview-wrapper) {
    width: 100% !important;
    flex: 1 1 50%;
  }

  .markdown-editor :deep(.md-editor-preview-wrapper) {
    border-top: 1px solid var(--border-hairline) !important;
    border-left: none !important;
  }
}
</style>
