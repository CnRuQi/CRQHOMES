import { computed } from 'vue'
import { useHead } from '@vueuse/head'

// 兼容 ref/computed 与普通值
function toValue(value) {
  return value && typeof value === 'object' && 'value' in value ? value.value : value
}

export function useSeo(options = {}) {
  const {
    title = '',
    description = '',
    keywords = '',
    image = '',
    type = 'website',
    url = '',
  } = options

  const siteName = '披花沐雪'
  const fullTitle = computed(() => {
    const t = toValue(title)
    return t ? `${t} - ${siteName}` : siteName
  })

  useHead({
    title: fullTitle,
    meta: computed(() => [
      {
        name: 'description',
        content: toValue(description) || 'One Last Kiss for the Beautiful World',
      },
      { name: 'keywords', content: toValue(keywords) || '博客,技术,前端,后端' },

      // Open Graph
      { property: 'og:type', content: toValue(type) },
      { property: 'og:title', content: fullTitle.value },
      {
        property: 'og:description',
        content: toValue(description) || 'One Last Kiss for the Beautiful World',
      },
      { property: 'og:site_name', content: siteName },
      ...(toValue(image) ? [{ property: 'og:image', content: toValue(image) }] : []),
      ...(toValue(url) ? [{ property: 'og:url', content: toValue(url) }] : []),
    ]),
  })
}
