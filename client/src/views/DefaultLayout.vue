<template>
  <div class="default-layout">
    <Navbar />
    <main class="main-content">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: calc(var(--header-height) + var(--spacing-2xl));
  padding-bottom: calc(var(--spacing-2xl) + env(safe-area-inset-bottom, 0px));
}
</style>
