import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Posts from '@/views/admin/Posts.vue'
import { getAllPosts, updateSortOrder } from '@/api/post'

vi.mock('@/api/post', () => ({
  getAllPosts: vi.fn(),
  deletePost: vi.fn(),
  toggleTop: vi.fn(),
  updateSortOrder: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ warning: vi.fn(), error: vi.fn(), success: vi.fn() }),
}))

const draggableStub = {
  props: { modelValue: { type: Array, default: () => [] } },
  emits: ['update:modelValue', 'end'],
  methods: {
    reorder() {
      const next = [...this.modelValue]
      ;[next[0], next[1]] = [next[1], next[0]]
      this.$emit('update:modelValue', next)
      this.$emit('end')
    },
  },
  template: `
    <tbody>
      <tr v-for="post in modelValue" :key="post.id"><td>{{ post.title }}</td></tr>
      <tr><td><button type="button" class="simulate-sort" @click="reorder">排序</button></td></tr>
    </tbody>
  `,
}

function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('文章排序并发保存', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAllPosts.mockResolvedValue({
      data: {
        list: [
          { id: 1, title: '文章一', status: 1, is_top: 0, views: 0 },
          { id: 2, title: '文章二', status: 1, is_top: 0, views: 0 },
          { id: 3, title: '文章三', status: 1, is_top: 0, views: 0 },
        ],
      },
    })
  })

  it('第一次排序保存期间再次排序后提交最新顺序', async () => {
    const firstSave = deferred()
    updateSortOrder.mockReturnValueOnce(firstSave.promise).mockResolvedValue({ data: {} })
    const wrapper = mount(Posts, {
      global: {
        stubs: {
          draggable: draggableStub,
          EmptyState: true,
          Icon: true,
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    await wrapper.find('.simulate-sort').trigger('click')
    expect(updateSortOrder).toHaveBeenCalledTimes(1)
    await wrapper.find('.simulate-sort').trigger('click')
    expect(updateSortOrder).toHaveBeenCalledTimes(1)

    firstSave.resolve({ data: {} })
    await flushPromises()

    expect(updateSortOrder).toHaveBeenCalledTimes(2)
    expect(updateSortOrder).toHaveBeenLastCalledWith([
      { id: 1, sort_order: 3 },
      { id: 2, sort_order: 2 },
      { id: 3, sort_order: 1 },
    ])
    wrapper.unmount()
  })
})
