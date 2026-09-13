import { describe, it, expect } from 'vitest'
import NProgress from 'nprogress'
import '@/router'

describe('路由加载进度条可访问性', () => {
  it('hides the decorative progress bar from assistive technology', () => {
    expect(NProgress.settings.barSelector).toBe('.bar')
    expect(NProgress.settings.template).toContain('aria-hidden="true"')
    expect(NProgress.settings.template).not.toContain('role="bar"')
  })
})
