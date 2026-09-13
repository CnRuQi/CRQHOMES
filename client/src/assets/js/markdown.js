import { marked } from 'marked'
// Public Markdown only needs the parser. Syntax highlighting stays inside the
// editor dependency, keeping highlighter language modules out of public chunks.
marked.use({ breaks: true, gfm: true })

// marked.use() 修改的是 marked 的「全局默认配置与扩展栈」，必须在模块加载时
// 执行一次、且只执行一次。放在组件 setup 里会随每次实例化重复注册，
// 扩展数组单调增长（缓慢内存泄漏），并让单一组件持有全局状态。
// 使用方直接 import 本模块导出的 marked 即可，不要再调用 marked.use()
export { marked }
