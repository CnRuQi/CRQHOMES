# 数据库迁移

> 步骤化的任务指南，AI Agent 可按此流程执行。

---

## 前置条件
- 明确需要添加/修改的表或字段
- 确认是否影响现有数据

---

## 步骤

### 1. 修改 Schema

在 `server/db/schema.sql` 中添加新的建表语句或修改：

```sql
-- 新增表
CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 新增索引
CREATE INDEX IF NOT EXISTS idx_new_table_name ON new_table(name);
```

### 2. 创建迁移脚本

在 `server/db/migrate.js` 中添加迁移逻辑：

```javascript
function migrateV2(db) {
  // 检查是否已迁移
  const tableInfo = db.prepare("PRAGMA table_info(posts)").all()
  const hasNewColumn = tableInfo.some(col => col.name === 'new_column')
  
  if (!hasNewColumn) {
    db.exec('ALTER TABLE posts ADD COLUMN new_column TEXT DEFAULT ""')
    console.log('✅ 添加 new_column 字段')
  }
}
```

### 3. 更新 Controller

在对应的 Controller 中使用新的数据库结构：

```javascript
// 查询时包含新字段
const post = db.prepare('SELECT id, title, new_column FROM posts WHERE id = ?').get(id)
```

### 4. 更新前端

如果新增了字段，更新对应的前端显示：

```vue
<template>
  <div>{{ post.new_column }}</div>
</template>
```

---

## 数据库规则

| 规则 | 说明 |
|------|------|
| 使用 IF NOT EXISTS | 防止重复创建 |
| ALTER TABLE 先检查 | 避免重复添加字段 |
| 外键约束 | 使用 `FOREIGN KEY` + `ON DELETE SET NULL` |
| 索引 | 高频查询字段必须有索引 |
| 参数化查询 | 所有 SQL 使用 `?` 占位符 |

---

## 检查清单

- [ ] schema.sql 已更新
- [ ] migrate.js 有幂等检查（可重复执行）
- [ ] 新字段有合理的默认值
- [ ] 高频查询字段已添加索引
- [ ] Controller 已更新使用新字段
- [ ] 前端已更新显示新字段
