const { ipKeyGenerator } = require('express-rate-limit')

function usernameAttemptKey(req) {
  const username = String(req.body?.username || '')
    .trim()
    .toLowerCase()
  const ip = ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown')
  return `${ip}:${username}`
}

module.exports = { usernameAttemptKey }
