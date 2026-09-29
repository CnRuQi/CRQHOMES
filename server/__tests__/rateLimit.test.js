import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
let buildRateLimitOptions
let usernameAttemptKey
try {
  buildRateLimitOptions = require('../middleware/rateLimit').buildRateLimitOptions
} catch (_error) {
  buildRateLimitOptions = undefined
}
try {
  usernameAttemptKey = require('../middleware/authLimiter').usernameAttemptKey
} catch (_error) {
  usernameAttemptKey = undefined
}

describe('rate-limit store configuration', () => {
  it('creates a separately named shared store for each limiter', () => {
    expect(buildRateLimitOptions).toBeTypeOf('function')
    const created = []
    const storeFactory = (name) => {
      created.push(name)
      return { name }
    }
    const first = buildRateLimitOptions('posts:search', { limit: 300 }, storeFactory)
    const second = buildRateLimitOptions('auth:login', { limit: 5 }, storeFactory)

    expect(created).toEqual(['posts:search', 'auth:login'])
    expect(first).toMatchObject({ limit: 300, store: { name: 'posts:search' } })
    expect(second).toMatchObject({ limit: 5, store: { name: 'auth:login' } })
  })
})

describe('username login limiter key', () => {
  it('isolates failed attempts by both normalized username and client IP', () => {
    expect(usernameAttemptKey).toBeTypeOf('function')
    const first = usernameAttemptKey({ body: { username: ' Admin ' }, ip: '192.0.2.1' })
    const sameClient = usernameAttemptKey({ body: { username: 'admin' }, ip: '192.0.2.1' })
    const otherClient = usernameAttemptKey({ body: { username: 'admin' }, ip: '192.0.2.2' })

    expect(first).toBe(sameClient)
    expect(first).not.toBe(otherClient)
  })
})

describe('public detail rate limit', () => {
  it('registers a limiter before the public detail controller', () => {
    const postRouter = require('../routes/post')
    const detail = postRouter.stack.find(
      (layer) => layer.route?.path === '/:idOrSlug' && layer.route.methods.get
    )

    expect(detail.route.stack.length).toBeGreaterThan(1)
  })
})
