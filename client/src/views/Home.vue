<template>
  <div class="home">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <!-- Hero 区域 -->
        <section class="hero" data-aos="fade-down">
          <div class="hero-decoration">
            <span class="deco-line"></span>
            <span class="deco-dot"></span>
            <span class="deco-line"></span>
          </div>
          <h1 class="hero-title">
            <span class="gradient-text">Blog</span>
          </h1>
          <p class="hero-subtitle">记录生活，分享技术</p>
          <div class="hero-decoration">
            <span class="deco-line"></span>
            <span class="deco-dot"></span>
            <span class="deco-line"></span>
          </div>
        </section>

        <!-- 文章列表 -->
        <section class="posts-section">
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
          </div>

          <template v-else>
            <div v-if="posts.length" class="posts-grid">
              <PostCard
                v-for="(post, index) in posts"
                :key="post.id"
                :post="post"
                :index="index"
              />
            </div>

            <div v-else class="empty">
              <div class="empty-icon">📝</div>
              <p>暂无文章</p>
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
          </template>
        </section>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePostStore } from '@/stores/post'
import Navbar from '@/components/Navbar.vue'
import PostCard from '@/components/PostCard.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const postStore = usePostStore()

const loading = ref(false)
const posts = ref([])
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
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  fetchPosts(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(() => route.params.slug, () => {
  fetchPosts(1)
})

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.main-content {
  padding-top: calc(var(--header-height) + var(--spacing-2xl));
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
  background: linear-gradient(90deg, transparent, rgba(150, 164, 138, 0.4), transparent);
}

.deco-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0.6;
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
  background: linear-gradient(135deg, #7B8B6F 0%, #96A48B 30%, #D4B0B5 70%, #E2C4C6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% {
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
  .hero-title {
    font-size: 2.5rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
