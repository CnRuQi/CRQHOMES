<template>
  <span v-if="iconSrc" aria-hidden="true" class="icon" :style="iconStyle"></span>
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

// 样式对象放在 script 里而不是模板表达式里：
// data URL 必须包在带引号的 url("...") 中——Vite 内联的小 SVG 含特殊字符，
// 未加引号的 url() 会被提前终止，整张遮罩失效，
// 症状就是所有图标渲染成一块 currentColor 的实心方块。
// 模板字符串里的双引号与 HTML 属性的引号嵌套也容易打架，一并避开。
const iconStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  '--icon-src': `url("${iconSrc.value}")`,
}))
</script>

<style scoped>
/* 图标以 CSS 遮罩渲染：SVG 只贡献形状（alpha 通道），颜色完全由 currentColor 决定。
   用 <img> 时图标无法继承 color——太阳/月亮/搜索（stroke="currentColor"）在两种主题下
   都会解析成黑色，图标集里写死的 #515151 在深色主题下对比度过低，
   check/alert/close/info（stroke="#ffffff"）在浅色卡片上又完全看不见；
   同时 .icon { color: … } 这类着色规则会静默失效。遮罩方案一次性解决这三点，
   并让图标自动跟随按钮与链接的文字颜色。 */
.icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
  background-color: currentColor;
  -webkit-mask-image: var(--icon-src);
  mask-image: var(--icon-src);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
</style>
