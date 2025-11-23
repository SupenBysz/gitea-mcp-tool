#!/bin/bash

# Gitea MCP Server - Quick Installation (Download Release)
# Downloads and installs pre-built release package

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 默认语言（根据系统环境检测）
LANG_DEFAULT="zh"
if [[ "${LANG}" != *"zh"* ]] && [[ "${LANG}" != *"CN"* ]]; then
    LANG_DEFAULT="en"
fi
INSTALL_LANG="${INSTALL_LANG:-$LANG_DEFAULT}"

# 多语言文本
declare -A TEXT_TITLE=(
    ["zh"]="Gitea MCP Server - 快速安装"
    ["en"]="Gitea MCP Server - Quick Installation"
)

declare -A TEXT_LANG_SELECT=(
    ["zh"]="请选择语言 / Select Language"
    ["en"]="Please select language / 请选择语言"
)

declare -A TEXT_VERSION_INFO=(
    ["zh"]="版本信息"
    ["en"]="Version Information"
)

declare -A TEXT_CURRENT_VERSION=(
    ["zh"]="当前已安装版本"
    ["en"]="Currently Installed Version"
)

declare -A TEXT_LATEST_VERSION=(
    ["zh"]="最新可用版本"
    ["en"]="Latest Available Version"
)

declare -A TEXT_NOT_INSTALLED=(
    ["zh"]="未安装"
    ["en"]="Not installed"
)

declare -A TEXT_INSTALL_TYPE=(
    ["zh"]="请选择安装类型"
    ["en"]="Please select installation type"
)

declare -A TEXT_INSTALL_MCP=(
    ["zh"]="仅安装 MCP Server（供 AI 工具使用）"
    ["en"]="MCP Server only (for AI tools)"
)

declare -A TEXT_INSTALL_CLI=(
    ["zh"]="仅安装 CLI 工具（keactl 命令行）"
    ["en"]="CLI tool only (keactl command line)"
)

declare -A TEXT_INSTALL_ALL=(
    ["zh"]="安装全部（MCP + CLI）"
    ["en"]="Install both (MCP + CLI)"
)

declare -A TEXT_CHECKING_NODE=(
    ["zh"]="检查 Node.js 环境"
    ["en"]="Checking Node.js"
)

declare -A TEXT_DOWNLOADING=(
    ["zh"]="下载发布包"
    ["en"]="Downloading release package"
)

declare -A TEXT_INSTALLING=(
    ["zh"]="安装软件包"
    ["en"]="Installing package"
)

declare -A TEXT_INSTALLING_DEPS=(
    ["zh"]="安装依赖"
    ["en"]="Installing dependencies"
)

declare -A TEXT_CONFIGURATION=(
    ["zh"]="配置说明"
    ["en"]="Configuration"
)

declare -A TEXT_INSTALL_SUCCESS=(
    ["zh"]="安装成功完成！"
    ["en"]="Installation completed successfully!"
)

declare -A TEXT_INSTALL_PATH=(
    ["zh"]="安装路径"
    ["en"]="Installation path"
)

declare -A TEXT_NEXT_STEPS=(
    ["zh"]="后续步骤"
    ["en"]="Next steps"
)

declare -A TEXT_RUN_WIZARD=(
    ["zh"]="运行配置向导（推荐）"
    ["en"]="Run configuration wizard (recommended)"
)

declare -A TEXT_MANUAL_CONFIG=(
    ["zh"]="或手动配置 MCP 客户端"
    ["en"]="Or manually configure your MCP client"
)

declare -A TEXT_ASK_WIZARD=(
    ["zh"]="是否现在运行配置向导来自动配置 MCP 客户端? (y/n)"
    ["en"]="Run configuration wizard now to auto-configure MCP clients? (y/n)"
)

declare -A TEXT_SKIP_WIZARD=(
    ["zh"]="跳过配置向导，请参考上方示例手动配置"
    ["en"]="Skipped wizard, please configure manually using examples above"
)

# 日志函数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Configuration
GITEA_URL="https://gitea.ktyun.cc"
REPO_OWNER="Kysion"
REPO_NAME="entai-gitea-mcp"
INSTALL_DIR="${HOME}/.gitea-mcp"
INSTALL_TYPE="all"  # all, mcp, cli
VERSION=""
CURRENT_INSTALLED_VERSION=""

# 语言选择
select_language() {
    echo ""
    echo -e "${CYAN}==========================================${NC}"
    echo -e "  ${TEXT_LANG_SELECT[$INSTALL_LANG]}"
    echo -e "${CYAN}==========================================${NC}"
    echo ""

    PS3=$'\n'"Please enter (1-2): "
    select lang in "中文 (Chinese)" "English"; do
        case $lang in
            "中文 (Chinese)")
                INSTALL_LANG="zh"
                break
                ;;
            "English")
                INSTALL_LANG="en"
                break
                ;;
            *)
                echo "Invalid option"
                ;;
        esac
    done
}

# 获取当前已安装版本
get_installed_version() {
    if [ -f "${INSTALL_DIR}/package.json" ]; then
        CURRENT_INSTALLED_VERSION=$(node -p "require('${INSTALL_DIR}/package.json').version" 2>/dev/null || echo "")
    fi

    if [ -z "$CURRENT_INSTALLED_VERSION" ]; then
        CURRENT_INSTALLED_VERSION="${TEXT_NOT_INSTALLED[$INSTALL_LANG]}"
    fi
}

# Check for authentication token
check_auth() {
    if [ -z "$GITEA_API_TOKEN" ]; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_warn "GITEA_API_TOKEN 未设置。如果是私有仓库，下载可能会失败"
            log_info "认证方式: export GITEA_API_TOKEN=your_token_here"
        else
            log_warn "GITEA_API_TOKEN not set. Download may fail for private repositories"
            log_info "To authenticate: export GITEA_API_TOKEN=your_token_here"
        fi
        echo ""
    else
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_info "使用认证访问"
        else
            log_info "Using authenticated access"
        fi
    fi
}

# Get latest release version
get_latest_version() {
    if [ "$INSTALL_LANG" = "zh" ]; then
        log_info "获取最新版本..."
    else
        log_info "Fetching latest release version..."
    fi

    local api_url="${GITEA_URL}/api/v1/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"
    local auth_header=""

    if [ -n "$GITEA_API_TOKEN" ]; then
        auth_header="Authorization: token ${GITEA_API_TOKEN}"
    fi

    if command_exists curl; then
        if [ -n "$auth_header" ]; then
            VERSION=$(curl -s -H "${auth_header}" "${api_url}" | grep -o '"tag_name":"[^"]*"' | cut -d'"' -f4)
        else
            VERSION=$(curl -s "${api_url}" | grep -o '"tag_name":"[^"]*"' | cut -d'"' -f4)
        fi
    elif command_exists wget; then
        if [ -n "$auth_header" ]; then
            VERSION=$(wget -qO- --header="${auth_header}" "${api_url}" | grep -o '"tag_name":"[^"]*"' | cut -d'"' -f4)
        else
            VERSION=$(wget -qO- "${api_url}" | grep -o '"tag_name":"[^"]*"' | cut -d'"' -f4)
        fi
    else
        log_error "Neither curl nor wget is available"
        exit 1
    fi

    if [ -z "$VERSION" ]; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_warn "无法获取最新版本，使用默认: v1.4.0"
        else
            log_warn "Could not fetch latest version, using default: v1.4.0"
        fi
        VERSION="v1.4.0"
    fi
}

# 显示版本信息
show_version_info() {
    echo ""
    echo -e "${CYAN}==========================================${NC}"
    echo -e "  ${TEXT_VERSION_INFO[$INSTALL_LANG]}"
    echo -e "${CYAN}==========================================${NC}"
    echo ""

    get_installed_version

    echo "📦 ${TEXT_CURRENT_VERSION[$INSTALL_LANG]}: ${CURRENT_INSTALLED_VERSION}"
    echo "🌐 ${TEXT_LATEST_VERSION[$INSTALL_LANG]}: ${VERSION}"
    echo ""
}

# 选择安装类型
select_install_type() {
    echo ""
    echo -e "${CYAN}==========================================${NC}"
    echo -e "  ${TEXT_INSTALL_TYPE[$INSTALL_LANG]}"
    echo -e "${CYAN}==========================================${NC}"
    echo ""

    PS3=$'\n'"Please enter (1-3): "
    select type in "${TEXT_INSTALL_MCP[$INSTALL_LANG]}" \
                   "${TEXT_INSTALL_CLI[$INSTALL_LANG]}" \
                   "${TEXT_INSTALL_ALL[$INSTALL_LANG]}"; do
        case $REPLY in
            1)
                INSTALL_TYPE="mcp"
                break
                ;;
            2)
                INSTALL_TYPE="cli"
                break
                ;;
            3)
                INSTALL_TYPE="all"
                break
                ;;
            *)
                echo "Invalid option"
                ;;
        esac
    done
}

# Check prerequisites
check_node() {
    log_step "1/5 ${TEXT_CHECKING_NODE[$INSTALL_LANG]}..."

    if ! command_exists node; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_error "Node.js 未安装"
            log_info "请从以下地址安装 Node.js 18+: https://nodejs.org/"
        else
            log_error "Node.js is not installed"
            log_info "Please install Node.js 18+ from: https://nodejs.org/"
        fi
        exit 1
    fi

    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_error "Node.js 版本必须 >= 18。当前: $(node -v)"
        else
            log_error "Node.js version must be 18+. Current: $(node -v)"
        fi
        exit 1
    fi

    log_info "Node.js $(node -v) ✓"

    if ! command_exists npm; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_error "npm 未安装"
        else
            log_error "npm is not installed"
        fi
        exit 1
    fi

    log_info "npm $(npm -v) ✓"
}

# Download release
download_release() {
    log_step "2/5 ${TEXT_DOWNLOADING[$INSTALL_LANG]}..."

    local package_name="gitea-mcp-${VERSION}.tar.gz"
    local download_url="${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/releases/download/${VERSION}/${package_name}"

    if [ "$INSTALL_LANG" = "zh" ]; then
        log_info "下载地址: ${download_url}"
    else
        log_info "URL: ${download_url}"
    fi

    local temp_file="/tmp/${package_name}"
    local auth_header=""

    if [ -n "$GITEA_API_TOKEN" ]; then
        auth_header="Authorization: token ${GITEA_API_TOKEN}"
    fi

    if command_exists curl; then
        if [ -n "$auth_header" ]; then
            curl -L -H "${auth_header}" -o "${temp_file}" "${download_url}" || {
                log_error "Download failed"
                exit 1
            }
        else
            curl -L -o "${temp_file}" "${download_url}" || {
                log_error "Download failed"
                exit 1
            }
        fi
    elif command_exists wget; then
        if [ -n "$auth_header" ]; then
            wget --header="${auth_header}" -O "${temp_file}" "${download_url}" || {
                log_error "Download failed"
                exit 1
            }
        else
            wget -O "${temp_file}" "${download_url}" || {
                log_error "Download failed"
                exit 1
            }
        fi
    fi

    TEMP_FILE="${temp_file}"

    if [ "$INSTALL_LANG" = "zh" ]; then
        log_info "已下载到: ${temp_file}"
    else
        log_info "Downloaded to: ${temp_file}"
    fi
}

# Install package
install_package() {
    log_step "3/5 ${TEXT_INSTALLING[$INSTALL_LANG]}..."

    # Remove old installation
    if [ -d "${INSTALL_DIR}" ]; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_warn "删除旧版本: ${INSTALL_DIR}"
        else
            log_warn "Removing old installation: ${INSTALL_DIR}"
        fi
        rm -rf "${INSTALL_DIR}"
    fi

    mkdir -p "${INSTALL_DIR}"
    tar -xzf "${TEMP_FILE}" -C "${INSTALL_DIR}"
    rm -f "${TEMP_FILE}"

    if [ "$INSTALL_LANG" = "zh" ]; then
        log_info "已安装到: ${INSTALL_DIR}"
    else
        log_info "Installed to: ${INSTALL_DIR}"
    fi
}

# Install dependencies
install_dependencies() {
    log_step "4/5 ${TEXT_INSTALLING_DEPS[$INSTALL_LANG]}..."

    cd "${INSTALL_DIR}"

    if [ "$INSTALL_LANG" = "zh" ]; then
        log_info "运行 npm install..."
    else
        log_info "Running npm install..."
    fi

    if npm install --production --silent > /dev/null 2>&1; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_info "依赖安装完成 ✓"
        else
            log_info "Dependencies installed ✓"
        fi
    else
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_warn "npm install 完成但有警告"
        else
            log_warn "npm install completed with warnings"
        fi
    fi

    cd - > /dev/null
}

# Show configuration
show_config() {
    log_step "5/5 ${TEXT_CONFIGURATION[$INSTALL_LANG]}"

    echo ""
    log_info "=========================================="
    log_info "${TEXT_INSTALL_SUCCESS[$INSTALL_LANG]}"
    log_info "=========================================="
    echo ""

    log_info "${TEXT_INSTALL_PATH[$INSTALL_LANG]}:"
    echo "  ${INSTALL_DIR}"
    echo ""

    case $INSTALL_TYPE in
        "mcp")
            if [ "$INSTALL_LANG" = "zh" ]; then
                log_info "MCP Server 入口:"
                echo "  ${INSTALL_DIR}/dist/index.js"
            else
                log_info "MCP Server entry point:"
                echo "  ${INSTALL_DIR}/dist/index.js"
            fi
            ;;
        "cli")
            if [ "$INSTALL_LANG" = "zh" ]; then
                log_info "CLI 工具入口:"
                echo "  ${INSTALL_DIR}/dist/cli/index.js"
                echo ""
                log_info "使用方式:"
                echo "  node ${INSTALL_DIR}/dist/cli/index.js --help"
            else
                log_info "CLI tool entry point:"
                echo "  ${INSTALL_DIR}/dist/cli/index.js"
                echo ""
                log_info "Usage:"
                echo "  node ${INSTALL_DIR}/dist/cli/index.js --help"
            fi
            ;;
        "all")
            if [ "$INSTALL_LANG" = "zh" ]; then
                log_info "MCP Server: ${INSTALL_DIR}/dist/index.js"
                log_info "CLI 工具: ${INSTALL_DIR}/dist/cli/index.js"
            else
                log_info "MCP Server: ${INSTALL_DIR}/dist/index.js"
                log_info "CLI tool: ${INSTALL_DIR}/dist/cli/index.js"
            fi
            ;;
    esac

    echo ""

    if [ "$INSTALL_TYPE" = "mcp" ] || [ "$INSTALL_TYPE" = "all" ]; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_info "配置示例:"
        else
            log_info "Configuration examples:"
        fi

        echo ""
        echo "  Claude Desktop (~/.../Claude/claude_desktop_config.json):"
        echo '  {'
        echo '    "mcpServers": {'
        echo '      "gitea-mcp-tool": {'
        echo '        "command": "node",'
        echo '        "args": ["'${INSTALL_DIR}'/dist/index.js"],'
        echo '        "env": {'
        echo '          "GITEA_BASE_URL": "https://gitea.ktyun.cc",'
        echo '          "GITEA_API_TOKEN": "your_token_here"'
        echo '        }'
        echo '      }'
        echo '    }'
        echo '  }'
        echo ""
    fi

    log_info "${TEXT_NEXT_STEPS[$INSTALL_LANG]}:"
    echo "  1. ${TEXT_RUN_WIZARD[$INSTALL_LANG]}"
    echo "  2. ${TEXT_MANUAL_CONFIG[$INSTALL_LANG]}"

    if [ "$INSTALL_LANG" = "zh" ]; then
        echo "  3. 设置 GITEA_BASE_URL 和 GITEA_API_TOKEN"
        echo "  4. 重启 MCP 客户端"
        echo ""
        log_info "文档: ${INSTALL_DIR}/README.md"
        log_info "支持: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/issues"
    else
        echo "  3. Set GITEA_BASE_URL and GITEA_API_TOKEN"
        echo "  4. Restart your MCP client"
        echo ""
        log_info "Documentation: ${INSTALL_DIR}/README.md"
        log_info "Support: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/issues"
    fi
    echo ""
}

# 询问是否运行配置向导
ask_configure() {
    if [ "$INSTALL_TYPE" = "cli" ]; then
        return
    fi

    echo ""
    read -p "$(echo -e ${BLUE}${TEXT_ASK_WIZARD[$INSTALL_LANG]}:${NC} )" -n 1 -r < /dev/tty
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$INSTALL_LANG" = "zh" ]; then
            log_info "正在下载配置向导..."
        else
            log_info "Downloading configuration wizard..."
        fi

        local config_script="/tmp/configure-clients-$$.sh"
        local script_url="${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/raw/branch/main/configure-clients.sh"
        local auth_header=""

        if [ -n "$GITEA_API_TOKEN" ]; then
            auth_header="Authorization: token ${GITEA_API_TOKEN}"
        fi

        if command_exists curl; then
            if [ -n "$auth_header" ]; then
                curl -fsSL -H "${auth_header}" "${script_url}" -o "${config_script}" 2>/dev/null || {
                    if [ "$INSTALL_LANG" = "zh" ]; then
                        log_warn "下载配置向导失败，请手动配置"
                    else
                        log_warn "Failed to download wizard, please configure manually"
                    fi
                    return
                }
            else
                curl -fsSL "${script_url}" -o "${config_script}" 2>/dev/null || {
                    if [ "$INSTALL_LANG" = "zh" ]; then
                        log_warn "下载配置向导失败，请手动配置"
                    else
                        log_warn "Failed to download wizard, please configure manually"
                    fi
                    return
                }
            fi
        fi

        if [ -f "${config_script}" ]; then
            chmod +x "${config_script}"
            bash "${config_script}"
            rm -f "${config_script}"
        fi
    else
        log_info "${TEXT_SKIP_WIZARD[$INSTALL_LANG]}"
    fi
}

# Main
main() {
    # 语言选择
    select_language

    echo ""
    log_info "=========================================="
    log_info "${TEXT_TITLE[$INSTALL_LANG]}"
    log_info "=========================================="
    echo ""

    check_auth
    get_latest_version

    # 显示版本信息
    show_version_info

    # 选择安装类型
    select_install_type

    # 执行安装
    check_node
    download_release
    install_package
    install_dependencies
    show_config
    ask_configure
}

main
