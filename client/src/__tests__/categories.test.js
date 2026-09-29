import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Categories from '@/views/admin/Categories.vue'
import { getCategories, updateCategory } from '@/api/category'

vi.mock('@/api/category', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ error: vi.fn(), warning: vi.fn(), success: vi.fn() }),
}))

const categoriesResponse = {
  data: {
    categories: [
      { id: 1, name: '默认分类', slug: 'default', description: '', sort: 0 },
      { id: 2, name: '技术', slug: 'tech', description: '', sort: 1 },
    ],
  },
}

function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

async function mountCategories() {
  const wrapper = mount(Categories, {
    attachTo: document.body,
    global: {
      stubs: { Icon: true, EmptyState: true, Teleport: true, Transition: true },
    },
  })
  await flushPromises()
  return wrapper
}

describe('分类弹窗焦点与提交状态', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCategories.mockResolvedValue(categoriesResponse)
  })

  it('打开时聚焦首个输入框，Tab 在弹窗内循环', async () => {
    const wrapper = await mountCategories()
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('新建分类'))
      .trigger('click')
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.find('#category-name').element)

    const saveButton = wrapper.find('form button[type="submit"]')
    saveButton.element.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(wrapper.find('.close-btn').element)

    wrapper.find('.close-btn').element.focus()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    )
    expect(document.activeElement).toBe(saveButton.element)
    wrapper.unmount()
  })

  it('关闭后把焦点还给打开弹窗的按钮', async () => {
    const wrapper = await mountCategories()
    const opener = wrapper.findAll('button').find((button) => button.text().includes('新建分类'))
    opener.element.focus()
    await opener.trigger('click')
    await wrapper.find('.modal-footer .btn-secondary').trigger('click')
    await flushPromises()

    expect(document.activeElement).toBe(opener.element)
    wrapper.unmount()
  })

  it('提交期间不允许关闭或切换弹窗表单', async () => {
    const request = deferred()
    updateCategory.mockReturnValueOnce(request.promise)
    const wrapper = await mountCategories()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '编辑')
      .trigger('click')
    await wrapper.find('#category-name').setValue('更新后的分类')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('form button[type="submit"]').element.disabled).toBe(true)
    await wrapper.find('.modal-footer .btn-secondary').trigger('click')
    expect(wrapper.find('.modal').exists()).toBe(true)
    expect(wrapper.find('#category-name').element.value).toBe('更新后的分类')

    request.resolve({ data: {} })
    await flushPromises()
    expect(wrapper.find('.modal').exists()).toBe(false)
    wrapper.unmount()
  })

  it('成功保存并刷新列表后把焦点放回稳定的新建入口', async () => {
    const refresh = deferred()
    getCategories.mockResolvedValueOnce(categoriesResponse).mockReturnValueOnce(refresh.promise)
    updateCategory.mockResolvedValue({ data: {} })
    const wrapper = await mountCategories()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '编辑')
      .trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.modal').exists()).toBe(false)
    refresh.resolve(categoriesResponse)
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.find('.page-header button').element)
    wrapper.unmount()
  })
})
