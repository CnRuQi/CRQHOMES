<template>
  <!-- 骨架屏与 PostCard 同构：封面比例、正文节奏、页脚基线都对齐，
       数据到位时不会发生跳动。 -->
  <div class="skeleton-card" aria-hidden="true">
    <div class="skeleton-cover skeleton-pulse"></div>

    <div class="skeleton-body">
      <div class="skeleton-meta">
        <div class="skeleton-tag skeleton-pulse"></div>
        <div class="skeleton-date skeleton-pulse"></div>
      </div>

      <div class="skeleton-title skeleton-pulse"></div>
      <div class="skeleton-summary skeleton-pulse"></div>
      <div class="skeleton-summary short skeleton-pulse"></div>

      <div class="skeleton-footer">
        <div class="skeleton-chip skeleton-pulse"></div>
        <div class="skeleton-chip skeleton-pulse"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}

.skeleton-cover {
  aspect-ratio: 16 / 10;
}

.skeleton-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
}

.skeleton-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.skeleton-tag {
  width: 4rem;
  height: 1.25rem;
  border-radius: var(--radius-full);
}

.skeleton-date {
  width: 4.5rem;
  height: 0.75rem;
}

.skeleton-title {
  width: 85%;
  height: 1.5rem;
}

.skeleton-summary {
  width: 100%;
  height: 0.75rem;
}

.skeleton-summary.short {
  width: 62%;
}

.skeleton-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-4);
}

.skeleton-chip {
  width: 3rem;
  height: 0.75rem;
  border-radius: var(--radius-full);
}

@media (max-width: 768px) {
  .skeleton-body {
    padding: var(--space-5);
  }
}
</style>
