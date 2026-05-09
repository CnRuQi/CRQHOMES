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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border-radius: 16px;
  background: rgba(255, 252, 248, 0.8);
  border: 1px solid rgba(150, 164, 138, 0.15);
  box-shadow: 0 2px 8px rgba(150, 164, 138, 0.04);
}

.post-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(150, 164, 138, 0.08), 
    rgba(212, 176, 181, 0.08)
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 0;
  border-radius: inherit;
}

.post-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 
    0 25px 50px rgba(150, 164, 138, 0.15),
    0 0 0 1px rgba(150, 164, 138, 0.2);
  border-color: rgba(150, 164, 138, 0.3);
}

.post-card:hover::before {
  opacity: 1;
}

.card-link {
  display: block;
  color: inherit;
  text-decoration: none;
  position: relative;
  z-index: 1;
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
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.post-card:hover .card-cover img {
  transform: scale(1.08);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 40%,
    rgba(61, 64, 53, 0.5) 100%
  );
  transition: opacity 0.4s ease;
}

.card-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(150, 164, 138, 0.15),
    rgba(212, 176, 181, 0.15)
  );
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.4;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.card-body {
  padding: var(--spacing-lg);
  position: relative;
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
  background: rgba(150, 164, 138, 0.12);
  border-radius: 20px;
  color: var(--color-primary-dark);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.card-top {
  padding: 3px 12px;
  background: rgba(196, 151, 153, 0.15);
  border-radius: 20px;
  color: #C49799;
  font-weight: 500;
}

.card-date {
  color: var(--text-disabled);
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
  color: var(--text-muted);
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

.views-icon {
  font-size: 0.9rem;
  opacity: 0.7;
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
