import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { createConfig } = require('../config')

const validSecret = 'a'.repeat(64)

function makeEnv(overrides = {}) {
  return {
    NODE_ENV: 'development',
    JWT_SECRET: validSecret,
    SITE_URL: 'https://blog.example.com',
    TRUST_PROXY: '',
    ...overrides,
  }
}

describe('runtime configuration', () => {
  it('requires an explicit JWT secret outside the test environment', () => {
    expect(() => createConfig(makeEnv({ JWT_SECRET: undefined }))).toThrow(/JWT_SECRET/)
  })

  it('rejects the example JWT secret', () => {
    expect(() =>
      createConfig(makeEnv({ JWT_SECRET: 'your-super-secret-key-change-this-in-production' }))
    ).toThrow(/JWT_SECRET/)
  })

  it('rejects a production JWT secret shorter than 32 characters', () => {
    expect(() =>
      createConfig(makeEnv({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(31) }))
    ).toThrow(/32/)
  })

  it('requires SITE_URL in production', () => {
    expect(() => createConfig(makeEnv({ NODE_ENV: 'production', SITE_URL: undefined }))).toThrow(
      /SITE_URL/
    )
  })

  it('rejects an invalid production SITE_URL', () => {
    expect(() =>
      createConfig(makeEnv({ NODE_ENV: 'production', SITE_URL: 'javascript:alert(1)' }))
    ).toThrow(/SITE_URL/)
  })

  it('parses TRUST_PROXY as the configured proxy list', () => {
    const config = createConfig(makeEnv({ TRUST_PROXY: '127.0.0.1, 10.0.0.1' }))

    expect(config.trustProxy).toEqual(['127.0.0.1', '10.0.0.1'])
  })

  it('keeps development Host fallback available when SITE_URL is omitted', () => {
    const config = createConfig(makeEnv({ SITE_URL: undefined }))

    expect(config.siteUrl).toBe('')
  })
})
