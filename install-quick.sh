#!/bin/bash

# Gitea MCP Server - Quick Installation (Download Release)
# Downloads and installs pre-built release package

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check for authentication token (required for private repositories)
check_auth() {
    if [ -z "$GITEA_API_TOKEN" ]; then
        log_warn "GITEA_API_TOKEN not set. If this is a private repository, download may fail."
        log_info "To authenticate, set: export GITEA_API_TOKEN=your_token_here"
        echo ""
    else
        log_info "Using authenticated access"
    fi
}

# Get latest release version
get_latest_version() {
    log_info "Fetching latest release version..."

    # Try Gitea API
    local api_url="${GITEA_URL}/api/v1/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"

    # Build auth header if token is available
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
        log_warn "Could not fetch latest version from API, using default: v0.9.0"
        VERSION="v0.9.0"
    fi

    log_info "Latest version: ${VERSION}"
}

# Check prerequisites
check_node() {
    log_step "1/4 Checking Node.js..."

    if ! command_exists node; then
        log_error "Node.js is not installed"
        log_info "Please install Node.js 18+ from: https://nodejs.org/"
        exit 1
    fi

    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version must be 18+. Current: $(node -v)"
        exit 1
    fi

    log_info "Node.js $(node -v) ✓"
}

# Download release
download_release() {
    log_step "2/4 Downloading release package..."

    local package_name="gitea-mcp-${VERSION}.tar.gz"
    local download_url="${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/releases/download/${VERSION}/${package_name}"

    log_info "URL: ${download_url}"

    local temp_file="/tmp/${package_name}"

    # Build auth header if token is available
    local auth_header=""
    if [ -n "$GITEA_API_TOKEN" ]; then
        auth_header="Authorization: token ${GITEA_API_TOKEN}"
    fi

    if command_exists curl; then
        if [ -n "$auth_header" ]; then
            curl -L -H "${auth_header}" -o "${temp_file}" "${download_url}" || {
                log_error "Download failed"
                log_info "Please check: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/releases"
                log_info "For private repositories, ensure GITEA_API_TOKEN is set correctly"
                exit 1
            }
        else
            curl -L -o "${temp_file}" "${download_url}" || {
                log_error "Download failed"
                log_info "Please check: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/releases"
                exit 1
            }
        fi
    elif command_exists wget; then
        if [ -n "$auth_header" ]; then
            wget --header="${auth_header}" -O "${temp_file}" "${download_url}" || {
                log_error "Download failed"
                log_info "Please check: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/releases"
                log_info "For private repositories, ensure GITEA_API_TOKEN is set correctly"
                exit 1
            }
        else
            wget -O "${temp_file}" "${download_url}" || {
                log_error "Download failed"
                log_info "Please check: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/releases"
                exit 1
            }
        fi
    fi

    TEMP_FILE="${temp_file}"
    log_info "Downloaded to: ${temp_file}"
}

# Install package
install_package() {
    log_step "3/4 Installing package..."

    # Remove old installation
    if [ -d "${INSTALL_DIR}" ]; then
        log_warn "Removing old installation: ${INSTALL_DIR}"
        rm -rf "${INSTALL_DIR}"
    fi

    # Create installation directory
    mkdir -p "${INSTALL_DIR}"

    # Extract package
    tar -xzf "${TEMP_FILE}" -C "${INSTALL_DIR}"

    # Clean up
    rm -f "${TEMP_FILE}"

    log_info "Installed to: ${INSTALL_DIR}"
}

# Show configuration
show_config() {
    log_step "4/4 Configuration"

    echo ""
    log_info "=========================================="
    log_info "Installation completed successfully!"
    log_info "=========================================="
    echo ""
    log_info "Installation path:"
    echo "  ${INSTALL_DIR}"
    echo ""
    log_info "Main entry point:"
    echo "  ${INSTALL_DIR}/dist/index.js"
    echo ""
    log_info "Configuration examples:"
    echo ""
    echo "  Claude Desktop (~/.../Claude/claude_desktop_config.json):"
    echo '  {'
    echo '    "mcpServers": {'
    echo '      "gitea-service": {'
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
    echo "  VSCode Cline (.vscode/settings.json):"
    echo '  {'
    echo '    "cline.mcpServers": {'
    echo '      "gitea-service": {'
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
    log_info "Next steps:"
    echo "  1. Run configuration wizard (recommended)"
    echo "  2. Or manually configure your MCP client"
    echo "  3. Set GITEA_BASE_URL and GITEA_API_TOKEN"
    echo "  4. Restart your MCP client"
    echo ""
    log_info "Documentation: ${INSTALL_DIR}/README.md"
    log_info "Support: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/issues"
    echo ""
}

# 询问是否运行配置向导
ask_configure() {
    echo ""
    read -p "$(echo -e ${BLUE}是否现在运行配置向导来自动配置 MCP 客户端? \(y/n\):${NC} )" -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "正在下载配置向导..."
        local config_script="/tmp/configure-clients-$$.sh"
        local script_url="${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/raw/branch/main/configure-clients.sh"

        # 构建认证头
        local auth_header=""
        if [ -n "$GITEA_API_TOKEN" ]; then
            auth_header="Authorization: token ${GITEA_API_TOKEN}"
        fi

        # 下载配置脚本
        if command_exists curl; then
            if [ -n "$auth_header" ]; then
                curl -fsSL -H "${auth_header}" "${script_url}" -o "${config_script}" 2>/dev/null || {
                    log_warn "下载配置向导失败，请手动配置"
                    return
                }
            else
                curl -fsSL "${script_url}" -o "${config_script}" 2>/dev/null || {
                    log_warn "下载配置向导失败，请手动配置"
                    return
                }
            fi
        elif command_exists wget; then
            if [ -n "$auth_header" ]; then
                wget --header="${auth_header}" -qO "${config_script}" "${script_url}" 2>/dev/null || {
                    log_warn "下载配置向导失败，请手动配置"
                    return
                }
            else
                wget -qO "${config_script}" "${script_url}" 2>/dev/null || {
                    log_warn "下载配置向导失败，请手动配置"
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
        log_info "跳过配置向导，请参考上方示例手动配置"
    fi
}

# Main
main() {
    echo ""
    log_info "=========================================="
    log_info "Gitea MCP Server - Quick Installation"
    log_info "=========================================="
    echo ""

    check_auth
    get_latest_version
    check_node
    download_release
    install_package
    show_config
    ask_configure
}

main
