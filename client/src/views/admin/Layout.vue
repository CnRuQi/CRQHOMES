<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar glass-sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <router-link to="/admin" class="sidebar-logo">
          <span class="logo-icon">✦</span>
          <span class="logo-text" v-show="!isCollapsed">Blog</span>
        </router-link>
      </div>

      <nav class="sidebar-menu">
        <router-link to="/admin" class="menu-item" exact-active-class="active">
          <span class="menu-icon">📊</span>
          <span class="menu-text" v-show="!isCollapsed">仪表盘</span>
        </router-link>
        <router-link to="/admin/posts" class="menu-item" active-class="active">
          <span class="menu-icon">📝</span>
          <span class="menu-text" v-show="!isCollapsed">文章管理</span>
        </router-link>
        <router-link to="/admin/posts/create" class="menu-item" active-class="active">
          <span class="menu-icon">✏️</span>
          <span class="menu-text" v-show="!isCollapsed">写文章</span>
        </router-link>
        <router-link to="/admin/categories" class="menu-item" active-class="active">
          <span class="menu-icon">📁</span>
          <span class="menu-text" v-show="!isCollapsed">分类管理</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="menu-item">
          <span class="menu-icon">🌐</span>
          <span class="menu-text" v-show="!isCollapsed">访问前台</span>
        </router-link>
        <button class="menu-item" @click="handleLogout">
          <span class="menu-icon">🚪</span>
          <span class="menu-text" v-show="!isCollapsed">退出登录</span>
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
            <span class="user-avatar">👤</span>
            <span class="user-name">{{ authStore.user?.nickname || authStore.user?.username }}</span>
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

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapsed = ref(false)

const currentPageTitle = computed(() => {
  return route.meta.title || '仪表盘'
})

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
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
  transition: width var(--transition-normal);
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
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-icon {
  color: var(--color-primary);
  font-size: 1.5rem;
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
  transition: all var(--transition-fast);
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  font-size: inherit;
}

.menu-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: var(--text-primary);
}

.menu-item.active {
  background: rgba(99, 102, 241, 0.2);
  color: var(--color-primary-light);
}

.menu-icon {
  font-size: 1.2rem;
  min-width: 24px;
  text-align: center;
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

.user-avatar {
  font-size: 1.2rem;
}

.admin-content {
  padding: var(--spacing-xl);
  min-height: calc(100vh - var(--header-height));
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .main-wrapper {
    margin-left: 0 !important;
  }
}
</style>
