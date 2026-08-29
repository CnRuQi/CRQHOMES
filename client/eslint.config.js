import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from '@vue/eslint-config-prettier'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      // 允许 warn/error：catch 块中的错误诊断日志需保留，仅拦截 console.log 调试残留
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'vue/no-v-html': 'error',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.mjs'],
  },
]
