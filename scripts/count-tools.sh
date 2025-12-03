#!/bin/bash
# count-tools.sh - 统计 MCP 工具数量并更新相关文件
#
# 功能:
# 1. 扫描源码统计 MCP 工具数量
# 2. 更新 README.md 中的工具数量
#
# 用法: ./scripts/count-tools.sh [--update]
# 参数:
#   --update  更新 README.md（默认只显示统计结果）

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

# 源码目录
SRC_DIR="src/tools-registry"
README_FILE="README.md"

# 检查目录是否存在
if [ ! -d "$SRC_DIR" ]; then
    log_error "源码目录不存在: $SRC_DIR"
    exit 1
fi

# 统计工具数量
count_tools() {
    local total=0

    echo -e "${BLUE}=== MCP 工具统计 ===${NC}" >&2
    echo "" >&2

    # 遍历所有 registry 文件
    for file in "$SRC_DIR"/*-registry.ts; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            local category="${filename%-registry.ts}"

            # 统计 registerTool 调用次数
            local count=$(grep -c "registerTool(" "$file" 2>/dev/null || echo "0")

            if [ "$count" -gt 0 ]; then
                printf "  %-20s: %3d 个工具\n" "$category" "$count" >&2
                total=$((total + count))
            fi
        fi
    done

    echo "" >&2
    echo -e "${GREEN}总计: ${total} 个 MCP 工具${NC}" >&2
    echo "" >&2

    echo "$total"
}

# 更新 README.md 中的工具数量
update_readme() {
    local count="$1"

    if [ ! -f "$README_FILE" ]; then
        log_error "README.md 不存在"
        return 1
    fi

    # 获取当前 README 中的数量
    local current_count=$(grep -oE '\*\*[0-9]+ 个 MCP 工具\*\*' "$README_FILE" | grep -oE '[0-9]+' | head -1)

    if [ -z "$current_count" ]; then
        # 尝试另一种格式
        current_count=$(grep -oE 'MCP 工具数.*[0-9]+' "$README_FILE" | grep -oE '[0-9]+' | head -1)
    fi

    if [ "$current_count" = "$count" ]; then
        log_info "README.md 中的工具数量已是最新 ($count)"
        return 0
    fi

    log_info "更新 README.md: $current_count -> $count"

    # 替换特性部分的工具数量
    sed -i.bak "s/\*\*[0-9]\+ 个 MCP 工具\*\*/\*\*$count 个 MCP 工具\*\*/g" "$README_FILE"

    # 替换版本部分的工具数量
    sed -i.bak "s/MCP 工具数.*: [0-9]\+/MCP 工具数: $count/g" "$README_FILE"

    # 清理备份文件
    rm -f "${README_FILE}.bak"

    log_info "README.md 已更新"
}

# 主逻辑
main() {
    local update_flag=false

    # 解析参数
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --update)
                update_flag=true
                shift
                ;;
            *)
                log_error "未知参数: $1"
                echo "用法: $0 [--update]"
                exit 1
                ;;
        esac
    done

    # 统计工具
    local tool_count
    tool_count=$(count_tools | tail -1)

    # 如果指定了 --update，更新文件
    if [ "$update_flag" = true ]; then
        update_readme "$tool_count"
    fi

    # 输出最终数量（供 CI 使用）
    echo "TOOL_COUNT=$tool_count"
}

main "$@"
