import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
let csrfProtection
try {
  csrfProtection = require('../middleware/csrf').csrfProtection
} catch (_error) {
  csrfProtection = undefined
}

function checkRequest(req) {
  if (typeof csrfProtection !== 'function') return { statusCode: 0 }
  let nextError = null
  const res = {}
  csrfProtection(req, res, (error) => {
    nextError = error || null
  })
  return nextError
}

describe('cookie write CSRF protection', () => {
  it('provides a middleware and accepts the configured frontend origin', () => {
    expect(csrfProtection).toBeTypeOf('function')
    expect(
      checkRequest({
        method: 'POST',
        path: '/api/posts',
        headers: { origin: 'http://localhost:5173', cookie: 'token=abc' },
      })
    ).toBeNull()
  })

  it('rejects untrusted and missing origins for cookie-authenticated writes', () => {
    const rejectedOrigin = checkRequest({
      method: 'DELETE',
      path: '/api/posts/1',
      headers: { origin: 'https://attacker.example', cookie: 'token=abc' },
    })
    const missingOrigin = checkRequest({
      method: 'PUT',
      path: '/api/posts/1',
      headers: { cookie: 'token=abc' },
    })

    expect(rejectedOrigin?.statusCode).toBe(403)
    expect(missingOrigin?.statusCode).toBe(403)
  })

  it('accepts same-origin Fetch Metadata when Origin and Referer are omitted', () => {
    const error = checkRequest({
      method: 'PATCH',
      path: '/api/auth/profile',
      headers: { cookie: 'token=abc', 'sec-fetch-site': 'same-origin' },
    })

    expect(error).toBeNull()
  })

  it('does not affect safe methods or bearer-only API clients', () => {
    expect(checkRequest({ method: 'GET', headers: { cookie: 'token=abc' } })).toBeNull()
    expect(
      checkRequest({
        method: 'POST',
        path: '/api/posts',
        headers: { authorization: 'Bearer abc' },
      })
    ).toBeNull()
  })
})
