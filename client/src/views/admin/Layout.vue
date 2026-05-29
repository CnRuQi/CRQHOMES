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
        <button class="menu-item" @click="handleLogout">
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
          <button class="collapse-btn" @click="toggleSidebar">
            <span :class="{ rotated: isCollapsed }">☰</span>
          </button>
          <h2 class="page-title">{{ currentPageTitle }}</h2>
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
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapsed = ref(false)
const isMobileOpen = ref(false)

const currentPageTitle = computed(() => {
  return route.meta.title || '仪表盘'
})

function toggleSidebar() {
  if (window.innerWidth <= 768) {
    isMobileOpen.value = !isMobileOpen.value
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}

function closeMobileSidebar() {
  isMobileOpen.value = false
}

function handleLogout() {
  authStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  transition:
    background 0.2s ease,
    color 0.2s ease;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  font-size: inherit;
}

.menu-item:hover {
  background: rgba(163, 166, 156, 0.1);
  color: var(--text-primary);
}

.menu-item.active {
  background: rgba(163, 166, 156, 0.15);
  color: var(--color-primary-dark);
}

.menu-text {
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s ease 0.15s;
}

.menu-text.hidden {
  opacity: 0;
  transition: opacity 0.1s ease;
}

.sidebar-footer {
  padding: var(--spacing-md) var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.main-wrapper {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-normal);
}

.main-wrapper.expanded {
  margin-left: 70px;
}

.topbar {
  height: var(--header-height);
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.collapse-btn {
  font-size: 1.3rem;
  color: var(--text-secondary);
  padding: var(--spacing-xs);
  transition: transform var(--transition-fast);
}

.collapse-btn span {
  display: inline-block;
  transition: transform var(--transition-fast);
}

.collapse-btn span.rotated {
  transform: rotate(180deg);
}

.page-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
}

.admin-content {
  padding: var(--spacing-xl);
  min-height: calc(100vh - var(--header-height));
}

@media (max-width: 768px) {
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1002;
  }

  .sidebar {
    transform: translateX(-100%);
    z-index: 1003;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .main-wrapper {
    margin-left: 0 !important;
  }
}
</style>
