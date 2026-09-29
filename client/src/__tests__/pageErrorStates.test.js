import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Archives from '@/views/Archives.vue'
import Categories from '@/views/admin/Categories.vue'
import Posts from '@/views/admin/Posts.vue'
import { getArchives, getAllPosts } from '@/api/post'
import { getCategories } from '@/api/category'

const fetchPosts = vi.fn()

vi.mock('@/api/post', () => ({ getArchives: vi.fn(), getAllPosts: vi.fn() }))
vi.mock('@/api/category', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))
vi.mock('@/stores/post', () => ({
  usePostStore: () => ({
    posts: [],
    pagination: { total: 0, page: 1, pageSize: 18, totalPages: 0 },
    fetchPosts,
  }),
}))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ error: vi.fn(), warning: vi.fn(), success: vi.fn() }),
}))

async function createRouterAt(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Home },
      { path: '/archives', component: Archives },
      { path: '/post/:slug', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return router
}

describe('列表请求失败状态', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchPosts.mockRejectedValue(new Error('network error'))
    getArchives.mockRejectedValue(new Error('network error'))
    getAllPosts.mockRejectedValue(new Error('network error'))
    getCategories.mockRejectedValue(new Error('network error'))
  })

  it('首页请求失败显示错误态而非空文章态', async () => {
    const router = await createRouterAt('/')
    const wrapper = mount(Home, {
      global: {
        plugins: [router],
        stubs: { PostCard: true, SkeletonCard: true, Pagination: true },
      },
    })
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('暂无文章')
    wrapper.unmount()
  })

  it('归档请求失败显示错误态而非空文章态', async () => {
    const router = await createRouterAt('/archives')
    const wrapper = mount(Archives, {
      global: { plugins: [router], stubs: { 'router-link': true } },
    })
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('暂无文章')
    wrapper.unmount()
  })

  it('分类请求失败显示错误态而非空分类态', async () => {
    const wrapper = mount(Categories, { global: { stubs: { Icon: true, EmptyState: true } } })
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('暂无分类')
    wrapper.unmount()
  })

  it('后台文章请求失败显示错误态而非空列表态', async () => {
    const wrapper = mount(Posts, {
      global: {
        stubs: {
          draggable: true,
          Icon: true,
          EmptyState: {
            props: ['text'],
            template: '<div class="empty-state">{{ text }}</div>',
          },
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('暂无文章')
    wrapper.unmount()
  })
})
