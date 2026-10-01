/**
 * magnetic.js — 磁性交互指令（v-magnetic）
 *
 * 元素在光标接近时被「轻轻吸向」光标，离开后弹回。
 * 参数：v-magnetic 或 v-magnetic="0.3"（吸引强度 0–1，默认 0.24）。
 *
 * 设计约束：
 *   · 仅 pointer:fine + 非 reduced-motion 启用，其余环境是无操作的安全 no-op
 *   · 位移限幅 10px：磁性是暗示不是磁铁，吸过头就滑向廉价了
 *   · 弹回由 CSS transition（experience.css 的 .is-magnetic）完成，
 *     JS 只负责跟随阶段的 transform，写入走 style 直接赋值（rAF 频率）
 */

const ATTACH_FLAG = '__magneticBound'

function enabled() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export const magnetic = {
  mounted(el, binding) {
    if (!enabled() || el[ATTACH_FLAG]) return
    el[ATTACH_FLAG] = true
    el.classList.add('is-magnetic')

    const strength = Math.min(Math.max(Number(binding.value) || 0.24, 0), 1)
    const MAX_SHIFT = 10
    let rect = null

    const measure = () => {
      rect = el.getBoundingClientRect()
    }

    const follow = (event) => {
      if (!rect) measure()
      if (!rect) return
      // 跟随阶段必须零过渡：transition 会让每帧写入都「迟到」，跟手感全无
      if (el.style.transition) el.style.transition = ''
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      // 只在「接近」时吸引：光标已深入元素中心时位移归零，避免抖动
      const pull = 1 - Math.min(Math.hypot(dx, dy) / (rect.width * 0.9), 1)
      const shiftX = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dx * strength * pull))
      const shiftY = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dy * strength * pull))
      el.style.transform = `translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0)`
    }

    const onMove = (event) => {
      cancelAnimationFrame(el.__magneticRaf || 0)
      el.__magneticRaf = requestAnimationFrame(() => follow(event))
    }

    const reset = () => {
      cancelAnimationFrame(el.__magneticRaf || 0)
      el.__magneticRaf = 0
      rect = null
      // 弹回交给一段一次性过渡：写完 transition 再清 transform，浏览器才会补间
      el.style.transition = 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)'
      el.style.transform = ''
    }

    // 每次进入元素都重新测量：页面滚动后旧 rect 的中心点早已偏移，
    // 不刷新的话「磁性」会吸向元素原来呆过的地方
    el.__magneticMeasure = measure
    el.__magneticMove = onMove
    el.__magneticReset = reset
    el.addEventListener('pointerenter', measure)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', reset)
  },
  unmounted(el) {
    if (!el[ATTACH_FLAG]) return
    el.removeEventListener('pointerenter', el.__magneticMeasure)
    el.removeEventListener('pointermove', el.__magneticMove)
    el.removeEventListener('pointerleave', el.__magneticReset)
    cancelAnimationFrame(el.__magneticRaf || 0)
    el.classList.remove('is-magnetic')
    el.style.transform = ''
    el.style.transition = ''
    delete el[ATTACH_FLAG]
  },
}
