/**
 * inkCursor.js — 墨点跟随层（桌面端）
 *
 * 一滴迟到的墨：用 lerp 慢半拍地跟着原生光标走，
 * 悬停在可交互元素上时晕开成一圈淡墨。
 * 设计约束：
 *   · 不隐藏原生光标 —— 这是「阅读站」，选词、I-beam 的原生暗示必须保留，
 *     墨点只做氛围，不做指针替代（可用性优先于风格）
 *   · lerp 而非 1:1 跟随 —— 延迟感才是「墨」的物理性
 *   · 仅 pointer:fine + hover:hover + 非 reduced-motion 启用
 */

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  '[role="button"]',
  'input',
  'textarea',
  'select',
  'label',
  'summary',
].join(', ')

class InkCursor {
  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'ink-cursor'
    this.el.setAttribute('aria-hidden', 'true')
    this.x = window.innerWidth / 2
    this.y = window.innerHeight / 2
    this.tx = this.x
    this.ty = this.y
    this.rafId = 0
    this.running = false
    this.visible = false
  }

  onPointerMove = (event) => {
    this.tx = event.clientX
    this.ty = event.clientY
    if (!this.visible) {
      // 首次出现不「飞」过来：直接落位，之后再开始拖尾
      this.x = this.tx
      this.y = this.ty
      this.visible = true
      this.el.classList.add('is-visible')
    }
    if (!this.running) {
      this.running = true
      this.rafId = requestAnimationFrame(this.tick)
    }
  }

  onPointerOver = (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    this.el.classList.toggle('is-active', Boolean(target.closest(INTERACTIVE_SELECTOR)))
  }

  onPointerDown = () => this.el.classList.add('is-pressed')
  onPointerUp = () => this.el.classList.remove('is-pressed')

  onPointerLeave = () => {
    this.el.classList.remove('is-visible')
    this.visible = false
  }

  tick = () => {
    // 0.16 的插值系数：够跟手，又留得住「拖墨」的迟滞
    this.x += (this.tx - this.x) * 0.16
    this.y += (this.ty - this.y) * 0.16
    this.el.style.transform = `translate3d(${this.x.toFixed(1)}px, ${this.y.toFixed(1)}px, 0)`
    if (Math.abs(this.tx - this.x) < 0.1 && Math.abs(this.ty - this.y) < 0.1) {
      this.running = false
      return
    }
    this.rafId = requestAnimationFrame(this.tick)
  }

  mount() {
    document.body.appendChild(this.el)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerover', this.onPointerOver, { passive: true })
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true })
    window.addEventListener('pointerup', this.onPointerUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', this.onPointerLeave)
  }

  destroy() {
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerover', this.onPointerOver)
    window.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    document.documentElement.removeEventListener('pointerleave', this.onPointerLeave)
    this.el.remove()
  }
}

/**
 * 挂载墨点跟随层。所有前置条件不满足时返回 null。
 * @returns {InkCursor | null}
 */
export function mountInkCursor() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  if (!window.matchMedia) return null
  if (!window.matchMedia('(pointer: fine)').matches) return null
  if (!window.matchMedia('(hover: hover)').matches) return null
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  const cursor = new InkCursor()
  cursor.mount()
  return cursor
}
