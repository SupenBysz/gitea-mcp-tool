#!/bin/bash
# update-changelog.sh - 更新 CHANGELOG.md
#
# 功能:
# 1. 将 [Unreleased] 部分转换为指定版本号
# 2. 从 commit 历史补充遗漏的变更
# 3. 创建新的空 [Unreleased] 部分
#
# 用法: ./scripts/update-changelog.sh <版本号>
# 示例: ./scripts/update-changelog.sh 1.8.0

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 参数检查
VERSION="${1}"
if [ -z "$VERSION" ]; then
    log_error "请提供版本号"
    echo "用法: $0 <版本号>"
    echo "示例: $0 1.8.0"
    exit 1
fi

# 去掉可能的 v 前缀
VERSION="${VERSION#v}"

CHANGELOG_FILE="CHANGELOG.md"
TODAY=$(date +%Y-%m-%d)

# 检查 CHANGELOG 是否存在
if [ ! -f "$CHANGELOG_FILE" ]; then
    log_error "找不到 $CHANGELOG_FILE"
    exit 1
fi

log_info "开始更新 CHANGELOG，版本: $VERSION，日期: $TODAY"

# 创建临时文件
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# 读取当前 CHANGELOG
CHANGELOG_CONTENT=$(cat "$CHANGELOG_FILE")

# 检查是否有 [Unreleased] 部分
if ! grep -q "## \[Unreleased\]" "$CHANGELOG_FILE"; then
    log_warn "没有找到 [Unreleased] 部分，跳过"
    exit 0
fi

# 检查 [Unreleased] 是否有内容
UNRELEASED_CONTENT=$(awk '/## \[Unreleased\]/{flag=1; next} /## \[.*\] - /{flag=0} flag' "$CHANGELOG_FILE" | grep -v '^$' | head -5)
if [ -z "$UNRELEASED_CONTENT" ]; then
    log_warn "[Unreleased] 部分没有内容，跳过"
    exit 0
fi

log_info "检测到 [Unreleased] 内容，开始转换..."

# 从最近的 commits 中提取可能遗漏的变更
# 获取上一个版本 tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$LAST_TAG" ]; then
    log_info "上一个版本 tag: $LAST_TAG"

    # 获取自上次 tag 以来的 commits
    COMMITS=$(git log "${LAST_TAG}..HEAD" --oneline --no-merges 2>/dev/null || echo "")

    if [ -n "$COMMITS" ]; then
        log_info "检测到以下新提交:"
        echo "$COMMITS" | head -10

        # 提取 feat 和 fix 类型的提交（用于补充 CHANGELOG）
        FEAT_COMMITS=$(echo "$COMMITS" | grep -E "^[a-f0-9]+ feat" || echo "")
        FIX_COMMITS=$(echo "$COMMITS" | grep -E "^[a-f0-9]+ fix" || echo "")

        # 这里可以进一步处理，但为了保持手动 CHANGELOG 的质量，
        # 我们只输出提示，不自动添加
        if [ -n "$FEAT_COMMITS" ]; then
            log_info "检测到 feat 提交（已在 Unreleased 中的请忽略）:"
            echo "$FEAT_COMMITS"
        fi
        if [ -n "$FIX_COMMITS" ]; then
            log_info "检测到 fix 提交（已在 Unreleased 中的请忽略）:"
            echo "$FIX_COMMITS"
        fi
    fi
fi

# 执行替换: [Unreleased] -> [x.x.x] - YYYY-MM-DD
# 同时在前面添加新的空 [Unreleased] 部分
NEW_UNRELEASED_TEMPLATE="## [Unreleased]

### 新增

### 修复

### 变更

---

"

# 使用 awk 进行替换
awk -v version="$VERSION" -v date="$TODAY" -v template="$NEW_UNRELEASED_TEMPLATE" '
/^## \[Unreleased\]/ {
    print template
    print "## [" version "] - " date
    next
}
{ print }
' "$CHANGELOG_FILE" > "$TEMP_FILE"

# 写回文件
mv "$TEMP_FILE" "$CHANGELOG_FILE"

log_info "CHANGELOG 已更新!"
log_info "  - [Unreleased] -> [$VERSION] - $TODAY"
log_info "  - 已添加新的 [Unreleased] 部分"

# 显示变更预览
log_info "变更预览 (前30行):"
head -30 "$CHANGELOG_FILE"
