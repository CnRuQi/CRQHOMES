<template>
  <div class="default-layout">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <Navbar />
    <main id="main-content" class="main-content" tabindex="-1">
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
import { onMounted, onUnmounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { mountSnowfall } from '@/assets/js/snowfall'
import { mountInkCursor } from '@/assets/js/inkCursor'

// 全站氛围层：落雪与墨点都自带环境判定（触屏 / reduced-motion / 旧浏览器
// 直接返回 null），这里只负责生命周期。
let snowfall = null
let inkCursor = null

onMounted(() => {
  snowfall = mountSnowfall()
  inkCursor = mountInkCursor()
})

onUnmounted(() => {
  snowfall?.destroy()
  snowfall = null
  inkCursor?.destroy()
  inkCursor = null
})
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* 地址栏收放时 100vh 会算错，dvh 才是真实可视高度 */
  min-height: 100dvh;
  background: var(--bg-primary);
}

/* 顶栏固定，内容整体下沉一个 header 高度再加一段呼吸；
   上下留白都用流体令牌，缩放到任何视口都不会在断点处「跳」一下 */
.main-content {
  flex: 1;
  padding-top: calc(var(--header-height) + var(--space-section-sm));
  padding-bottom: var(--space-section-sm);
}

/* main 只在程序化聚焦时获得焦点（跳到主要内容），
   不应在鼠标点击时留下焦点框 */
.main-content:focus {
  outline: none;
}
</style>
