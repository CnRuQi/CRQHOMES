import { describe, it, expect } from 'vitest'
import { normalizeTags, parsePagination, parseTags } from '../utils/helpers.js'

describe('parsePagination', () => {
  it('returns defaults for empty query', () => {
    const result = parsePagination({})
    expect(result).toEqual({ page: 1, pageSize: 10, offset: 0 })
  })

  it('parses valid page and pageSize', () => {
    const result = parsePagination({ page: '3', pageSize: '20' })
    expect(result).toEqual({ page: 3, pageSize: 20, offset: 40 })
  })

  it('rejects a non-positive page', () => {
    expect(() => parsePagination({ page: '0' })).toThrow(/页码/)
  })

  it('rejects a pageSize above the public maximum', () => {
    expect(() => parsePagination({ pageSize: '100' })).toThrow(/每页数量/)
  })

  it('allows pageSize 0 only when unbounded reads are explicitly enabled', () => {
    const result = parsePagination({ pageSize: '0' }, { allowUnbounded: true })
    expect(result).toEqual({ page: 1, pageSize: null, offset: 0 })
    expect(() => parsePagination({ pageSize: '0' })).toThrow(/不分页/)
  })

  it('rejects non-numeric values instead of silently using defaults', () => {
    expect(() => parsePagination({ page: 'abc', pageSize: 'xyz' })).toThrow(/页码|每页数量/)
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

  it('normalizes whitespace in array values', () => {
    expect(normalizeTags([' vue ', 'node'])).toEqual(['vue', 'node'])
  })

  it('rejects tag lists over the shared limits', () => {
    expect(() => normalizeTags(Array.from({ length: 21 }, () => 'tag'))).toThrow(/20/)
    expect(() => normalizeTags('a'.repeat(51))).toThrow(/50/)
  })
})
