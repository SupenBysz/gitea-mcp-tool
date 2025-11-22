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

# Get latest release version
get_latest_version() {
    log_info "Fetching latest release version..."

    # Try Gitea API
    local api_url="${GITEA_URL}/api/v1/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"

    if command_exists curl; then
        VERSION=$(curl -s "${api_url}" | grep -o '"tag_name":"[^"]*"' | cut -d'"' -f4)
    elif command_exists wget; then
        VERSION=$(wget -qO- "${api_url}" | grep -o '"tag_name":"[^"]*"' | cut -d'"' -f4)
    else
        log_error "Neither curl nor wget is available"
        exit 1
    fi

    if [ -z "$VERSION" ]; then
        log_warn "Could not fetch latest version from API, using default: v0.8.1"
        VERSION="v0.8.1"
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

    if command_exists curl; then
        curl -L -o "${temp_file}" "${download_url}" || {
            log_error "Download failed"
            log_info "Please check: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/releases"
            exit 1
        }
    elif command_exists wget; then
        wget -O "${temp_file}" "${download_url}" || {
            log_error "Download failed"
            log_info "Please check: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/releases"
            exit 1
        }
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
    echo "  1. Configure your MCP client with the path above"
    echo "  2. Set GITEA_BASE_URL and GITEA_API_TOKEN"
    echo "  3. Restart your MCP client"
    echo "  4. Use gitea_mcp_init tool for interactive setup"
    echo ""
    log_info "Documentation: ${INSTALL_DIR}/README.md"
    log_info "Support: ${GITEA_URL}/${REPO_OWNER}/${REPO_NAME}/issues"
    echo ""
}

# Main
main() {
    echo ""
    log_info "=========================================="
    log_info "Gitea MCP Server - Quick Installation"
    log_info "=========================================="
    echo ""

    get_latest_version
    check_node
    download_release
    install_package
    show_config
}

main
