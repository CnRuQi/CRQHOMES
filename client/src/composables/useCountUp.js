import { ref, onMounted, watch, onUnmounted } from 'vue'

/**
 * 数字计数动画（ease-out cubic，默认 600ms）
 * @param {import('vue').Ref<number>} target 目标值 ref/computed
 * @param {{ duration?: number }} options
 */
export function useCountUp(target, { duration = 600 } = {}) {
  const value = ref(0)
  let raf = null

  // 用户偏好「减少动态效果」时直接显示最终值（不做计数动画）。
  // 早期版本只在 setup 期取了一次快照，运行期间修改系统设置不会生效；
  // 这里改成响应式并监听 change，与 useTheme 跟随系统主题的做法保持一致
  const reduceMotionQuery =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  const prefersReducedMotion = ref(!!reduceMotionQuery?.matches)

  function stopAnimation() {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  function animate() {
    stopAnimation()
    const to = Number(target.value) || 0
    if (prefersReducedMotion.value || value.value === to) {
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

  // 运行期间切换系统「减少动效」设置也要立即生效：
  // 切到减少时直接落到终值，避免动画停在半途
  function onReduceMotionChange(e) {
    prefersReducedMotion.value = e.matches
    if (e.matches) {
      stopAnimation()
      value.value = Number(target.value) || 0
    } else {
      animate()
    }
  }

  onMounted(() => {
    animate()
    // addEventListener 在旧版 Safari (<14) 上不存在
    reduceMotionQuery?.addEventListener?.('change', onReduceMotionChange)
  })
  watch(target, animate)
  onUnmounted(() => {
    stopAnimation()
    reduceMotionQuery?.removeEventListener?.('change', onReduceMotionChange)
  })

  // 直接返回 ref 本体：模板会自动解包，调用方无需写 .value
  return value
}
