<template>
  <div class="search-page">
    <Navbar />

    <main class="main-content">
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
              @input="debouncedSearch"
              autofocus
            />
            <button v-if="keyword" class="clear-btn" @click="clearSearch">
              ✕
            </button>
          </div>
        </section>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>

        <template v-else>
          <div v-if="keyword && !posts.length" class="empty-state" data-aos="fade-up">
            <Icon name="article" :size="48" class="empty-icon" />
            <p>未找到相关文章</p>
            <p class="empty-hint">试试其他关键词？</p>
          </div>

          <div v-else-if="posts.length" class="search-results" data-aos="fade-up">
            <p class="results-count">找到 {{ total }} 篇相关文章</p>
            <div class="posts-grid">
              <PostCard
                v-for="(post, index) in posts"
                :key="post.id"
                :post="post"
                :index="index"
              />
            </div>

            <!-- 分页 -->
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
          </div>

          <div v-else class="search-hint" data-aos="fade-up">
            <Icon name="search" :size="48" class="hint-icon" />
            <p>输入关键词开始搜索</p>
          </div>
        </template>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchPosts } from '@/api/post'
import { debounce } from '@/assets/js/utils'
import Navbar from '@/components/Navbar.vue'
import PostCard from '@/components/PostCard.vue'
import Footer from '@/components/Footer.vue'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const router = useRouter()

const keyword = ref(route.query.q || '')
const posts = ref([])
const total = ref(0)
const loading = ref(false)
const pagination = ref({
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0
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

async function doSearch(page = 1) {
  if (!keyword.value.trim()) {
    posts.value = []
    total.value = 0
    pagination.value = { total: 0, page: 1, pageSize: 10, totalPages: 0 }
    return
  }

  loading.value = true
  try {
    const res = await searchPosts({
      keyword: keyword.value.trim(),
      page,
      pageSize: 10
    })
    posts.value = res.data.list
    total.value = res.data.pagination.total
    pagination.value = res.data.pagination

    // 更新 URL
    router.replace({ query: { q: keyword.value.trim() } })
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(() => {
  doSearch()
}, 300)

function changePage(page) {
  doSearch(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearSearch() {
  keyword.value = ''
  posts.value = []
  total.value = 0
  pagination.value = { total: 0, page: 1, pageSize: 10, totalPages: 0 }
  router.replace({ query: {} })
}

// 初始化搜索
if (keyword.value) {
  doSearch()
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: calc(var(--header-height) + var(--spacing-2xl));
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
  background: rgba(163, 166, 156, 0.1);
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

.empty-state,
.search-hint {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.empty-icon,
.hint-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-hint {
  font-size: 0.9rem;
  margin-top: var(--spacing-sm);
}

.pagination {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xl);
}

.pagination-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.9rem;
  transition: all var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-2xl);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .search-input {
    font-size: 1rem;
  }
}
</style>
