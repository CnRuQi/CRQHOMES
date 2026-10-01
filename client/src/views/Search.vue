<template>
  <div class="search-page">
    <div class="view-content">
      <div class="container search-container">
        <header class="search-header section-head">
          <p class="section-eyebrow">Search</p>
          <h1 class="page-title">搜索</h1>
          <div class="search-box" role="search">
            <Icon name="search" :size="20" class="search-icon" />
            <input
              v-model="keyword"
              type="text"
              class="search-input"
              placeholder="输入关键词搜索文章..."
              aria-label="搜索文章"
              enterkeyhint="search"
              autofocus
              @input="handleSearchInput"
            />
            <button
              v-if="keyword"
              type="button"
              class="clear-btn"
              aria-label="清除搜索"
              @click="clearSearch"
            >
              ✕
            </button>
          </div>
        </header>

        <div v-if="loading" class="posts-grid">
          <SkeletonCard v-for="i in 3" :key="i" />
        </div>

        <template v-else>
          <p v-if="loadError" class="load-error" role="alert">搜索失败，请稍后重试</p>

          <EmptyState
            v-else-if="keyword && !posts.length"
            icon="article"
            text="未找到相关文章"
            hint="试试其他关键词？"
          />

          <div v-else-if="posts.length" class="search-results search-results-enter">
            <p class="results-count">
              <span class="results-number">{{ total }}</span>
              篇相关文章
            </p>
            <div class="posts-grid">
              <PostCard v-for="post in posts" :key="post.id" :post="post" :keyword="keyword" />
            </div>

            <!-- 分页 -->
            <Pagination :pagination="pagination" @change="changePage" />
          </div>

          <div v-else class="search-hint">
            <Icon name="search" :size="40" class="hint-icon" />
            <p class="hint-text">输入关键词开始搜索</p>
            <p class="hint-sub">标题与摘要都会被检索</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchPosts } from '@/api/post'
import { debounce, restoreListScroll } from '@/assets/js/utils'
import { useToast } from '@/composables/useToast'
import PostCard from '@/components/PostCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import Pagination from '@/components/Pagination.vue'
import EmptyState from '@/components/EmptyState.vue'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const posts = ref([])
const total = ref(0)
const loading = ref(false)
const loadError = ref(false)
const pagination = ref({
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
})

// 请求序号，用于丢弃过期的搜索响应（防竞态）
let searchSeq = 0
// 已请求的页码：浏览器前进/后退触发 watch 时区分「新翻页」与「本次翻页自己的 URL 回写」
let requestedPage = 1

async function doSearch(page = 1, { restore = false } = {}) {
  requestedPage = page
  if (!keyword.value.trim()) {
    posts.value = []
    total.value = 0
    loadError.value = false
    pagination.value = { total: 0, page: 1, pageSize: 10, totalPages: 0 }
    return
  }

  const seq = ++searchSeq
  loading.value = true
  loadError.value = false
  posts.value = []
  total.value = 0
  pagination.value = { total: 0, page: 1, pageSize: 10, totalPages: 0 }
  try {
    const res = await searchPosts({
      keyword: keyword.value.trim(),
      page,
      pageSize: 10,
    })
    // 丢弃过期请求的响应
    if (seq !== searchSeq) return

    posts.value = res.data.list
    total.value = res.data.pagination.total
    pagination.value = res.data.pagination

    // 更新 URL（带上页码，保持可分享/可后退）
    const query = { q: keyword.value.trim() }
    if (page > 1) {
      query.page = page
    }
    await router.replace({ query })

    // 仅「从文章详情返回」的初始加载才精确恢复滚动位置（输入搜索不触发恢复）
    if (restore) {
      await nextTick()
      restoreListScroll(route.fullPath)
    }
  } catch (error) {
    if (seq !== searchSeq) return
    console.error('搜索失败:', error)
    loadError.value = true
    toast.error('搜索失败')
  } finally {
    if (seq === searchSeq) {
      loading.value = false
    }
  }
}

const debouncedSearch = debounce(() => {
  doSearch()
}, 300)

function handleSearchInput() {
  searchSeq++
  loadError.value = false
  posts.value = []
  total.value = 0
  pagination.value = { total: 0, page: 1, pageSize: 10, totalPages: 0 }
  if (!keyword.value.trim()) {
    loading.value = false
    return
  }
  loading.value = true
  debouncedSearch()
}

function changePage(page) {
  doSearch(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearSearch() {
  // 使在途请求过期，避免清除后旧响应把结果回填
  searchSeq++
  keyword.value = ''
  posts.value = []
  total.value = 0
  loadError.value = false
  loading.value = false
  pagination.value = { total: 0, page: 1, pageSize: 10, totalPages: 0 }
  router.replace({ query: {} })
}

// 初始化搜索：页码从 URL 读取（保证返回时加载相同页内容，与保存的滚动位置一致）
if (keyword.value) {
  doSearch(parseInt(route.query.page, 10) || 1, { restore: true })
}

// 浏览器前进/后退（同路径仅 query 变化，组件不重挂载）时同步搜索状态
// q 与 page 都要监听：关键词未变而页码变化时同样需重新加载，否则结果与 URL 脱节
watch(
  () => [route.query.q, route.query.page],
  ([q, page]) => {
    const newKeyword = typeof q === 'string' ? q : ''
    const targetPage = parseInt(page, 10) || 1

    if (newKeyword !== keyword.value) {
      keyword.value = newKeyword
      if (newKeyword) {
        doSearch(targetPage)
      } else {
        searchSeq++
        posts.value = []
        total.value = 0
        loadError.value = false
        loading.value = false
        pagination.value = { total: 0, page: 1, pageSize: 10, totalPages: 0 }
      }
      return
    }

    // 关键词未变、仅页码变化（前进/后退翻页）；changePage 的 URL 回写走不到这里
    if (newKeyword && targetPage !== requestedPage) {
      doSearch(targetPage)
    }
  }
)
</script>

<style scoped>
/* 搜索页收窄到阅读行宽：输入框与结果都在一条视线上 */
.search-container {
  max-width: calc(var(--max-width-narrow) + var(--space-gutter) * 2);
}

.search-header {
  margin-bottom: var(--space-12);
}

.search-header .page-title {
  margin-bottom: var(--space-6);
}

/* 输入框做成一条「纸上的搜物线」：静息只有发丝边，
   聚焦时边线变实、浮出一圈柔光，反馈明确但不刺眼。 */
.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--dur-normal) var(--ease-standard),
    box-shadow var(--dur-normal) var(--ease-standard),
    background-color var(--dur-normal) var(--ease-standard);
}

.search-box:hover {
  border-color: var(--border-hover);
}

.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-ring-soft);
}

.search-icon {
  flex: 0 0 auto;
  color: var(--text-muted);
  transition: color var(--dur-normal) var(--ease-standard);
}

.search-box:focus-within .search-icon {
  color: var(--color-primary);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: var(--fs-md);
  line-height: var(--leading-normal);
}

/* 焦点指示由外层容器的 :focus-within 承担（苔绿边 + 光晕），
   input 自身不再画一圈 outline——两层描边叠在一起显乱。
   焦点可见性并未丢失，只是换了载体。 */
.search-input:focus-visible {
  outline: none;
}

.search-input::placeholder {
  color: var(--text-disabled);
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 1.75rem;
  height: 1.75rem;
  color: var(--text-muted);
  border-radius: var(--radius-full);
  font-size: var(--fs-xs);
  transition:
    color var(--dur-fast) var(--ease-standard),
    background-color var(--dur-fast) var(--ease-standard);
}

.clear-btn:hover {
  color: var(--text-primary);
  background: var(--tint-neutral);
}

.clear-btn:active {
  transform: scale(0.92);
}

/* ---------- 结果 ---------- */
.search-results-enter {
  animation: resultsIn var(--dur-slow) var(--ease-out) both;
}

@keyframes resultsIn {
  from {
    opacity: 0;
    transform: translate3d(0, 0.5rem, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* 计数用大号衬线数字压住「篇」这个量词，形成一处视觉锚点 */
.results-count {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
  color: var(--text-muted);
  font-size: var(--fs-caption);
  letter-spacing: var(--tracking-wide);
}

.results-number {
  color: var(--color-primary-dark);
  font-family: var(--font-display);
  font-size: var(--fs-2xl);
  font-weight: var(--weight-semibold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
  gap: var(--space-8);
  margin-bottom: var(--space-12);
}

.search-hint {
  padding: var(--space-section-sm) 0;
  text-align: center;
  color: var(--text-muted);
}

.hint-icon {
  margin-bottom: var(--space-5);
  color: var(--color-primary);
  opacity: 0.4;
}

.hint-text {
  color: var(--text-secondary);
  font-size: var(--fs-md);
}

.hint-sub {
  margin-top: var(--space-2);
  color: var(--text-disabled);
  font-size: var(--fs-micro);
  letter-spacing: var(--tracking-wide);
}

@media (max-width: 768px) {
  .search-header {
    margin-bottom: var(--space-8);
  }

  .search-box {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
  }

  .posts-grid {
    gap: var(--space-6);
    margin-bottom: var(--space-8);
  }
}
</style>
