<template>
  <div class="editor-page">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? '编辑文章' : '写文章' }}</h1>
      <div class="header-actions">
        <button type="button" class="btn btn-secondary" @click="goBack">取消</button>
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="handleSaveDraft">
          保存草稿
        </button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="handlePublish">
          {{ saving ? '保存中...' : '发布' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading" role="status" aria-label="加载中">
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
              aria-label="文章标题"
            />
          </div>

          <div class="form-group">
            <MarkdownEditor v-model="form.content" />
          </div>
        </div>

        <div class="editor-sidebar">
          <div class="sidebar-card">
            <h2 class="card-title">文章设置</h2>

            <div class="form-group">
              <label for="post-category" class="form-label">分类</label>
              <select id="post-category" v-model="form.category_id" class="form-select" required>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="post-tags" class="form-label">标签</label>
              <input
                id="post-tags"
                v-model="form.tags"
                type="text"
                class="form-input"
                placeholder="多个标签用逗号分隔"
              />
            </div>

            <div class="form-group">
              <label for="post-summary" class="form-label">摘要</label>
              <textarea
                id="post-summary"
                v-model="form.summary"
                class="form-textarea"
                placeholder="文章摘要（选填）"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <span id="post-cover-label" class="form-label">封面图</span>
              <div class="cover-tabs">
                <button
                  type="button"
                  class="tab-btn"
                  :class="{ active: coverMode === 'upload' }"
                  :aria-pressed="coverMode === 'upload'"
                  @click="coverMode = 'upload'"
                >
                  <Icon name="camera" :size="16" /> 上传
                </button>
                <button
                  type="button"
                  class="tab-btn"
                  :class="{ active: coverMode === 'link' }"
                  :aria-pressed="coverMode === 'link'"
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
                  alt="封面预览"
                  class="cover-preview"
                />
                <div v-else class="cover-placeholder">
                  <Icon name="camera" :size="32" />
                  <span>点击上传图片</span>
                </div>
                <input
                  id="post-cover-upload"
                  type="file"
                  accept="image/*"
                  class="cover-input"
                  aria-label="上传封面图"
                  @change="handleCoverUpload"
                />
              </div>

              <!-- 链接模式 -->
              <div v-else class="cover-link-input">
                <input
                  id="post-cover-url"
                  v-model="form.cover_image"
                  type="text"
                  class="form-input"
                  aria-labelledby="post-cover-label"
                  placeholder="输入图片链接，如 https://example.com/image.jpg"
                />
                <div v-if="form.cover_image" class="cover-preview-link">
                  <img
                    :src="form.cover_image"
                    alt="封面预览"
                    class="cover-preview"
                    @error="handleImageError"
                  />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="post-published-at" class="form-label">发布时间</label>
              <input
                id="post-published-at"
                v-model="form.published_at"
                type="datetime-local"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <div class="form-check">
                <input id="post-is-top" v-model="form.is_top" type="checkbox" />
                <label for="post-is-top" class="form-label">置顶文章</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { createPost, updatePost, getPostForAdmin } from '@/api/post'
import { getCategories } from '@/api/category'
import { uploadImage } from '@/api/upload'
import Icon from '@/components/Icon.vue'
import { useToast } from '@/composables/useToast'

const MarkdownEditor = defineAsyncComponent(() => import('@/components/MarkdownEditor.vue'))

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)

const loading = ref(false)
const saving = ref(false)
const dirty = ref(false) // 是否有未保存修改
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

// 表单任一字段变化即标记未保存（必须在 form 定义之后）
watch(
  form,
  () => {
    dirty.value = true
  },
  { deep: true }
)

function goBack() {
  // 无历史记录（刷新后直接访问编辑页）时回文章列表
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/admin/posts')
  }
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
    // 会话过期时用户在拦截器里点了「取消」：留在当前页，让用户自行处理（如复制内容）
    if (error?.code === 401) return
    toast.error('文章不存在或加载失败')
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
  if (!form.value.title.trim()) {
    toast.warning('请输入文章标题')
    return
  }
  // 已发布文章转草稿会让文章立即下线，需明确确认。
  // 发布时间不再被清除（服务端保留原值，转回发布态时恢复），所以提示里不再提这一条
  if (isEdit.value && form.value.status === 1) {
    const confirmed = window.confirm('已发布的文章转为草稿后会立即下线。确定继续吗？')
    if (!confirmed) return
  }
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
  if (saving.value) return // 防止双击重复提交
  saving.value = true
  const saveLocation = route.fullPath
  try {
    // datetime-local 给的是「本地时间、无时区」串（如 2026-08-29T22:30）。
    // 直接提交会让服务端按服务器自己的时区去解析，跨时区部署就会整体偏移。
    // 这里先转成带时区的 ISO 串，服务端才能还原成用户选定的那个时刻
    const publishedAt = form.value.published_at
      ? new Date(form.value.published_at).toISOString()
      : ''

    const data = {
      ...form.value,
      is_top: form.value.is_top ? 1 : 0,
      published_at: publishedAt,
    }

    if (isEdit.value) {
      await updatePost(route.params.id, data)
    } else {
      await createPost(data)
    }

    toast.success(isEdit.value ? '文章更新成功' : '文章创建成功')
    dirty.value = false
    saving.value = false
    if (route.fullPath === saveLocation) router.push('/admin/posts')
  } catch (error) {
    console.error('保存失败:', error)
    toast.error('保存失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.allSettled([fetchCategories(), fetchPost()])
  // 加载回填（含默认分类兜底）不算用户修改
  dirty.value = false
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 路由离开拦截（含「取消」按钮与侧边栏切换）
onBeforeRouteLeave((to, from, next) => {
  if (saving.value && to.path !== '/admin/login') {
    next(false)
    return
  }
  if (!dirty.value || to.path === '/admin/login') {
    next()
    return
  }
  if (window.confirm('当前编辑内容尚未保存，确定离开吗？')) {
    next()
  } else {
    next(false)
  }
})

// 关闭标签页/刷新提示
function handleBeforeUnload(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = ''
}
</script>

<style scoped>
/* ============================================================
   写文章：标题用衬线字直接写在纸面上（无框、只留一条底线），
   让「写作」本身成为页面里最显眼的一件事。
   ============================================================ */
.editor-page {
  max-width: var(--max-width-wide);
  min-width: 0;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-width: 0;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20rem;
  gap: var(--space-6);
  align-items: start;
}

.editor-main,
.editor-sidebar,
.sidebar-card {
  min-width: 0;
}

/* ---------- 标题：只有一条底线 ---------- */
.title-input {
  width: 100%;
  min-width: 0;
  padding: var(--space-3) 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-color);
  border-radius: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  transition: border-color var(--dur-normal) var(--ease-standard);
}

.title-input:focus {
  border-bottom-color: var(--color-primary);
}

.title-input::placeholder {
  color: var(--text-disabled);
  font-weight: var(--weight-regular);
}

/* ---------- 侧栏设置 ---------- */
.sidebar-card {
  position: sticky;
  top: calc(var(--header-height) + var(--space-6));
  padding: var(--space-5);
  background: var(--bg-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}

.card-title {
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-hairline);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-md);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
}

/* ---------- 封面上传 ---------- */
.cover-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.tab-btn {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--fs-micro);
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.tab-btn:hover {
  background: var(--tint-primary-weak);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--on-primary);
}

.cover-upload {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease-standard);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  height: 100%;
  color: var(--text-disabled);
  font-size: var(--fs-micro);
}

.cover-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.cover-link-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cover-preview-link {
  overflow: hidden;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
}

.cover-preview-link .cover-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .sidebar-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .editor-page .header-actions {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2);
  }

  .editor-page .header-actions .btn {
    width: 100%;
    min-width: 0;
    padding: var(--space-2) var(--space-3);
    font-size: var(--fs-micro);
  }

  .editor-page .header-actions .btn:last-child {
    grid-column: 1 / -1;
  }

  .editor-main .title-input {
    font-size: var(--fs-xl);
    padding: var(--space-2) 0;
  }
}
</style>
