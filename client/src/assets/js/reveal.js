/**
 * reveal.js — 基于 IntersectionObserver 的入场揭示系统
 *
 * 为什么不用 AOS：
 *   1. AOS 需要在每个元素上写 data-aos-* 并全局初始化，行为不可控；
 *   2. 它用 scroll 事件驱动，长列表下开销明显；
 *   3. 它是通用库的默认观感，与「这一站自己的语言」无关。
 *
 * 本实现：
 *   · 单一 IntersectionObserver 实例，揭示后立即 unobserve
 *   · 只在「同一批进入视口」的元素之间错峰，而不是按 DOM 顺序全局编号——
 *     否则长列表里靠后的一张卡片滚动进入时，会白白等待几百毫秒
 *   · 用 MutationObserver 覆盖「异步数据到达后才渲染」的列表
 *   · 无条件降级：不支持 IntersectionObserver 或用户偏好降低动态时，
 *     直接把内容标记为已揭示，绝不让内容停留在隐藏态
 *
 * 用法：给元素加 data-reveal="up|down|left|right|scale|mask|blur|rule|fade"，
 * 可选 data-reveal-delay="120" 覆盖自动错峰。
 */

const REVEAL_SELECTOR = '[data-reveal]'
const BOUND_FLAG = 'revealBound'

/** 同一批元素之间的错峰间隔（ms） */
const STAGGER_STEP = 70
/** 错峰上限：第 8 个之后不再累加，避免大批量出现时尾巴拖太久 */
const STAGGER_MAX = 7
/** 提前 8% 视口高度触发，让动效略早于元素完全进入 */
const ROOT_MARGIN = '0px 0px -8% 0px'
/** threshold 必须为 0：mask 型元素的初始态被 clip-path 裁到只剩 2px 墨线
 *  （IntersectionObserver 的交集计算会应用 clip-path），
 *  任何 >0 的 threshold 都会让 ratio 永远不达标、内容被永久藏住。
 *  触发时机由 rootMargin 负责微调，不需要 threshold 参与。 */
const THRESHOLD = 0

let observer = null
let mutationObserver = null
let scanScheduled = false

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function supportsObserver() {
  return typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function'
}

function revealNow(el) {
  el.classList.add('is-revealed')
  if (observer) {
    observer.unobserve(el)
  }
}

function hasExplicitDelay(el) {
  const explicit = el.dataset.revealDelay
  if (explicit === undefined || explicit === '') return false
  const parsed = Number(explicit)
  if (!Number.isFinite(parsed)) return false
  el.style.setProperty('--reveal-delay', `${Math.max(0, parsed)}ms`)
  return true
}

/** 同一批进入视口的元素，按视觉顺序（上→下，左→右）依次亮相 */
function sortByVisualOrder(elements) {
  return elements
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)
    .map((item) => item.el)
}

function revealBatch(elements) {
  const ordered = sortByVisualOrder(elements)
  ordered.forEach((el, index) => {
    if (index > 0 && !hasExplicitDelay(el)) {
      const step = Math.min(index, STAGGER_MAX) * STAGGER_STEP
      el.style.setProperty('--reveal-delay', `${step}ms`)
    }
    revealNow(el)
  })
}

/** 收集根节点内尚未绑定过的待揭示元素 */
function queryPending(root) {
  const scope = root && typeof root.querySelectorAll === 'function' ? root : document
  return Array.from(scope.querySelectorAll(REVEAL_SELECTOR))
}

/**
 * 扫描并登记待揭示元素。
 * @param {ParentNode} [root] 限定扫描范围，默认整篇文档
 */
export function scanReveal(root) {
  if (typeof document === 'undefined') return

  const pending = queryPending(root).filter((el) => el.dataset[BOUND_FLAG] !== 'true')
  if (!pending.length) return

  const immediate = !supportsObserver() || prefersReducedMotion()

  if (immediate) {
    pending.forEach((el) => {
      el.dataset[BOUND_FLAG] = 'true'
      revealNow(el)
    })
    return
  }

  pending.forEach((el) => {
    el.dataset[BOUND_FLAG] = 'true'
    observer.observe(el)
  })
}

/** 用 rAF 合并同一帧内的多次 DOM 变化，避免重复扫描 */
function scheduleScan() {
  if (scanScheduled) return
  scanScheduled = true
  const raf =
    typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame
      : (cb) => setTimeout(cb, 16)

  raf(() => {
    scanScheduled = false
    scanReveal()
  })
}

/**
 * 启动揭示系统。应在应用挂载后调用一次。
 * 重复初始化是幂等的。
 */
export function initReveal() {
  if (typeof document === 'undefined') return

  // 不支持或用户偏好降低动态：一次性把已有元素标为已揭示即可
  if (!supportsObserver() || prefersReducedMotion()) {
    scanReveal()
    return
  }

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        const arrived = []
        entries.forEach((entry) => {
          if (entry.isIntersecting) arrived.push(entry.target)
        })
        if (arrived.length) revealBatch(arrived)
      },
      { rootMargin: ROOT_MARGIN, threshold: THRESHOLD }
    )
  }

  if (!mutationObserver && typeof window.MutationObserver === 'function') {
    mutationObserver = new MutationObserver(scheduleScan)
    mutationObserver.observe(document.body, { childList: true, subtree: true })
  }

  scanReveal()
}

/** 应用卸载时释放观察器与监听 */
export function disposeReveal() {
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
  if (observer) {
    observer.disconnect()
    observer = null
  }
  scanScheduled = false
}

/**
 * 让一批新插入的元素立即重新参与扫描。
 * 主要用于「数据异步到达后一次性渲染大量卡片」的场景，
 * 不必等待 MutationObserver 的下一帧。
 */
export function refreshReveal() {
  scheduleScan()
}
