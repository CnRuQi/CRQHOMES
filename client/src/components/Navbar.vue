<template>
  <!-- 移动端菜单遮罩：位于 header 之外，避免被 header 的层叠上下文裁剪 -->
  <div v-if="isMenuOpen" class="mobile-overlay" @click="closeMenu"></div>

  <header class="navbar" :class="{ 'is-stuck': isScrolled }">
    <div class="container navbar-content">
      <router-link to="/" class="navbar-logo" @click="closeMenu">
        <Icon name="logo" :size="26" />
        <span class="logo-text">披花沐雪</span>
      </router-link>

      <nav id="navbar-menu" class="navbar-menu" :class="{ active: isMenuOpen }" aria-label="主导航">
        <router-link to="/" class="nav-link" :style="linkStyle(0)" @click="closeMenu">
          首页
        </router-link>
        <router-link
          v-for="(cat, index) in postStore.categories"
          :key="cat.id"
          :to="`/category/${cat.slug}`"
          class="nav-link"
          :style="linkStyle(index + 1)"
          @click="closeMenu"
        >
          {{ cat.name }}
        </router-link>
        <router-link
          to="/archives"
          class="nav-link"
          :style="linkStyle(postStore.categories.length + 1)"
          @click="closeMenu"
        >
          归档
        </router-link>
        <router-link
          to="/admin/login"
          class="nav-link admin-link"
          :style="linkStyle(postStore.categories.length + 2)"
          @click="closeMenu"
        >
          管理
        </router-link>
      </nav>

      <div class="navbar-actions">
        <router-link to="/search" class="icon-btn" title="搜索" aria-label="搜索">
          <Icon name="search" :size="19" />
        </router-link>
        <button
          class="icon-btn"
          type="button"
          :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
          :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
          @click="toggle($event)"
        >
          <Icon :name="isDark ? 'sun' : 'moon'" :size="19" />
        </button>
        <button
          ref="menuToggleRef"
          class="menu-toggle"
          type="button"
          :aria-label="isMenuOpen ? '关闭菜单' : '打开菜单'"
          :aria-expanded="isMenuOpen"
          aria-controls="navbar-menu"
          @click="toggleMenu"
        >
          <span class="menu-bars" :class="{ active: isMenuOpen }" aria-hidden="true"></span>
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
import { setBodyScrollLock } from '@/assets/js/utils'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const postStore = usePostStore()
const { isDark, toggle } = useTheme()

const isScrolled = ref(false)
const isMenuOpen = ref(false)
const menuToggleRef = ref(null)

/** 移动端菜单项的交错序号：交给 CSS 换算成延迟，菜单项数量变化时自动跟随 */
const linkStyle = (index) => ({ '--i': index })

function handleScroll() {
  isScrolled.value = window.scrollY > 24
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
  setBodyScrollLock(isMenuOpen.value)
}

function closeMenu() {
  isMenuOpen.value = false
  setBodyScrollLock(false)
}

// Esc 关掉移动端菜单，并把焦点交还开关按钮——
// 键盘用户不该因为关了一次菜单就「掉」回文档开头
function handleKeydown(event) {
  if (event.key !== 'Escape' || !isMenuOpen.value) return
  closeMenu()
  menuToggleRef.value?.focus()
}

// 路由变化时自动关闭菜单（浏览器前进/后退），释放 body 滚动锁
watch(
  () => route.fullPath,
  () => {
    if (isMenuOpen.value) closeMenu()
  }
)

onMounted(async () => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleKeydown)
  handleScroll()
  await postStore.fetchCategories()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeydown)
  setBodyScrollLock(false)
})
</script>

<style scoped>
/* ============================================================
   顶栏：未滚动时完全透明，页面在「一张纸」上开始；
   一旦离开顶端，才落下一道纸面与发丝线——顶栏的出现本身就是
   「你已经开始阅读」的信号。
   ============================================================ */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  z-index: var(--z-header);
  background: transparent;
  border-bottom: 1px solid transparent;
  transition:
    background-color var(--dur-slow) var(--ease-standard),
    border-color var(--dur-slow) var(--ease-standard),
    box-shadow var(--dur-slow) var(--ease-standard);
}

.navbar.is-stuck {
  background: color-mix(in srgb, var(--bg-primary) 92%, transparent);
  border-bottom-color: var(--border-hairline);
  box-shadow: var(--shadow-xs);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: var(--space-4);
}

/* ---------- 标识 ---------- */
.navbar-logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  flex: 0 0 auto;
  color: var(--text-primary);
  transition: color var(--dur-normal) var(--ease-standard);
}

/* logo 文字本身只有 ~26px 高：用透明热区补足触控标准，视觉不动 */
.navbar-logo::before {
  content: '';
  position: absolute;
  inset: -9px -10px;
}

.navbar-logo .icon {
  transition: transform var(--dur-slow) var(--ease-spring);
}

/* 悬停时只让印章轻轻一倾，文字不动——小的位移才显得「真」 */
.navbar-logo:hover .icon {
  transform: rotate(-8deg) scale(1.06);
}

.navbar-logo:hover {
  color: var(--color-primary-dark);
}

.logo-text {
  font-family: var(--font-display);
  font-size: var(--fs-xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-none);
}

/* ---------- 导航 ---------- */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 0 1 auto;
}

.nav-link {
  position: relative;
  /* 垂直 padding 12px：让可点目标 ≥44px（触控标准），header 64px 内仍居中 */
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--fs-caption);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
  transition:
    color var(--dur-normal) var(--ease-standard),
    background-color var(--dur-normal) var(--ease-standard);
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--tint-primary-weak);
}

.nav-link.router-link-exact-active {
  color: var(--color-primary-dark);
  background: var(--tint-primary);
}

/* 桌面端：发丝线自中心展开，替代移动端的整块底色 */
@media (min-width: 769px) {
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    width: 0;
    height: 1px;
    background: currentColor;
    transition:
      width var(--dur-normal) var(--ease-out),
      left var(--dur-normal) var(--ease-out);
  }

  .nav-link:hover::after,
  .nav-link.router-link-exact-active::after {
    width: 1.75rem;
    left: calc(50% - 0.875rem);
  }
}

/* 「管理」是次要入口：独立成一个小按钮，不参与主导航的节奏 */
.admin-link {
  margin-left: var(--space-3);
  /* 垂直 12px：与 .nav-link 同标准，可点目标 ≥44px */
  padding: var(--space-3) var(--space-5);
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.admin-link:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-hover);
}

.admin-link::after {
  display: none;
}

/* ---------- 操作区 ---------- */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 0 0 auto;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition:
    color var(--dur-normal) var(--ease-standard),
    background-color var(--dur-normal) var(--ease-standard),
    transform var(--dur-fast) var(--ease-spring);
}

.icon-btn:hover {
  color: var(--text-primary);
  background: var(--tint-primary);
}

.icon-btn:active {
  transform: scale(0.94);
}

/* ---------- 汉堡按钮 ---------- */
.menu-toggle {
  display: none;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
}

.menu-bars,
.menu-bars::before,
.menu-bars::after {
  display: block;
  width: 20px;
  height: 1.5px;
  background: var(--text-primary);
  border-radius: var(--radius-full);
  transition:
    transform var(--dur-normal) var(--ease-standard),
    opacity var(--dur-fast) var(--ease-standard),
    background-color var(--dur-normal) var(--ease-standard);
}

.menu-bars {
  position: relative;
}

.menu-bars::before,
.menu-bars::after {
  content: '';
  position: absolute;
  left: 0;
}

.menu-bars::before {
  top: -6px;
}

.menu-bars::after {
  top: 6px;
}

.menu-bars.active {
  background: transparent;
}

.menu-bars.active::before {
  transform: translateY(6px) rotate(45deg);
}

.menu-bars.active::after {
  transform: translateY(-6px) rotate(-45deg);
}

/* ============================================================
   移动端整屏菜单
   ============================================================ */
@media (max-width: 768px) {
  .menu-toggle {
    display: inline-flex;
  }

  .navbar.is-stuck {
    background: color-mix(in srgb, var(--bg-primary) 97%, transparent);
  }

  .navbar-menu {
    position: fixed;
    top: var(--header-height);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: var(--space-1);
    width: 100%;
    padding: var(--space-8) var(--space-gutter)
      calc(var(--space-8) + var(--safe-bottom, env(safe-area-inset-bottom, 0px)));
    background: var(--bg-primary);
    overflow-y: auto;
    overscroll-behavior: contain;
    transform: translateX(100%);
    visibility: hidden;
    pointer-events: none;
    transition:
      transform var(--dur-slow) var(--ease-emphasis),
      visibility 0s linear var(--dur-slow);
  }

  .navbar-menu.active {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
    transition-delay: 0s;
  }

  /* 菜单项逐条推入：延迟由 --i 决定，菜单条数变化时自动跟随 */
  .navbar-menu .nav-link {
    opacity: 0;
    transform: translate3d(1.5rem, 0, 0);
    transition:
      opacity var(--dur-slow) var(--ease-out),
      transform var(--dur-slow) var(--ease-emphasis),
      color var(--dur-normal) var(--ease-standard),
      background-color var(--dur-normal) var(--ease-standard);
  }

  .navbar-menu.active .nav-link {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition-delay: calc(var(--i, 0) * 40ms + 60ms);
  }

  .nav-link {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 3rem;
    padding: var(--space-4) var(--space-6);
    font-size: var(--fs-lg);
    font-weight: var(--weight-regular);
    letter-spacing: var(--tracking-wider);
    width: 100%;
    text-align: center;
  }

  .nav-link::after {
    display: none;
  }

  .admin-link {
    margin: var(--space-4) 0 0;
    padding: var(--space-4) var(--space-6);
    font-size: var(--fs-base);
  }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    top: var(--header-height);
    /* 必须低于 .navbar 的 z-index，否则会盖住 header 内的菜单导致菜单项无法点击 */
    z-index: calc(var(--z-header) - 1);
    background: color-mix(in srgb, var(--ink-900) 34%, transparent);
  }
}

/* 桌面端才启用毛玻璃。
   backdrop-filter 会让 .navbar 成为内部 fixed 子元素的包含块，
   移动端菜单（fixed）正是它的子元素，一旦启用就会定位错乱、
   滚动后菜单塌陷成只剩第一项——所以这道 min-width 是必须的，不是优化。 */
@media (min-width: 769px) {
  .navbar.is-stuck {
    backdrop-filter: blur(var(--blur-md)) saturate(150%);
    -webkit-backdrop-filter: blur(var(--blur-md)) saturate(150%);
  }
}

/* 视口极窄时优先保住标识与操作区 */
@media (max-width: 359px) {
  .logo-text {
    display: none;
  }
}
</style>
