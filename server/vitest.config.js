import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['**/*.{test,spec}.js'],
    exclude: ['node_modules', 'uploads'],
  },
})
