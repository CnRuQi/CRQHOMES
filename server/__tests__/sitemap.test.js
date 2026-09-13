import { describe, it, expect, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const configPath = require.resolve('../config')
const dbPath = require.resolve('../db')
const sitemapControllerPath = require.resolve('../controllers/sitemapController')

const originalConfig = require.cache[configPath]
const originalDb = require.cache[dbPath]

function loadController(config, rows = {}) {
  require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: config,
  }
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      getDb: () => ({
        prepare: () => ({
          all: () => rows.posts || rows.categories || [],
        }),
      }),
    },
  }
  delete require.cache[sitemapControllerPath]
  return require('../controllers/sitemapController')
}

afterEach(() => {
  if (originalConfig) {
    require.cache[configPath] = originalConfig
  } else {
    delete require.cache[configPath]
  }
  if (originalDb) {
    require.cache[dbPath] = originalDb
  } else {
    delete require.cache[dbPath]
  }
  delete require.cache[sitemapControllerPath]
})

describe('sitemap site URL', () => {
  it('uses configured SITE_URL in production instead of the request Host', () => {
    const { getSitemapData } = loadController({
      env: 'production',
      siteUrl: 'https://configured.example.com',
    })

    const result = getSitemapData({
      protocol: 'https',
      get: () => 'evil.example.com',
    })

    expect(result.siteUrl).toBe('https://configured.example.com')
  })

  it('does not fall back to the request Host in production', () => {
    const { getSitemapData } = loadController({
      env: 'production',
      siteUrl: '',
    })

    expect(() =>
      getSitemapData({
        protocol: 'https',
        get: () => 'evil.example.com',
      })
    ).toThrow(/SITE_URL/)
  })
})
