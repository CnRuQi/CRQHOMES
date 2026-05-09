<template>
  <div class="editor-page">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑文章' : '写文章' }}</h2>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goBack">取消</button>
        <button class="btn btn-secondary" @click="handleSaveDraft" :disabled="saving">
          保存草稿
        </button>
        <button class="btn btn-primary" @click="handlePublish" :disabled="saving">
          {{ saving ? '保存中...' : '发布' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div class="editor-layout">
        <div class="editor-main">
          <div class="form-group">
            <input
              v-model="form.title"
              type="text"
              class="title-input"
              placeholder="请输入文章标题"
            />
          </div>

          <div class="form-group">
            <MarkdownEditor v-model="form.content" />
          </div>
        </div>

        <div class="editor-sidebar">
          <div class="sidebar-card glass-card">
            <h3 class="card-title">文章设置</h3>

            <div class="form-group">
              <label class="form-label">分类</label>
              <select v-model="form.category_id" class="form-select">
                <option value="">无分类</option>
                <option
                  v-for="cat in categories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">标签</label>
              <input
                v-model="form.tags"
                type="text"
                class="form-input"
                placeholder="多个标签用逗号分隔"
              />
            </div>

            <div class="form-group">
              <label class="form-label">摘要</label>
              <textarea
                v-model="form.summary"
                class="form-textarea"
                placeholder="文章摘要（选填）"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">封面图</label>
              <div class="cover-upload">
                <img
                  v-if="form.cover_image"
                  :src="form.cover_image"
                  class="cover-preview"
                />
                <div v-else class="cover-placeholder">
                  <Icon name="camera" :size="32" />
                  <span>点击上传</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="cover-input"
                  @change="handleCoverUpload"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <input
                  v-model="form.is_top"
                  type="checkbox"
                />
                置顶文章
              </label>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPost, updatePost, getPost } from '@/api/post'
import { getCategories } from '@/api/category'
import { uploadImage } from '@/api/upload'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)

const loading = ref(false)
const saving = ref(false)
const categories = ref([])

const form = ref({
  title: '',
  content: '',
  summary: '',
  cover_image: '',
  category_id: '',
  tags: '',
  is_top: false,
  status: 1
})

function goBack() {
  router.back()
}

async function fetchCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data.categories
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

async function fetchPost() {
  if (!route.params.id) return

  loading.value = true
  try {
    const res = await getPost(route.params.id)
    const post = res.data.post
    form.value = {
      title: post.title,
      content: post.content,
      summary: post.summary || '',
      cover_image: post.cover_image || '',
      category_id: post.category_id || '',
      tags: Array.isArray(post.tags) ? post.tags.join(',') : (post.tags || ''),
      is_top: !!post.is_top,
      status: post.status
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    router.push('/admin/posts')
  } finally {
    loading.value = false
  }
}

async function handleCoverUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  try {
    const res = await uploadImage(file)
    form.value.cover_image = res.data.url
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败: ' + (error.message || '未知错误'))
  }
}

async function handleSaveDraft() {
  form.value.status = 0
  await savePost()
}

async function handlePublish() {
  if (!form.value.title.trim()) {
    alert('请输入文章标题')
    return
  }
  if (!form.value.content.trim()) {
    alert('请输入文章内容')
    return
  }

  form.value.status = 1
  await savePost()
}

async function savePost() {
  saving.value = true
  try {
    const data = {
      ...form.value,
      is_top: form.value.is_top ? 1 : 0
    }

    if (isEdit.value) {
      await updatePost(route.params.id, data)
    } else {
      await createPost(data)
    }

    router.push('/admin/posts')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchCategories()
  fetchPost()
})
</script>

<style scoped>
.editor-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--spacing-xl);
}

.title-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  transition: border-color var(--transition-fast);
}

.title-input:focus {
  border-color: var(--color-primary);
}

.title-input::placeholder {
  color: var(--text-muted);
}

.sidebar-card {
  padding: var(--spacing-lg);
  position: sticky;
  top: calc(var(--header-height) + var(--spacing-xl));
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.cover-upload {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.cover-upload:hover {
  border-color: var(--color-primary);
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--text-muted);
}

.cover-placeholder span:first-child {
  font-size: 2rem;
}

.cover-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-card {
    position: static;
  }
}
</style>
