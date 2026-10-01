<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-card--lead glass-card" data-reveal="up">
        <div class="stat-icon">
          <Icon name="article" :size="28" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalPosts }}</div>
          <div class="stat-label">文章总数</div>
        </div>
      </div>

      <div class="stat-card glass-card" data-reveal="up">
        <div class="stat-icon">
          <Icon name="category" :size="24" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalCategories }}</div>
          <div class="stat-label">分类数量</div>
        </div>
      </div>

      <div class="stat-card glass-card" data-reveal="up">
        <div class="stat-icon">
          <Icon name="views" :size="24" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalViews }}</div>
          <div class="stat-label">总阅读量</div>
        </div>
      </div>

      <div class="stat-card glass-card" data-reveal="up">
        <div class="stat-icon">
          <Icon name="pinyes" :size="24" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ topPosts }}</div>
          <div class="stat-label">置顶文章</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="recent-posts glass-card" data-reveal="up">
        <h2 class="section-title">最近文章</h2>
        <div class="posts-list">
          <div v-for="post in recentPosts" :key="post.id" class="post-item">
            <div class="post-info">
              <router-link :to="`/admin/posts/${post.id}/edit`" class="post-title">
                {{ post.title }}
              </router-link>
              <span class="post-date">{{ formatDate(post.published_at || post.created_at) }}</span>
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

      <div class="quick-actions glass-card" data-reveal="up">
        <h2 class="section-title">快捷操作</h2>
        <div class="actions-list">
          <router-link to="/admin/posts/create" class="action-item">
            <Icon name="edit" :size="20" />
            <span class="action-text">写新文章</span>
          </router-link>
          <router-link to="/admin/posts" class="action-item">
            <Icon name="list" :size="20" />
            <span class="action-text">管理文章</span>
          </router-link>
          <router-link to="/admin/categories" class="action-item">
            <Icon name="folder" :size="20" />
            <span class="action-text">管理分类</span>
          </router-link>
          <router-link to="/" class="action-item">
            <Icon name="external" :size="20" />
            <span class="action-text">访问前台</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getStats } from '@/api/post'
import { getCategories } from '@/api/category'
import { getAllPosts } from '@/api/post'
import { formatDate } from '@/assets/js/utils'
import { useToast } from '@/composables/useToast'
import { useCountUp } from '@/composables/useCountUp'
import Icon from '@/components/Icon.vue'

const toast = useToast()

const stats = ref({
  totalPosts: 0,
  totalCategories: 0,
  totalViews: 0,
  topPosts: 0,
})

const recentPosts = ref([])

// 统计数字计数滚动动画
const totalPosts = useCountUp(computed(() => stats.value.totalPosts))
const totalCategories = useCountUp(computed(() => stats.value.totalCategories))
const totalViews = useCountUp(computed(() => stats.value.totalViews))
const topPosts = useCountUp(computed(() => stats.value.topPosts))

onMounted(async () => {
  try {
    const [statsRes, postsRes, categoriesRes] = await Promise.all([
      getStats(),
      getAllPosts({ pageSize: 5, sort: 'recent' }),
      getCategories(),
    ])

    stats.value.totalPosts = statsRes.data.totalPosts
    stats.value.totalViews = statsRes.data.totalViews
    stats.value.topPosts = statsRes.data.topPosts
    recentPosts.value = postsRes.data.list
    stats.value.totalCategories = categoriesRes.data.categories.length
  } catch (error) {
    console.error('获取统计数据失败:', error)
    toast.error('加载统计数据失败')
  }
})
</script>

<style scoped>
/* ============================================================
   仪表盘：先看见「体量」，再看见「要做什么」。
   文章总数占满一整行作为当前第一眼，
   其余三项退回次级卡片——避免四块等重的格子。
   ============================================================ */
.dashboard {
  max-width: var(--max-width);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 0;
  padding: var(--space-6);
}

.stat-card--lead {
  --stat-icon-size: 3.25rem;
  grid-column: 1 / -1;
  background: linear-gradient(115deg, var(--tint-primary) 0%, transparent 60%);
  border-color: var(--border-subtle);
}

.stat-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: var(--stat-icon-size, 2.75rem);
  height: var(--stat-icon-size, 2.75rem);
  background: var(--tint-primary-weak);
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  color: var(--color-primary-dark);
}

.stat-info {
  min-width: 0;
}

.stat-value {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-stat);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
  font-variant-numeric: tabular-nums;
}

.stat-card--lead .stat-value {
  font-size: var(--fs-stat-lead);
}

.stat-label {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--fs-caption);
  letter-spacing: var(--tracking-wide);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--space-5);
}

.recent-posts,
.quick-actions {
  min-width: 0;
  padding: var(--space-6);
  background: var(--bg-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}

.section-title {
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-hairline);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
}

.posts-list,
.actions-list {
  display: flex;
  flex-direction: column;
}

.post-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-inline: calc(var(--space-3) * -1);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  transition: background-color var(--dur-fast) var(--ease-standard);
}

.post-item:hover {
  background: var(--tint-primary-weak);
}

.post-info {
  flex: 1;
  min-width: 0;
}

.post-title {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--text-primary);
  font-size: var(--fs-caption);
  font-weight: var(--weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease-standard);
}

.post-title:hover {
  color: var(--color-primary-dark);
}

.post-date {
  color: var(--text-disabled);
  font-size: var(--fs-micro);
  font-variant-numeric: tabular-nums;
}

.post-status {
  flex: 0 0 auto;
}

.empty-state {
  padding: var(--space-10) var(--space-4);
  color: var(--text-muted);
  font-size: var(--fs-caption);
  text-align: center;
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-inline: calc(var(--space-3) * -1);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  text-decoration: none;
  transition: background-color var(--dur-fast) var(--ease-standard);
}

.action-item:hover {
  background: var(--tint-primary-weak);
}

/* 悬停时只有图标向前挪半步，行本身不动 */
.action-item :deep(.icon) {
  color: var(--text-muted);
  transition: transform var(--dur-normal) var(--ease-spring);
}

.action-item:hover :deep(.icon) {
  color: var(--color-primary-dark);
  transform: translateX(3px);
}

.action-text {
  font-size: var(--fs-caption);
  font-weight: var(--weight-medium);
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: var(--space-3);
  }

  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .recent-posts,
  .quick-actions {
    padding: var(--space-4);
  }
}
</style>
