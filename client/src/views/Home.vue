<template>
  <div class="home">
    <main class="main-content">
      <div class="container">
        <!-- Hero 区域 - 仅首页显示 -->
        <section v-if="!route.params.slug" class="hero" data-aos="fade-down">
          <div class="hero-decoration">
            <span class="deco-line"></span>
            <span class="deco-dot"></span>
            <span class="deco-line"></span>
          </div>
          <h1 class="hero-title">
            <span class="gradient-text">披花沐雪</span>
          </h1>
          <p class="hero-subtitle">One Last Kiss for the Beautiful World</p>
          <div class="hero-decoration">
            <span class="deco-line"></span>
            <span class="deco-dot"></span>
            <span class="deco-line"></span>
          </div>
        </section>

        <!-- 文章列表 -->
        <section class="posts-section">
          <div v-if="loading" class="posts-grid">
            <SkeletonCard v-for="i in 6" :key="i" />
          </div>

          <template v-else>
            <div v-if="posts.length" class="posts-grid">
              <PostCard v-for="(post, index) in posts" :key="post.id" :post="post" :index="index" />
            </div>

            <EmptyState v-else icon="article" text="暂无文章" />

            <!-- 分页 -->
            <Pagination :pagination="pagination" @change="changePage" />
          </template>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post'
import { restoreListScroll } from '@/assets/js/utils'
import PostCard from '@/components/PostCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import Pagination from '@/components/Pagination.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()

const loading = ref(false)
const posts = ref([])
const pagination = ref({
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
})

async function fetchPosts(page = 1) {
  loading.value = true
  try {
    const params = { page, pageSize: 10 }
    if (route.params.slug) {
      params.category = route.params.slug
    }
    await postStore.fetchPosts(params)
    posts.value = postStore.posts
    pagination.value = postStore.pagination
  } catch (error) {
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  fetchPosts(page)
  // 页码写入 URL：返回列表时才能加载相同页内容，滚动位置恢复才准确
  const query = { ...route.query }
  if (page > 1) {
    query.page = page
  } else {
    delete query.page
  }
  router.replace({ query })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  // 初始页码从 URL 读取（返回列表时恢复原页码内容）
  const initPage = parseInt(route.query.page, 10) || 1
  await fetchPosts(initPage)
  await nextTick()
  // 数据渲染完成后精确恢复滚动位置（修正骨架屏期间页面高度不足导致的错位）
  restoreListScroll(route.fullPath)
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.main-content {
  padding-bottom: var(--spacing-2xl);
}

.hero {
  text-align: center;
  padding: var(--spacing-3xl, 64px) 0 var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
  position: relative;
}

.hero-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: var(--spacing-lg) 0;
}

.deco-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(163, 166, 156, 0.4), transparent);
}

.deco-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0.5;
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 800;
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-display);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.gradient-text {
  background: linear-gradient(135deg, #82857c 0%, #a3a69c 40%, #c4c6bf 70%, #dedfd9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: gradient-shift 10s ease infinite;
}

@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.hero-subtitle {
  color: var(--text-muted);
  font-size: 1.15rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  font-family: var(--font-sans);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

@media (max-width: 768px) {
  .hero {
    padding: var(--spacing-xl) 0 var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .hero-title {
    font-size: 1.8rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 0.85rem;
    letter-spacing: 0.05em;
  }

  .deco-line {
    width: 40px;
  }
}
</style>
