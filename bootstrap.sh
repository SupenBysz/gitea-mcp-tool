#!/bin/bash

# Gitea MCP Server - Bootstrap Installer
# 用于私有仓库的快速安装引导脚本
# 用户可以直接复制粘贴此脚本内容运行

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 配置
GITEA_URL="https://gitea.ktyun.cc"
REPO_OWNER="Kysion"
REPO_NAME="entai-gitea-mcp"
SCRIPT_URL="${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/raw/branch/main/install-quick.sh"

# 检查 Token
if [ -z "$GITEA_API_TOKEN" ]; then
    log_error "未设置 GITEA_API_TOKEN 环境变量"
    echo ""
    echo "使用方法："
    echo "  export GITEA_API_TOKEN=your_token_here"
    echo "  bash bootstrap.sh"
    echo ""
    echo "或者一行命令："
    echo "  GITEA_API_TOKEN=your_token bash bootstrap.sh"
    exit 1
fi

log_info "Bootstrap Installer for Gitea MCP Server"
echo ""

# 下载安装脚本
log_info "下载安装脚本..."
TEMP_SCRIPT="/tmp/install-gitea-mcp-$$.sh"

if command -v curl >/dev/null 2>&1; then
    curl -fsSL -H "Authorization: token ${GITEA_API_TOKEN}" \
        "${SCRIPT_URL}" -o "${TEMP_SCRIPT}" || {
        log_error "下载失败"
        exit 1
    }
elif command -v wget >/dev/null 2>&1; then
    wget --header="Authorization: token ${GITEA_API_TOKEN}" \
        -qO "${TEMP_SCRIPT}" "${SCRIPT_URL}" || {
        log_error "下载失败"
        exit 1
    }
else
    log_error "需要 curl 或 wget"
    exit 1
fi

log_info "下载完成，开始安装..."
echo ""

# 执行安装脚本
bash "${TEMP_SCRIPT}"

# 清理
rm -f "${TEMP_SCRIPT}"

log_info "Bootstrap 完成！"
