import js from '@eslint/js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const customRules = require('./eslint-rules/index.js')

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        JSON: 'readonly',
        Error: 'readonly',
        RegExp: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        isNaN: 'readonly',
        Promise: 'readonly',
      },
    },
    rules: {
      // 允许 warn/error/info：这些是错误诊断与启动信息，仅拦截 console.log 之类的调试残留
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-template-curly-in-string': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
  {
    plugins: {
      'custom-rules': {
        rules: customRules,
      },
    },
    rules: {
      'custom-rules/no-direct-db-in-routes': 'error',
      'custom-rules/require-input-validation': 'error',
      'custom-rules/no-sql-concat': 'error',
      'custom-rules/require-auth-middleware': 'error',
    },
  },
  {
    // CLI 脚本：console 是面向终端的程序输出（提示与结果），不是调试日志
    files: ['db/create-admin.js', 'db/import-data.js', 'db/init.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'uploads/**', '*.db', 'eslint.config.mjs', '__tests__/**', 'vitest.config.js', 'eslint-rules/**'],
  },
]
