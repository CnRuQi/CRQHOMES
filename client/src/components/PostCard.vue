<template>
  <article class="post-card glass-card" data-aos="fade-up" :data-aos-delay="index * 100">
    <router-link :to="`/post/${post.slug || post.id}`" class="card-link">
      <div v-if="post.cover_image" class="card-cover">
        <img :src="post.cover_image" :alt="post.title" loading="lazy" />
        <div class="cover-overlay"></div>
      </div>
      <div v-else class="card-cover placeholder">
        <span class="placeholder-icon">✦</span>
      </div>

      <div class="card-body">
        <div class="card-meta">
          <span v-if="post.category_name" class="card-category">
            {{ post.category_name }}
          </span>
          <span v-if="post.is_top" class="card-top">置顶</span>
          <span class="card-date">{{ fromNow(post.published_at || post.created_at) }}</span>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -->
        <h3 v-if="keyword" class="card-title" v-html="highlightKeywords(post.title, keyword)"></h3>
        <h3 v-else class="card-title">{{ post.title }}</h3>

        <!-- eslint-disable-next-line vue/no-v-html -->
        <p
          v-if="post.summary && keyword"
          class="card-summary"
          v-html="highlightKeywords(truncate(post.summary, 100), keyword)"
        ></p>
        <p v-else-if="post.summary" class="card-summary">
          {{ truncate(post.summary, 100) }}
        </p>

        <div class="card-footer">
          <div v-if="post.tags && post.tags.length" class="card-tags">
            <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
          <div class="card-views">
            <Icon name="views" :size="16" />
            <span>{{ formatNumber(post.views) }}</span>
          </div>
        </div>
      </div>
    </router-link>
  </article>
</template>

<script setup>
import { fromNow, truncate, formatNumber, highlightKeywords } from '@/assets/js/utils'
import Icon from '@/components/Icon.vue'

defineProps({
  post: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
  keyword: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.post-card {
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(120, 122, 116, 0.15);
  box-shadow: var(--shadow-sm);
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(120, 122, 116, 0.25);
}

.card-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.card-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  filter: grayscale(10%);
}

.post-card:hover .card-cover img {
  transform: scale(1.05);
  filter: grayscale(0%);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(56, 57, 54, 0.4) 100%);
}

.card-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(163, 166, 156, 0.12), rgba(222, 223, 217, 0.12));
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.3;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.card-body {
  padding: var(--spacing-lg);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  font-size: 0.8rem;
}

.card-category {
  padding: 3px 12px;
  background: rgba(163, 166, 156, 0.12);
  border-radius: 20px;
  color: var(--color-primary-dark);
  font-weight: 500;
}

.card-top {
  padding: 3px 12px;
  background: rgba(179, 143, 143, 0.15);
  border-radius: 20px;
  color: #9a7272;
  font-weight: 500;
}

.card-date {
  color: var(--text-muted);
  margin-left: auto;
  font-size: 0.8rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  font-family: var(--font-display);
}

.post-card:hover .card-title {
  color: var(--color-primary-dark);
}

.card-summary {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: var(--spacing-lg);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(150, 164, 138, 0.1);
}

.card-tags {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.card-views {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-disabled);
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .card-cover {
    height: 160px;
  }

  .card-body {
    padding: var(--spacing-md);
  }

  .card-title {
    font-size: 1.1rem;
  }
}

:deep(mark) {
  background: rgba(163, 166, 156, 0.3);
  color: inherit;
  padding: 1px 2px;
  border-radius: 2px;
}
</style>
