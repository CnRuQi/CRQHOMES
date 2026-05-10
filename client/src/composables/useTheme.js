import { ref, onMounted } from 'vue'

const isDark = ref(false)

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
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches)
      }
    })
  }

  return {
    isDark,
    toggle,
    initTheme,
    watchSystemTheme
  }
}
