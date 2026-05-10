<template>
  <div class="app-wrapper">
    <!-- 和纸纹理 -->
    <div class="washi-texture"></div>
    
    <router-view v-slot="{ Component, route }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <!-- 全局 Toast -->
    <Toast 
      v-model:visible="toastState.visible"
      :message="toastState.message"
      :type="toastState.type"
      :duration="toastState.duration"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'

const { toastState } = useToast()

onMounted(() => {
  AOS.init({
    duration: 600,
    easing: 'ease-out',
    once: true,
    offset: 50
  })
})
</script>

<style>
.app-wrapper {
  position: relative;
  min-height: 100vh;
}

/* 和纸纹理 - 微小的纸质纤维感 */
.washi-texture {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: multiply;
}

/* 页面过渡动画 - 克制平缓 */
.page-enter-active {
  transition: all 0.35s ease-out;
}

.page-leave-active {
  transition: all 0.25s ease-in;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
