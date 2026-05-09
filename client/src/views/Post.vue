<template>
  <div class="post-detail">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>

        <template v-else-if="post">
          <article class="article" data-aos="fade-up">
            <!-- 文章头部 -->
            <header class="article-header">
              <div class="article-meta">
                <span v-if="post.category_name" class="meta-category">
                  {{ post.category_name }}
                </span>
                <span class="meta-date">{{ formatDate(post.published_at || post.created_at) }}</span>
                <span class="meta-views">👁 {{ post.views }} 次阅读</span>
              </div>

              <h1 class="article-title">{{ post.title }}</h1>

              <div class="article-tags" v-if="post.tags && post.tags.length">
                <span v-for="tag in post.tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
            </header>

            <!-- 封面图 -->
            <div class="article-cover" v-if="post.cover_image">
              <img :src="post.cover_image" :alt="post.title" />
            </div>

            <!-- 文章内容 -->
            <div class="article-content" v-html="renderedContent"></div>

            <!-- 文章底部 -->
            <footer class="article-footer">
              <div class="article-info">
                <p>最后更新于 {{ formatDate(post.updated_at) }}</p>
              </div>

              <div class="article-actions">
                <button class="btn btn-secondary" @click="goBack">
                  ← 返回
                </button>
              </div>
            </footer>
          </article>
        </template>

        <div v-else class="empty">
          <div class="empty-icon">😕</div>
          <p>文章不存在</p>
          <router-link to="/" class="btn btn-primary mt-md">
            返回首页
          </router-link>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post'
import { formatDate } from '@/assets/js/utils'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()

const loading = ref(false)
const post = ref(null)

// 配置 marked
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (e) {
        // ignore
      }
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return marked(post.value.content)
})

function goBack() {
  router.back()
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await postStore.fetchPost(route.params.id)
    post.value = res.data.post
  } catch (error) {
    console.error('获取文章失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.post-detail {
  min-height: 100vh;
}

.main-content {
  padding-top: calc(var(--header-height) + var(--spacing-2xl));
  padding-bottom: var(--spacing-2xl);
}

.article {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  padding: var(--spacing-2xl);
  border: 1px solid rgba(120, 122, 116, 0.15);
  box-shadow: var(--shadow-md);
}

.article-header {
  margin-bottom: var(--spacing-2xl);
}

.article-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  color: var(--text-muted);
  font-size: 0.9rem;
}

.meta-category {
  padding: 4px 14px;
  background: rgba(163, 166, 156, 0.15);
  border-radius: 20px;
  color: var(--color-primary-dark);
  font-weight: 500;
}

.meta-date,
.meta-views {
  color: var(--text-muted);
}

.article-title {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
  font-family: var(--font-display);
}

.article-tags {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.article-cover {
  margin-bottom: var(--spacing-2xl);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.article-cover img {
  width: 100%;
  height: auto;
  display: block;
}

.article-content {
  font-size: 1.05rem;
  line-height: 1.9;
  color: var(--text-secondary);
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4) {
  margin-top: 2em;
  margin-bottom: 1em;
  font-weight: 600;
  color: var(--text-primary);
}

.article-content :deep(h2) {
  font-size: 1.5rem;
  padding-bottom: 0.5em;
  border-bottom: 1px solid rgba(120, 122, 116, 0.2);
}

.article-content :deep(h3) {
  font-size: 1.25rem;
}

.article-content :deep(p) {
  margin-bottom: 1.5em;
}

.article-content :deep(a) {
  color: var(--color-primary-dark);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.article-content :deep(img) {
  max-width: 100%;
  border-radius: var(--border-radius);
  margin: 1.5em 0;
  box-shadow: var(--shadow-sm);
}

.article-content :deep(blockquote) {
  padding: 1em 1.5em;
  border-left: 4px solid var(--color-primary);
  background: rgba(163, 166, 156, 0.08);
  border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  margin: 1.5em 0;
  color: var(--text-secondary);
}

.article-content :deep(code) {
  padding: 2px 8px;
  background: rgba(163, 166, 156, 0.12);
  border-radius: 4px;
  font-size: 0.9em;
  font-family: var(--font-mono);
  color: var(--text-primary);
}

.article-content :deep(pre) {
  margin: 1.5em 0;
  padding: 1.5em;
  background: rgba(45, 46, 43, 0.06);
  border-radius: var(--border-radius);
  border: 1px solid rgba(120, 122, 116, 0.12);
  overflow-x: auto;
}

.article-content :deep(pre code) {
  padding: 0;
  background: none;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 2em;
  margin-bottom: 1.5em;
}

.article-content :deep(li) {
  margin-bottom: 0.5em;
}

.article-content :deep(hr) {
  border: none;
  border-top: 1px solid rgba(120, 122, 116, 0.2);
  margin: 2em 0;
}

.article-footer {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid rgba(120, 122, 116, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.article-info {
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .article {
    padding: var(--spacing-lg);
    border-radius: 16px;
  }

  .article-title {
    font-size: 1.8rem;
  }

  .article-meta {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .article-footer {
    flex-direction: column;
    gap: var(--spacing-md);
  }
}
</style>
