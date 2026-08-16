<template>
  <div class="skeleton-card glass-card">
    <div class="skeleton-cover skeleton-pulse"></div>
    <div class="skeleton-body">
      <div class="skeleton-meta">
        <div class="skeleton-tag skeleton-pulse"></div>
        <div class="skeleton-date skeleton-pulse"></div>
      </div>
      <div class="skeleton-title skeleton-pulse"></div>
      <div class="skeleton-summary skeleton-pulse"></div>
      <div class="skeleton-summary short skeleton-pulse"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  overflow: hidden;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(120, 122, 116, 0.15);
  box-shadow: var(--shadow-sm);
}

.skeleton-pulse {
  background: linear-gradient(
    90deg,
    rgba(163, 166, 156, 0.1) 25%,
    rgba(163, 166, 156, 0.2) 50%,
    rgba(163, 166, 156, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-cover {
  height: 200px;
}

.skeleton-body {
  padding: var(--spacing-lg);
}

.skeleton-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.skeleton-tag {
  width: 60px;
  height: 20px;
  border-radius: 20px;
}

.skeleton-date {
  width: 80px;
  height: 16px;
}

.skeleton-title {
  height: 24px;
  width: 85%;
  margin-bottom: var(--spacing-sm);
}

.skeleton-summary {
  height: 16px;
  width: 100%;
  margin-bottom: var(--spacing-sm);
}

.skeleton-summary.short {
  width: 60%;
  margin-bottom: var(--spacing-lg);
}

@media (max-width: 768px) {
  .skeleton-cover {
    height: 160px;
  }

  .skeleton-body {
    padding: var(--spacing-md);
  }
}
</style>
