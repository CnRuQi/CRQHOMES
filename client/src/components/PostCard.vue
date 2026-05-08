<template>
  <article
    class="post-card glass-card"
    data-aos="fade-up"
    :data-aos-delay="index * 100"
  >
    <router-link :to="`/post/${post.id}`" class="card-link">
      <div class="card-cover" v-if="post.cover_image">
        <img :src="post.cover_image" :alt="post.title" loading="lazy" />
        <div class="cover-overlay"></div>
      </div>
      <div class="card-cover placeholder" v-else>
        <span class="placeholder-icon">✦</span>
      </div>

      <div class="card-body">
        <div class="card-meta">
          <span v-if="post.category_name" class="card-category">
            {{ post.category_name }}
          </span>
          <span v-if="post.is_top" class="card-top">置顶</span>
          <span class="card-date">{{ fromNow(post.created_at) }}</span>
        </div>

        <h3 class="card-title">{{ post.title }}</h3>

        <p class="card-summary" v-if="post.summary">
          {{ truncate(post.summary, 100) }}
        </p>

        <div class="card-footer">
          <div class="card-tags" v-if="post.tags && post.tags.length">
            <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
          <div class="card-views">
            <span class="views-icon">👁</span>
            <span>{{ formatNumber(post.views) }}</span>
          </div>
        </div>
      </div>
    </router-link>
  </article>
</template>

<script setup>
import { fromNow, truncate, formatNumber } from '@/assets/js/utils'

defineProps({
  post: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.post-card {
  overflow: hidden;
  transition: all var(--transition-normal);
}

.post-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(150, 164, 138, 0.12);
  border-color: rgba(150, 164, 138, 0.3);
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
  transition: transform var(--transition-normal);
}

.post-card:hover .card-cover img {
  transform: scale(1.05);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgba(61, 64, 53, 0.6)
  );
}

.card-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(150, 164, 138, 0.2),
    rgba(212, 176, 181, 0.2)
  );
}

.placeholder-icon {
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.5);
  animation: float 3s ease-in-out infinite;
}

.card-body {
  padding: var(--spacing-lg);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  font-size: 0.85rem;
}

.card-category {
  padding: 2px 10px;
  background: rgba(150, 164, 138, 0.15);
  border-radius: 20px;
  color: var(--color-primary-dark);
  font-weight: 500;
}

.card-top {
  padding: 2px 10px;
  background: rgba(196, 151, 153, 0.2);
  border-radius: 20px;
  color: #C49799;
  font-weight: 500;
}

.card-date {
  color: var(--text-muted);
  margin-left: auto;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-summary {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.card-views {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.views-icon {
  font-size: 1rem;
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
</style>
