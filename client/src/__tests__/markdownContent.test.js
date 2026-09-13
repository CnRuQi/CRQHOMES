import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MarkdownContent from '@/components/MarkdownContent.vue'

describe('MarkdownContent', () => {
  it('exposes the article body as a named region', () => {
    const wrapper = mount(MarkdownContent, {
      props: { source: '正文' },
    })

    expect(wrapper.find('[role="region"]').attributes('aria-label')).toBe('文章正文')
  })

  it('renders supported Markdown nodes as Vue elements', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source:
          '# 标题\n\n**加粗**、`代码` 和 [链接](https://example.com)\n\n![封面](/uploads/cover.png)',
      },
    })

    expect(wrapper.find('h1').text()).toBe('标题')
    expect(wrapper.find('strong').text()).toBe('加粗')
    expect(wrapper.find('code').text()).toBe('代码')
    expect(wrapper.find('a').attributes('href')).toBe('https://example.com')
    expect(wrapper.find('img').attributes('src')).toBe('/uploads/cover.png')
    expect(wrapper.find('img').attributes('loading')).toBe('lazy')
  })

  it('drops raw HTML and unsafe URLs while preserving link text', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source:
          '<script>alert(1)</script><div class="raw">不应渲染</div>\n\n[危险链接](javascript:alert(1))',
      },
    })

    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('.raw').exists()).toBe(false)
    expect(wrapper.text()).toContain('危险链接')
    expect(wrapper.find('a').attributes('href')).toBeUndefined()
  })

  it('rejects protocol-relative URLs while preserving safe relative links', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: `[外部协议相对链接](//evil.example)

[站内链接](./about)

[锚点](#section)

[邮件](mailto:test@example.com)`,
      },
    })

    const links = wrapper.findAll('a')
    expect(links[0].attributes('href')).toBeUndefined()
    expect(links[1].attributes('href')).toBe('./about')
    expect(links[2].attributes('href')).toBe('#section')
    expect(links[3].attributes('href')).toBe('mailto:test@example.com')
  })
})
