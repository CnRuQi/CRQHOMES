<template>
  <!-- 移动端菜单遮罩 -->
  <div v-if="isMenuOpen" class="mobile-overlay" @click="closeMenu"></div>

  <header class="navbar glass-header" :class="{ scrolled: isScrolled }">
    <div class="container navbar-content">
      <router-link to="/" class="navbar-logo">
        <Icon name="logo" :size="28" />
        <span class="logo-text">披花沐雪</span>
      </router-link>

      <nav class="navbar-menu" :class="{ active: isMenuOpen }">
        <router-link to="/" class="nav-link" @click="closeMenu"> 首页 </router-link>
        <router-link
          v-for="cat in postStore.categories"
          :key="cat.id"
          :to="`/category/${cat.slug}`"
          class="nav-link"
          @click="closeMenu"
        >
          {{ cat.name }}
        </router-link>
        <router-link to="/archives" class="nav-link" @click="closeMenu"> 归档 </router-link>
        <router-link to="/admin/login" class="nav-link admin-link" @click="closeMenu">
          管理
        </router-link>
      </nav>

      <div class="navbar-actions">
        <router-link to="/search" class="search-toggle" title="搜索">
          <Icon name="search" :size="20" />
        </router-link>
        <button
          class="theme-toggle"
          :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
          @click="toggle"
        >
          <Icon :name="isDark ? 'sun' : 'moon'" :size="20" />
        </button>
        <button class="menu-toggle" @click="toggleMenu">
          <span :class="{ active: isMenuOpen }"></span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePostStore } from '@/stores/post'
import { useTheme } from '@/composables/useTheme'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const postStore = usePostStore()
const { isDark, toggle } = useTheme()

const isScrolled = ref(false)
const isMenuOpen = ref(false)

function handleScroll() {
  isScrolled.value = window.scrollY > 50
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
  setBodyScrollLock(isMenuOpen.value)
}

function closeMenu() {
  isMenuOpen.value = false
  setBodyScrollLock(false)
}

// 锁定/释放页面滚动（html + body 双锁，兼容 iOS Safari）
function setBodyScrollLock(locked) {
  const overflow = locked ? 'hidden' : ''
  document.documentElement.style.overflow = overflow
  document.body.style.overflow = overflow
}

// 路由变化时自动关闭菜单（浏览器前进/后退），释放 body 滚动锁
watch(
  () => route.fullPath,
  () => {
    if (isMenuOpen.value) closeMenu()
  }
)

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  await postStore.fetchCategories()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  setBodyScrollLock(false)
})
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar.scrolled {
  background: rgba(245, 245, 243, 0.92);
  box-shadow: 0 1px 3px rgba(56, 57, 54, 0.06);
}

/* 桌面端启用毛玻璃；移动端禁用 backdrop-filter——
   backdrop-filter 会使 .navbar 成为内部 fixed 子元素（移动端菜单）的包含块，
   导致菜单定位错乱、塌陷（滚动页面后菜单只剩第一项）。移动端保持纯背景，也符合性能优先设计 */
@media (min-width: 768px) {
  .navbar.scrolled {
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
}

[data-theme='dark'] .navbar.scrolled {
  background: rgba(26, 26, 26, 0.92);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  color: var(--text-primary);
  background: rgba(163, 166, 156, 0.1);
}

.search-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.search-toggle:hover {
  color: var(--text-primary);
  background: rgba(163, 166, 156, 0.1);
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-display);
  letter-spacing: -0.02em;
  transition: transform 0.3s ease;
}

.navbar-logo:hover {
  transform: scale(1.05);
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.nav-link {
  color: var(--text-muted);
  font-weight: 500;
  padding: 8px 16px;
  position: relative;
  transition: all 0.3s ease;
  border-radius: 8px;
  font-size: 0.95rem;
}

.nav-link:hover {
  color: var(--text-primary);
  background: rgba(163, 166, 156, 0.08);
}

.nav-link.router-link-exact-active {
  color: var(--color-primary-dark);
  background: rgba(163, 166, 156, 0.12);
}

/* 桌面端：导航链接下划线滑动动画（移动端菜单不使用，避免干扰交错动画） */
@media (min-width: 769px) {
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    width: 0;
    height: 2px;
    background: var(--color-primary);
    border-radius: 2px;
    transition:
      width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-link:hover::after,
  .nav-link.router-link-exact-active::after {
    width: 60%;
    left: 20%;
  }
}

.admin-link {
  padding: 8px 18px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(163, 166, 156, 0.2);
  border-radius: 10px;
  margin-left: var(--spacing-sm);
  transition: all 0.3s ease;
}

.admin-link:hover {
  background: rgba(163, 166, 156, 0.1);
  border-color: rgba(163, 166, 156, 0.35);
  transform: translateY(1px);
  box-shadow: var(--shadow-sm);
}

.menu-toggle {
  display: none;
  width: 28px;
  height: 20px;
  position: relative;
  cursor: pointer;
}

.menu-toggle span,
.menu-toggle span::before,
.menu-toggle span::after {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--text-primary);
  position: absolute;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.menu-toggle span {
  top: 50%;
  transform: translateY(-50%);
}

.menu-toggle span::before {
  content: '';
  top: -7px;
}

.menu-toggle span::after {
  content: '';
  bottom: -7px;
}

.menu-toggle span.active {
  background: transparent;
}

.menu-toggle span.active::before {
  top: 0;
  transform: rotate(45deg);
}

.menu-toggle span.active::after {
  bottom: 0;
  transform: rotate(-45deg);
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .navbar-menu {
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    bottom: 0;
    background: rgb(252, 251, 249);
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--spacing-2xl) var(--spacing-lg)
      calc(var(--spacing-2xl) + env(safe-area-inset-bottom, 0px));
    gap: var(--spacing-sm);
    transform: translateX(100%);
    transition: transform 0.45s cubic-bezier(0.32, 0.72, 0, 1);
    z-index: 1001;
    overflow-y: auto;
  }

  [data-theme='dark'] .navbar-menu {
    background: rgb(26, 26, 26);
  }

  .navbar-menu.active {
    transform: translateX(0);
  }

  /* 菜单项交错滑入动画 */
  .navbar-menu .nav-link {
    opacity: 0;
    transform: translateX(28px);
    transition:
      opacity 0.35s ease,
      transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
      color 0.2s ease,
      background 0.2s ease;
  }

  .navbar-menu.active .nav-link {
    opacity: 1;
    transform: translateX(0);
  }

  .navbar-menu.active .nav-link:nth-child(1) {
    transition-delay: 0.05s;
  }
  .navbar-menu.active .nav-link:nth-child(2) {
    transition-delay: 0.1s;
  }
  .navbar-menu.active .nav-link:nth-child(3) {
    transition-delay: 0.15s;
  }
  .navbar-menu.active .nav-link:nth-child(4) {
    transition-delay: 0.2s;
  }
  .navbar-menu.active .nav-link:nth-child(5) {
    transition-delay: 0.25s;
  }
  .navbar-menu.active .nav-link:nth-child(6) {
    transition-delay: 0.3s;
  }
  .navbar-menu.active .nav-link:nth-child(7) {
    transition-delay: 0.35s;
  }
  .navbar-menu.active .nav-link:nth-child(8) {
    transition-delay: 0.4s;
  }
  .navbar-menu.active .nav-link:nth-child(9) {
    transition-delay: 0.45s;
  }
  .navbar-menu.active .nav-link:nth-child(10) {
    transition-delay: 0.5s;
  }

  .nav-link {
    font-size: 1.1rem;
    padding: 14px 24px;
    width: 100%;
    text-align: center;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    top: var(--header-height);
    background: rgba(0, 0, 0, 0.3);
    /* 必须低于 .navbar 的 z-index(1000)，否则会盖住 header 内的菜单导致菜单项无法点击 */
    z-index: 999;
    animation: overlayFadeIn 0.3s ease;
  }

  @keyframes overlayFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
