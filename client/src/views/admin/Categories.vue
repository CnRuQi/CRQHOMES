<template>
  <div class="categories-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <button class="btn btn-primary" @click="showModal = true">
        <Icon name="add" :size="18" /> 新建分类
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

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
            <button class="btn btn-sm btn-secondary" @click="editCategory(category)">编辑</button>
            <button class="btn btn-sm btn-danger" @click="handleDelete(category)">删除</button>
          </div>
        </div>
      </div>

      <EmptyState v-if="!categories.length" icon="folder" text="暂无分类" glass>
        <button class="btn btn-primary mt-md" @click="showModal = true">创建第一个分类</button>
      </EmptyState>
    </template>

    <!-- 模态框 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal glass-card">
            <div class="modal-header">
              <h3>{{ editingCategory ? '编辑分类' : '新建分类' }}</h3>
              <button class="close-btn" @click="closeModal">✕</button>
            </div>

            <form class="modal-body" @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="form-label">分类名称 *</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  placeholder="请输入分类名称"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">分类别名 *</label>
                <input
                  v-model="form.slug"
                  type="text"
                  class="form-input"
                  placeholder="用于URL，如：tech"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">描述</label>
                <textarea
                  v-model="form.description"
                  class="form-textarea"
                  placeholder="分类描述（选填）"
                  rows="3"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">排序</label>
                <input
                  v-model.number="form.sort"
                  type="number"
                  class="form-input"
                  placeholder="数字越小越靠前"
                />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
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
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'
import Icon from '@/components/Icon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const loading = ref(false)
const categories = ref([])
const showModal = ref(false)
const submitting = ref(false)
const editingCategory = ref(null)

const form = ref({
  name: '',
  slug: '',
  description: '',
  sort: 0,
})

async function fetchCategories() {
  loading.value = true
  try {
    const res = await getCategories()
    categories.value = res.data.categories
  } catch (error) {
    console.error('获取分类失败:', error)
    toast.error('加载分类失败')
  } finally {
    loading.value = false
  }
}

function editCategory(category) {
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
    toast.error('删除失败: ' + (error.message || '未知错误'))
  }
}

onMounted(() => {
  fetchCategories()
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
