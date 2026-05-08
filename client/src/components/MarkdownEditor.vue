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
  border-radius: var(--border-radius);
  overflow: hidden;
}

.markdown-editor :deep(.md-editor) {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.markdown-editor :deep(.md-editor-toolbar) {
  background-color: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid var(--border-color);
}

.markdown-editor :deep(.md-editor-toolbar-item) {
  color: var(--text-secondary);
}

.markdown-editor :deep(.md-editor-toolbar-item:hover) {
  color: var(--text-primary);
  background-color: rgba(99, 102, 241, 0.2);
}

.markdown-editor :deep(.md-editor-content) {
  background-color: var(--bg-secondary);
}

.markdown-editor :deep(.md-editor-input) {
  color: var(--text-primary);
  background-color: var(--bg-secondary);
}

.markdown-editor :deep(.md-editor-preview) {
  background-color: var(--bg-secondary);
}

.markdown-editor :deep(.md-editor-preview-wrapper) {
  border-left: 1px solid var(--border-color);
}

.markdown-editor :deep(.md-editor-preview) {
  color: var(--text-primary);
}

.markdown-editor :deep(.md-editor-preview h1),
.markdown-editor :deep(.md-editor-preview h2),
.markdown-editor :deep(.md-editor-preview h3) {
  color: var(--text-primary);
}

.markdown-editor :deep(.md-editor-preview a) {
  color: var(--color-primary-light);
}

.markdown-editor :deep(.md-editor-preview code) {
  background-color: rgba(99, 102, 241, 0.2);
  color: var(--text-primary);
}

.markdown-editor :deep(.md-editor-preview pre) {
  background-color: rgba(0, 0, 0, 0.3);
}

.markdown-editor :deep(.md-editor-preview blockquote) {
  border-left-color: var(--color-primary);
  background-color: var(--bg-glass);
}

.markdown-editor :deep(.md-editor-preview table th) {
  background-color: rgba(15, 23, 42, 0.8);
}

.markdown-editor :deep(.md-editor-preview table td) {
  border-color: var(--border-color);
}
</style>
