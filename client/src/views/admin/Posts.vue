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
        <select
          v-model="filters.status"
          class="form-select"
          aria-label="按状态筛选"
          @change="fetchPosts()"
        >
          <option value="">全部状态</option>
          <option value="1">已发布</option>
          <option value="0">草稿</option>
        </select>
        <input
          v-model="filters.keyword"
          type="text"
          class="form-input"
          placeholder="搜索文章..."
          aria-label="搜索文章"
          @input="debouncedFetch"
        />
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div class="posts-table glass-card">
      <table>
        <thead>
          <tr>
            <th class="drag-col" scope="col">
              <span class="sr-only">排序</span>
            </th>
            <th scope="col">标题</th>
            <th scope="col">分类</th>
            <th scope="col">状态</th>
            <th scope="col">置顶</th>
            <th scope="col">阅读</th>
            <th scope="col">发布时间</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <draggable
          v-model="posts"
          tag="tbody"
          item-key="id"
          handle=".drag-handle"
          :disabled="hasFilter"
          ghost-class="ghost-row"
          @end="handleDragEnd"
        >
          <template #item="{ element: post }">
            <tr>
              <td class="drag-col">
                <button
                  type="button"
                  class="drag-handle"
                  :aria-label="`排序：${post.title}。使用上/下方向键移动`"
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  @keydown.up.prevent="movePost(post, -1)"
                  @keydown.down.prevent="movePost(post, 1)"
                >
                  <Icon name="list" :size="16" />
                </button>
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
                  type="button"
                  class="top-btn"
                  :class="{ active: post.is_top }"
                  :aria-label="post.is_top ? `取消置顶：${post.title}` : `置顶：${post.title}`"
                  :aria-pressed="Boolean(post.is_top)"
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
                  <button type="button" class="btn btn-sm btn-danger" @click="handleDelete(post)">
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </draggable>
      </table>

      <EmptyState v-if="!loading && !posts.length" icon="article" text="暂无文章">
        <router-link to="/admin/posts/create" class="btn btn-primary mt-md"> 写文章 </router-link>
      </EmptyState>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllPosts, deletePost, toggleTop, updateSortOrder } from '@/api/post'
import { formatDate, debounce } from '@/assets/js/utils'
import { useToast } from '@/composables/useToast'
import Icon from '@/components/Icon.vue'
import EmptyState from '@/components/EmptyState.vue'
import draggable from 'vuedraggable'

const toast = useToast()
const loading = ref(false)
const posts = ref([])

const filters = ref({
  status: '',
  keyword: '',
})

const debouncedFetch = debounce(() => {
  fetchPosts()
}, 300)

// 请求序号：丢弃过期响应（快速输入/切换筛选时先发的慢响应不覆盖后发结果）
let fetchSeq = 0

// 筛选状态下禁用拖拽排序
const hasFilter = computed(() => filters.value.status !== '' || filters.value.keyword !== '')
const sortSaving = ref(false)

async function fetchPosts() {
  const seq = ++fetchSeq
  loading.value = true
  try {
    // pageSize=0 表示不分页，一次列出全部文章，保证拖拽排序可在任意文章间进行
    const params = {
      pageSize: 0,
      ...filters.value,
    }
    const res = await getAllPosts(params)
    if (seq !== fetchSeq) return
    posts.value = res.data.list
  } catch (error) {
    console.error('获取文章列表失败:', error)
    toast.error('加载文章失败')
  } finally {
    if (seq === fetchSeq) loading.value = false
  }
}

async function handleToggleTop(post) {
  try {
    // 以服务端返回值为准，避免本地翻转与服务端规范化逻辑漂移
    const res = await toggleTop(post.id)
    post.is_top = res.data.is_top
    toast.success(post.is_top ? '已置顶' : '已取消置顶')
    // 服务端 is_top DESC 优先排序，置顶/取消中部文章后本地行序已失效，
    // 不刷新会让 handleDragEnd 的置顶分组校验误判
    await fetchPosts()
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
    await fetchPosts()
    toast.success('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    toast.error('删除失败')
  }
}

function getSortData() {
  return posts.value.map((post, index) => ({
    id: post.id,
    sort_order: posts.value.length - index,
  }))
}

async function persistSortOrder() {
  if (sortSaving.value) return
  sortSaving.value = true
  try {
    await updateSortOrder(getSortData())
  } catch (error) {
    console.error('排序更新失败:', error)
    toast.error('排序更新失败')
    await fetchPosts()
  } finally {
    sortSaving.value = false
  }
}

// 拖拽之外的键盘排序入口：只允许在同一置顶分组内移动，避免破坏服务端排序规则。
async function movePost(post, direction) {
  if (hasFilter.value || sortSaving.value) {
    if (hasFilter.value) toast.warning('排序仅在无筛选时可用')
    return
  }

  const currentIndex = posts.value.findIndex((item) => item.id === post.id)
  const targetIndex = currentIndex + direction
  if (
    currentIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >= posts.value.length ||
    Boolean(posts.value[currentIndex].is_top) !== Boolean(posts.value[targetIndex].is_top)
  ) {
    toast.warning('置顶文章固定显示在最前，不能跨组移动')
    return
  }

  const nextPosts = [...posts.value]
  ;[nextPosts[currentIndex], nextPosts[targetIndex]] = [
    nextPosts[targetIndex],
    nextPosts[currentIndex],
  ]
  posts.value = nextPosts
  await persistSortOrder()
}

async function handleDragEnd() {
  // 列表已不分页（列出全部文章），仅在无筛选时允许拖拽排序，
  // 避免筛选出的子集提交后打乱全局顺序
  if (hasFilter.value) {
    toast.warning('排序仅在无筛选时可用')
    fetchPosts()
    return
  }

  // 置顶文章固定显示在最前（服务端 is_top DESC 优先）：
  // 拖拽后若置顶组与非置顶组发生交错，说明跨组拖动，回滚并提示
  let sawNonTop = false
  let groupBroken = false
  for (const post of posts.value) {
    if (!post.is_top) {
      sawNonTop = true
    } else if (sawNonTop) {
      groupBroken = true
      break
    }
  }
  if (groupBroken) {
    toast.warning('置顶文章固定显示在最前，不能拖到未置顶文章之后')
    fetchPosts()
    return
  }

  await persistSortOrder()
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
  background: var(--bg-card);
  border: 1px solid var(--border-color);
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
  background: var(--bg-card-hover);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.posts-table {
  overflow-x: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
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
  background: var(--bg-table-row);
}

tr td:first-child {
  border-radius: 8px 0 0 8px;
}

tr td:last-child {
  border-radius: 0 8px 8px 0;
}

tr:hover td {
  background: var(--bg-table-row-hover);
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
  background: var(--bg-table-row-hover);
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text-secondary);
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.drag-handle {
  width: 32px;
  min-height: 32px;
  padding: var(--spacing-xs);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  cursor: grab;
  background: transparent;
  color: var(--text-disabled);
  transition: color var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover {
  color: var(--text-muted);
  background: var(--bg-table-row-hover);
}

.drag-handle:focus-visible {
  color: var(--text-primary);
  border-color: var(--color-primary);
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
</style>
