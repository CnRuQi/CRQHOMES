const path = require('path')
const rateLimit = require('express-rate-limit')
const config = require('../config')

function buildRateLimitOptions(name, options, storeFactory = null) {
  return {
    ...options,
    ...(storeFactory ? { store: storeFactory(name) } : {}),
  }
}

function loadStoreFactory(moduleName) {
  if (!moduleName) return null

  const modulePath =
    path.isAbsolute(moduleName) || moduleName.startsWith('.')
      ? path.resolve(__dirname, '..', moduleName)
      : moduleName
  const loaded = require(modulePath)
  const factory = typeof loaded === 'function' ? loaded : loaded.createStore
  if (typeof factory !== 'function') {
    throw new Error('RATE_LIMIT_STORE_MODULE 必须导出 createStore(name) 工厂函数')
  }
  return factory
}

function createRateLimit(name, options) {
  const storeFactory = loadStoreFactory(config.rateLimit.storeModule)
  return rateLimit(buildRateLimitOptions(name, options, storeFactory))
}

module.exports = { buildRateLimitOptions, createRateLimit }
