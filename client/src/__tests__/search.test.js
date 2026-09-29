import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Search from '@/views/Search.vue'
import { searchPosts } from '@/api/post'

vi.mock('@/api/post', () => ({
  searchPosts: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ error: vi.fn(), warning: vi.fn(), success: vi.fn() }),
}))

function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

async function mountSearch(query = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/search', component: Search },
      { path: '/post/:slug', component: { template: '<div />' } },
    ],
  })
  await router.push({ path: '/search', query })
  await router.isReady()
  const wrapper = mount(Search, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('Search 输入与查询参数边界', () => {
  beforeEach(() => {
    searchPosts.mockReset()
  })

  it('逐字清空关键词后忽略仍在途的旧请求', async () => {
    const request = deferred()
    searchPosts.mockReturnValueOnce(request.promise)
    const { wrapper } = await mountSearch({ q: '旧关键词' })
    await flushPromises()

    const input = wrapper.find('.search-input')
    await input.setValue('')
    request.resolve({
      data: {
        list: [{ id: 1, title: '旧结果', tags: [], created_at: '2026-01-01T00:00:00.000Z' }],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      },
    })
    await flushPromises()

    expect(wrapper.find('.search-results').exists()).toBe(false)
    wrapper.unmount()
  })

  it('重复 q 参数按无效关键词处理且不抛错', async () => {
    const { wrapper } = await mountSearch({ q: ['第一个', '第二个'] })

    expect(wrapper.find('.search-input').element.value).toBe('')
    expect(searchPosts).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('首次搜索失败显示错误态而非未找到结果', async () => {
    searchPosts.mockRejectedValueOnce(new Error('network error'))
    const { wrapper } = await mountSearch({ q: '关键词' })
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('未找到相关文章')
    wrapper.unmount()
  })

  it('新关键词搜索失败时不显示旧关键词的结果', async () => {
    searchPosts
      .mockResolvedValueOnce({
        data: {
          list: [{ id: 1, title: '旧文章', tags: [], created_at: '2026-01-01T00:00:00.000Z' }],
          pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        },
      })
      .mockRejectedValueOnce(new Error('network error'))
    vi.useFakeTimers()
    const { wrapper } = await mountSearch({ q: '旧关键词' })
    await flushPromises()

    await wrapper.find('.search-input').setValue('新关键词')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    vi.useRealTimers()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('旧文章')
    wrapper.unmount()
  })
})
