<template>
  <div class="admin-posts">
    <div class="page-header">
      <h2>文章管理</h2>
      <router-link to="/admin/posts/create" class="btn btn-primary">
        <Icon name="edit" :size="18" /> 写文章
      </router-link>
    </div>

    <div class="filter-bar glass-card">
      <div class="filter-left">
        <select v-model="filters.status" class="form-select" @change="fetchPosts()">
          <option value="">全部状态</option>
          <option value="1">已发布</option>
          <option value="0">草稿</option>
        </select>
        <input
          v-model="filters.keyword"
          type="text"
          class="form-input"
          placeholder="搜索文章..."
          @input="debouncedFetch"
        />
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div class="posts-table glass-card">
        <table>
          <thead>
            <tr>
              <th class="drag-col"></th>
              <th>标题</th>
              <th>分类</th>
              <th>状态</th>
              <th>置顶</th>
              <th>阅读</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <draggable
            v-model="posts"
            tag="tbody"
            item-key="id"
            handle=".drag-handle"
            ghost-class="ghost-row"
            @end="handleDragEnd"
          >
            <template #item="{ element: post }">
              <tr>
                <td class="drag-col">
                  <span class="drag-handle">
                    <Icon name="list" :size="16" />
                  </span>
                </td>
                <td>
                  <router-link :to="`/admin/posts/${post.id}/edit`" class="post-title">
                    {{ post.title }}
                  </router-link>
                </td>
                <td>
                  <span v-if="post.category_name" class="category-tag">
                    {{ post.category_name }}
                  </span>
                  <span v-else class="text-muted">未分类</span>
                </td>
                <td>
                  <span :class="['status-tag', post.status ? 'published' : 'draft']">
                    {{ post.status ? '已发布' : '草稿' }}
                  </span>
                </td>
                <td>
                  <button
                    class="top-btn"
                    :class="{ active: post.is_top }"
                    @click="handleToggleTop(post)"
                  >
                    <Icon :name="post.is_top ? 'pinyes' : 'pinno'" :size="18" />
                  </button>
                </td>
                <td>{{ post.views }}</td>
                <td>{{ formatDate(post.published_at || post.created_at) }}</td>
                <td>
                  <div class="actions">
                    <router-link
                      :to="`/admin/posts/${post.id}/edit`"
                      class="btn btn-sm btn-secondary"
                    >
                      编辑
                    </router-link>
                    <button class="btn btn-sm btn-danger" @click="handleDelete(post)">删除</button>
                  </div>
                </td>
              </tr>
            </template>
          </draggable>
        </table>

        <EmptyState v-if="!posts.length" icon="article" text="暂无文章">
          <router-link to="/admin/posts/create" class="btn btn-primary mt-md"> 写文章 </router-link>
        </EmptyState>
      </div>

      <Pagination :pagination="pagination" @change="changePage" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAllPosts, deletePost, toggleTop, updateSortOrder } from '@/api/post'
import { formatDate, debounce } from '@/assets/js/utils'
import { useToast } from '@/composables/useToast'
import Icon from '@/components/Icon.vue'
import Pagination from '@/components/Pagination.vue'
import EmptyState from '@/components/EmptyState.vue'
import draggable from 'vuedraggable'

const toast = useToast()
const loading = ref(false)
const posts = ref([])
const pagination = ref({
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
})

const filters = ref({
  status: '',
  keyword: '',
})

const debouncedFetch = debounce(() => {
  fetchPosts()
}, 300)

async function fetchPosts(page = 1) {
  loading.value = true
  try {
    const params = {
      page,
      pageSize: 10,
      ...filters.value,
    }
    const res = await getAllPosts(params)
    posts.value = res.data.list
    pagination.value = res.data.pagination
  } catch (error) {
    console.error('获取文章列表失败:', error)
    toast.error('加载文章失败')
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  fetchPosts(page)
}

async function handleToggleTop(post) {
  try {
    await toggleTop(post.id)
    post.is_top = post.is_top ? 0 : 1
  } catch (error) {
    console.error('切换置顶失败:', error)
    toast.error('切换置顶失败')
  }
}

async function handleDelete(post) {
  if (!confirm(`确定删除文章 "${post.title}" 吗？`)) {
    return
  }

  try {
    await deletePost(post.id)
    fetchPosts(pagination.value.page)
  } catch (error) {
    console.error('删除失败:', error)
    toast.error('删除失败')
  }
}

async function handleDragEnd() {
  // 拖拽排序仅在第一页且无筛选时可用，避免只提交子集导致全局顺序错乱
  const hasFilter = filters.value.status !== '' || filters.value.keyword !== ''
  if (pagination.value.page !== 1 || hasFilter) {
    toast.warning('排序仅在无筛选且第一页时可用')
    fetchPosts(pagination.value.page)
    return
  }

  try {
    const sortData = posts.value.map((post, index) => ({
      id: post.id,
      sort_order: posts.value.length - index,
    }))
    await updateSortOrder(sortData)
  } catch (error) {
    console.error('排序更新失败:', error)
    toast.error('排序更新失败')
    fetchPosts(pagination.value.page)
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.admin-posts {
  max-width: 1200px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(120, 122, 116, 0.15);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}

.filter-left {
  display: flex;
  gap: var(--spacing-md);
}

.filter-left .form-select,
.filter-left .form-input {
  width: auto;
  min-width: 150px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(120, 122, 116, 0.2);
  border-radius: 10px;
}

.posts-table {
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(120, 122, 116, 0.15);
  border-radius: 14px;
  padding: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 2px;
}

th {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  background: rgba(235, 235, 232, 0.3);
}

tr td:first-child {
  border-radius: 8px 0 0 8px;
}

tr td:last-child {
  border-radius: 0 8px 8px 0;
}

tr:hover td {
  background: rgba(163, 166, 156, 0.08);
}

.post-title {
  color: var(--text-primary);
  font-weight: 500;
  transition: color 0.2s ease;
}

.post-title:hover {
  color: var(--color-primary-dark);
}

.category-tag {
  padding: 3px 12px;
  background: rgba(163, 166, 156, 0.1);
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--color-primary-dark);
  font-weight: 500;
}

.top-btn {
  font-size: 1.1rem;
  padding: var(--spacing-xs);
  opacity: 0.4;
  transition: all 0.2s ease;
  cursor: pointer;
}

.top-btn.active {
  opacity: 1;
}

.top-btn:hover {
  opacity: 0.8;
  transform: scale(1.1);
}

.actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* 拖拽相关样式 */
.drag-col {
  width: 30px;
  padding: 0 var(--spacing-sm) !important;
}

.drag-handle {
  cursor: grab;
  color: var(--text-disabled);
  transition: color var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover {
  color: var(--text-muted);
}

.drag-handle:active {
  cursor: grabbing;
}

.ghost-row {
  opacity: 0.5;
  background: rgba(163, 166, 156, 0.1);
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .filter-left {
    width: 100%;
    flex-direction: column;
  }

  .filter-left .form-select,
  .filter-left .form-input {
    width: 100%;
  }

  /* 移动端隐藏次要列：分类、阅读、发布时间 */
  .posts-table th:nth-child(3),
  .posts-table td:nth-child(3),
  .posts-table th:nth-child(6),
  .posts-table td:nth-child(6),
  .posts-table th:nth-child(7),
  .posts-table td:nth-child(7) {
    display: none;
  }

  .posts-table th,
  .posts-table td {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .posts-table th {
    font-size: 0.7rem;
  }

  .actions {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .actions .btn {
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  /* 超窄屏隐藏拖拽列（移动端拖拽排序不常用） */
  .posts-table .drag-col {
    display: none;
  }
}
</style>
