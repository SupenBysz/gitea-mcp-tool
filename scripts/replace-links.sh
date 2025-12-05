#!/bin/bash
# replace-links.sh - 替换 Gitea 私有链接为 GitHub 公开链接
#
# 用法: ./scripts/replace-links.sh [目录]
# 默认处理当前目录下的所有 .md 文件

set -e

# 配置
GITEA_HOST="gitea.ktyun.cc"
GITEA_OWNER="Kysion"
GITEA_REPO="entai-gitea-mcp"

GITHUB_HOST="github.com"
GITHUB_OWNER="SupenBysz"
GITHUB_REPO="gitea-mcp-tool"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取工作目录
WORK_DIR="${1:-.}"

# 检查目录是否存在
if [ ! -d "$WORK_DIR" ]; then
    log_error "目录不存在: $WORK_DIR"
    exit 1
fi

log_info "开始替换链接，工作目录: $WORK_DIR"

# 需要处理的文件模式
FILE_PATTERNS=("*.md" "*.json")

# 统计
TOTAL_FILES=0
MODIFIED_FILES=0

# 替换函数
replace_in_file() {
    local file="$1"
    local original_content
    local new_content

    original_content=$(cat "$file")
    new_content="$original_content"

    # 替换规则 1: raw 文件链接（必须先于主链接替换）
    # https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/ -> https://raw.githubusercontent.com/SupenBysz/gitea-mcp-tool/main/
    new_content=$(echo "$new_content" | sed "s|https://${GITEA_HOST}/${GITEA_OWNER}/${GITEA_REPO}/raw/branch/\([^/]*\)/|https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/\1/|g")

    # 替换规则 2: 仓库主链接
    # https://gitea.ktyun.cc/Kysion/entai-gitea-mcp -> https://github.com/SupenBysz/gitea-mcp-tool
    new_content=$(echo "$new_content" | sed "s|https://${GITEA_HOST}/${GITEA_OWNER}/${GITEA_REPO}|https://${GITHUB_HOST}/${GITHUB_OWNER}/${GITHUB_REPO}|g")

    # 替换规则 3: SSH 克隆链接
    # gitea@gitea.ktyun.cc:Kysion/entai-gitea-mcp.git -> git@github.com:SupenBysz/gitea-mcp-tool.git
    new_content=$(echo "$new_content" | sed "s|gitea@${GITEA_HOST}:${GITEA_OWNER}/${GITEA_REPO}\.git|git@${GITHUB_HOST}:${GITHUB_OWNER}/${GITHUB_REPO}.git|g")

    # 注意：保留 GITEA_BASE_URL 配置示例中的 gitea.ktyun.cc
    # 这些是用户配置示例，不应该替换

    # 检查是否有变化
    if [ "$original_content" != "$new_content" ]; then
        echo "$new_content" > "$file"
        log_info "已修改: $file"
        MODIFIED_FILES=$((MODIFIED_FILES + 1))
        return 0
    fi

    return 1
}

# 遍历文件
for pattern in "${FILE_PATTERNS[@]}"; do
    while IFS= read -r -d '' file; do
        TOTAL_FILES=$((TOTAL_FILES + 1))

        # 跳过 node_modules
        if [[ "$file" == *"node_modules"* ]]; then
            continue
        fi

        # 跳过 .git 目录
        if [[ "$file" == *".git"* ]]; then
            continue
        fi

        replace_in_file "$file" || true

    done < <(find "$WORK_DIR" -name "$pattern" -type f -print0 2>/dev/null)
done

log_info "完成！共扫描 $TOTAL_FILES 个文件，修改 $MODIFIED_FILES 个文件"
