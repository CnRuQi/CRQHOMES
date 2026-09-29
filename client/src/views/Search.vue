<template>
  <div class="search-page">
    <div class="view-content">
      <div class="container">
        <section class="search-header" data-aos="fade-down">
          <h1 class="page-title">搜索</h1>
          <div class="search-box">
            <Icon name="search" :size="20" />
            <input
              v-model="keyword"
              type="text"
              class="search-input"
              placeholder="输入关键词搜索文章..."
              aria-label="搜索文章"
              autofocus
              @input="handleSearchInput"
            />
            <button v-if="keyword" class="clear-btn" aria-label="清除搜索" @click="clearSearch">
              ✕
            </button>
          </div>
        </section>

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

          <div v-else-if="posts.length" class="search-results" data-aos="fade-up">
            <p class="results-count">找到 {{ total }} 篇相关文章</p>
            <div class="posts-grid">
              <PostCard
                v-for="(post, index) in posts"
                :key="post.id"
                :post="post"
                :index="index"
                :keyword="keyword"
              />
            </div>

            <!-- 分页 -->
            <Pagination :pagination="pagination" @change="changePage" />
          </div>

          <div v-else class="search-hint" data-aos="fade-up">
            <Icon name="search" :size="48" class="hint-icon" />
            <p>输入关键词开始搜索</p>
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
.search-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.view-content {
  flex: 1;
  padding-bottom: var(--spacing-2xl);
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.search-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-display);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(163, 166, 156, 0.1);
}

.search-box svg {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 1.1rem;
  color: var(--text-primary);
  min-width: 0;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  padding: 4px 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  color: var(--text-primary);
  background: var(--bg-glass-hover);
}

.results-count {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-lg);
}

.posts-grid {
  display: grid;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.search-hint {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.hint-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .search-input {
    font-size: 1rem;
  }

  .search-box {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .clear-btn {
    min-width: 32px;
    min-height: 32px;
  }

  .search-header {
    margin-bottom: var(--spacing-xl);
  }
}
</style>
