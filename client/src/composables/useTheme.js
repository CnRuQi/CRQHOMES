import { ref } from 'vue'

const isDark = ref(false)

let mediaQuery = null
let systemThemeHandler = null

const THEME_KEY = 'theme'

export function useTheme() {
  // 只切外观，不落盘
  function applyTheme(dark) {
    isDark.value = dark
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }

  // 用户显式切换：落盘后即代表「手动选择过」，优先级高于系统偏好。
  // 支持.View Transitions 的浏览器从点击处做圆形墨晕扩散；
  // 其余环境与降低动态偏好时直接切换，行为与旧版一致。
  function setTheme(dark, event) {
    const doc = typeof document !== 'undefined' ? document : null
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!doc || !doc.startViewTransition || reduced || !event) {
      applyTheme(dark)
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
      return
    }

    const x = typeof event.clientX === 'number' ? event.clientX : window.innerWidth / 2
    const y = typeof event.clientY === 'number' ? event.clientY : window.innerHeight / 2
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = doc.startViewTransition(() => {
      applyTheme(dark)
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    })

    transition.ready.then(() => {
      doc.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius.toFixed(0)}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 560,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  function toggle(event) {
    setTheme(!isDark.value, event)
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY)
    // 无存档时按系统偏好渲染，但刻意不落盘：一旦落盘，
    // watchSystemTheme 里「没有存档才跟随」的判断就永远为假，跟随系统就成了死代码。
    // 历史用户已有的 theme 值无法区分来源，一律视为其显式选择，升级后外观不变。
    if (saved) {
      applyTheme(saved === 'dark')
    } else {
      applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }

  // 监听系统主题变化
  function watchSystemTheme() {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemThemeHandler = (e) => {
      // 没有存档 = 用户从未手动选过主题，此时才跟随系统
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches)
      }
    }
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', systemThemeHandler)
    } else if (mediaQuery.addListener) {
      // 兼容旧版 Safari（<14）
      mediaQuery.addListener(systemThemeHandler)
    }
  }

  // 停止监听系统主题变化
  function stopWatchSystemTheme() {
    if (mediaQuery && systemThemeHandler) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', systemThemeHandler)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(systemThemeHandler)
      }
    }
    systemThemeHandler = null
    mediaQuery = null
  }

  return {
    isDark,
    toggle,
    initTheme,
    watchSystemTheme,
    stopWatchSystemTheme,
  }
}
