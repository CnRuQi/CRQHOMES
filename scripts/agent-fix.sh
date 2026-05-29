#!/bin/bash
# Agent 自动修复脚本（会修改文件）
# 用法: bash scripts/agent-fix.sh

set -e
failed=0

echo "========================================"
echo "  披花沐雪 - Agent 自动修复"
echo "========================================"
echo ""

# 1. Lint 自动修复
echo "[1/3] Lint 自动修复..."
echo "--- Server ---"
(cd server && npm run lint:fix) || failed=1
echo "--- Client ---"
(cd client && npm run lint:fix) || failed=1
echo ""

# 2. 格式化
echo "[2/3] 格式化..."
npm run format || failed=1
echo ""

# 3. 测试验证
echo "[3/3] 测试验证..."
echo "--- Server ---"
(cd server && npm test) || failed=1
echo "--- Client ---"
(cd client && npm test) || failed=1
echo ""

# 结果
echo "========================================"
if [ $failed -ne 0 ]; then
    echo "  修复完成但测试有失败，请手动检查"
    exit 1
else
    echo "  修复完成，全部通过!"
    exit 0
fi
