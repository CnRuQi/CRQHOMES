<template>
  <img
    :src="iconSrc"
    :alt="name"
    class="icon"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 20,
  },
})

// 预注册所有图标，构建时由 Vite 打包，避免动态 new URL 在生产构建中失效
const iconModules = import.meta.glob('../assets/icons/*.svg', {
  eager: true,
  import: 'default',
})

const iconSrc = computed(() => {
  return iconModules[`../assets/icons/${props.name}.svg`] || ''
})
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
}
</style>
