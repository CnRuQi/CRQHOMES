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

  // 用户显式切换：落盘后即代表「手动选择过」，优先级高于系统偏好
  function setTheme(dark) {
    applyTheme(dark)
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  }

  function toggle() {
    setTheme(!isDark.value)
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
