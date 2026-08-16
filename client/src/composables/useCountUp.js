import { ref, onMounted, watch, onUnmounted } from 'vue'

/**
 * 数字计数动画（ease-out cubic，默认 600ms）
 * @param {import('vue').Ref<number>} target 目标值 ref/computed
 * @param {{ duration?: number }} options
 */
export function useCountUp(target, { duration = 600 } = {}) {
  const value = ref(0)
  let raf = null
  // 用户偏好减少动态效果时，直接显示最终值（不做计数动画）
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function animate() {
    if (raf) cancelAnimationFrame(raf)
    const to = Number(target.value) || 0
    if (prefersReducedMotion || value.value === to) {
      value.value = to
      return
    }
    const from = value.value

    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      // ease-out cubic：先快后慢，避免匀速拖沓
      const eased = 1 - Math.pow(1 - progress, 3)
      value.value = Math.round(from + (to - from) * eased)
      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }
    raf = requestAnimationFrame(step)
  }

  onMounted(animate)
  watch(target, animate)
  onUnmounted(() => {
    if (raf) cancelAnimationFrame(raf)
  })

  return { value }
}
