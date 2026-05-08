<template>
  <div class="home">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <!-- Hero 区域 -->
        <section class="hero" data-aos="fade-down">
          <h1 class="hero-title">
            <span class="gradient-text">Blog</span>
          </h1>
          <p class="hero-subtitle">记录生活，分享技术</p>
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
  padding: var(--spacing-2xl) 0;
  margin-bottom: var(--spacing-2xl);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: var(--spacing-md);
}

.gradient-text {
  background: linear-gradient(135deg, #7B8B6F, #D4B0B5, #96A48B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  color: var(--text-secondary);
  font-size: 1.2rem;
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
