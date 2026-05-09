<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card glass-card" data-aos="fade-up" data-aos-delay="0">
        <div class="stat-icon">📝</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalPosts }}</div>
          <div class="stat-label">文章总数</div>
        </div>
      </div>

      <div class="stat-card glass-card" data-aos="fade-up" data-aos-delay="100">
        <div class="stat-icon">📁</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalCategories }}</div>
          <div class="stat-label">分类数量</div>
        </div>
      </div>

      <div class="stat-card glass-card" data-aos="fade-up" data-aos-delay="200">
        <div class="stat-icon">👁</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalViews }}</div>
          <div class="stat-label">总阅读量</div>
        </div>
      </div>

      <div class="stat-card glass-card" data-aos="fade-up" data-aos-delay="300">
        <div class="stat-icon">📌</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.topPosts }}</div>
          <div class="stat-label">置顶文章</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="recent-posts glass-card" data-aos="fade-up">
        <h3 class="section-title">最近文章</h3>
        <div class="posts-list">
          <div
            v-for="post in recentPosts"
            :key="post.id"
            class="post-item"
          >
            <div class="post-info">
              <router-link :to="`/admin/posts/${post.id}/edit`" class="post-title">
                {{ post.title }}
              </router-link>
              <span class="post-date">{{ formatDate(post.created_at) }}</span>
            </div>
            <div class="post-status">
              <span :class="['status-tag', post.status ? 'published' : 'draft']">
                {{ post.status ? '已发布' : '草稿' }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="!recentPosts.length" class="empty-state">
          <p>暂无文章</p>
          <router-link to="/admin/posts/create" class="btn btn-primary btn-sm mt-md">
            写文章
          </router-link>
        </div>
      </div>

      <div class="quick-actions glass-card" data-aos="fade-up" data-aos-delay="100">
        <h3 class="section-title">快捷操作</h3>
        <div class="actions-list">
          <router-link to="/admin/posts/create" class="action-item">
            <span class="action-icon">✏️</span>
            <span class="action-text">写新文章</span>
          </router-link>
          <router-link to="/admin/posts" class="action-item">
            <span class="action-icon">📋</span>
            <span class="action-text">管理文章</span>
          </router-link>
          <router-link to="/admin/categories" class="action-item">
            <span class="action-icon">📂</span>
            <span class="action-text">管理分类</span>
          </router-link>
          <router-link to="/" class="action-item">
            <span class="action-icon">🌐</span>
            <span class="action-text">访问前台</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAllPosts } from '@/api/post'
import { getCategories } from '@/api/category'
import { formatDate } from '@/assets/js/utils'

const stats = ref({
  totalPosts: 0,
  totalCategories: 0,
  totalViews: 0,
  topPosts: 0
})

const recentPosts = ref([])

onMounted(async () => {
  try {
    // 获取文章统计
    const postsRes = await getAllPosts({ pageSize: 100 })
    const posts = postsRes.data.list
    stats.value.totalPosts = postsRes.data.pagination.total
    stats.value.totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0)
    stats.value.topPosts = posts.filter(p => p.is_top).length
    recentPosts.value = posts.slice(0, 5)

    // 获取分类统计
    const categoriesRes = await getCategories()
    stats.value.totalCategories = categoriesRes.data.categories.length
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(120, 122, 116, 0.15);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

/* 最近文章卡片 */
.recent-posts {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(120, 122, 116, 0.15);
  padding: var(--spacing-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* 快捷操作卡片 */
.quick-actions {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(120, 122, 116, 0.15);
  padding: var(--spacing-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid rgba(120, 122, 116, 0.15);
  color: var(--text-primary);
}

.posts-list {
  display: flex;
  flex-direction: column;
}

.post-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: transparent;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(163, 166, 156, 0.08);
}

.post-item:last-child {
  border-bottom: none;
}

.post-item:hover {
  background: rgba(163, 166, 156, 0.06);
}

.post-info {
  flex: 1;
}

.post-title {
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
  display: block;
  transition: color 0.2s ease;
}

.post-title:hover {
  color: var(--color-primary-dark);
}

.post-date {
  color: var(--text-disabled);
  font-size: 0.8rem;
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

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-muted);
}

.actions-list {
  display: flex;
  flex-direction: column;
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: transparent;
  color: var(--text-primary);
  transition: all 0.2s ease;
  text-decoration: none;
  border-bottom: 1px solid rgba(163, 166, 156, 0.1);
}

.action-item:last-child {
  border-bottom: none;
}

.action-item:hover {
  background: rgba(163, 166, 156, 0.06);
  transform: translateX(4px);
}

.action-icon {
  font-size: 1.2rem;
}

.action-text {
  font-weight: 500;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
