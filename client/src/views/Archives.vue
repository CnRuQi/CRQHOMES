<template>
  <div class="archives">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <h1 class="page-title" data-aos="fade-down">归档</h1>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
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
                  :to="`/post/${post.id}`"
                  class="archive-item"
                >
                  <span class="item-date">{{ formatDate(post.created_at, 'MM-DD') }}</span>
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

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getArchives } from '@/api/post'
import { formatDate } from '@/assets/js/utils'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

const loading = ref(false)
const archives = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await getArchives()
    archives.value = res.data.archives
  } catch (error) {
    console.error('获取归档失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.archives {
  min-height: 100vh;
}

.main-content {
  padding-top: calc(var(--header-height) + var(--spacing-2xl));
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
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
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

@media (max-width: 768px) {
  .archive-item {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>
