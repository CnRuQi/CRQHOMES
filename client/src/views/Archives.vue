<template>
  <div class="archives">
    <div class="view-content">
      <div class="container">
        <h1 class="page-title" data-aos="fade-down">归档</h1>

        <div v-if="loading" class="archives-skeleton">
          <div v-for="i in 3" :key="i" class="skeleton-group">
            <div class="skeleton-group-title skeleton-pulse"></div>
            <div class="skeleton-items">
              <div v-for="j in 4" :key="j" class="skeleton-item skeleton-pulse"></div>
            </div>
          </div>
        </div>

        <template v-else>
          <div v-if="archives.length" class="archives-list">
            <div
              v-for="archive in archives"
              :key="`${archive.year}-${archive.month}`"
              class="archive-group"
              data-aos="fade-up"
            >
              <h2 class="archive-title">
                {{ archive.year }}年{{ archive.month }}月
                <span class="archive-count">({{ archive.posts.length }})</span>
              </h2>

              <div class="archive-posts">
                <router-link
                  v-for="post in archive.posts"
                  :key="post.id"
                  :to="`/post/${post.slug || post.id}`"
                  class="archive-item"
                >
                  <span class="item-date">{{
                    formatDate(post.published_at || post.created_at, 'MM-DD')
                  }}</span>
                  <span class="item-title">{{ post.title }}</span>
                </router-link>
              </div>
            </div>
          </div>

          <div v-else class="empty">
            <div class="empty-icon">📚</div>
            <p>暂无文章</p>
          </div>

          <nav v-if="pagination.totalPages > 1" class="archives-pagination" aria-label="归档分页">
            <button
              type="button"
              class="pagination-btn"
              :disabled="pagination.page <= 1 || loading"
              @click="goToPage(pagination.page - 1)"
            >
              上一页
            </button>
            <span class="pagination-status">
              第 {{ pagination.page }} / {{ pagination.totalPages }} 页
            </span>
            <button
              type="button"
              class="pagination-btn"
              :disabled="pagination.page >= pagination.totalPages || loading"
              @click="goToPage(pagination.page + 1)"
            >
              下一页
            </button>
          </nav>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArchives } from '@/api/post'
import { formatDate, restoreListScroll } from '@/assets/js/utils'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const loading = ref(false)
const archives = ref([])
const archivePageSize = 50
const pagination = ref({ total: 0, page: 1, pageSize: archivePageSize, totalPages: 0 })

const initialPage = Number(route.query.page)
const page = ref(Number.isSafeInteger(initialPage) && initialPage > 0 ? initialPage : 1)

async function fetchArchives() {
  loading.value = true
  try {
    const res = await getArchives({ page: page.value, pageSize: archivePageSize })
    archives.value = res.data.archives
    pagination.value = res.data.pagination

    if (pagination.value.totalPages > 0 && page.value > pagination.value.totalPages) {
      page.value = pagination.value.totalPages
      await fetchArchives()
      return
    }
  } catch (error) {
    console.error('获取归档失败:', error)
    toast.error('加载归档失败')
  } finally {
    loading.value = false
  }
}

async function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages || loading.value) return
  page.value = nextPage
  const query = { ...route.query }
  if (nextPage === 1) {
    delete query.page
  } else {
    query.page = String(nextPage)
  }
  await router.replace({ query })
  await fetchArchives()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  await fetchArchives()
  // 数据渲染完成后精确恢复滚动位置
  await nextTick()
  restoreListScroll(route.fullPath)
})
</script>

<style scoped>
.archives {
  min-height: 100vh;
}

.view-content {
  padding-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.archive-group {
  margin-bottom: var(--spacing-2xl);
}

.archive-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-primary);
  display: inline-block;
}

.archive-count {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 1rem;
}

.archive-posts {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.archive-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.archive-item:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-hover);
  transform: translateX(8px);
}

.item-date {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  min-width: 50px;
}

.item-title {
  flex: 1;
}

.archives-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-2xl);
}

.pagination-btn {
  min-width: 84px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-glass);
  color: var(--text-primary);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination-status {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.skeleton-pulse {
  background: var(--bg-tertiary);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-group {
  margin-bottom: var(--spacing-2xl);
}

.skeleton-group-title {
  height: 28px;
  width: 150px;
  margin-bottom: var(--spacing-md);
  border-radius: var(--border-radius-sm);
}

.skeleton-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.skeleton-item {
  height: 48px;
  border-radius: var(--border-radius-sm);
}

@media (max-width: 768px) {
  .archive-item {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>
