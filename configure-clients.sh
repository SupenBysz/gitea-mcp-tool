#!/bin/bash

# Gitea MCP Server - Client Configuration Wizard
# 自动配置多个 MCP 客户端

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# 配置参数
INSTALL_DIR="${HOME}/.gitea-mcp"
GITEA_BASE_URL="${GITEA_BASE_URL:-https://gitea.ktyun.cc}"
GITEA_API_TOKEN="${GITEA_API_TOKEN:-}"

# 检测操作系统
detect_os() {
    case "$(uname -s)" in
        Darwin*)
            OS="macos"
            ;;
        Linux*)
            OS="linux"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            OS="windows"
            ;;
        *)
            OS="unknown"
            ;;
    esac
}

# 获取配置文件路径
get_config_paths() {
    case "$OS" in
        macos)
            CLAUDE_DESKTOP_CONFIG="${HOME}/Library/Application Support/Claude/claude_desktop_config.json"
            VSCODE_USER_CONFIG="${HOME}/Library/Application Support/Code/User/settings.json"
            CURSOR_USER_CONFIG="${HOME}/Library/Application Support/Cursor/User/settings.json"
            WINDSURF_USER_CONFIG="${HOME}/Library/Application Support/Windsurf/User/settings.json"
            ;;
        linux)
            CLAUDE_DESKTOP_CONFIG="${HOME}/.config/Claude/claude_desktop_config.json"
            VSCODE_USER_CONFIG="${HOME}/.config/Code/User/settings.json"
            CURSOR_USER_CONFIG="${HOME}/.config/Cursor/User/settings.json"
            WINDSURF_USER_CONFIG="${HOME}/.config/Windsurf/User/settings.json"
            ;;
        windows)
            CLAUDE_DESKTOP_CONFIG="${APPDATA}/Claude/claude_desktop_config.json"
            VSCODE_USER_CONFIG="${APPDATA}/Code/User/settings.json"
            CURSOR_USER_CONFIG="${APPDATA}/Cursor/User/settings.json"
            WINDSURF_USER_CONFIG="${APPDATA}/Windsurf/User/settings.json"
            ;;
    esac
}

# 检查 jq 是否安装
check_jq() {
    if ! command -v jq >/dev/null 2>&1; then
        log_warn "未安装 jq，将使用手动 JSON 处理"
        HAS_JQ=false
    else
        HAS_JQ=true
    fi
}

# 创建 MCP 服务器配置 JSON
create_mcp_config() {
    cat <<EOF
{
  "command": "node",
  "args": ["${INSTALL_DIR}/dist/index.js"],
  "env": {
    "GITEA_BASE_URL": "${GITEA_BASE_URL}",
    "GITEA_API_TOKEN": "${GITEA_API_TOKEN}"
  }
}
EOF
}

# 配置 Claude Desktop
configure_claude_desktop() {
    log_step "配置 Claude Desktop..."

    local config_dir=$(dirname "${CLAUDE_DESKTOP_CONFIG}")

    # 创建配置目录
    if [ ! -d "$config_dir" ]; then
        log_warn "Claude Desktop 配置目录不存在: $config_dir"
        read -p "是否创建配置目录? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mkdir -p "$config_dir"
        else
            log_warn "跳过 Claude Desktop 配置"
            return
        fi
    fi

    # 备份现有配置
    if [ -f "${CLAUDE_DESKTOP_CONFIG}" ]; then
        cp "${CLAUDE_DESKTOP_CONFIG}" "${CLAUDE_DESKTOP_CONFIG}.backup.$(date +%s)"
        log_info "已备份现有配置"
    fi

    # 创建或更新配置
    if [ "$HAS_JQ" = true ]; then
        # 使用 jq 更新配置
        local mcp_config=$(create_mcp_config)
        if [ -f "${CLAUDE_DESKTOP_CONFIG}" ]; then
            # 更新现有配置
            jq --argjson config "$mcp_config" \
                '.mcpServers["gitea-service"] = $config' \
                "${CLAUDE_DESKTOP_CONFIG}" > "${CLAUDE_DESKTOP_CONFIG}.tmp"
            mv "${CLAUDE_DESKTOP_CONFIG}.tmp" "${CLAUDE_DESKTOP_CONFIG}"
        else
            # 创建新配置
            jq -n --argjson config "$mcp_config" \
                '{mcpServers: {"gitea-service": $config}}' \
                > "${CLAUDE_DESKTOP_CONFIG}"
        fi
    else
        # 手动创建配置
        cat > "${CLAUDE_DESKTOP_CONFIG}" <<EOF
{
  "mcpServers": {
    "gitea-service": $(create_mcp_config)
  }
}
EOF
    fi

    log_info "✓ Claude Desktop 配置完成: ${CLAUDE_DESKTOP_CONFIG}"
}

# 配置 VSCode (Cline)
configure_vscode() {
    log_step "配置 VSCode (Cline)..."

    local config_dir=$(dirname "${VSCODE_USER_CONFIG}")

    if [ ! -d "$config_dir" ]; then
        log_warn "VSCode 配置目录不存在: $config_dir"
        read -p "是否创建配置目录? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mkdir -p "$config_dir"
        else
            log_warn "跳过 VSCode 配置"
            return
        fi
    fi

    # 备份现有配置
    if [ -f "${VSCODE_USER_CONFIG}" ]; then
        cp "${VSCODE_USER_CONFIG}" "${VSCODE_USER_CONFIG}.backup.$(date +%s)"
    fi

    # 创建或更新配置
    if [ "$HAS_JQ" = true ]; then
        local mcp_config=$(create_mcp_config)
        if [ -f "${VSCODE_USER_CONFIG}" ]; then
            jq --argjson config "$mcp_config" \
                '.["cline.mcpServers"]["gitea-service"] = $config' \
                "${VSCODE_USER_CONFIG}" > "${VSCODE_USER_CONFIG}.tmp"
            mv "${VSCODE_USER_CONFIG}.tmp" "${VSCODE_USER_CONFIG}"
        else
            jq -n --argjson config "$mcp_config" \
                '{"cline.mcpServers": {"gitea-service": $config}}' \
                > "${VSCODE_USER_CONFIG}"
        fi
    else
        cat > "${VSCODE_USER_CONFIG}" <<EOF
{
  "cline.mcpServers": {
    "gitea-service": $(create_mcp_config)
  }
}
EOF
    fi

    log_info "✓ VSCode (Cline) 配置完成: ${VSCODE_USER_CONFIG}"
}

# 配置 Cursor
configure_cursor() {
    log_step "配置 Cursor..."

    local config_dir=$(dirname "${CURSOR_USER_CONFIG}")

    if [ ! -d "$config_dir" ]; then
        log_warn "Cursor 配置目录不存在: $config_dir"
        log_warn "跳过 Cursor 配置"
        return
    fi

    # 备份现有配置
    if [ -f "${CURSOR_USER_CONFIG}" ]; then
        cp "${CURSOR_USER_CONFIG}" "${CURSOR_USER_CONFIG}.backup.$(date +%s)"
    fi

    # 创建或更新配置（Cursor 可能使用与 VSCode 相同的配置格式）
    if [ "$HAS_JQ" = true ]; then
        local mcp_config=$(create_mcp_config)
        if [ -f "${CURSOR_USER_CONFIG}" ]; then
            jq --argjson config "$mcp_config" \
                '.["mcpServers"]["gitea-service"] = $config' \
                "${CURSOR_USER_CONFIG}" > "${CURSOR_USER_CONFIG}.tmp"
            mv "${CURSOR_USER_CONFIG}.tmp" "${CURSOR_USER_CONFIG}"
        else
            jq -n --argjson config "$mcp_config" \
                '{"mcpServers": {"gitea-service": $config}}' \
                > "${CURSOR_USER_CONFIG}"
        fi
    else
        cat > "${CURSOR_USER_CONFIG}" <<EOF
{
  "mcpServers": {
    "gitea-service": $(create_mcp_config)
  }
}
EOF
    fi

    log_info "✓ Cursor 配置完成: ${CURSOR_USER_CONFIG}"
}

# 配置 Windsurf
configure_windsurf() {
    log_step "配置 Windsurf..."

    local config_dir=$(dirname "${WINDSURF_USER_CONFIG}")

    if [ ! -d "$config_dir" ]; then
        log_warn "Windsurf 配置目录不存在: $config_dir"
        log_warn "跳过 Windsurf 配置"
        return
    fi

    # 备份现有配置
    if [ -f "${WINDSURF_USER_CONFIG}" ]; then
        cp "${WINDSURF_USER_CONFIG}" "${WINDSURF_USER_CONFIG}.backup.$(date +%s)"
    fi

    # 创建或更新配置
    if [ "$HAS_JQ" = true ]; then
        local mcp_config=$(create_mcp_config)
        if [ -f "${WINDSURF_USER_CONFIG}" ]; then
            jq --argjson config "$mcp_config" \
                '.["mcpServers"]["gitea-service"] = $config' \
                "${WINDSURF_USER_CONFIG}" > "${WINDSURF_USER_CONFIG}.tmp"
            mv "${WINDSURF_USER_CONFIG}.tmp" "${WINDSURF_USER_CONFIG}"
        else
            jq -n --argjson config "$mcp_config" \
                '{"mcpServers": {"gitea-service": $config}}' \
                > "${WINDSURF_USER_CONFIG}"
        fi
    else
        cat > "${WINDSURF_USER_CONFIG}" <<EOF
{
  "mcpServers": {
    "gitea-service": $(create_mcp_config)
  }
}
EOF
    fi

    log_info "✓ Windsurf 配置完成: ${WINDSURF_USER_CONFIG}"
}

# 显示配置信息
show_config_info() {
    echo ""
    log_info "=========================================="
    log_info "配置信息"
    log_info "=========================================="
    echo ""
    echo "  安装目录: ${INSTALL_DIR}"
    echo "  Gitea 服务器: ${GITEA_BASE_URL}"
    echo "  API Token: ${GITEA_API_TOKEN:0:10}..."
    echo ""
}

# 选择要配置的客户端
select_clients() {
    echo ""
    log_info "请选择要配置的 MCP 客户端（空格选择，回车确认）："
    echo ""
    echo "  1) Claude Desktop"
    echo "  2) VSCode (Cline)"
    echo "  3) Cursor"
    echo "  4) Windsurf"
    echo "  5) 全部配置"
    echo ""
    read -p "请输入选项 (1-5): " choice

    case $choice in
        1)
            configure_claude_desktop
            ;;
        2)
            configure_vscode
            ;;
        3)
            configure_cursor
            ;;
        4)
            configure_windsurf
            ;;
        5)
            configure_claude_desktop
            configure_vscode
            configure_cursor
            configure_windsurf
            ;;
        *)
            log_error "无效选项"
            exit 1
            ;;
    esac
}

# 主函数
main() {
    echo ""
    log_info "=========================================="
    log_info "Gitea MCP Server - 客户端配置向导"
    log_info "=========================================="
    echo ""

    # 检查安装目录
    if [ ! -d "${INSTALL_DIR}" ]; then
        log_error "未找到安装目录: ${INSTALL_DIR}"
        log_info "请先运行安装脚本: install-quick.sh"
        exit 1
    fi

    # 检测操作系统
    detect_os
    log_info "检测到操作系统: ${OS}"

    # 获取配置路径
    get_config_paths

    # 检查 jq
    check_jq

    # 获取配置信息
    if [ -z "$GITEA_API_TOKEN" ]; then
        echo ""
        read -p "请输入 Gitea API Token: " GITEA_API_TOKEN
    fi

    if [ -z "$GITEA_BASE_URL" ]; then
        read -p "请输入 Gitea 服务器地址 [https://gitea.ktyun.cc]: " input_url
        GITEA_BASE_URL="${input_url:-https://gitea.ktyun.cc}"
    fi

    # 显示配置信息
    show_config_info

    # 选择客户端
    select_clients

    echo ""
    log_info "=========================================="
    log_info "配置完成！"
    log_info "=========================================="
    echo ""
    log_info "请重启相应的 MCP 客户端以使配置生效"
    echo ""
}

main
