<template>
  <div class="categories-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <button ref="createButtonRef" type="button" class="btn btn-primary" @click="openCreateModal">
        <Icon name="add" :size="18" /> 新建分类
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <p v-if="loadError" class="load-error" role="alert">分类加载失败，请稍后重试</p>

      <template v-else>
        <div class="categories-grid">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-card glass-card"
            data-aos="fade-up"
          >
            <div class="category-info">
              <h3 class="category-name">{{ category.name }}</h3>
              <p class="category-slug">{{ category.slug }}</p>
              <p v-if="category.description" class="category-desc">
                {{ category.description }}
              </p>
              <div class="category-meta">
                <span class="post-count">{{ category.post_count || 0 }} 篇文章</span>
              </div>
            </div>
            <div class="category-actions">
              <button class="btn btn-sm btn-secondary" @click="editCategory(category, $event)">
                编辑
              </button>
              <button class="btn btn-sm btn-danger" @click="handleDelete(category)">删除</button>
            </div>
          </div>
        </div>

        <EmptyState v-if="!categories.length" icon="folder" text="暂无分类" glass>
          <button type="button" class="btn btn-primary mt-md" @click="openCreateModal">
            创建第一个分类
          </button>
        </EmptyState>
      </template>
    </template>

    <!-- 模态框 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div
            ref="modalRef"
            class="modal glass-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            <div class="modal-header">
              <h3 id="category-modal-title">
                {{ editingCategory ? '编辑分类' : '新建分类' }}
              </h3>
              <button
                type="button"
                class="close-btn"
                aria-label="关闭"
                :disabled="submitting"
                @click="closeModal"
              >
                ✕
              </button>
            </div>

            <form class="modal-body" @submit.prevent="handleSubmit">
              <div class="form-group">
                <label for="category-name" class="form-label">分类名称 *</label>
                <input
                  id="category-name"
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  placeholder="请输入分类名称"
                  required
                />
              </div>

              <div class="form-group">
                <label for="category-slug" class="form-label">分类别名 *</label>
                <input
                  id="category-slug"
                  v-model="form.slug"
                  type="text"
                  class="form-input"
                  placeholder="用于URL，如：tech"
                  required
                />
              </div>

              <div class="form-group">
                <label for="category-description" class="form-label">描述</label>
                <textarea
                  id="category-description"
                  v-model="form.description"
                  class="form-textarea"
                  placeholder="分类描述（选填）"
                  rows="3"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="category-sort" class="form-label">排序</label>
                <input
                  id="category-sort"
                  v-model.number="form.sort"
                  type="number"
                  class="form-input"
                  placeholder="数字越小越靠前"
                />
              </div>

              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  :disabled="submitting"
                  @click="closeModal"
                >
                  取消
                </button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  {{ submitting ? '保存中...' : '保存' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'
import { setBodyScrollLock } from '@/assets/js/utils'
import Icon from '@/components/Icon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const loading = ref(false)
const loadError = ref(false)
const categories = ref([])
const showModal = ref(false)
const submitting = ref(false)
const editingCategory = ref(null)
const modalRef = ref(null)
const createButtonRef = ref(null)
let modalOpener = null

const form = ref({
  name: '',
  slug: '',
  description: '',
  sort: 0,
})

async function fetchCategories() {
  loading.value = true
  loadError.value = false
  try {
    const res = await getCategories()
    categories.value = res.data.categories
  } catch (error) {
    console.error('获取分类失败:', error)
    loadError.value = true
    toast.error('加载分类失败')
  } finally {
    loading.value = false
  }
}

function openCreateModal(event) {
  if (submitting.value) return
  modalOpener = event?.currentTarget || document.activeElement
  editingCategory.value = null
  form.value = { name: '', slug: '', description: '', sort: 0 }
  showModal.value = true
}

function editCategory(category, event) {
  if (submitting.value) return
  modalOpener = event?.currentTarget || document.activeElement
  editingCategory.value = category
  form.value = {
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    sort: category.sort || 0,
  }
  showModal.value = true
}

function closeModal() {
  if (submitting.value) return
  showModal.value = false
  editingCategory.value = null
  form.value = {
    name: '',
    slug: '',
    description: '',
    sort: 0,
  }
}

async function handleSubmit() {
  submitting.value = true
  const isEdit = !!editingCategory.value
  try {
    if (isEdit) {
      await updateCategory(editingCategory.value.id, form.value)
    } else {
      await createCategory(form.value)
    }
    submitting.value = false
    modalOpener = createButtonRef.value
    closeModal()
    await fetchCategories()
    toast.success(isEdit ? '分类更新成功' : '分类创建成功')
  } catch (error) {
    toast.error('操作失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

async function handleDelete(category) {
  if (!confirm(`确定删除分类 "${category.name}" 吗？如果该分类下有文章，需要先转移或删除文章。`)) {
    return
  }

  try {
    await deleteCategory(category.id)
    await fetchCategories()
    toast.success('分类删除成功')
  } catch (error) {
    const msg = error.message || '未知错误'
    // 优先读后端给的结构化字段；正则只作旧版本降级，避免把中文文案当成接口契约
    const count = error?.data?.postCount ?? String(msg).match(/该分类下还有 (\d+) 篇文章/)?.[1]
    if (count !== undefined && count !== null && count !== '') {
      toast.warning(`该分类下还有 ${count} 篇文章，请先在「文章管理」搜索该分类并转移文章`)
    } else {
      toast.error('删除失败: ' + msg)
    }
  }
}

// Esc 是键盘用户唯一的退出方式：模态打开期间才挂监听，避免常驻全局
function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeModal()
    return
  }
  if (e.key !== 'Tab' || !modalRef.value) return

  const focusable = modalRef.value.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (
    e.shiftKey &&
    (document.activeElement === first || !modalRef.value.contains(document.activeElement))
  ) {
    e.preventDefault()
    last.focus()
  } else if (
    !e.shiftKey &&
    (document.activeElement === last || !modalRef.value.contains(document.activeElement))
  ) {
    e.preventDefault()
    first.focus()
  }
}

// 模态打开期间：挂 Esc 监听 + 锁背景滚动（与移动端菜单的做法保持一致）
watch(showModal, async (open) => {
  setBodyScrollLock(open)
  if (open) {
    document.addEventListener('keydown', handleKeydown)
    await nextTick()
    modalRef.value?.querySelector('#category-name')?.focus()
  } else {
    document.removeEventListener('keydown', handleKeydown)
    const opener = modalOpener
    modalOpener = null
    await nextTick()
    if (opener?.isConnected) opener.focus()
  }
})

onMounted(() => {
  fetchCategories()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // 模态开着时被 401 踢走或路由跳走，必须释放滚动锁，否则页面再也滚不动
  setBodyScrollLock(false)
})
</script>

<style scoped>
.categories-page {
  max-width: 1200px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.category-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--spacing-lg);
}

.category-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.category-slug {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-family: var(--font-mono);
  margin-bottom: var(--spacing-sm);
}

.category-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-md);
}

.category-meta {
  margin-bottom: var(--spacing-md);
}

.post-count {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.category-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalZoomIn 0.25s ease;
}

/* 模态框遮罩淡入/淡出（退出过渡） */
.modal-fade-enter-active {
  transition: opacity 0.25s ease;
}

.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes modalZoomIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }

  /* 移动端模态框：底部弹出式（Bottom Sheet） */
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal {
    max-width: 100%;
    max-height: 92vh;
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    animation: modalSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-footer .btn {
    width: 100%;
  }
}

@keyframes modalSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.close-btn {
  font-size: 1.2rem;
  color: var(--text-muted);
  padding: var(--spacing-xs);
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}
</style>
