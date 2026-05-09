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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar.scrolled {
  background: rgba(245, 245, 243, 0.92);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 1px 3px rgba(56, 57, 54, 0.06);
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

.logo-icon {
  color: var(--color-primary);
  font-size: 1.6rem;
  transition: transform 0.3s ease;
}

.navbar-logo:hover .logo-icon {
  transform: rotate(15deg);
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

.nav-link.router-link-active {
  color: var(--color-primary-dark);
  background: rgba(163, 166, 156, 0.12);
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
    background: rgba(252, 251, 249, 0.98);
    backdrop-filter: blur(30px);
    flex-direction: column;
    justify-content: flex-start;
    padding-top: var(--spacing-2xl);
    gap: var(--spacing-md);
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .navbar-menu.active {
    transform: translateX(0);
  }

  .nav-link {
    font-size: 1.1rem;
    padding: 12px 24px;
    width: 90%;
    text-align: center;
  }
}
</style>
