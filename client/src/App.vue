<template>
  <div class="app-wrapper">
    <router-view v-slot="{ Component, route }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="route.matched[0]?.path || route.path" />
      </transition>
    </router-view>

    <!-- 全局 Toast -->
    <Toast
      v-model:visible="toastState.visible"
      :message="toastState.message"
      :type="toastState.type"
      :duration="toastState.duration"
      :seq="toastState.seq"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'

const { toastState } = useToast()
const { initTheme, watchSystemTheme, stopWatchSystemTheme } = useTheme()

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

function initAos() {
  AOS.init({
    duration: 500,
    easing: 'ease-out',
    once: true,
    offset: 50,
    // 用户偏好减少动态效果时禁用滚动动画
    disable: reduceMotionQuery.matches,
  })
}

onMounted(() => {
  initTheme()
  watchSystemTheme()
  initAos()
  // 会话中切换系统「减少动态效果」时即时生效
  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener('change', initAos)
  }
})

onUnmounted(() => {
  stopWatchSystemTheme()
  if (reduceMotionQuery.removeEventListener) {
    reduceMotionQuery.removeEventListener('change', initAos)
  }
})
</script>

<style>
.app-wrapper {
  position: relative;
  min-height: 100vh;
  background: var(--bg-primary);
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
