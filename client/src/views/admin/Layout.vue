<template>
  <div class="admin-layout">
    <!-- 移动端遮罩 -->
    <div v-if="isMobileOpen" class="mobile-overlay" @click="closeMobileSidebar"></div>

    <!-- 侧边栏 -->
    <aside
      class="sidebar glass-sidebar"
      :class="{ collapsed: isCollapsed, 'mobile-open': isMobileOpen }"
    >
      <div class="sidebar-header">
        <router-link to="/admin" class="sidebar-logo" @click="closeMobileSidebar">
          <Icon name="logo" :size="24" />
          <span v-show="!isCollapsed" class="logo-text">披花沐雪</span>
        </router-link>
      </div>

      <nav class="sidebar-menu">
        <router-link
          to="/admin"
          class="menu-item"
          exact-active-class="active"
          @click="closeMobileSidebar"
        >
          <Icon name="dashboard" :size="20" />
          <span class="menu-text" :class="{ hidden: isCollapsed }">仪表盘</span>
        </router-link>
        <router-link
          to="/admin/posts"
          class="menu-item"
          active-class="active"
          @click="closeMobileSidebar"
        >
          <Icon name="article" :size="20" />
          <span class="menu-text" :class="{ hidden: isCollapsed }">文章管理</span>
        </router-link>
        <router-link
          to="/admin/posts/create"
          class="menu-item"
          active-class="active"
          @click="closeMobileSidebar"
        >
          <Icon name="edit" :size="20" />
          <span class="menu-text" :class="{ hidden: isCollapsed }">写文章</span>
        </router-link>
        <router-link
          to="/admin/categories"
          class="menu-item"
          active-class="active"
          @click="closeMobileSidebar"
        >
          <Icon name="category" :size="20" />
          <span class="menu-text" :class="{ hidden: isCollapsed }">分类管理</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="menu-item" @click="closeMobileSidebar">
          <Icon name="external" :size="20" />
          <span class="menu-text" :class="{ hidden: isCollapsed }">访问前台</span>
        </router-link>
        <button type="button" class="menu-item" @click="handleLogout">
          <Icon name="logout" :size="20" />
          <span class="menu-text" :class="{ hidden: isCollapsed }">退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-wrapper" :class="{ expanded: isCollapsed }">
      <!-- 顶栏 -->
      <header class="topbar glass-header">
        <div class="topbar-left">
          <button
            ref="collapseBtnRef"
            type="button"
            class="collapse-btn"
            :aria-label="isCollapsed ? '展开侧边栏' : '收起侧边栏'"
            @click="toggleSidebar"
          >
            <span aria-hidden="true" :class="{ rotated: isCollapsed }"></span>
          </button>
          <!-- 窄屏侧栏离屏时，这里是唯一的位置提示；
               宽屏交给页面自己的标题，同一句话不出现两次 -->
          <span class="topbar-location" aria-hidden="true">{{ currentPageTitle }}</span>
        </div>

        <div class="topbar-right">
          <span class="user-info">
            <Icon name="user" :size="20" />
            <span class="user-name">{{
              authStore.user?.nickname || authStore.user?.username
            }}</span>
          </span>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <!-- :key 强制跨路由重建实例：create 与 edit 共用 Editor，复用会残留旧文章表单 -->
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { setBodyScrollLock } from '@/assets/js/utils'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapsed = ref(false)
const isMobileOpen = ref(false)
const collapseBtnRef = ref(null)

const currentPageTitle = computed(() => {
  return route.meta.title || '仪表盘'
})

function toggleSidebar() {
  if (window.innerWidth <= 768) {
    isMobileOpen.value = !isMobileOpen.value
    setBodyScrollLock(isMobileOpen.value)
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}

function closeMobileSidebar() {
  isMobileOpen.value = false
  setBodyScrollLock(false)
}

// Esc 收起窄屏抽屉，并把焦点交还开关按钮（与前台顶栏同一套行为）
function handleKeydown(event) {
  if (event.key !== 'Escape' || !isMobileOpen.value) return
  closeMobileSidebar()
  collapseBtnRef.value?.focus()
}

async function handleLogout() {
  await authStore.logout()
  router.push('/admin/login')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))

// 卸载时释放滚动锁（如移动端菜单开着时被 401 踢出），防止残留 overflow:hidden 让登录页无法滚动
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  setBodyScrollLock(false)
})
</script>

<style scoped>
/* ============================================================
   后台：与前台的「纸」同一套材质，只把密度调高。
   侧栏用墨色滴痕标记当前页，主区保持安静。
   ============================================================ */
.admin-layout {
  /* 收起态宽度只在这里定义：侧栏自身与主区让位都引用它，
     避免同一个数字抄两遍、改一处漏一处 */
  --sidebar-w-collapsed: 4.5rem;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  min-width: 0;
  background: var(--bg-primary);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--z-sticky);
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  overflow: hidden;
  border-right: 1px solid var(--border-hairline);
  transition:
    width var(--dur-normal) var(--ease-standard),
    transform var(--dur-normal) var(--ease-spring);
}

.sidebar.collapsed {
  width: var(--sidebar-w-collapsed);
}

.sidebar-header {
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border-hairline);
  white-space: nowrap;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;
}

.sidebar-menu {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-3);
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.menu-item:hover {
  background: var(--tint-primary-weak);
  color: var(--text-primary);
}

/* 当前项：一层淡墨垫底，左侧压一道墨痕 */
.menu-item.active {
  background: var(--tint-primary);
  color: var(--color-primary-dark);
  font-weight: var(--weight-medium);
}

.menu-item.active::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 1.25rem;
  background: var(--color-primary);
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
  transform: translateY(-50%);
}

.menu-text {
  white-space: nowrap;
  opacity: 1;
  transition: opacity var(--dur-fast) var(--ease-standard) var(--dur-instant);
}

.menu-text.hidden {
  opacity: 0;
  transition: opacity var(--dur-instant) var(--ease-standard);
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-3);
  border-top: 1px solid var(--border-hairline);
}

.main-wrapper {
  flex: 1;
  min-width: 0;
  margin-left: var(--sidebar-width);
  background: var(--bg-primary);
  transition: margin-left var(--dur-normal) var(--ease-standard);
}

.main-wrapper.expanded {
  margin-left: var(--sidebar-w-collapsed);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  height: var(--header-height);
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--border-hairline);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

/* 收起/展开：一条竖线加一只折角，用纯 CSS 画，随状态翻向 */
.collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  min-height: 2.5rem;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.collapse-btn:hover {
  background: var(--tint-primary-weak);
  color: var(--color-primary-dark);
}

.collapse-btn span {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 16px;
}

.collapse-btn span::before {
  content: '';
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 0;
  width: 2px;
  background: currentColor;
  border-radius: var(--radius-full);
}

.collapse-btn span::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 6px;
  width: 7px;
  height: 7px;
  border-left: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-50%) rotate(45deg);
  transition: transform var(--dur-normal) var(--ease-spring);
}

.collapse-btn span.rotated::after {
  transform: translateY(-50%) rotate(-135deg);
}

/* 位置提示：只在侧栏离屏的窄屏出现 */
.topbar-location {
  display: none;
  min-width: 0;
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--fs-caption);
}

.admin-content {
  min-width: 0;
  min-height: calc(100vh - var(--header-height));
  min-height: calc(100dvh - var(--header-height));
  padding: var(--space-8);
}

/* 后台页面切换过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--dur-fast) var(--ease-standard);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .mobile-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    background: color-mix(in srgb, var(--ink-900) 42%, transparent);
    animation: fadeIn var(--dur-normal) var(--ease-standard);
  }

  /* 抽屉收起时必须真正移出焦点顺序（visibility + pointer-events）：
     否则键盘用户要先用 Tab 穿过 7 个停在屏幕外的菜单项才能到内容区。
     关闭时给 visibility 一个与滑动同长的延迟，动画不会被「瞬间消失」打断。 */
  .sidebar {
    z-index: calc(var(--z-overlay) + 1);
    transform: translateX(-100%);
    visibility: hidden;
    pointer-events: none;
    transition:
      transform var(--dur-slow) var(--ease-emphasis),
      visibility 0s linear var(--dur-slow);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
    transition-delay: 0s;
  }

  .main-wrapper {
    margin-left: 0 !important;
  }

  /* 窄屏上折角换成三条横线：它就是「抽屉开关」 */
  .collapse-btn span::after {
    display: none;
  }

  .collapse-btn span {
    height: 2px;
  }

  .collapse-btn span::before {
    top: 0;
    bottom: auto;
    left: 0;
    width: 20px;
    height: 2px;
    background: currentColor;
    box-shadow:
      0 5px 0 currentColor,
      0 -5px 0 currentColor;
  }

  .topbar {
    padding: 0 var(--space-4);
  }

  /* 窄屏没有常驻侧栏，位置提示重新出现 */
  .topbar-location {
    display: block;
  }

  .admin-content {
    padding: var(--space-4);
  }

  .user-name {
    display: none;
  }
}
</style>
