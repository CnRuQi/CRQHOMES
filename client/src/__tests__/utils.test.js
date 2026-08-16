import { describe, it, expect } from 'vitest'
import { formatDate, truncate, formatNumber, debounce } from '../assets/js/utils.js'

describe('formatDate', () => {
  it('returns empty string for falsy input', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
  })

  it('formats date with default format', () => {
    const result = formatDate('2024-01-15T10:30:00')
    expect(result).toMatch(/2024-01-15/)
  })

  it('formats date with custom format', () => {
    const result = formatDate('2024-01-15T10:30:00', 'YYYY/MM/DD')
    expect(result).toBe('2024/01/15')
  })
})

describe('truncate', () => {
  it('returns empty string for falsy input', () => {
    expect(truncate(null)).toBe('')
    expect(truncate(undefined)).toBe('')
    expect(truncate('')).toBe('')
  })

  it('returns text as-is if shorter than length', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates text exceeding length', () => {
    const result = truncate('hello world this is a test', 10)
    expect(result).toBe('hello worl...')
  })
})

describe('formatNumber', () => {
  it('returns "0" for falsy input', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
  })

  it('returns string for small numbers', () => {
    expect(formatNumber(42)).toBe('42')
  })

  it('formats thousands with k suffix', () => {
    expect(formatNumber(1500)).toBe('1.5k')
  })

  it('formats ten thousands with w suffix', () => {
    expect(formatNumber(25000)).toBe('2.5w')
  })
})

describe('debounce', () => {
  it('delays function execution', async () => {
    let count = 0
    const fn = debounce(() => {
      count++
    }, 100)
    fn()
    fn()
    fn()
    expect(count).toBe(0)
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(count).toBe(1)
  })
})
