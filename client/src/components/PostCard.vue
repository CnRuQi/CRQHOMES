<template>
  <article class="post-card" data-reveal="up">
    <router-link :to="`/post/${post.slug || post.id}`" class="card-link">
      <div v-if="post.cover_image && !imageFailed" class="card-cover">
        <img
          ref="imgEl"
          :src="post.cover_image"
          :alt="post.title"
          loading="lazy"
          :class="{ 'is-loaded': imageLoaded }"
          @load="imageLoaded = true"
          @error="handleImageError"
        />
        <span class="cover-pending-icon" aria-hidden="true">✦</span>
        <div class="cover-overlay"></div>
      </div>
      <div
        v-else-if="imageFailed"
        class="card-cover placeholder image-fallback"
        role="img"
        aria-label="封面图片加载失败"
      >
        <Icon name="camera" :size="28" />
        <span>封面图片加载失败</span>
      </div>
      <div v-else class="card-cover placeholder">
        <span class="placeholder-icon" aria-hidden="true"></span>
      </div>

      <div class="card-body">
        <div class="card-meta">
          <span v-if="post.category_name" class="card-category">
            {{ post.category_name }}
          </span>
          <span v-if="post.is_top" class="card-top">置顶</span>
          <span class="card-date">{{ fromNow(post.published_at || post.created_at) }}</span>
        </div>

        <h2 class="card-title">
          <template v-for="(part, i) in titleParts" :key="i">
            <mark v-if="part.highlight">{{ part.text }}</mark>
            <span v-else>{{ part.text }}</span>
          </template>
        </h2>

        <p v-if="post.summary" class="card-summary">
          <template v-for="(part, i) in summaryParts" :key="i">
            <mark v-if="part.highlight">{{ part.text }}</mark>
            <span v-else>{{ part.text }}</span>
          </template>
        </p>

        <div class="card-footer">
          <div v-if="post.tags && post.tags.length" class="card-tags">
            <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
          <div v-else class="card-tags"></div>
          <div class="card-views">
            <Icon name="views" :size="15" />
            <span>{{ formatNumber(post.views) }}</span>
          </div>
        </div>
      </div>
    </router-link>
  </article>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { fromNow, truncate, formatNumber, highlightParts } from '@/assets/js/utils'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  keyword: {
    type: String,
    default: '',
  },
})

const titleParts = computed(() => highlightParts(props.post.title, props.keyword))
const summaryParts = computed(() =>
  highlightParts(truncate(props.post.summary, 100), props.keyword)
)
const imageFailed = ref(false)
const imageLoaded = ref(false)
const imgEl = ref(null)

function handleImageError() {
  imageFailed.value = true
}

// 缓存命中的图片可能在监听挂上之前就完成加载：mount 后补一次状态校对，
// 避免 is-loaded 永远缺席导致图片停在 opacity:0
onMounted(() => {
  if (imgEl.value && imgEl.value.complete && imgEl.value.naturalWidth > 0) {
    imageLoaded.value = true
  }
})

watch(
  () => props.post.cover_image,
  () => {
    imageFailed.value = false
  }
)
</script>

<style scoped>
/* ============================================================
   文章卡片
   层级不靠重阴影，而靠：纸面的深浅差、1px 发丝边、
   以及 hover 时 2px 的抬升——抬得越少，越像纸被风掀起一角。
   ============================================================ */
.post-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--dur-normal) var(--ease-out),
    box-shadow var(--dur-normal) var(--ease-out),
    border-color var(--dur-normal) var(--ease-standard),
    background-color var(--dur-normal) var(--ease-standard);
}

.post-card:hover {
  transform: translateY(-2px);
  background: var(--bg-card-hover);
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}

.card-link {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

/* ---------- 封面 ----------
   用宽高比而非固定高度：卡片在 2 列 / 3 列 / 单列下
   封面比例恒定，不会在宽屏被拉扁。 */
.card-cover {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  /* 与无封面占位同一种纸面语言：加载中/慢网络下不是一块死灰，
     而是泛着苔墨微光的纸底，图片淡入后自然接管 */
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(8%);
  /* 加载完成前透明，onload 后淡入——消除大图 pop-in 的闪现感 */
  opacity: 0;
  transition:
    opacity var(--dur-slow) var(--ease-standard),
    transform var(--dur-slower) var(--ease-out),
    filter var(--dur-slow) var(--ease-standard);
}

.card-cover img.is-loaded {
  opacity: 1;
}

/* 加载中的居中墨点：与无封面的 placeholder-icon 同一视觉语言，
   图片淡入后它被盖在下面，无需移除 */
.cover-pending-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: var(--fs-3xl);
  line-height: 1;
  opacity: 0.28;
  pointer-events: none;
}

.post-card:hover .card-cover img {
  transform: scale(1.04);
  filter: grayscale(0%);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 62%, rgba(24, 25, 22, 0.22) 100%);
}

.card-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.card-cover.image-fallback {
  flex-direction: column;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--fs-micro);
}

.placeholder-icon {
  color: var(--color-primary);
  font-size: var(--fs-3xl);
  line-height: 1;
  opacity: 0.28;
  transition:
    opacity var(--dur-slow) var(--ease-standard),
    transform var(--dur-slow) var(--ease-spring);
}

.placeholder-icon::before {
  content: '✦';
}

/* 无封面时，悬停让这枚墨点微微「亮一下」，替代整块的缩放 */
.post-card:hover .placeholder-icon {
  opacity: 0.5;
  transform: scale(1.06);
}

/* ---------- 正文 ---------- */
.card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--space-6);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  font-size: var(--fs-micro);
  line-height: 1.4;
}

.card-category {
  padding: 0.15rem var(--space-3);
  background: var(--tint-primary);
  color: var(--color-primary-dark);
  border-radius: var(--radius-full);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
}

/* 「置顶」用绛色区分，且向两端混色，保证亮暗两个主题下都够读 */
.card-top {
  padding: 0.15rem var(--space-3);
  background: color-mix(in srgb, var(--rose-600) 14%, transparent);
  color: color-mix(in srgb, var(--rose-600) 84%, var(--text-primary));
  border-radius: var(--radius-full);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
}

.card-date {
  margin-left: auto;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.card-title {
  position: relative;
  margin-bottom: var(--space-4);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-h4);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color var(--dur-normal) var(--ease-standard);
}

/* 悬停时从标题下画出一道短墨线，与章节标头同源 */
.card-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.4rem;
  width: 0;
  height: 1px;
  background: var(--color-primary);
  transition: width var(--dur-slow) var(--ease-out);
}

.post-card:hover .card-title {
  color: var(--color-primary-dark);
}

.post-card:hover .card-title::after {
  width: 2.5rem;
}

.card-summary {
  margin-bottom: var(--space-5);
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  line-height: var(--leading-relaxed);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ---------- 页脚 ----------
   margin-top:auto 让同一行卡片的页脚对齐，
   标题长短不一时底部仍在同一条基线上。 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.card-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-2);
  min-width: 0;
  overflow: hidden;
}

.card-views {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: var(--fs-micro);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .card-body {
    padding: var(--space-5);
  }
}

@media (hover: none) {
  .post-card:active {
    transform: scale(0.985);
    transition-duration: var(--dur-instant);
  }
}

:deep(mark) {
  padding: 0 0.15em;
  background: var(--color-accent);
  color: var(--text-primary);
  border-radius: var(--radius-xs);
}
</style>
