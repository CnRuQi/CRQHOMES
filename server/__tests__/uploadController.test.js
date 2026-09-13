import { describe, it, expect, afterEach } from 'vitest'
import { createRequire } from 'module'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const require = createRequire(import.meta.url)
const configPath = require.resolve('../config')
const uploadControllerPath = require.resolve('../controllers/uploadController')

const originalConfig = require.cache[configPath]
const originalUploadController = require.cache[uploadControllerPath]
const tempDirs = []

function loadController(uploadDir) {
  require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: {
      env: 'test',
      upload: {
        dir: uploadDir,
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg'],
      },
    },
  }
  delete require.cache[uploadControllerPath]
  return require('../controllers/uploadController')
}

afterEach(() => {
  if (originalConfig) {
    require.cache[configPath] = originalConfig
  } else {
    delete require.cache[configPath]
  }
  if (originalUploadController) {
    require.cache[uploadControllerPath] = originalUploadController
  } else {
    delete require.cache[uploadControllerPath]
  }
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('upload URL generation', () => {
  it('returns a URL rooted at /uploads for an external absolute upload directory', () => {
    const uploadDir = mkdtempSync(join(tmpdir(), 'blog-upload-'))
    tempDirs.push(uploadDir)
    const yearMonth = '202601'
    const relativeDir = join(uploadDir, yearMonth)
    const filePath = join(relativeDir, 'image.jpg')
    mkdirSync(relativeDir, { recursive: true })
    writeFileSync(filePath, Buffer.from([0xff, 0xd8, 0xff, ...new Array(8).fill(0), 0xff, 0xd9]))

    const { uploadImage } = loadController(uploadDir)
    let payload = null
    let nextError = null
    const res = {
      json: (value) => {
        payload = value
      },
    }

    uploadImage(
      {
        file: {
          path: filePath,
          filename: 'image.jpg',
          originalname: 'original.jpg',
          size: 13,
          mimetype: 'image/jpeg',
        },
      },
      res,
      (error) => {
        nextError = error
      }
    )

    expect(nextError).toBeNull()
    expect(payload.data.url).toBe('/uploads/202601/image.jpg')
  })
})
