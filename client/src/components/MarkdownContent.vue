<script>
import { computed, h } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from '@/assets/js/markdown'

const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]

const ALLOWED_ATTR = [
  'alt',
  'class',
  'colspan',
  'height',
  'href',
  'rel',
  'rowspan',
  'start',
  'src',
  'target',
  'title',
  'width',
]

const SAFE_URI = /^(?:(?:https?|mailto):|(?!(?:[a-z][a-z\d+.-]*:|\/\/)))/i

function isSafeUri(value) {
  return typeof value === 'string' && SAFE_URI.test(value.trim())
}

function sanitizeMarkdown(source) {
  const renderer = new marked.Renderer()
  // Raw HTML is intentionally excluded from the Markdown contract. Markdown
  // nodes still pass through DOMPurify as a defense-in-depth boundary.
  renderer.html = () => ''

  return DOMPurify.sanitize(marked(source, { renderer }), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: SAFE_URI,
    afterSanitizeAttributes: (node) => {
      if (node.tagName === 'A') {
        const href = node.getAttribute('href')
        if (href && !isSafeUri(href)) node.removeAttribute('href')
        if (node.getAttribute('target') === '_blank') {
          node.setAttribute('rel', 'noopener noreferrer')
        }
      }
    },
  })
}

function toVNode(node) {
  if (node.nodeType === 3) return node.textContent
  if (node.nodeType !== 1) return null

  const attrs = {}
  for (const attribute of Array.from(node.attributes)) {
    const { name, value } = attribute
    if (name === 'href' && !isSafeUri(value)) continue
    attrs[name === 'class' ? 'class' : name] = value
  }

  if (node.tagName === 'A' && attrs.target === '_blank') {
    attrs.rel = 'noopener noreferrer'
  }
  if (node.tagName === 'IMG') {
    attrs.loading = 'lazy'
  }

  const children = Array.from(node.childNodes).map(toVNode).filter(Boolean)
  return h(node.tagName.toLowerCase(), attrs, children)
}

export default {
  name: 'MarkdownContent',
  props: {
    source: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const renderedNodes = computed(() => {
      if (!props.source) return []

      const sanitized = sanitizeMarkdown(props.source)
      const parsed = new DOMParser().parseFromString(`<div>${sanitized}</div>`, 'text/html')
      const container = parsed.body.firstElementChild
      return container ? Array.from(container.childNodes).map(toVNode).filter(Boolean) : []
    })

    return () =>
      h(
        'div',
        { class: 'markdown-content', role: 'region', 'aria-label': '文章正文' },
        renderedNodes.value
      )
  },
}
</script>
