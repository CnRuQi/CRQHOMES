import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import PostCard from '@/components/PostCard.vue'
import Dashboard from '@/views/admin/Dashboard.vue'
import Posts from '@/views/admin/Posts.vue'
import Layout from '@/views/admin/Layout.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { getAllPosts, getStats, updateSortOrder } from '@/api/post'
import { getCategories } from '@/api/category'

vi.mock('md-editor-v3', () => ({
  MdEditor: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <div class="md-editor">
        <div class="md-editor-toolbar-wrapper">
          <button type="button">工具</button>
        </div>
        <div class="md-editor-content">
          <div class="cm-content" contenteditable="true"></div>
        </div>
      </div>
    `,
  },
}))

vi.mock('@/api/post', () => ({
  getAllPosts: vi.fn(),
  getStats: vi.fn(),
  updateSortOrder: vi.fn(),
  deletePost: vi.fn(),
  toggleTop: vi.fn(),
}))

vi.mock('@/api/category', () => ({
  getCategories: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    toastState: { visible: false, message: '', type: 'info', duration: 3000 },
    show: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    hide: vi.fn(),
  }),
}))

const draggableStub = {
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  template: '<tbody><slot v-for="element in modelValue" name="item" :element="element" /></tbody>',
}

const iconStub = {
  template: '<span aria-hidden="true" />',
}

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

async function createTestRouter(path = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  await router.push(path)
  await router.isReady()
  return router
}

describe('前台文章卡片语义', () => {
  it('uses a second-level heading and hides decorative placeholder content', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PostCard, {
      props: {
        post: {
          id: 1,
          title: '无封面文章',
          summary: '',
          tags: [],
          views: 0,
          created_at: '2026-09-13T00:00:00.000Z',
        },
      },
      global: {
        plugins: [router],
        stubs: { Icon: iconStub },
      },
    })

    expect(wrapper.find('h2.card-title').exists()).toBe(true)
    expect(wrapper.find('.placeholder-icon').attributes('aria-hidden')).toBe('true')
  })

  it('shows an accessible fallback when the cover image fails', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PostCard, {
      props: {
        post: {
          id: 2,
          title: '失效封面文章',
          cover_image: '/uploads/missing.png',
          summary: '',
          tags: [],
          views: 0,
          created_at: '2026-09-13T00:00:00.000Z',
        },
      },
      global: {
        plugins: [router],
        stubs: { Icon: iconStub },
      },
    })

    await wrapper.find('.card-cover img').trigger('error')

    expect(wrapper.find('.card-cover img').exists()).toBe(false)
    expect(wrapper.find('.image-fallback').attributes('role')).toBe('img')
    expect(wrapper.find('.image-fallback').attributes('aria-label')).toBe('封面图片加载失败')
  })
})

describe('后台页面语义', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStats.mockResolvedValue({
      data: { totalPosts: 2, totalCategories: 1, totalViews: 3, topPosts: 1 },
    })
    getAllPosts.mockResolvedValue({
      data: {
        list: [
          {
            id: 1,
            title: '已发布文章',
            status: 1,
            is_top: 0,
            views: 2,
            created_at: '2026-09-13T00:00:00.000Z',
          },
          {
            id: 2,
            title: '草稿文章',
            status: 0,
            is_top: 0,
            views: 1,
            created_at: '2026-09-12T00:00:00.000Z',
          },
        ],
      },
    })
    getCategories.mockResolvedValue({
      data: { categories: [{ id: 1, name: '默认分类' }] },
    })
    updateSortOrder.mockResolvedValue({ data: {} })
  })

  it('uses second-level headings for dashboard sections', async () => {
    const router = await createTestRouter('/admin')
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router],
        stubs: { Icon: iconStub },
      },
    })
    await flushPromises()

    expect(wrapper.findAll('h2.section-title').map((heading) => heading.text())).toEqual([
      '最近文章',
      '快捷操作',
    ])
  })

  it('exposes a keyboard sorting alternative for each post row', async () => {
    const router = await createTestRouter('/admin/posts')
    const wrapper = mount(Posts, {
      global: {
        plugins: [router],
        stubs: {
          Icon: iconStub,
          EmptyState: true,
          draggable: draggableStub,
        },
      },
    })
    await flushPromises()

    const handle = wrapper.find('.drag-handle')
    expect(handle.element.tagName).toBe('BUTTON')
    expect(handle.attributes('type')).toBe('button')
    expect(handle.attributes('aria-label')).toContain('使用上/下方向键移动')

    await handle.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(updateSortOrder).toHaveBeenCalledWith([
      { id: 2, sort_order: 2 },
      { id: 1, sort_order: 1 },
    ])
  })
})

describe('后台布局与 Markdown 编辑器语义', () => {
  it('marks the menu glyph as decorative while the button keeps its label', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/admin', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
      ],
    })
    await router.push('/admin')
    await router.isReady()

    const wrapper = mount(Layout, {
      global: {
        plugins: [router, createPinia()],
        stubs: { Icon: iconStub, transition: true },
      },
    })

    expect(wrapper.find('.collapse-btn').attributes('aria-label')).toBe('收起侧边栏')
    expect(wrapper.find('.collapse-btn span').attributes('aria-hidden')).toBe('true')
  })

  it('makes the horizontally scrollable editor toolbar focusable and named', async () => {
    const wrapper = mount(MarkdownEditor)
    await nextTick()

    const toolbar = wrapper.find('.md-editor-toolbar-wrapper')
    expect(toolbar.attributes('tabindex')).toBe('0')
    expect(toolbar.attributes('role')).toBe('region')
    expect(toolbar.attributes('aria-label')).toBe('Markdown 编辑器工具栏')
  })
})
