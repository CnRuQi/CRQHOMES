<template>
  <div class="categories-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <button class="btn btn-primary" @click="showModal = true">
        ➕ 新建分类
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
            <p class="category-desc" v-if="category.description">
              {{ category.description }}
            </p>
            <div class="category-meta">
              <span class="post-count">{{ category.post_count || 0 }} 篇文章</span>
            </div>
          </div>
          <div class="category-actions">
            <button class="btn btn-sm btn-secondary" @click="editCategory(category)">
              编辑
            </button>
            <button class="btn btn-sm btn-danger" @click="handleDelete(category)">
              删除
            </button>
          </div>
        </div>
      </div>

      <div v-if="!categories.length" class="empty-state glass-card">
        <div class="empty-icon">📁</div>
        <p>暂无分类</p>
        <button class="btn btn-primary mt-md" @click="showModal = true">
          创建第一个分类
        </button>
      </div>
    </template>

    <!-- 模态框 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal glass-card" data-aos="zoom-in">
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
              <button type="button" class="btn btn-secondary" @click="closeModal">
                取消
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                {{ submitting ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'

const loading = ref(false)
const categories = ref([])
const showModal = ref(false)
const submitting = ref(false)
const editingCategory = ref(null)

const form = ref({
  name: '',
  slug: '',
  description: '',
  sort: 0
})

async function fetchCategories() {
  loading.value = true
  try {
    const res = await getCategories()
    categories.value = res.data.categories
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
    sort: category.sort || 0
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
    sort: 0
  }
}

async function handleSubmit() {
  submitting.value = true
  try {
    if (editingCategory.value) {
      await updateCategory(editingCategory.value.id, form.value)
    } else {
      await createCategory(form.value)
    }
    closeModal()
    fetchCategories()
  } catch (error) {
    alert('操作失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

async function handleDelete(category) {
  if (!confirm(`确定删除分类 "${category.name}" 吗？该分类下的文章将变为未分类。`)) {
    return
  }

  try {
    await deleteCategory(category.id)
    fetchCategories()
  } catch (error) {
    alert('删除失败: ' + (error.message || '未知错误'))
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

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
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

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
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
