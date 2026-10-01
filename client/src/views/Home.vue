<template>
  <div class="home">
    <div class="view-content">
      <div class="container">
        <!-- 首页题头：仅首页渲染，分类页改渲染分类题头。
             标题逐字入场，右上一团淡苔墨晕缓慢呼吸。 -->
        <section v-if="!route.params.slug" class="hero">
          <div class="hero-aura" aria-hidden="true"></div>
          <div class="hero-main">
            <p class="hero-eyebrow">
              <span class="eyebrow-rule" aria-hidden="true"></span>
              随笔 · 长文 · 记录
            </p>
            <h1 class="hero-title" aria-label="披花沐雪">
              <span
                v-for="(char, i) in heroChars"
                :key="i"
                class="hero-char"
                :style="{ '--char-i': i }"
                aria-hidden="true"
                >{{ char }}</span
              >
            </h1>
            <p class="hero-subtitle">One Last Kiss for the Beautiful World</p>
            <div class="hero-rule" aria-hidden="true">
              <span class="deco-line"></span>
              <span class="deco-dot"></span>
              <span class="deco-line"></span>
            </div>
            <a v-magnetic="0.32" class="hero-cue" href="#posts">浏览文章</a>
          </div>
        </section>

        <section v-else class="category-head">
          <p class="hero-eyebrow" data-reveal="fade">
            <span class="eyebrow-rule" aria-hidden="true"></span>
            分类
          </p>
          <h1 class="category-title" data-reveal="up">{{ categoryLabel }}</h1>
          <p v-if="pagination.total" class="category-count">共 {{ pagination.total }} 篇文章</p>
        </section>

        <!-- 文章列表 -->
        <section id="posts" class="posts-section">
          <div v-if="loading" class="posts-grid grid-auto">
            <SkeletonCard v-for="i in 9" :key="i" />
          </div>

          <template v-else>
            <p v-if="loadError" class="load-error" role="alert">文章加载失败，请稍后重试</p>

            <template v-else>
              <div v-if="posts.length" class="posts-grid grid-auto">
                <PostCard v-for="post in posts" :key="post.id" :post="post" />
              </div>

              <EmptyState v-else icon="article" text="暂无文章" />

              <!-- 分页 -->
              <Pagination :pagination="pagination" @change="changePage" />
            </template>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post'
import { useToast } from '@/composables/useToast'
import { getCategories } from '@/api/category'
import { restoreListScroll } from '@/assets/js/utils'
import PostCard from '@/components/PostCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import Pagination from '@/components/Pagination.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()
const toast = useToast()

const loading = ref(false)
const loadError = ref(false)
const posts = ref([])
const categoryName = ref('')
const pagination = ref({
  total: 0,
  page: 1,
  pageSize: 18,
  totalPages: 0,
})

const categoryLabel = computed(() => categoryName.value || route.params.slug || '分类')

// 站名逐字入场：拆成单字 span，延迟由 --char-i 决定（样式层换算）
const heroChars = '披花沐雪'.split('')

// 请求序号：连续翻页时丢弃过期响应，避免内容与 URL 页码脱节
let fetchSeq = 0
let requestedPage = 0

async function fetchPosts(page = 1) {
  // 越界页码 clamp 到有效范围（如直接访问 ?page=999）
  const totalPages = pagination.value.totalPages
  if (totalPages > 0) page = Math.min(Math.max(1, page), totalPages)
  const seq = ++fetchSeq
  requestedPage = page
  loading.value = true
  loadError.value = false
  try {
    const params = { page, pageSize: 18 }
    if (route.params.slug) {
      params.category = route.params.slug
    }
    await postStore.fetchPosts(params)
    if (seq !== fetchSeq) return
    posts.value = postStore.posts
    pagination.value = postStore.pagination
  } catch (error) {
    console.error('获取文章列表失败:', error)
    if (seq !== fetchSeq) return
    loadError.value = true
    toast.error('加载文章失败，请稍后重试')
  } finally {
    if (seq === fetchSeq) loading.value = false
  }
}

// 分类名只是题头的装饰性补充：取不到就退化为显示 slug，绝不影响列表本身
async function resolveCategoryName() {
  const slug = route.params.slug
  if (!slug) return
  try {
    const res = await getCategories()
    const list = res?.data?.categories || []
    const hit = list.find(
      (item) => item && (item.slug === slug || String(item.id) === slug || item.name === slug)
    )
    if (hit) categoryName.value = hit.name
  } catch {
    /* 分类名缺失不影响列表 */
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
  resolveCategoryName()
  // 初始页码从 URL 读取（返回列表时恢复原页码内容）
  const initPage = parseInt(route.query.page, 10) || 1
  await fetchPosts(initPage)
  await nextTick()
  // 数据渲染完成后精确恢复滚动位置（修正骨架屏期间页面高度不足导致的错位）
  restoreListScroll(route.fullPath)
})

// 浏览器前进/后退翻页时同步（changePage 已先更新 requestedPage，不会重复请求）
watch(
  () => route.query.page,
  (page) => {
    const target = parseInt(page, 10) || 1
    if (target !== requestedPage) fetchPosts(target)
  }
)
</script>

<style scoped>
/* ============================================================
   首页题头
   不对称的编辑版式：正文压在左侧，右侧留一枚朱印。
   第一屏自管入场（逐字揭幕 + 墨晕呼吸 + 错峰淡入），
   不走全局 reveal 系统——hero 是叙事起点，值得一套专属编排。
   ============================================================ */
.hero {
  position: relative;
  /* 独立 stacking context：氛围层(z:-1)只沉到 hero 内容之下，
     而不是沉到 .app-wrapper 的不透明背景之下被整块吃掉 */
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  min-height: min(72vh, 680px);
  padding: clamp(2.5rem, 8vw, 6rem) 0 var(--space-section-sm);
  margin-bottom: var(--space-section-sm);
  border-bottom: 1px solid var(--border-hairline);
}

/* 氛围层：右上一团极淡的苔墨，随时间缓慢呼吸。
   呼吸幅度由 --aura-min/--aura-max 变量驱动（keyframes 引用变量，
   暗色/移动端只需覆写变量即可整体调淡）；只动 opacity——
   blur 元素一旦参与 transform 动画就会逐帧重新光栅化，纯 opacity 则走合成。 */
.hero-aura {
  --aura-min: 0.42;
  --aura-max: 0.62;
  position: absolute;
  top: -18%;
  right: -12%;
  z-index: -1;
  width: clamp(24rem, 46vw, 42rem);
  aspect-ratio: 1;
  background: radial-gradient(
    circle at 42% 42%,
    var(--tint-primary-strong) 0%,
    var(--tint-primary) 34%,
    transparent 68%
  );
  border-radius: 50%;
  filter: blur(48px);
  opacity: var(--aura-min);
  animation: auraBreathe 9s var(--ease-in-out) infinite;
  pointer-events: none;
}

[data-theme='dark'] .hero-aura {
  /* 暗色纸面上亮雾更「显」，整体再压一档才守得住克制的调性 */
  --aura-min: 0.28;
  --aura-max: 0.44;
}

@keyframes auraBreathe {
  0%,
  100% {
    opacity: var(--aura-min);
  }
  50% {
    opacity: var(--aura-max);
  }
}

.hero-main {
  min-width: 0;
}

/* ---------- 编排 1：眉标 ---------- */
.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  color: var(--text-muted);
  font-size: var(--fs-micro);
  letter-spacing: var(--tracking-widest);
  animation: heroRise var(--dur-slower) var(--ease-emphasis) 80ms both;
}

.eyebrow-rule {
  width: 1.75rem;
  height: 1px;
  background: var(--color-primary);
}

/* ---------- 编排 2：逐字揭幕的站名 ----------
   每个字从 clip 揭示 + 上移 + 轻微右倾中落定，
   延迟 = 240ms 起步 + 90ms/字；总时长 ≈ 0.9s，读完即稳。 */
.hero-title {
  margin-bottom: var(--space-4);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: clamp(3.25rem, 9.5vw, 6.75rem);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.hero-char {
  display: inline-block;
  animation: charIn var(--dur-reveal) var(--ease-emphasis) calc(240ms + var(--char-i, 0) * 90ms)
    both;
}

@keyframes charIn {
  from {
    opacity: 0;
    transform: translateY(0.28em) rotate(2.5deg);
    clip-path: inset(0 0 100% 0);
  }
  to {
    opacity: 1;
    transform: none;
    clip-path: inset(0 0 -12% 0);
  }
}

@keyframes heroRise {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hero-subtitle {
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: var(--fs-lead);
  font-style: italic;
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-wide);
  animation: heroRise var(--dur-slower) var(--ease-emphasis) 560ms both;
}

.hero-rule {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-8);
  animation: heroRise var(--dur-slower) var(--ease-emphasis) 640ms both;
}

.deco-line {
  width: 3rem;
  height: 1px;
  background: var(--border-color);
}

.deco-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
}

/* 「浏览文章」：悬停时短横线向右生长，给出即时的方向反馈；
   磁性由 v-magnetic 提供，这里只管颜色与墨线的形态。 */
.hero-cue {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-8);
  /* 垂直 12px：可点目标 ≥44px，作为 hero 主 CTA 不允许低于触控标准 */
  padding: var(--space-3) 0;
  color: var(--text-muted);
  font-size: var(--fs-micro);
  letter-spacing: var(--tracking-wider);
  transition: color var(--dur-normal) var(--ease-standard);
  animation: heroRise var(--dur-slower) var(--ease-emphasis) 720ms both;
}

.hero-cue::before {
  content: '';
  width: 2.5rem;
  height: 1px;
  background: currentColor;
  transition: width var(--dur-slow) var(--ease-out);
}

.hero-cue::after {
  content: '→';
  margin-left: -0.25rem;
  opacity: 0;
  transform: translateX(-0.4rem);
  transition:
    opacity var(--dur-normal) var(--ease-out),
    transform var(--dur-normal) var(--ease-out);
}

.hero-cue:hover {
  color: var(--color-primary-dark);
}

.hero-cue:hover::before {
  width: 3.25rem;
}

.hero-cue:hover::after {
  opacity: 1;
  transform: none;
}

/* ---------- 分类页题头 ---------- */
.category-head {
  padding-bottom: var(--space-8);
  margin-bottom: var(--space-section-sm);
  border-bottom: 1px solid var(--border-hairline);
}

.category-title {
  margin-bottom: var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-h1);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.category-count {
  color: var(--text-muted);
  font-size: var(--fs-caption);
  letter-spacing: var(--tracking-wide);
  font-variant-numeric: tabular-nums;
}

/* ---------- 列表 ----------
   卡片网格交给全局 .grid-auto（19rem 起跳），
   这里只把行距调宽一档——卡片之间需要比文字更松的呼吸。 */
.posts-grid {
  --grid-gap: var(--space-8);
}

@media (max-width: 768px) {
  .hero {
    min-height: 0;
    padding-top: var(--space-8);
  }

  .hero-aura {
    /* 移动端收拢：小屏上一团大光晕只会让文字发灰 */
    top: -10%;
    right: -30%;
    width: 18rem;
    --aura-min: 0.26;
    --aura-max: 0.4;
    filter: blur(40px);
  }

  .hero-rule,
  .hero-cue {
    margin-top: var(--space-6);
  }

  .posts-grid {
    --grid-gap: var(--space-6);
  }
}

/* 降低动态：hero 的编排退为直接可见（与全局 reveal 的处理同规范） */
@media (prefers-reduced-motion: reduce) {
  .hero-eyebrow,
  .hero-char,
  .hero-subtitle,
  .hero-rule,
  .hero-cue {
    animation: none;
  }

  .hero-aura {
    animation: none;
  }

  .hero-char {
    opacity: 1;
    clip-path: none;
  }
}
</style>
