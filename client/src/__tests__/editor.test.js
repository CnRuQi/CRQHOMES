import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Editor from '@/views/admin/Editor.vue'

vi.mock('@/api/post', () => ({
  createPost: vi.fn().mockResolvedValue({ data: { post: { id: 1 } } }),
  updatePost: vi.fn().mockResolvedValue({ data: { post: { id: 1 } } }),
  getPostForAdmin: vi.fn().mockResolvedValue({
    data: {
      post: {
        id: 1,
        title: '已有文章',
        content: '内容',
        summary: '',
        cover_image: '',
        category_id: 1,
        tags: [],
        is_top: 0,
        status: 1,
        published_at: '2026-01-01T00:00:00.000Z',
      },
    },
  }),
}))

vi.mock('@/api/category', () => ({
  getCategories: vi.fn().mockResolvedValue({ data: { categories: [{ id: 1, name: '默认分类' }] } }),
}))

vi.mock('@/api/upload', () => ({
  uploadImage: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    toastState: { visible: false, message: '', type: 'info' },
    toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  }),
}))

const routes = [
  { path: '/admin/posts/create', component: Editor },
  { path: '/admin/posts/:id/edit', component: Editor },
  { path: '/admin/posts', component: { template: '<div>列表</div>' } },
]

function makeRouter(path) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.push(path)
  return router
}

describe('Editor.vue 渲染回归（防止 setup 抛错导致空白页）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('写文章页（新建）正常挂载', async () => {
    const router = makeRouter('/admin/posts/create')
    await router.isReady()
    const wrapper = mount(Editor, {
      global: { plugins: [router], stubs: { MarkdownEditor: true, Icon: true } },
    })
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.editor-page').exists()).toBe(true)
    expect(wrapper.text()).toContain('写文章')
    wrapper.unmount()
  })

  it('编辑文章页正常挂载并回填数据', async () => {
    const router = makeRouter('/admin/posts/1/edit')
    await router.isReady()
    const wrapper = mount(Editor, {
      global: { plugins: [router], stubs: { MarkdownEditor: true, Icon: true } },
    })
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.editor-page').exists()).toBe(true)
    expect(wrapper.text()).toContain('编辑文章')
    expect(wrapper.find('.title-input').element.value).toBe('已有文章')
    wrapper.unmount()
  })
})
