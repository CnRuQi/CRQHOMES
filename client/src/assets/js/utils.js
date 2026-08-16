import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD HH:mm') {
  if (!date) return ''
  return dayjs(date).format(format)
}

// 相对时间
export function fromNow(date) {
  if (!date) return ''
  return dayjs(date).fromNow()
}

// 截取摘要
export function truncate(text, length = 150) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// 格式化数字
export function formatNumber(num) {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 防抖
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 生成分页页码范围
export function getPageRange(total, current, range = 2) {
  const pages = []
  let start = Math.max(1, current - range)
  let end = Math.min(total, current + range)

  if (end - start < range * 2) {
    if (start === 1) {
      end = Math.min(total, start + range * 2)
    } else {
      start = Math.max(1, end - range * 2)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
}

// 搜索关键词高亮：将文本按关键词拆分为片段，配合 Vue 模板安全渲染（避免 v-html）
export function highlightParts(text, keyword) {
  if (!text) return []
  if (!keyword) return [{ text, highlight: false }]

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const lowerKeyword = keyword.toLowerCase()

  return text
    .split(regex)
    .filter((part) => part !== '')
    .map((part) => ({
      text: part,
      highlight: part.toLowerCase() === lowerKeyword,
    }))
}

// 列表页滚动位置（sessionStorage，解决 SPA 返回列表时位置丢失/错位）
// 流程：列表→详情时保存 → scrollBehavior 恢复时暂存 → 数据渲染完成后精确校正
const SCROLL_KEY_PREFIX = 'list-scroll:'

export function saveListScroll(key, y) {
  try {
    sessionStorage.setItem(SCROLL_KEY_PREFIX + key, String(y !== undefined ? y : window.scrollY))
  } catch (_e) {
    // sessionStorage 不可用时静默失败
  }
}

export function getListScroll(key) {
  try {
    const v = sessionStorage.getItem(SCROLL_KEY_PREFIX + key)
    if (v === null) return null
    return parseInt(v, 10)
  } catch (_e) {
    return null
  }
}

export function clearListScroll(key) {
  try {
    sessionStorage.removeItem(SCROLL_KEY_PREFIX + key)
  } catch (_e) {
    // ignore
  }
}

// 列表页数据渲染完成后调用：精确恢复滚动位置并清除暂存
// 使用 behavior:'auto' 瞬时定位，避免被全局 scroll-behavior:smooth 变成缓慢动画
export function restoreListScroll(key) {
  const y = getListScroll(key)
  if (y !== null) {
    window.scrollTo({ top: y, behavior: 'auto' })
    clearListScroll(key)
  }
}
