import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveListScroll,
  getListScroll,
  clearListScroll,
  restoreListScroll,
} from '../assets/js/utils.js'

describe('list scroll persistence', () => {
  beforeEach(() => {
    sessionStorage.clear()
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    })
  })

  it('saves current scrollY and reads it back', () => {
    window.scrollY = 1200
    saveListScroll('/')
    expect(getListScroll('/')).toBe(1200)
  })

  it('saves explicit y value', () => {
    saveListScroll('/archives', 800)
    expect(getListScroll('/archives')).toBe(800)
  })

  it('returns null for missing key', () => {
    expect(getListScroll('/missing')).toBeNull()
  })

  it('clears saved value', () => {
    saveListScroll('/', 500)
    clearListScroll('/')
    expect(getListScroll('/')).toBeNull()
  })

  it('restores scroll position and clears storage', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    saveListScroll('/', 777)
    restoreListScroll('/')
    expect(scrollTo).toHaveBeenCalledWith({ top: 777, behavior: 'auto' })
    expect(getListScroll('/')).toBeNull()
  })

  it('restore does nothing without saved value', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    restoreListScroll('/')
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('keeps keys isolated per path', () => {
    saveListScroll('/search?q=a', 100)
    saveListScroll('/search?q=b', 200)
    expect(getListScroll('/search?q=a')).toBe(100)
    expect(getListScroll('/search?q=b')).toBe(200)
  })
})
