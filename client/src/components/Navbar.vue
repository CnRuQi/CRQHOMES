<template>
  <header class="navbar glass-header" :class="{ scrolled: isScrolled }">
    <div class="container navbar-content">
      <router-link to="/" class="navbar-logo">
        <span class="logo-icon">✦</span>
        <span class="logo-text">Blog</span>
      </router-link>

      <nav class="navbar-menu" :class="{ active: isMenuOpen }">
        <router-link to="/" class="nav-link" @click="closeMenu">
          首页
        </router-link>
        <router-link
          v-for="cat in categories"
          :key="cat.id"
          :to="`/category/${cat.slug}`"
          class="nav-link"
          @click="closeMenu"
        >
          {{ cat.name }}
        </router-link>
        <router-link to="/archives" class="nav-link" @click="closeMenu">
          归档
        </router-link>
        <router-link to="/admin/login" class="nav-link admin-link" @click="closeMenu">
          管理
        </router-link>
      </nav>

      <button class="menu-toggle" @click="toggleMenu">
        <span :class="{ active: isMenuOpen }"></span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePostStore } from '@/stores/post'

const postStore = usePostStore()
const categories = ref([])

const isScrolled = ref(false)
const isMenuOpen = ref(false)

function handleScroll() {
  isScrolled.value = window.scrollY > 50
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  await postStore.fetchCategories()
  categories.value = postStore.categories
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
  transition: all var(--transition-normal);
}

.navbar.scrolled {
  background: rgba(15, 23, 42, 0.95);
  box-shadow: var(--shadow-md);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-icon {
  color: var(--color-primary);
  font-size: 1.8rem;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.nav-link {
  color: var(--text-secondary);
  font-weight: 500;
  padding: var(--spacing-xs) 0;
  position: relative;
  transition: color var(--transition-fast);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: width var(--transition-fast);
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.admin-link {
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(99, 102, 241, 0.2);
  border-radius: var(--border-radius-sm);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.admin-link::after {
  display: none;
}

.admin-link:hover {
  background: rgba(99, 102, 241, 0.3);
  color: var(--color-primary-light);
}

.menu-toggle {
  display: none;
  width: 30px;
  height: 24px;
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
  transition: all var(--transition-fast);
}

.menu-toggle span {
  top: 50%;
  transform: translateY(-50%);
}

.menu-toggle span::before {
  content: '';
  top: -8px;
}

.menu-toggle span::after {
  content: '';
  bottom: -8px;
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
    background: rgba(15, 23, 42, 0.98);
    backdrop-filter: blur(20px);
    flex-direction: column;
    justify-content: flex-start;
    padding-top: var(--spacing-2xl);
    gap: var(--spacing-xl);
    transform: translateX(100%);
    transition: transform var(--transition-normal);
  }

  .navbar-menu.active {
    transform: translateX(0);
  }

  .nav-link {
    font-size: 1.2rem;
  }
}
</style>
