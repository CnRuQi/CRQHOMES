import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { authRules, postRules, categoryRules } = require('../middleware/validator')

// 依次运行规则链中的各条 chain，收集全部校验错误信息
// 注意：ValidationChain 是「可调用对象」，typeof 也是 function，但带有 .run 方法；
// 末尾的 validate 中间件是普通函数、没有 .run，据此区分，不能简单跳过 function
async function runRules(rules, req) {
  const errors = []
  for (const rule of rules) {
    if (typeof rule?.run !== 'function') continue
    const result = await rule.run(req)
    if (!result.isEmpty()) {
      errors.push(...result.array().map((e) => e.msg))
    }
  }
  return errors
}

async function runValidation(rules, req) {
  await runRules(rules, req)
  try {
    rules[rules.length - 1](req, {}, () => {})
    return null
  } catch (error) {
    return error
  }
}

describe('authRules.changePassword 新密码 72 字节上限', () => {
  const oldPassword = 'old-password'

  it('不超过 72 字节的密码通过', async () => {
    const errors = await runRules(authRules.changePassword, {
      body: { oldPassword, newPassword: 'a'.repeat(72) },
    })
    expect(errors).toEqual([])
  })

  it('超过 72 字节的密码被拒绝（bcrypt 会静默截断超长部分）', async () => {
    const errors = await runRules(authRules.changePassword, {
      body: { oldPassword, newPassword: 'a'.repeat(73) },
    })
    expect(errors).toContain('新密码过长（加密算法最多处理72字节），请缩短后重试')
  })

  it('按 UTF-8 字节而非字符数校验：25 个中文（75 字节、25 字符）被拒', async () => {
    // 字符数远小于常见 char 上限，若按字符校验会漏放；只有按字节校验才能拦住
    const errors = await runRules(authRules.changePassword, {
      body: { oldPassword, newPassword: '密'.repeat(25) },
    })
    expect(errors).toContain('新密码过长（加密算法最多处理72字节），请缩短后重试')
  })

  it('24 个中文（正好 72 字节）通过', async () => {
    const errors = await runRules(authRules.changePassword, {
      body: { oldPassword, newPassword: '密'.repeat(24) },
    })
    expect(errors).toEqual([])
  })
})

describe('authRules.login 密码 72 字节上限', () => {
  it('登录密码最多允许 72 个 UTF-8 字节', async () => {
    const valid = await runRules(authRules.login, {
      body: { username: 'admin', password: 'a'.repeat(72) },
    })
    const tooLong = await runRules(authRules.login, {
      body: { username: 'admin', password: 'a'.repeat(73) },
    })
    const multibyteTooLong = await runRules(authRules.login, {
      body: { username: 'admin', password: '密'.repeat(25) },
    })

    expect(valid).toEqual([])
    expect(tooLong).toContain('密码过长（加密算法最多处理72字节），请缩短后重试')
    expect(multibyteTooLong).toContain('密码过长（加密算法最多处理72字节），请缩短后重试')
  })
})

describe('request text type validation', () => {
  const malformedValues = [{}, []]

  it.each(['title', 'content', 'summary', 'tags', 'cover_image'])(
    'rejects object and array values for post.%s',
    async (field) => {
      for (const value of malformedValues) {
        const error = await runValidation(postRules.create, {
          body: {
            title: field === 'title' ? value : '有效标题',
            content: field === 'content' ? value : '有效正文',
            category_id: 1,
            [field]: value,
          },
        })

        expect(error?.statusCode).toBe(400)
      }
    }
  )

  it('rejects an object category description', async () => {
    const error = await runValidation(categoryRules.create, {
      body: { name: '分类', slug: 'category', description: {} },
    })

    expect(error?.statusCode).toBe(400)
  })

  it.each([{}, []])('rejects malformed profile nickname %j', async (nickname) => {
    const error = await runValidation(authRules.updateProfile, {
      body: { nickname },
    })

    expect(error?.statusCode).toBe(400)
  })
})

describe('post tag limits', () => {
  const validPost = { title: '标题', content: '正文', category_id: 1 }

  it('rejects more than 20 tags', async () => {
    const tags = Array.from({ length: 21 }, (_, index) => `tag-${index}`).join(',')
    const error = await runValidation(postRules.create, { body: { ...validPost, tags } })

    expect(error?.statusCode).toBe(400)
  })

  it('rejects a tag longer than 50 characters', async () => {
    const error = await runValidation(postRules.create, {
      body: { ...validPost, tags: 'a'.repeat(51) },
    })

    expect(error?.statusCode).toBe(400)
  })

  it('rejects a serialized tag list longer than 500 characters', async () => {
    const tags = Array.from({ length: 20 }, () => 'a'.repeat(30)).join(',')
    const error = await runValidation(postRules.create, { body: { ...validPost, tags } })

    expect(error?.statusCode).toBe(400)
  })
})

describe('public list pagination rules', () => {
  it('rejects pageSize=0 publicly but allows it for the admin list', async () => {
    const publicError = await runValidation(postRules.list, { query: { pageSize: '0' } })
    const adminError = await runValidation(postRules.adminList, { query: { pageSize: '0' } })

    expect(publicError?.statusCode).toBe(400)
    expect(adminError).toBeNull()
  })

  it('bounds tag filters', async () => {
    const error = await runValidation(postRules.list, {
      query: { tag: 'a'.repeat(51) },
    })

    expect(error?.statusCode).toBe(400)
  })
})
