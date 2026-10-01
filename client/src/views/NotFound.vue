<template>
  <div class="not-found">
    <div class="container">
      <div class="content" data-reveal="up">
        <p class="section-eyebrow">Error · 404</p>

        <p class="error-code" aria-hidden="true">404</p>

        <h1 class="error-message">迷路了？这里什么都没有</h1>

        <div class="rule" aria-hidden="true">
          <span class="rule-line"></span>
          <span class="rule-dot"></span>
          <span class="rule-line"></span>
        </div>

        <p class="error-hint">页面可能已被移动或删除，也可能只是链接写错了。</p>

        <div class="actions">
          <router-link to="/" class="btn btn-primary">返回首页</router-link>
          <router-link to="/archives" class="btn btn-secondary">浏览归档</router-link>
          <router-link to="/search" class="btn btn-secondary">搜索文章</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   404：把数字做成一枚「空心字」，
   它只提供尺度，不抢走「回到正轨」这件事的注意力。
   ============================================================ */
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-section) 0;
}

.content {
  max-width: 34rem;
  margin: 0 auto;
  text-align: center;
}

.error-code {
  margin: var(--space-4) 0 var(--space-6);
  color: var(--border-color);
  font-family: var(--font-display);
  font-size: var(--fs-6xl);
  font-weight: var(--weight-bold);
  line-height: 0.86;
  letter-spacing: var(--tracking-tighter);
  font-variant-numeric: tabular-nums;
  user-select: none;
}

/* 支持描边时转为空心字；不支持则保留上方的浅色实心数字，字体永不消失 */
@supports (-webkit-text-stroke: 1px currentcolor) {
  .error-code {
    color: transparent;
    -webkit-text-stroke: 1px var(--border-strong);
  }
}

.error-message {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-h4);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

.rule {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin: var(--space-6) 0;
}

.rule-line {
  width: 2.5rem;
  height: 1px;
  background: var(--border-color);
}

.rule-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
}

.error-hint {
  margin-bottom: var(--space-10);
  color: var(--text-muted);
  font-size: var(--fs-caption);
  line-height: var(--leading-relaxed);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

@media (max-width: 768px) {
  .error-code {
    font-size: var(--fs-5xl);
  }

  .error-message {
    font-size: var(--fs-lg);
  }

  .error-hint {
    margin-bottom: var(--space-8);
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
