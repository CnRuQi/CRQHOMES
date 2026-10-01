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
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import { initReveal, disposeReveal } from '@/assets/js/reveal'

const { toastState } = useToast()
const { initTheme, watchSystemTheme, stopWatchSystemTheme } = useTheme()

onMounted(() => {
  initTheme()
  watchSystemTheme()
  // 入场揭示：单例 IntersectionObserver + MutationObserver，
  // 覆盖首屏与异步渲染的列表。替代了原先的 AOS——
  // 少一个运行时依赖，也少一套不属于本站的默认观感。
  initReveal()
})

onUnmounted(() => {
  stopWatchSystemTheme()
  disposeReveal()
})
</script>

<style>
.app-wrapper {
  position: relative;
  min-height: 100vh;
  /* 移动端浏览器地址栏会算进 100vh，用 dvh 修正；不支持的浏览器保留上一行 */
  min-height: 100dvh;
  background: var(--bg-primary);
}
</style>
