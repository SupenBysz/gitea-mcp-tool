#!/bin/bash
# check-private-links.sh - 检查 npm 发布文件中是否包含私有 Gitea 链接
#
# 用法: ./scripts/check-private-links.sh
# 返回: 0 = 无私有链接, 1 = 发现私有链接

set -e

# 配置 - 私有 Gitea 域名
PRIVATE_DOMAINS=(
    "gitea.ktyun.cc"
)

# 需要检查的目录和文件 (npm package 会发布的内容)
# 参考 package.json 的 files 字段: ["dist", "config", ".mcp.json", "README.md", "LICENSE"]
CHECK_PATHS=(
    "dist"
    "config"
    ".mcp.json"
    "README.md"
)

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

# 统计
FOUND_COUNT=0
FOUND_FILES=()

log_info "开始检查 npm 发布文件中的私有链接..."
echo ""

for path in "${CHECK_PATHS[@]}"; do
    if [ ! -e "$path" ]; then
        log_warn "路径不存在，跳过: $path"
        continue
    fi

    for domain in "${PRIVATE_DOMAINS[@]}"; do
        # 使用 grep 搜索私有域名
        # 排除 source map 文件 (.map) - 这些只是调试文件，不影响运行时
        if [ -d "$path" ]; then
            # 目录：递归搜索，排除 .map 文件
            matches=$(grep -r --include="*.js" --include="*.json" --include="*.md" --include="*.ts" "$domain" "$path" 2>/dev/null || true)
        else
            # 文件：直接搜索（跳过 .map 文件）
            if [[ "$path" == *.map ]]; then
                continue
            fi
            matches=$(grep "$domain" "$path" 2>/dev/null || true)
        fi

        if [ -n "$matches" ]; then
            log_error "在 $path 中发现私有链接 ($domain):"
            echo "$matches" | head -20
            echo ""
            FOUND_COUNT=$((FOUND_COUNT + 1))
            FOUND_FILES+=("$path")
        fi
    done
done

echo ""
echo "========================================"

if [ $FOUND_COUNT -gt 0 ]; then
    log_error "发现 $FOUND_COUNT 处私有链接！"
    echo ""
    log_error "受影响的路径:"
    for f in "${FOUND_FILES[@]}"; do
        echo "  - $f"
    done
    echo ""
    log_error "请在发布前修复这些私有链接"
    log_info "提示: 运行 ./scripts/replace-links.sh 可自动替换链接"
    exit 1
else
    log_info "检查通过！未发现私有链接"
    exit 0
fi
