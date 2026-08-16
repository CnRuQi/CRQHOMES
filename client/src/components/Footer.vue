<template>
  <footer class="footer">
    <div class="container footer-content">
      <div class="footer-info">
        <div class="footer-logo">
          <Icon name="logo" :size="24" />
          <span class="logo-text">披花沐雪</span>
        </div>
        <p class="footer-desc">One Last Kiss for the Beautiful World</p>
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
        <div class="beian-info">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"
            >蜀ICP备2025145207号-2</a
          >
          <span class="divider">|</span>
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch"
            target="_blank"
            rel="noopener noreferrer"
            class="police-link"
          >
            <img
              src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png"
              alt="网安备"
              width="16"
              height="16"
              loading="lazy"
            />
            <span>川公网安备51180202512082号</span>
          </a>
        </div>
        <p class="copyright">
          &copy; {{ currentYear }} 披花沐雪 <span class="footer-separator">|</span> cnruqi.site. All
          rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import Icon from '@/components/Icon.vue'
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

.footer-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: var(--spacing-2xl);
}

.link-group h4 {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  color: var(--color-primary-dark);
}

.footer-bottom {
  grid-column: 1 / -1;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.beian-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.beian-info a {
  color: var(--text-disabled);
  font-size: 0.8rem;
  text-decoration: none;
  transition: color var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 4px;
}

.beian-info a:hover {
  color: var(--text-muted);
}

.beian-info .divider {
  color: var(--text-disabled);
  font-size: 0.8rem;
  opacity: 0.5;
}

.beian-info .police-link img {
  vertical-align: middle;
  opacity: 0.7;
}

.copyright {
  color: var(--text-disabled);
  font-size: 0.85rem;
}

.footer-separator {
  margin: 0 var(--spacing-sm);
  opacity: 0.5;
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
