<template>
  <div class="archives">
    <div class="view-content">
      <div class="container">
        <header class="archives-header section-head">
          <p class="section-eyebrow">Archives</p>
          <h1 class="page-title">归档</h1>
          <p v-if="!loading && !loadError && postCount" class="page-subtitle">
            共 {{ postCount }} 篇文章，依年月编次
          </p>
        </header>

        <div v-if="loading" class="archives-skeleton">
          <div v-for="i in 3" :key="i" class="skeleton-group">
            <div class="skeleton-title skeleton-pulse"></div>
            <div class="skeleton-items">
              <div v-for="j in 4" :key="j" class="skeleton-item skeleton-pulse"></div>
            </div>
          </div>
        </div>

        <template v-else>
          <p v-if="loadError" class="load-error" role="alert">归档加载失败，请稍后重试</p>

          <template v-else>
            <div v-if="archives.length" class="archives-list">
              <article v-for="group in groupedByYear" :key="group.year" class="year-group">
                <h2 class="year-title">{{ group.year }}</h2>

                <div class="year-body">
                  <section
                    v-for="archive in group.months"
                    :key="`${archive.year}-${archive.month}`"
                    class="month-group"
                    data-reveal="up"
                  >
                    <h3 class="month-title">
                      {{ pad2(archive.month) }}月
                      <span class="archive-count">{{ archive.posts.length }}</span>
                    </h3>

                    <ul class="archive-posts">
                      <li v-for="post in archive.posts" :key="post.id">
                        <router-link :to="`/post/${post.slug || post.id}`" class="archive-item">
                          <time
                            class="item-date"
                            :datetime="post.published_at || post.created_at || undefined"
                          >
                            {{ formatDate(post.published_at || post.created_at, 'DD') }}
                          </time>
                          <span class="item-title">{{ post.title }}</span>
                        </router-link>
                      </li>
                    </ul>
                  </section>
                </div>
              </article>
            </div>

            <EmptyState v-else icon="article" text="暂无文章" hint="第一篇文章写完就会出现在这里" />

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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArchives } from '@/api/post'
import { formatDate, restoreListScroll } from '@/assets/js/utils'
import { useToast } from '@/composables/useToast'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const loading = ref(false)
const loadError = ref(false)
const archives = ref([])
const archivePageSize = 50
const pagination = ref({ total: 0, page: 1, pageSize: archivePageSize, totalPages: 0 })

const initialPage = Number(route.query.page)
const page = ref(Number.isSafeInteger(initialPage) && initialPage > 0 ? initialPage : 1)

// 接口按「年-月」分桶返回，这里再按年聚合一层，
// 让年份成为可吸附的索引列，月份成为其下的次级标目。
const groupedByYear = computed(() => {
  const groups = []
  const index = new Map()
  for (const archive of archives.value) {
    let group = index.get(archive.year)
    if (!group) {
      group = { year: archive.year, months: [] }
      index.set(archive.year, group)
      groups.push(group)
    }
    group.months.push(archive)
  }
  return groups
})

const postCount = computed(() =>
  archives.value.reduce((sum, archive) => sum + (archive.posts?.length || 0), 0)
)

function pad2(value) {
  return String(value).padStart(2, '0')
}

async function fetchArchives() {
  loading.value = true
  loadError.value = false
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
    loadError.value = true
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
/* ============================================================
   归档：一页「编年索引」
   年份是吸附在左栏的索引号，月份是次级标目，
   文章退到一条细线上，日期用等宽数字对齐成一条垂直线。
   ============================================================ */
.archives-header {
  margin-bottom: var(--space-12);
}

.archives-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.year-group {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: var(--space-8);
  align-items: start;
}

.year-title {
  position: sticky;
  top: calc(var(--header-height) + var(--space-6));
  color: var(--color-primary-dark);
  font-family: var(--font-display);
  font-size: var(--fs-2xl);
  font-weight: var(--weight-semibold);
  line-height: 1;
  letter-spacing: var(--tracking-tight);
  font-variant-numeric: tabular-nums;
}

.year-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  min-width: 0;
}

.month-group {
  min-width: 0;
}

.month-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
}

/* 标目右侧延出一条发丝线，像印刷目录的引导线 */
.month-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-hairline);
}

.archive-count {
  color: var(--text-disabled);
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  font-variant-numeric: tabular-nums;
}

.archive-posts {
  display: flex;
  flex-direction: column;
}

.archive-item {
  display: flex;
  align-items: baseline;
  gap: var(--space-5);
  margin-inline: calc(var(--space-3) * -1);
  padding: var(--space-3);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.archive-item:hover {
  background: var(--tint-primary-weak);
}

.item-date {
  flex: 0 0 auto;
  min-width: 2ch;
  color: var(--text-disabled);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
  transition: color var(--dur-fast) var(--ease-standard);
}

.item-title {
  min-width: 0;
  font-size: var(--fs-md);
  line-height: var(--leading-snug);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease-standard);
}

/* 悬停只做两件事：行底泛出一层极淡的墨，日期转为主色。
   位移交给「条目本身」，不做整行横移——索引需要稳。 */
.archive-item:hover .item-title {
  color: var(--color-primary-dark);
}

.archive-item:hover .item-date {
  color: var(--color-primary);
}

.archive-item:active {
  background: var(--tint-primary);
}

/* ---------- 分页 ---------- */
.archives-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-16);
}

.pagination-btn {
  min-width: 5.5rem;
  min-height: 2.5rem;
  padding: var(--space-2) var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  letter-spacing: var(--tracking-wide);
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard),
    transform var(--dur-instant) var(--ease-standard);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  background: var(--tint-primary-weak);
}

.pagination-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.pagination-status {
  color: var(--text-muted);
  font-size: var(--fs-caption);
  font-variant-numeric: tabular-nums;
}

/* ---------- 骨架屏 ---------- */
.archives-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.skeleton-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.skeleton-title {
  width: 4rem;
  height: 2rem;
}

.skeleton-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-item {
  height: 2.75rem;
}

@media (max-width: 768px) {
  .archives-header {
    margin-bottom: var(--space-8);
  }

  .archives-list {
    gap: var(--space-12);
  }

  .year-group {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-6);
  }

  /* 窄屏无法吸附，年份退回一条横向标目 */
  .year-title {
    position: static;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-hairline);
    font-size: var(--fs-xl);
  }

  .year-body {
    gap: var(--space-8);
  }

  .item-title {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  .archives-pagination {
    margin-top: var(--space-12);
  }
}
</style>
