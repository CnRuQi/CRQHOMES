# 浏览器回归基线（2026-09-13）

本记录来自本地服务（前端 `http://127.0.0.1:5174`、后端 `http://127.0.0.1:3000`）和已有 Chrome CDP `9229` 上的 `htmlsite-cdp` session。测试数据库和上传目录位于任务专用临时目录，未使用项目真实数据。agent-browser 自动启动在本机仍会报告 `CDP response channel closed`，因此本轮复用了已运行的 Chrome CDP；所有页面检查、axe 和控制台采集均为本轮重新执行。

## Light 主题全矩阵

覆盖路由：`/`、`/archives`、`/search`、`/admin/login`、已认证的 `/admin`、`/admin/posts`、`/admin/categories`、`/admin/posts/create`。每个路由均检查 `320`、`375`、`414`、`768`、`1440` CSS 像素。

所有样本均满足：

- 页面只有一个 `main` landmark。
- axe violations 为 `0`，axe incomplete 为 `0`。
- agent-browser console error 列表为空。
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`，没有文档级横向滚动。

浏览器保留的垂直滚动条使 `clientWidth` 比设置的 viewport 小 `8px`（例如 `320 -> 312`、`1440 -> 1432`），这是正常的滚动条占位。`body.scrollWidth` 在窄屏可能大于 client width：首页包含关闭状态的右侧移动菜单，后台页面包含固定侧栏或表格内容；这些区域被页面的 `overflow-x: clip` / 内部滚动容器裁剪，不会形成文档级横向滚动，故不作为溢出缺陷。

| 路由 | 视口 | 主题 | main | axe violations | incomplete | 控制台错误 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `/` | 320/375/414/768/1440 | light | 1 | 0 | 0 | 无 |
| `/archives` | 320/375/414/768/1440 | light | 1 | 0 | 0 | 无 |
| `/search` | 320/375/414/768/1440 | light | 1 | 0 | 0 | 无 |
| `/admin/login` | 320/375/414/768/1440 | light | 1 | 0 | 0 | 无 |
| `/admin`（已认证） | 320/375/414/768/1440 | light | 1 | 0 | 0 | 无 |
| `/admin/posts`（已认证） | 320/375/414/768/1440 | light | 1 | 0 | 0 | 无 |
| `/admin/categories`（已认证） | 320/375/414/768/1440 | light | 1 | 0 | 0 | 无 |
| `/admin/posts/create`（已认证） | 320/375/414/768/1440 | light | 1 | 0 | 0 | 无 |

## Dark 主题关键页面

在 `320`、`768`、`1440` CSS 像素下复查 `/`、`/post/real-markdown` 和 `/admin/login`。9 个样本均为单一 `main`、axe violations `0`、incomplete `0`、无控制台错误和无文档级横向滚动。

真实文章页确认了标题、二级标题、列表、代码块、HTTPS 链接和懒加载图片正常渲染；原始 HTML 未执行，失效封面显示可访问的失败状态。

## 键盘排序回归

在已认证的 `/admin/posts`、`768` CSS 像素下，将第二篇文章的排序按钮聚焦并按 `ArrowDown`：列表从 `Real Markdown Article, Second Article, Draft Article` 变为 `Real Markdown Article, Draft Article, Second Article`。重新加载页面后顺序保持；再对该文章按 `ArrowUp` 恢复顺序，重新加载后恢复为 `Real Markdown Article, Second Article, Draft Article`。两次操作均无控制台错误。

## 结论

本轮未发现新的可复现浏览器缺陷。上一轮记录的 heading order、状态标签对比度、移动菜单装饰字符和编辑器滚动区域问题已由当前实现和本轮 axe 结果覆盖；后续只需保留最终 gates、依赖来源和数据库副本证据。

## 最终工程证据

- `npm ci` 在 root、`server`、`client` 均成功完成；过程中仅有 npm 机器级配置提示、依赖安装脚本批准提示和已有 `glob` deprecated warning。
- `npm run lint`、`npm run format:check`、`npm test` 和 `client/npm run build` 均退出 `0`。测试为 client `6` 个文件 / `35` 个用例、server `7` 个文件 / `71` 个用例，共 `106` 个用例通过。
- build 产物仍有已知风险：`MarkdownEditor-DihckxT0.js` 压缩后约 `877.38 kB`，Vite 保留 `500 kB` chunk warning；编辑器已按路由懒加载，公开首页未请求该 chunk。
- root、server、client 的 `npm audit --offline` 均报告 `0 vulnerabilities`。这些结果来自本机 npm 缓存，不能替代联网漏洞库结论。当前 CI 已对三个锁文件执行联网 `npm audit --audit-level=high`；漏洞达到 high/critical 或 registry 不可达都会使 CI 失败。
- 数据库副本初始化两次前后 `users=1`、`posts=3`、`categories=2` 保持不变；两次 `PRAGMA integrity_check` 为 `ok`，两次重复 slug 查询均为空。
- `git diff --check` 退出 `0`；CRLF 提示不影响结果。最终没有项目服务监听 `3000`/`5174`，敏感本地文件、构建产物和临时数据库均未进入 tracked 文件。
