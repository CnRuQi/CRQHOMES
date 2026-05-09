<template>
  <div class="admin-posts">
    <div class="page-header">
      <h2>文章管理</h2>
      <router-link to="/admin/posts/create" class="btn btn-primary">
        ✏️ 写文章
      </router-link>
    </div>

    <div class="filter-bar glass-card">
      <div class="filter-left">
        <select v-model="filters.status" class="form-select" @change="fetchPosts">
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
              <th>标题</th>
              <th>分类</th>
              <th>状态</th>
              <th>置顶</th>
              <th>阅读</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post.id">
              <td>
                <router-link :to="`/admin/posts/${post.id}/edit`" class="post-title">
                  {{ post.title }}
                </router-link>
              </td>
              <td>
                <span class="category-tag" v-if="post.category_name">
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
                  {{ post.is_top ? '📌' : '📍' }}
                </button>
              </td>
              <td>{{ post.views }}</td>
              <td>{{ formatDate(post.created_at) }}</td>
              <td>
                <div class="actions">
                  <router-link
                    :to="`/admin/posts/${post.id}/edit`"
                    class="btn btn-sm btn-secondary"
                  >
                    编辑
                  </router-link>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="handleDelete(post)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!posts.length" class="empty-state">
          <p>暂无文章</p>
          <router-link to="/admin/posts/create" class="btn btn-primary mt-md">
            写文章
          </router-link>
        </div>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </button>
        <button
          v-for="page in displayPages"
          :key="page"
          class="pagination-btn"
          :class="{ active: page === pagination.page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button
          class="pagination-btn"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllPosts, deletePost, toggleTop } from '@/api/post'
import { formatDate, debounce } from '@/assets/js/utils'

const loading = ref(false)
const posts = ref([])
const pagination = ref({
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0
})

const filters = ref({
  status: '',
  keyword: ''
})

const displayPages = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.page
  const pages = []

  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)

  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else {
      start = Math.max(1, end - 4)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
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
      ...filters.value
    }
    const res = await getAllPosts(params)
    posts.value = res.data.list
    pagination.value = res.data.pagination
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

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(163, 166, 156, 0.12);
  border-radius: 14px;
}

.filter-left {
  display: flex;
  gap: var(--spacing-md);
}

.filter-left .form-select,
.filter-left .form-input {
  width: auto;
  min-width: 150px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(163, 166, 156, 0.2);
  border-radius: 10px;
}

.posts-table {
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(163, 166, 156, 0.12);
  border-radius: 14px;
  padding: var(--spacing-sm);
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

.status-tag {
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-tag.published {
  background: rgba(155, 163, 142, 0.15);
  color: #7B8370;
}

.status-tag.draft {
  background: rgba(199, 179, 141, 0.15);
  color: #A69570;
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

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
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
}
</style>
