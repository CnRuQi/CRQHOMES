import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import Editor from '@/views/admin/Editor.vue'
import Layout from '@/views/admin/Layout.vue'
import { getPostForAdmin, updatePost } from '@/api/post'

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

// useToast 返回顶层方法（toast.error 直接可用），mock 形状必须与真实实现一致
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

const editorRoutes = [
  { path: '/admin/posts/create', component: Editor },
  { path: '/admin/posts/:id/edit', component: Editor },
  { path: '/admin/posts', component: { template: '<div>列表</div>' } },
]

// Layout 作为父级路由：跨路由重建测试必须走真实的 <router-view> 渲染路径
const layoutRoutes = [
  { path: '/', component: { template: '<div>前台</div>' } },
  {
    path: '/admin',
    component: Layout,
    children: [
      { path: '', component: { template: '<div>仪表盘</div>' } },
      { path: 'posts', component: { template: '<div>列表</div>' } },
      { path: 'posts/create', component: Editor },
      { path: 'posts/:id/edit', component: Editor },
      { path: 'categories', component: { template: '<div>分类</div>' } },
    ],
  },
]

function makeRouter(path, routes = editorRoutes) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.push(path)
  return router
}

const editorStubs = { MarkdownEditor: true, Icon: true }

describe('Editor.vue 渲染回归（防止 setup 抛错导致空白页）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('写文章页（新建）正常挂载', async () => {
    const router = makeRouter('/admin/posts/create')
    await router.isReady()
    const wrapper = mount(Editor, {
      global: { plugins: [router], stubs: editorStubs },
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
      global: { plugins: [router], stubs: editorStubs },
    })
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.editor-page').exists()).toBe(true)
    expect(wrapper.text()).toContain('编辑文章')
    expect(wrapper.find('.title-input').element.value).toBe('已有文章')
    wrapper.unmount()
  })
})

describe('admin Layout 跨路由重建 Editor（防止实例复用导致表单串页）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create → edit 导航时重新挂载 Editor 并按新 id 拉取文章', async () => {
    const router = makeRouter('/admin/posts/create', layoutRoutes)
    await router.isReady()
    const wrapper = mount(Layout, {
      global: {
        plugins: [router, createPinia()],
        stubs: { MarkdownEditor: true, Icon: true, transition: true },
      },
    })
    await flushPromises()

    // 新建页不拉取文章
    expect(getPostForAdmin).not.toHaveBeenCalled()

    await router.push('/admin/posts/2/edit')
    await flushPromises()
    await nextTick()

    // 若 <component :is> 缺少 :key，Editor 实例被复用、onMounted 不重跑，此处断言失败
    expect(getPostForAdmin).toHaveBeenCalledTimes(1)
    expect(getPostForAdmin).toHaveBeenCalledWith('2')
    expect(wrapper.find('.title-input').element.value).toBe('已有文章')
    wrapper.unmount()
  })
})

describe('已发布文章转草稿需确认（防止静默下线并清空发布时间）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountEditPage() {
    const router = makeRouter('/admin/posts/1/edit')
    await router.isReady()
    const wrapper = mount(Editor, {
      global: { plugins: [router], stubs: editorStubs },
    })
    await flushPromises()
    return wrapper
  }

  function findDraftButton(wrapper) {
    return wrapper.findAll('button').find((b) => b.text().includes('保存草稿'))
  }

  it('确认取消时不提交', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = await mountEditPage()

    await findDraftButton(wrapper).trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(updatePost).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
    wrapper.unmount()
  })

  it('确认后以草稿状态提交', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = await mountEditPage()

    await findDraftButton(wrapper).trigger('click')
    await flushPromises()

    expect(updatePost).toHaveBeenCalledTimes(1)
    expect(updatePost).toHaveBeenCalledWith('1', expect.objectContaining({ status: 0 }))
    confirmSpy.mockRestore()
    wrapper.unmount()
  })
})
