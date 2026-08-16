<template>
  <div class="editor-page">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑文章' : '写文章' }}</h2>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goBack">取消</button>
        <button class="btn btn-secondary" :disabled="saving" @click="handleSaveDraft">
          保存草稿
        </button>
        <button class="btn btn-primary" :disabled="saving" @click="handlePublish">
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
              <select v-model="form.category_id" class="form-select" required>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
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
              <div class="cover-tabs">
                <button
                  class="tab-btn"
                  :class="{ active: coverMode === 'upload' }"
                  @click="coverMode = 'upload'"
                >
                  <Icon name="camera" :size="16" /> 上传
                </button>
                <button
                  class="tab-btn"
                  :class="{ active: coverMode === 'link' }"
                  @click="coverMode = 'link'"
                >
                  <Icon name="external" :size="16" /> 链接
                </button>
              </div>

              <!-- 上传模式 -->
              <div v-if="coverMode === 'upload'" class="cover-upload">
                <img
                  v-if="form.cover_image && !form.cover_image.startsWith('http')"
                  :src="form.cover_image"
                  class="cover-preview"
                />
                <div v-else class="cover-placeholder">
                  <Icon name="camera" :size="32" />
                  <span>点击上传图片</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="cover-input"
                  @change="handleCoverUpload"
                />
              </div>

              <!-- 链接模式 -->
              <div v-else class="cover-link-input">
                <input
                  v-model="form.cover_image"
                  type="text"
                  class="form-input"
                  placeholder="输入图片链接，如 https://example.com/image.jpg"
                />
                <div v-if="form.cover_image" class="cover-preview-link">
                  <img :src="form.cover_image" class="cover-preview" @error="handleImageError" />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">发布时间</label>
              <input v-model="form.published_at" type="datetime-local" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">
                <input v-model="form.is_top" type="checkbox" />
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
import { createPost, updatePost, getPostForAdmin } from '@/api/post'
import { getCategories } from '@/api/category'
import { uploadImage } from '@/api/upload'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import Icon from '@/components/Icon.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)

const loading = ref(false)
const saving = ref(false)
const categories = ref([])
const coverMode = ref('upload') // 'upload' 或 'link'

const form = ref({
  title: '',
  content: '',
  summary: '',
  cover_image: '',
  category_id: '',
  tags: '',
  is_top: false,
  status: 1,
  published_at: '',
})

function goBack() {
  router.back()
}

// 分类兜底：无论新建还是编辑历史「无分类」文章，未选择分类时默认选中「默认分类」
// （找不到名为「默认分类」的分类时退化为第一个分类）
function ensureDefaultCategory() {
  if (!form.value.category_id && categories.value.length) {
    const defaultCat = categories.value.find((c) => c.name === '默认分类') || categories.value[0]
    form.value.category_id = defaultCat.id
  }
}

async function fetchCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data.categories
    ensureDefaultCategory()
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

async function fetchPost() {
  if (!route.params.id) return

  loading.value = true
  try {
    const res = await getPostForAdmin(route.params.id)
    const post = res.data.post

    // 格式化为 datetime-local 格式（保持本地时区，避免 toISOString 转 UTC 导致偏移）
    let publishedAt = ''
    if (post.published_at) {
      const date = new Date(post.published_at)
      const pad = (n) => String(n).padStart(2, '0')
      publishedAt = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    form.value = {
      title: post.title,
      content: post.content,
      summary: post.summary || '',
      cover_image: post.cover_image || '',
      category_id: post.category_id || '',
      tags: Array.isArray(post.tags) ? [...new Set(post.tags)].join(',') : post.tags || '',
      is_top: !!post.is_top,
      status: post.status,
      published_at: publishedAt,
    }
    // 历史「无分类」文章编辑时兜底到默认分类（分类列表可能已加载）
    ensureDefaultCategory()
    // 根据封面图判断模式
    if (post.cover_image && post.cover_image.startsWith('http')) {
      coverMode.value = 'link'
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
    toast.error('上传失败: ' + (error.message || '未知错误'))
  } finally {
    // 重置 input，允许再次选择同一文件
    e.target.value = ''
  }
}

function handleImageError() {
  console.warn('图片加载失败')
}

async function handleSaveDraft() {
  form.value.status = 0
  await savePost()
}

async function handlePublish() {
  if (!form.value.title.trim()) {
    toast.warning('请输入文章标题')
    return
  }
  if (!form.value.content.trim()) {
    toast.warning('请输入文章内容')
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
      is_top: form.value.is_top ? 1 : 0,
    }

    if (isEdit.value) {
      await updatePost(route.params.id, data)
    } else {
      await createPost(data)
    }

    toast.success(isEdit.value ? '文章更新成功' : '文章创建成功')
    router.push('/admin/posts')
  } catch (error) {
    console.error('保存失败:', error)
    toast.error('保存失败: ' + (error.message || '未知错误'))
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

.cover-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.cover-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background: rgba(163, 166, 156, 0.1);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.cover-link-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.cover-preview-link {
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.cover-preview-link .cover-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .editor-page .header-actions {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;
    gap: var(--spacing-sm);
  }

  .editor-page .header-actions .btn {
    width: 100%;
    padding: 10px 6px;
    font-size: 0.9rem;
  }

  .editor-main .title-input {
    font-size: 1.2rem;
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>
