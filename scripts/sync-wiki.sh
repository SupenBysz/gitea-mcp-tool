#!/bin/bash
# sync-wiki.sh - 同步 Gitea Wiki 到 GitHub Wiki
#
# 功能:
# 1. 克隆 Gitea Wiki 仓库
# 2. 替换 Gitea 私有链接为 GitHub 公开链接
# 3. 推送到 GitHub Wiki 仓库
#
# 用法: ./scripts/sync-wiki.sh
# 环境变量:
#   GITEA_WIKI_URL - Gitea Wiki 仓库 URL（可选，默认自动生成）
#   GITHUB_WIKI_URL - GitHub Wiki 仓库 URL（可选，默认自动生成）
#   GITHUB_TOKEN - GitHub Token（用于推送）

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置
GITEA_HOST="gitea.ktyun.cc"
GITEA_OWNER="Kysion"
GITEA_REPO="entai-gitea-mcp"

GITHUB_HOST="github.com"
GITHUB_OWNER="SupenBysz"
GITHUB_REPO="gitea-mcp-tool"

# Wiki 仓库 URL
GITEA_WIKI_URL="${GITEA_WIKI_URL:-gitea@${GITEA_HOST}:${GITEA_OWNER}/${GITEA_REPO}.wiki.git}"
GITHUB_WIKI_URL="${GITHUB_WIKI_URL:-git@${GITHUB_HOST}:${GITHUB_OWNER}/${GITHUB_REPO}.wiki.git}"

# 如果提供了 GITHUB_TOKEN，使用 HTTPS
if [ -n "$GITHUB_TOKEN" ]; then
    GITHUB_WIKI_URL="https://${GITHUB_TOKEN}@${GITHUB_HOST}/${GITHUB_OWNER}/${GITHUB_REPO}.wiki.git"
fi

# 临时目录
WORK_DIR=$(mktemp -d)
trap "rm -rf $WORK_DIR" EXIT

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info "开始同步 Wiki"
log_info "  Gitea Wiki: $GITEA_WIKI_URL"
log_info "  GitHub Wiki: ${GITHUB_WIKI_URL%@*}@***" # 隐藏 token
log_info "  工作目录: $WORK_DIR"

# 1. 克隆 Gitea Wiki
log_info "正在克隆 Gitea Wiki..."
cd "$WORK_DIR"

if ! git clone "$GITEA_WIKI_URL" wiki 2>/dev/null; then
    log_warn "无法克隆 Gitea Wiki，可能 Wiki 不存在或没有权限"
    exit 0
fi

cd wiki

# 检查是否有内容
if [ ! -f "Home.md" ] && [ -z "$(ls -A *.md 2>/dev/null)" ]; then
    log_warn "Gitea Wiki 为空，跳过同步"
    exit 0
fi

log_info "成功克隆 Gitea Wiki，文件列表:"
ls -la *.md 2>/dev/null || echo "  (无 .md 文件)"

# 2. 替换链接
log_info "正在替换链接..."

# 复制替换脚本到工作目录并执行
if [ -f "$SCRIPT_DIR/replace-links.sh" ]; then
    # 直接在当前目录替换
    bash "$SCRIPT_DIR/replace-links.sh" .
else
    log_warn "未找到 replace-links.sh，手动替换链接..."

    # 内联替换逻辑
    for file in *.md; do
        if [ -f "$file" ]; then
            # 替换仓库主链接
            sed -i.bak "s|https://${GITEA_HOST}/${GITEA_OWNER}/${GITEA_REPO}|https://${GITHUB_HOST}/${GITHUB_OWNER}/${GITHUB_REPO}|g" "$file"

            # 替换 raw 文件链接
            sed -i.bak "s|https://${GITEA_HOST}/${GITEA_OWNER}/${GITEA_REPO}/raw/branch/\([^/]*\)/|https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/\1/|g" "$file"

            # 替换 SSH 克隆链接
            sed -i.bak "s|gitea@${GITEA_HOST}:${GITEA_OWNER}/${GITEA_REPO}\.git|git@${GITHUB_HOST}:${GITHUB_OWNER}/${GITHUB_REPO}.git|g" "$file"

            rm -f "${file}.bak"
        fi
    done
fi

# 3. 配置 Git
log_info "配置 Git..."
git config user.name "Gitea MCP Bot"
git config user.email "bot@gitea-mcp.local"

# 4. 检查是否有更改
if git diff --quiet && git diff --staged --quiet; then
    log_info "链接替换后无变更"
else
    log_info "检测到链接变更，提交中..."
    git add -A
    git commit -m "docs: sync from Gitea Wiki and replace links

🤖 Generated with Gitea MCP CI/CD"
fi

# 5. 添加 GitHub 远程并推送
log_info "推送到 GitHub Wiki..."

# 移除旧的 github remote（如果存在）
git remote remove github 2>/dev/null || true

# 添加 GitHub Wiki 作为远程
git remote add github "$GITHUB_WIKI_URL"

# 获取 GitHub Wiki 的当前状态
if git fetch github 2>/dev/null; then
    # 如果 GitHub Wiki 存在，尝试合并
    if git branch -r | grep -q "github/master"; then
        log_info "GitHub Wiki 存在，合并中..."
        git merge github/master --allow-unrelated-histories -m "merge: sync with GitHub Wiki" || true
    fi
fi

# 推送到 GitHub Wiki
if git push github HEAD:master --force 2>/dev/null; then
    log_info "成功推送到 GitHub Wiki!"
else
    log_error "推送到 GitHub Wiki 失败"
    log_warn "请确保:"
    log_warn "  1. GitHub Wiki 已启用"
    log_warn "  2. GITHUB_TOKEN 有 wiki 写入权限"
    log_warn "  3. 或者 SSH key 已配置"
    exit 1
fi

log_info "Wiki 同步完成!"
