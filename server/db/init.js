const { initDb, closeDb } = require('./index')

try {
  console.log('正在初始化数据库...')
  initDb()
  console.log('数据库初始化成功！')
} catch (error) {
  console.error('数据库初始化失败:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
