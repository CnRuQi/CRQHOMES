#!/bin/bash
# Agent 一键检查脚本（只读，不修改文件）
# 用法: bash scripts/agent-check.sh

set -e
failed=0

echo "========================================"
echo "  披花沐雪 - Agent 代码检查"
echo "========================================"
echo ""

# 1. Lint 检查
echo "[1/3] Lint 检查..."
echo "--- Server ---"
(cd server && npm run lint) || failed=1
echo "--- Client ---"
(cd client && npm run lint) || failed=1
echo ""

# 2. 格式检查
echo "[2/3] 格式检查..."
npm run format:check || failed=1
echo ""

# 3. 测试
echo "[3/3] 测试..."
echo "--- Server ---"
(cd server && npm test) || failed=1
echo "--- Client ---"
(cd client && npm test) || failed=1
echo ""

# 结果
echo "========================================"
if [ $failed -ne 0 ]; then
    echo "  检查失败，请修复上述问题"
    exit 1
else
    echo "  全部通过!"
    exit 0
fi
