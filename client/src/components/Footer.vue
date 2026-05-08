<template>
  <footer class="footer">
    <div class="container footer-content">
      <div class="footer-info">
        <div class="footer-logo">
          <span class="logo-icon">✦</span>
          <span class="logo-text">Blog</span>
        </div>
        <p class="footer-desc">记录生活，分享技术</p>
      </div>

      <div class="footer-links">
        <div class="link-group">
          <h4>导航</h4>
          <router-link to="/">首页</router-link>
          <router-link to="/archives">归档</router-link>
        </div>
        <div class="link-group">
          <h4>管理</h4>
          <router-link to="/admin/login">后台登录</router-link>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Blog. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.footer {
  margin-top: var(--spacing-2xl);
  padding: var(--spacing-2xl) 0 var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-2xl);
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.footer-logo .logo-icon {
  color: var(--color-primary);
}

.footer-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: var(--spacing-2xl);
}

.link-group h4 {
  color: var(--text-primary);
  font-size: 0.95rem;
  margin-bottom: var(--spacing-md);
}

.link-group a {
  display: block;
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-sm);
  transition: color var(--transition-fast);
}

.link-group a:hover {
  color: var(--color-primary-light);
}

.footer-bottom {
  grid-column: 1 / -1;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.footer-bottom p {
  color: var(--text-muted);
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }

  .footer-links {
    gap: var(--spacing-xl);
  }
}
</style>
