import { ref } from 'vue'

const isDark = ref(false)

let mediaQuery = null
let systemThemeHandler = null

export function useTheme() {
  function setTheme(dark) {
    isDark.value = dark
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  function toggle() {
    setTheme(!isDark.value)
  }

  function initTheme() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      setTheme(saved === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark)
    }
  }

  // 监听系统主题变化
  function watchSystemTheme() {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemThemeHandler = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches)
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
