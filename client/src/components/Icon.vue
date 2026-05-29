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

const iconSrc = computed(() => {
  return new URL(`../assets/icons/${props.name}.svg`, import.meta.url).href
})
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
}
</style>
