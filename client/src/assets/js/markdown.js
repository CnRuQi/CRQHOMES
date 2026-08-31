import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
// 按需注册常用语言，避免全量引入 highlight.js（约 1MB）
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import markdown from 'highlight.js/lib/languages/markdown'
import plaintext from 'highlight.js/lib/languages/plaintext'
import 'highlight.js/styles/github-dark.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('java', java)
hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('plaintext', plaintext)

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value
        } catch (_e) {
          // ignore
        }
      }
      return hljs.highlightAuto(code).value
    },
  })
)
marked.use({ breaks: true, gfm: true })

// marked.use() 修改的是 marked 的「全局默认配置与扩展栈」，必须在模块加载时
// 执行一次、且只执行一次。放在组件 setup 里会随每次实例化重复注册，
// 扩展数组单调增长（缓慢内存泄漏），并让单一组件持有全局状态。
// 使用方直接 import 本模块导出的 marked 即可，不要再调用 marked.use()
export { marked }
