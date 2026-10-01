/**
 * snowfall.js — 全站落雪氛围层
 *
 * 「披花沐雪」：雪是站名的一部分，也是这个站点唯一的「天气」。
 * 设计约束：
 *   · 极轻：全站同屏不超过 44 粒，单粒不透明度 ≤ 0.55，
 *     只提供「房间里有扇窗开着」的感知，绝不与正文争夺注意力
 *   · 极省：单一 rAF 循环、无每粒对象的绘制状态切换（同色统一填充）；
 *     标签页不可见即暂停；移动端与触屏一律不启用（GPU/电量优先）
 *   · 可退：prefers-reduced-motion 或 canvas 不可用时完全不初始化
 */

const TAU = Math.PI * 2

/** 同屏粒子数：按视口面积缩放，封顶 44 */
function particleCount(width, height) {
  const density = (width * height) / 38000
  return Math.max(18, Math.min(44, Math.round(density)))
}

function rand(min, max) {
  return min + Math.random() * (max - min)
}

class Snowfall {
  constructor(host) {
    this.host = host
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'snowfall-layer'
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d')
    this.flakes = []
    this.rafId = 0
    this.running = false
    this.lastTime = 0
    this.dpr = 1
    this.width = 0
    this.height = 0
  }

  /** 主题对应的雪色：亮色主题用墨灰（雪映在纸上），暗色主题用霜白 */
  readFlakeColor() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    return dark ? 'rgba(226, 232, 222, 0.85)' : 'rgba(87, 90, 84, 0.8)'
  }

  resize() {
    const rect = this.host.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = Math.max(1, rect.width)
    this.height = Math.max(1, rect.height)
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  seed() {
    const count = particleCount(this.width, this.height)
    this.flakes = Array.from({ length: count }, () => this.spawn(true))
  }

  /** @param {boolean} anywhere 初始铺设时允许全高分布，避免「从空白中一起落下」 */
  spawn(anywhere = false) {
    const r = rand(0.6, 2.1)
    return {
      x: rand(0, this.width),
      y: anywhere ? rand(-this.height * 0.2, this.height) : rand(-24, -6),
      r,
      vy: rand(0.18, 0.5) + r * 0.08, // 大雪片略快，符合视觉直觉
      drift: rand(0.12, 0.4),
      phase: rand(0, TAU),
      omega: rand(0.0008, 0.0022),
      alpha: rand(0.22, 0.55),
    }
  }

  tick = (now) => {
    if (!this.running) return
    // 时间驱动而不是帧驱动：144Hz 屏上帧驱动会让雪快一倍多；
    // dt 归一到 60fps 帧，clamp 3 是防止标签页切回时首帧 dt 暴走
    if (!this.lastTime) this.lastTime = now
    const dt = Math.min((now - this.lastTime) / 16.6667, 3)
    this.lastTime = now

    const { ctx } = this
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.fillStyle = this.color
    for (const f of this.flakes) {
      f.phase += f.omega * 16 * dt
      f.y += f.vy * dt
      f.x += Math.sin(f.phase) * f.drift * dt
      // 横向越界时从另一侧进入；纵向落出底部则回到顶端
      if (f.y - f.r > this.height) {
        Object.assign(f, this.spawn())
        continue
      }
      if (f.x < -8) f.x = this.width + 8
      else if (f.x > this.width + 8) f.x = -8
      ctx.globalAlpha = f.alpha
      ctx.beginPath()
      ctx.arc(f.x, f.y, f.r, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    this.rafId = requestAnimationFrame(this.tick)
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTime = 0
    this.color = this.readFlakeColor()
    this.rafId = requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.rafId)
  }

  /** 主题切换后重读一次雪色（下一帧生效） */
  refreshColor() {
    this.color = this.readFlakeColor()
  }

  mount() {
    this.host.appendChild(this.canvas)
    this.resize()
    this.seed()
    this.start()

    this.onResize = () => {
      // 尺寸变化重铺，粒子密度跟随视口
      this.resize()
      this.seed()
    }
    this.onVisibility = () => {
      if (document.hidden) this.stop()
      else this.start()
    }
    this.onThemeChange = () => this.refreshColor()

    window.addEventListener('resize', this.onResize, { passive: true })
    document.addEventListener('visibilitychange', this.onVisibility)
    // 主题由 data-theme 表达，属性变化时雪色跟随
    this.themeObserver = new MutationObserver(this.onThemeChange)
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }

  destroy() {
    this.stop()
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.themeObserver?.disconnect()
    this.themeObserver = null
    this.canvas.remove()
  }
}

/**
 * 挂载落雪层。所有前置条件不满足时返回 null，调用方无需判断。
 * @returns {Snowfall | null}
 */
export function mountSnowfall(host = document.body) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  if (!window.matchMedia) return null

  // 触屏 / 无精细指针（手机、平板）：不启用
  const finePointer = window.matchMedia('(pointer: fine)').matches
  if (!finePointer) return null
  // 降低动态：一切持续运动的装饰退场
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  // 老 environmental 兜底：canvas 2d 拿不到就不做
  const probe = document.createElement('canvas')
  if (!probe.getContext || !probe.getContext('2d')) return null

  const snow = new Snowfall(host)
  snow.mount()
  return snow
}
