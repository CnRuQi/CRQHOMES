<template>
  <div class="post-detail">
    <!-- 阅读进度：只在正文页出现的一条 2px 墨线，贴在页头下缘。
         挂到 body 上，避免被路由过渡的 transform 变成「相对内容区固定」。 -->
    <Teleport to="body">
      <div
        v-if="post"
        class="read-progress"
        aria-hidden="true"
        :style="{ '--progress': progress }"
      ></div>
    </Teleport>

    <div class="view-content">
      <div class="container">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>

        <template v-else-if="post">
          <article class="article">
            <!-- 文章头部：居中做「扉页」，正文再收回单栏宽度 -->
            <header class="article-header" data-reveal="up">
              <p class="article-meta">
                <span v-if="post.category_name" class="meta-category">
                  {{ post.category_name }}
                </span>
                <span v-if="post.category_name" class="meta-dot" aria-hidden="true"></span>
                <span class="meta-date">{{
                  formatDate(post.published_at || post.created_at)
                }}</span>
                <span class="meta-dot" aria-hidden="true"></span>
                <span class="meta-views">
                  <Icon name="views" :size="15" />
                  {{ post.views }} 次阅读
                </span>
              </p>

              <h1 class="article-title" data-reveal="mask">{{ post.title }}</h1>

              <div v-if="post.tags && post.tags.length" class="article-tags" data-reveal="fade">
                <span v-for="tag in post.tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
            </header>

            <!-- 封面：滚动离场时轻微上浮（scroll-driven，渐进增强） -->
            <div v-if="post.cover_image" class="article-cover" data-reveal="blur">
              <img
                v-if="!coverImageFailed"
                :src="post.cover_image"
                :alt="post.title"
                @error="handleCoverError"
              />
              <div v-else class="image-fallback" role="img" aria-label="封面图片加载失败">
                <Icon name="camera" :size="28" />
                <span>封面图片加载失败</span>
              </div>
            </div>

            <!-- 正文：.prose 排版系统由 main.css 统一提供，
                 通过 class 透传到 MarkdownContent 的根节点，
                 对其直接子元素（章节标题）生效 -->
            <div class="article-content">
              <MarkdownContent class="prose" :source="post.content" />
            </div>

            <!-- 文章底部 -->
            <footer class="article-footer">
              <p class="article-info">最后更新于 {{ formatDate(post.updated_at) }}</p>

              <button type="button" class="btn btn-secondary" @click="goBack">← 返回</button>
            </footer>
          </article>
        </template>

        <EmptyState
          v-else
          icon="alert"
          text="文章不存在"
          hint="链接可能已经失效，或这篇文章已被删除"
        >
          <router-link to="/" class="btn btn-primary">返回首页</router-link>
        </EmptyState>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post'
import { useSeo } from '@/composables/useSeo'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/assets/js/utils'
import Icon from '@/components/Icon.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()
const toast = useToast()

// 初值为 true：onMounted 发起请求前若已完成首次渲染，会先走 v-else 分支闪一帧「文章不存在」
const loading = ref(true)
const post = ref(null)
const coverImageFailed = ref(false)

// 阅读进度：0–1 的比值写进 CSS 变量，由 transform 绘制（不触发重排）。
// 滚动事件用 rAF 合并，一帧最多写一次变量。
const progress = ref(0)
let progressTicking = false

function updateProgress() {
  const root = document.documentElement
  const max = root.scrollHeight - root.clientHeight
  progress.value = max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 0
}

function handleScroll() {
  if (progressTicking) return
  progressTicking = true
  requestAnimationFrame(() => {
    progressTicking = false
    updateProgress()
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})

// setup 顶层调用：随数据响应式更新，组件卸载时自动清理 SEO meta
useSeo({
  title: computed(() => post.value?.title || ''),
  description: computed(() => post.value?.summary || post.value?.title || ''),
  keywords: computed(() => (post.value?.tags || []).join(',')),
  image: computed(() => post.value?.cover_image || ''),
  url: computed(() => window.location.href),
  type: 'article',
})

function goBack() {
  // 无历史记录（直接访问/新标签页打开）时回首页，避免按钮无效
  if (router.options.history.state.back) {
    router.back()
  } else {
    router.push('/')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await postStore.fetchPost(route.params.slug)
    coverImageFailed.value = false
    post.value = res.data.post
  } catch (error) {
    console.error('获取文章失败:', error)
    toast.error('加载文章失败')
  } finally {
    loading.value = false
    // 正文渲染完成后高度才确定，重新量一次进度
    handleScroll()
  }
})

function handleCoverError() {
  coverImageFailed.value = true
}
</script>

<style scoped>
/* ============================================================
   文章页：一纸长卷
   头部居中如扉页，正文收回 40rem 的阅读栏宽；
   不做圆角卡片＋投影（那是通用模板的样子），
   层级交给字号、行高与发丝线。
   ============================================================ */
.post-detail {
  min-height: 60vh;
}

/* 阅读进度：页头下缘的一条墨线，长度即读到的位置。
   用 transform 而不是 width，滚动时只走合成层；纸上不印。 */
.read-progress {
  position: fixed;
  top: var(--header-height);
  left: 0;
  z-index: calc(var(--z-header) - 1);
  width: 100%;
  height: 2px;
  background: linear-gradient(
    to right,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 45%, transparent)
  );
  transform: scaleX(var(--progress, 0));
  transform-origin: left center;
  pointer-events: none;
}

.article {
  max-width: var(--max-width-narrow);
  margin: 0 auto;
}

/* ---------- 扉页 ---------- */
.article-header {
  margin-bottom: var(--space-10);
  text-align: center;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--text-muted);
  font-size: var(--fs-caption);
}

.meta-category {
  padding: 0.2rem var(--space-3);
  background: var(--tint-primary-weak);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  color: var(--color-primary-dark);
  font-size: var(--fs-micro);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--border-strong);
}

.meta-date,
.meta-views {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-variant-numeric: tabular-nums;
}

.meta-views :deep(.icon) {
  opacity: 0.72;
}

.article-title {
  margin: var(--space-5) auto;
  max-width: 22ch;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-article);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  text-wrap: balance;
  overflow-wrap: break-word;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
}

/* ---------- 封面 ---------- */
.article-cover {
  margin-bottom: var(--space-12);
  /* 加载中/失败时不再塌成一条白边：纸面渐变先撑住场子，
     图片就位后自然接管（与卡片封面同一种语言） */
  min-height: 12rem;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  height: auto;
}

/* 封面滚动视差：滚动离场时图以 1.06 的比例缓慢下移，
   制造「图比纸慢半拍」的深度。scroll-driven 动画零 JS，
   不支持的浏览器自动静态显示。 */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .article-cover img {
      animation: coverParallax linear both;
      animation-timeline: view();
      animation-range: exit 0% exit 100%;
    }
  }
}

@keyframes coverParallax {
  from {
    transform: scale(1.06) translateY(0);
  }
  to {
    transform: scale(1.06) translateY(-4%);
  }
}

.image-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 12rem;
  color: var(--text-disabled);
  font-size: var(--fs-caption);
  /* 与卡片无封面占位同一种纸面语言，不是一块突兀的白 */
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

/* ---------- 正文 ---------- */
.article-content {
  max-width: var(--measure);
  margin-inline: auto;
}

/* ---------- 尾注 ---------- */
.article-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  max-width: var(--measure);
  margin: var(--space-12) auto 0;
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-hairline);
}

.article-info {
  color: var(--text-disabled);
  font-size: var(--fs-micro);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .article-header {
    margin-bottom: var(--space-8);
  }

  .article-title {
    max-width: none;
  }

  .article-cover {
    margin-bottom: var(--space-8);
    border-radius: var(--radius-md);
  }

  .article-footer {
    margin-top: var(--space-10);
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
}
</style>
