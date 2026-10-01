<template>
  <div class="admin-posts">
    <div class="page-header">
      <h1 class="page-title">文章管理</h1>
      <router-link to="/admin/posts/create" class="btn btn-primary">
        <Icon name="edit" :size="18" /> 写文章
      </router-link>
    </div>

    <div class="filter-bar">
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

    <p v-else-if="loadError" class="load-error" role="alert">文章列表加载失败，请稍后重试</p>

    <div v-else class="posts-table">
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
              <td class="tabular-nums">{{ post.views }}</td>
              <td class="tabular-nums">{{ formatDate(post.published_at || post.created_at) }}</td>
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
const loadError = ref(false)
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
let sortQueued = false

async function fetchPosts() {
  const seq = ++fetchSeq
  loading.value = true
  loadError.value = false
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
    if (seq !== fetchSeq) return
    loadError.value = true
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
  if (sortSaving.value) {
    sortQueued = true
    return
  }
  sortSaving.value = true
  try {
    await updateSortOrder(getSortData())
  } catch (error) {
    console.error('排序更新失败:', error)
    toast.error('排序更新失败')
    if (!sortQueued) await fetchPosts()
  } finally {
    sortSaving.value = false
    if (sortQueued) {
      sortQueued = false
      await persistSortOrder()
    }
  }
}

// 拖拽之外的键盘排序入口：只允许在同一置顶分组内移动，避免破坏服务端排序规则。
async function movePost(post, direction) {
  if (hasFilter.value) {
    toast.warning('排序仅在无筛选时可用')
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
/* ============================================================
   文章管理：一张摊开的册页。
   行与行之间只用发丝线分隔，去掉了灰色行块，
   让阅读顺序（标题→状态→时间）自己站成一条线。
   ============================================================ */
.admin-posts {
  max-width: var(--max-width);
}

/* ---------- 筛选条 ---------- */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-6);
  background: var(--bg-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}

.filter-left {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.filter-left .form-select,
.filter-left .form-input {
  width: auto;
  min-width: 12rem;
}

/* ---------- 册页 ---------- */
.posts-table {
  overflow-x: auto;
  background: var(--bg-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-disabled);
  font-size: var(--fs-micro);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-widest);
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

tbody td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-hairline);
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* 行高亮用一层极淡的墨色，而不是整块灰底 */
tbody tr {
  transition: background-color var(--dur-fast) var(--ease-standard);
}

tbody tr:hover td {
  background: var(--tint-primary-weak);
}

.post-title {
  color: var(--text-primary);
  font-size: var(--fs-md);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-tight);
  transition: color var(--dur-fast) var(--ease-standard);
}

.post-title:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem var(--space-3);
  background: var(--tint-primary-weak);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  font-size: var(--fs-micro);
  white-space: nowrap;
}

/* ---------- 行内操作 ---------- */
.top-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  color: var(--text-disabled);
  opacity: 0.55;
  transition:
    opacity var(--dur-fast) var(--ease-standard),
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.top-btn:hover {
  background: var(--tint-primary-weak);
  opacity: 1;
}

.top-btn.active {
  color: var(--color-primary);
  opacity: 1;
}

.actions {
  display: flex;
  gap: var(--space-2);
}

/* ---------- 拖拽排序 ---------- */
.drag-col {
  width: 3rem;
  /* 单类选择器已胜过 tbody td（类 > 类型），不需要 !important */
  padding: var(--space-2);
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  min-height: 2rem;
  padding: var(--space-1);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-disabled);
  cursor: grab;
  transition:
    color var(--dur-fast) var(--ease-standard),
    background-color var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard);
}

.drag-handle:hover {
  background: var(--tint-primary-weak);
  color: var(--text-primary);
}

.drag-handle:focus-visible {
  border-color: var(--color-primary);
  color: var(--text-primary);
}

.drag-handle:active {
  cursor: grabbing;
}

/* 拖拽中的占位行：一层墨色底 + 降透明度 */
.ghost-row {
  opacity: 0.55;
}

.ghost-row td {
  background: var(--tint-primary);
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .filter-left {
    flex-direction: column;
  }

  .filter-left .form-select,
  .filter-left .form-input {
    width: 100%;
    min-width: 0;
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

  thead th {
    padding: var(--space-2) var(--space-3);
  }

  tbody td {
    padding: var(--space-3);
  }

  .actions {
    flex-direction: column;
    gap: var(--space-2);
  }

  .actions .btn {
    white-space: nowrap;
  }
}
</style>
