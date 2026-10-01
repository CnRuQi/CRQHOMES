<template>
  <footer class="footer">
    <div class="container">
      <!-- 宣告区：超大站名是页脚的「落款」，每个字都可被拨动 -->
      <div class="footer-brand" data-reveal="up">
        <p class="brand-line" aria-label="披花沐雪">
          <span v-for="(char, i) in brandChars" :key="i" class="brand-char" aria-hidden="true">{{
            char
          }}</span>
        </p>
        <p class="footer-desc">One Last Kiss for the Beautiful World</p>
      </div>

      <div class="footer-grid" data-reveal="up">
        <nav class="footer-links" aria-label="页脚导航">
          <div class="link-group">
            <h2>导航</h2>
            <router-link to="/">首页</router-link>
            <router-link to="/archives">归档</router-link>
            <router-link to="/search">搜索</router-link>
          </div>
          <div class="link-group">
            <h2>管理</h2>
            <router-link to="/admin/login">后台登录</router-link>
          </div>
        </nav>

        <button v-magnetic="0.3" type="button" class="back-top" @click="scrollTop">
          <span class="back-top-arrow" aria-hidden="true">↑</span>
          <span class="sr-only">回到顶部</span>
        </button>
      </div>

      <div class="footer-bottom">
        <div class="beian-info">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"
            >蜀ICP备2025145207号-2</a
          >
          <span class="divider" aria-hidden="true">|</span>
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
          &copy; {{ currentYear }} 披花沐雪 <span class="footer-separator">·</span> crq.homes. All
          rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
const brandChars = '披花沐雪'.split('')

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
/* ============================================================
   页脚：从「信息堆底部」改为「落款宣告区」。
   大字号站名是视觉锚点；链接行、备案行按信息密度递减，
   整个页面的阅读到这里像一封信的落款。
   ============================================================ */
.footer {
  /* 底部额外让出安全区：iOS 的横条不该压住版权行 */
  padding: var(--space-16) 0 calc(var(--space-6) + var(--safe-bottom));
  border-top: 1px solid var(--border-hairline);
  background: var(--bg-secondary);
}

/* ---------- 宣告区 ---------- */
.footer-brand {
  margin-bottom: var(--space-12);
}

/* 落款大字：与 hero 同源的 display 字号，但更收敛（不做逐字入场，
   页脚不与首页 hero 抢戏）；悬停时整行轻浮、被指的字浮得更高，
   像「墨点荡开」。移动端没有 hover，自动退化。 */
.brand-line {
  display: inline-flex;
  align-items: baseline;
  gap: 0.04em;
  margin-bottom: var(--space-4);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: clamp(2.75rem, 7vw, 5rem);
  font-weight: var(--weight-semibold);
  line-height: 1.1;
  letter-spacing: var(--tracking-tight);
  user-select: none;
  cursor: default;
}

.brand-char {
  display: inline-block;
  transition:
    transform var(--dur-slow) var(--ease-spring),
    color var(--dur-slow) var(--ease-standard);
}

.brand-line:hover .brand-char {
  transform: translateY(-0.03em);
}

.brand-line:hover .brand-char:hover {
  color: var(--color-primary-dark);
  transform: translateY(-0.09em);
}

.footer-desc {
  max-width: 26ch;
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--fs-lead);
  line-height: var(--leading-snug);
  color: var(--text-secondary);
  text-wrap: pretty;
}

/* ---------- 链接 + 回顶 ---------- */
.footer-grid {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-12);
  padding-top: var(--space-8);
  padding-bottom: var(--space-8);
  border-top: 1px solid var(--border-subtle);
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-10) var(--space-16);
}

.link-group h2 {
  margin-bottom: var(--space-4);
  color: var(--text-muted);
  font-size: var(--fs-micro);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-widest);
}

.link-group a {
  position: relative;
  display: block;
  padding: var(--space-1) 0;
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  transition: color var(--dur-normal) var(--ease-standard);
}

/* 视觉保持紧凑列表节奏，可点区域用透明热区补足 44px（::after 已被下划线动效占用） */
.link-group a::before {
  content: '';
  position: absolute;
  inset: -9px -8px;
}

.link-group a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: currentColor;
  transition: width var(--dur-normal) var(--ease-out);
}

.link-group a:hover {
  color: var(--color-primary-dark);
}

.link-group a:hover::after {
  width: 100%;
}

/* 回顶：一枚安静的墨钮，磁性由 v-magnetic 提供 */
.back-top {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 3rem;
  height: 3rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    color var(--dur-normal) var(--ease-standard),
    border-color var(--dur-normal) var(--ease-standard),
    background-color var(--dur-normal) var(--ease-standard),
    box-shadow var(--dur-normal) var(--ease-standard);
}

.back-top:hover {
  color: var(--color-primary-dark);
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
  box-shadow: var(--shadow-sm);
}

.back-top:active {
  transform: translateY(1px);
}

.back-top-arrow {
  font-size: var(--fs-md);
  line-height: 1;
  transition: transform var(--dur-normal) var(--ease-spring);
}

.back-top:hover .back-top-arrow {
  transform: translateY(-2px);
}

/* ---------- 底：备案与版权 ---------- */
.footer-bottom {
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-subtle);
  text-align: center;
}

.beian-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.beian-info a {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-muted);
  font-size: var(--fs-2xs);
  transition: color var(--dur-normal) var(--ease-standard);
}

/* 备案行字号极小（19px 高）：透明热区补足触控标准，行内布局不动 */
.beian-info a::before {
  content: '';
  position: absolute;
  inset: -13px -6px;
}

.beian-info a:hover {
  color: var(--text-secondary);
}

.beian-info .divider {
  color: var(--text-disabled);
  font-size: var(--fs-2xs);
}

.beian-info .police-link img {
  opacity: 0.75;
}

.copyright {
  color: var(--text-muted);
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wide);
}

.footer-separator {
  margin: 0 var(--space-1);
  color: var(--text-disabled);
}

@media (max-width: 768px) {
  .footer {
    padding-top: var(--space-12);
  }

  .footer-brand {
    margin-bottom: var(--space-8);
  }

  .footer-grid {
    flex-direction: column;
    gap: var(--space-8);
    padding-top: var(--space-6);
  }

  .footer-links {
    gap: var(--space-12);
  }

  /* 移动端没有 hover：回顶按钮改为行内展示，占位更稳 */
  .back-top {
    align-self: flex-start;
  }

  .footer-desc {
    max-width: none;
  }
}
</style>
