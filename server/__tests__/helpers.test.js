import { describe, it, expect } from 'vitest'
import { parsePagination, parseTags } from '../utils/helpers.js'

describe('parsePagination', () => {
  it('returns defaults for empty query', () => {
    const result = parsePagination({})
    expect(result).toEqual({ page: 1, pageSize: 10, offset: 0 })
  })

  it('parses valid page and pageSize', () => {
    const result = parsePagination({ page: '3', pageSize: '20' })
    expect(result).toEqual({ page: 3, pageSize: 20, offset: 40 })
  })

  it('clamps page to minimum 1', () => {
    const result = parsePagination({ page: '0' })
    expect(result.page).toBe(1)
  })

  it('clamps pageSize to maximum 50', () => {
    const result = parsePagination({ pageSize: '100' })
    expect(result.pageSize).toBe(50)
  })

  it('treats pageSize 0 as no pagination (all)', () => {
    const result = parsePagination({ pageSize: '0' })
    expect(result).toEqual({ page: 1, pageSize: null, offset: 0 })
  })

  it('handles non-numeric values gracefully', () => {
    const result = parsePagination({ page: 'abc', pageSize: 'xyz' })
    expect(result).toEqual({ page: 1, pageSize: 10, offset: 0 })
  })
})

describe('parseTags', () => {
  it('returns empty array for null/undefined', () => {
    expect(parseTags(null)).toEqual([])
    expect(parseTags(undefined)).toEqual([])
    expect(parseTags('')).toEqual([])
  })

  it('returns array as-is', () => {
    expect(parseTags(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('splits comma-separated string', () => {
    expect(parseTags('vue,node,js')).toEqual(['vue', 'node', 'js'])
  })

  it('trims whitespace', () => {
    expect(parseTags(' vue , node ')).toEqual(['vue', 'node'])
  })

  it('filters empty strings', () => {
    expect(parseTags('vue,,node,')).toEqual(['vue', 'node'])
  })
})
