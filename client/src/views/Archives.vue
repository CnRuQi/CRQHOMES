<template>
  <div class="archives">
    <main class="main-content">
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
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getArchives } from '@/api/post'
import { formatDate, restoreListScroll } from '@/assets/js/utils'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const toast = useToast()
const loading = ref(false)
const archives = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await getArchives()
    archives.value = res.data.archives
  } catch (error) {
    console.error('获取归档失败:', error)
    toast.error('加载归档失败')
  } finally {
    loading.value = false
  }
  // 数据渲染完成后精确恢复滚动位置
  await nextTick()
  restoreListScroll(route.fullPath)
})
</script>

<style scoped>
.archives {
  min-height: 100vh;
}

.main-content {
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
  background: rgba(163, 166, 156, 0.1);
  border-color: rgba(163, 166, 156, 0.3);
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

.skeleton-pulse {
  background: linear-gradient(
    90deg,
    rgba(163, 166, 156, 0.1) 25%,
    rgba(163, 166, 156, 0.2) 50%,
    rgba(163, 166, 156, 0.1) 75%
  );
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
