import { useHead } from '@vueuse/head'

export function useSeo(options = {}) {
  const {
    title = '',
    description = '',
    keywords = '',
    image = '',
    type = 'website',
    url = ''
  } = options

  const siteName = '披花沐雪'
  const fullTitle = title ? `${title} - ${siteName}` : siteName

  useHead({
    title: fullTitle,
    meta: [
      { name: 'description', content: description || 'One Last Kiss for the Beautiful World' },
      { name: 'keywords', content: keywords || '博客,技术,前端,后端' },
      
      // Open Graph
      { property: 'og:type', content: type },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description || 'One Last Kiss for the Beautiful World' },
      { property: 'og:site_name', content: siteName },
      ...(image ? [{ property: 'og:image', content: image }] : []),
      ...(url ? [{ property: 'og:url', content: url }] : [])
    ]
  })
}
