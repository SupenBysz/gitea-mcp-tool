#!/bin/bash

# Gitea MCP Server - Local Deployment Script
# 一键部署脚本：构建并部署到 ~/.gitea-mcp/ 供 Claude Code 使用

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

echo ""
log_info "=========================================="
log_info "Gitea MCP Server - 本地部署"
log_info "=========================================="
echo ""

# Step 1: Build
log_step "1/3 构建项目..."
npm run build

# Step 2: Deploy
log_step "2/3 部署到 ~/.gitea-mcp/..."
rm -rf ~/.gitea-mcp/dist ~/.gitea-mcp/package.json 2>/dev/null || true
cp -r dist ~/.gitea-mcp/
cp package.json ~/.gitea-mcp/
cp README.md ~/.gitea-mcp/ 2>/dev/null || true
cp -r docs ~/.gitea-mcp/ 2>/dev/null || true

# Step 3: Verify
log_step "3/3 验证部署..."
VERSION=$(node -p "require('./package.json').version")
SIZE=$(du -h ~/.gitea-mcp/dist/index.js | cut -f1)

echo ""
log_info "=========================================="
log_info "部署成功完成！"
log_info "=========================================="
echo ""
echo "📦 版本: v${VERSION}"
echo "📂 路径: ~/.gitea-mcp/"
echo "📄 主文件: ~/.gitea-mcp/dist/index.js (${SIZE})"
echo ""
log_info "Claude Code 配置文件位置:"
echo "  ~/.claude.json"
echo ""
log_info "确认配置指向:"
echo '  "args": ["/Users/supen/.gitea-mcp/dist/index.js"]'
echo ""
log_info "重启 Claude Code 即可使用最新版本"
echo ""
