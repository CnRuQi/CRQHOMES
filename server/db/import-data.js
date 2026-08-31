const { getDb, initDb, closeDb } = require('./index')
const readline = require('readline')

// 分类数据
const categories = [
  { id: 1, name: '默认分类', slug: 'default', description: '默认文章分类' },
  { id: 2, name: '电影', slug: 'movie', description: '' },
  { id: 3, name: '鸡汤来喽', slug: 'chicken-soup', description: '鸡汤来喽' },
]

// 文章数据
const posts = [
  {
    id: 1,
    title: '这是一些链接',
    slug: 'yi-xie-lian-jie',
    summary: '我的链接',
    content: `这是一些链接卡片：

- [Node重构版](http://node.cnruqi.site)
- [个人简历](http://crq.cnruqi.site)
- [便签墙](http://bq.cnruqi.site)`,
    cover_image: 'https://img.cnruqi.site/%E6%8A%AB%E8%8A%B1%E6%B2%90%E9%9B%AA.png',
    is_top: 1,
    category_id: 1,
    status: 1,
    views: 0,
    published_at: '2026-01-05T10:00:00.000Z',
  },
  {
    id: 2,
    title: '余命十年',
    slug: 'yu-ming-shi-nian',
    summary: '晴空塔的大雨，打湿了两个人的心\n眼睛为他下着雨，心却在为他打伞',
    content: `## 余命十年

*藤井道人 監督 · 小坂流加 原作*

---

相遇总是伴随着别离

恋爱就像宴席终会散去

所以恋爱中的人们

只是带来各自喜欢的东西相对而坐

隔着桌子聊天

苦中作乐罢了`,
    cover_image: 'https://img.cnruqi.site/CnRuQiBlog/leftTenYear.webp',
    is_top: 0,
    category_id: 2,
    status: 1,
    views: 0,
    published_at: '2026-02-14T10:00:00.000Z',
  },
  {
    id: 3,
    title: '今夜，就算这份爱恋从世界上消失',
    slug: 'jin-ye-ai-lian',
    summary: '真织，重要的记忆会刻在心里。你会想起来的。',
    content: `## 今夜，就算这份爱恋从世界上消失

*不要忘记*

**神谷透**

---

真织，重要的记忆会刻在心里。

你会想起来的。`,
    cover_image: 'https://img.cnruqi.site/CnRuQiBlog/night.webp',
    is_top: 0,
    category_id: 2,
    status: 1,
    views: 0,
    published_at: '2026-03-20T10:00:00.000Z',
  },
  {
    id: 4,
    title: '明日的我与昨日的你约会',
    slug: 'ming-ri-wo-yu-zuo-ri-ni',
    summary: '明天见',
    content: `## 明日的我与昨日的你约会

我们并没有擦肩而过

我们会将彼此的世界相连

连成一个圆

合二为一

我们两个人拥有同一个命运`,
    cover_image: 'https://img.cnruqi.site/CnRuQiBlog/appointment.webp',
    is_top: 0,
    category_id: 2,
    status: 1,
    views: 0,
    published_at: '2026-04-11T10:00:00.000Z',
  },
  {
    id: 5,
    title: 'Love Letter',
    slug: 'love-letter',
    summary: '你好吗？我很好',
    content: `## Love Letter

藤井树喜欢藤井树，

只有十年前的藤井树
和
十年后的藤井树知道。

---

————岩井俊二《情书》`,
    cover_image: 'https://img.cnruqi.site/CnRuQiBlog/LoveLetter.webp',
    is_top: 0,
    category_id: 2,
    status: 1,
    views: 0,
    published_at: '2026-05-09T10:00:00.000Z',
  },
  {
    id: 6,
    title: '花束般的恋爱',
    slug: 'hua-shu-ban-de-lian-ai',
    summary: '我们应该……都没有……爱着对方吧',
    content: `## 花束般的恋爱

*她与她的恋爱循环*

---

你们两个不喜欢音乐啊，用耳机听歌**两边耳机**放出来的音乐是不一样的。用耳机听左边和右边的声音是不一样的，虽然他们在听同一首歌，但听到的内容是不一样的，他们两现在听的不是同一首歌。

---

可有时候就想两个人一起听嘛，不是每个人都有自己的手机吗，戴上自己的耳机，同时按下**播放键**就行了。

---

正因为两个人一起分享一个东西，才有意识不是吗？都说了**恋爱是不能分享的**，恋爱一个人只能拥有一个，每个人只有一个。

---

—— 《花束般的恋爱》`,
    cover_image: 'https://img.cnruqi.site/CnRuQiBlog/flower.webp',
    is_top: 0,
    category_id: 2,
    status: 1,
    views: 0,
    published_at: '2026-06-13T10:00:00.000Z',
  },
  {
    id: 7,
    title: '世界从不替你下定义',
    slug: 'shi-jie-cong-bu-ti-ni-xia-ding-yi',
    summary: '它只是安静地等你给它意义',
    content: `## 世界从不替你下定义

这世界上就没有不好的经历

无论你经历什么

你只要允许

它成为你人生

**所有的色彩里的其中一部分**

*它都是美丽的*

---

我们来看一个生锈的铁

它生锈了

但是它就是因为在美丽的背景前面

**它的生锈都变得好看**`,
    cover_image: 'https://cnruqi.site/uploads/2026/03/e13d3cd1-2bd0-4dad-8d20-fc0fd2e471a3.webp',
    is_top: 0,
    category_id: 3,
    status: 1,
    views: 0,
    published_at: '2026-07-18T10:00:00.000Z',
  },
  {
    id: 8,
    title: 'Be Happy, My Friend. ( ´͈ ᵕ `͈ )◞♡',
    slug: 'be-happy-my-friend',
    summary: '不是只有相拥之人，才能起舞',
    content: `## Be Happy, My Friend

*✦ MY FRIEND · 致挚友 ✦*

---

我认为逃避是人类最伟大的发明

我会一直向前逃避，直到夜色耗尽

再去找一块无辜的石头

让它来承受我的不开心

当清晨到来，我的派对就会结束

太阳会把我的懦弱扒的一干二净

而这一刻，我会想对你说：

**"亲爱的，我活着"**

---

[原文链接：https://b23.tv/ZBr8UCk](https://b23.tv/ZBr8UCk)`,
    cover_image: '',
    is_top: 0,
    category_id: 3,
    status: 1,
    views: 0,
    published_at: '2026-08-15T10:00:00.000Z',
  },
]

// 清空全站文章是不可逆操作（脚本自身不备份），执行前必须确认。
// 要求输入站点名而不是简单的 y/N，避免无脑回车或连击
const CONFIRM_PHRASE = '披花沐雪'

function question(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function confirmDestructiveImport() {
  // 生产环境一律拒绝：这里没有备份机制，误执行就是全站文章不可恢复
  if (process.env.NODE_ENV === 'production') {
    console.error('拒绝执行：NODE_ENV=production。本脚本会清空全部文章与分类，且不可恢复。')
    return false
  }
  // 非交互环境无法确认，直接拒绝而不是挂起等待输入
  if (!process.stdin.isTTY) {
    if (process.env.IMPORT_FORCE === '1') {
      console.log('IMPORT_FORCE=1：已跳过确认（请确保已自行备份）。')
      return true
    }
    console.error('拒绝执行：当前不是交互式终端，无法确认清空操作。')
    console.error('如需在自动化环境执行，请先备份数据库，再显式设置 IMPORT_FORCE=1。')
    return false
  }
  console.log('⚠️  警告：本操作将清空全部文章与分类，且不可恢复。')
  const answer = await question(`请输入站点名「${CONFIRM_PHRASE}」以确认: `)
  return answer.trim() === CONFIRM_PHRASE
}

async function importData() {
  if (!(await confirmDestructiveImport())) {
    console.log('已取消，未做任何改动。')
    return
  }

  console.log('开始导入数据...\n')

  try {
    // initDb() 一并放进 try：它自身也可能失败，且失败后同样需要 closeDb() 收尾
    initDb()
    const db = getDb()

    // 整个导入放入事务：中途失败整体回滚，避免半导入状态
    const runImport = db.transaction(() => {
      // 清空现有数据（保留用户）
      console.log('清空现有文章和分类数据...')
      db.prepare('DELETE FROM posts').run()
      db.prepare('DELETE FROM categories').run()
      // view_tracking.post_id 没有外键级联，文章清空后需手动清理孤儿记录
      db.prepare('DELETE FROM view_tracking').run()

      // 导入分类
      console.log('导入分类...')
      const insertCategory = db.prepare(
        'INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?)'
      )

      for (const cat of categories) {
        insertCategory.run(cat.id, cat.name, cat.slug, cat.description)
        console.log(`  ✓ 分类: ${cat.name}`)
      }

      // 导入文章
      console.log('\n导入文章...')
      const insertPost = db.prepare(`
        INSERT INTO posts (id, title, slug, content, summary, cover_image, category_id, is_top, status, views, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const post of posts) {
        insertPost.run(
          post.id,
          post.title,
          post.slug,
          post.content,
          post.summary,
          post.cover_image,
          post.category_id,
          post.is_top,
          post.status,
          post.views,
          // 未显式提供时回退到导入时刻，但必须转成 UTC ISO 串，
          // 保证 published_at 列始终只有一种格式（归档分组与排序都依赖它）
          post.published_at || new Date().toISOString()
        )
        console.log(`  ✓ 文章: ${post.title}`)
      }

      // 重置自增 ID
      db.prepare(
        "UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM posts) WHERE name = 'posts'"
      ).run()
      db.prepare(
        "UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM categories) WHERE name = 'categories'"
      ).run()
    })
    runImport()

    console.log('\n✅ 数据导入完成！')
    console.log(`   - 分类: ${categories.length} 个`)
    console.log(`   - 文章: ${posts.length} 篇`)
  } catch (error) {
    console.error('导入失败:', error.message)
    process.exitCode = 1
  } finally {
    closeDb()
  }
}

importData()
