#!/bin/bash

# Gitea MCP Server - One-Click Installation Script
# This script automates the installation and setup process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        log_info "Visit: https://nodejs.org/"
        exit 1
    fi

    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version must be 18 or higher. Current: $(node -v)"
        exit 1
    fi
    log_info "Node.js version: $(node -v) ✓"

    # Check pnpm
    if ! command_exists pnpm; then
        log_warn "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi
    log_info "pnpm version: $(pnpm -v) ✓"

    # Check git
    if ! command_exists git; then
        log_error "Git is not installed. Please install Git first."
        exit 1
    fi
    log_info "Git version: $(git --version) ✓"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    pnpm install
    log_info "Dependencies installed ✓"
}

# Build project
build_project() {
    log_info "Building project..."
    pnpm build
    log_info "Build completed ✓"
}

# Get absolute path
get_absolute_path() {
    echo "$(cd "$(dirname "$0")" && pwd)"
}

# Display configuration instructions
show_config_instructions() {
    local project_path=$(get_absolute_path)

    echo ""
    log_info "=========================================="
    log_info "Installation completed successfully!"
    log_info "=========================================="
    echo ""
    log_info "Next steps:"
    echo ""
    echo "1. Configure your MCP client with the following path:"
    echo ""
    echo "   ${GREEN}${project_path}/dist/index.js${NC}"
    echo ""
    echo "2. Choose configuration method:"
    echo ""
    echo "   Option A: Use initialization wizard (Recommended)"
    echo "   - Run: ${YELLOW}gitea_mcp_init${NC} in your MCP client"
    echo ""
    echo "   Option B: Manual configuration"
    echo "   - Set environment variables:"
    echo "     ${YELLOW}GITEA_BASE_URL${NC}=https://your-gitea-server.com"
    echo "     ${YELLOW}GITEA_API_TOKEN${NC}=your_token_here"
    echo ""
    echo "3. Configuration examples:"
    echo ""
    echo "   Claude Desktop (~/.../Claude/claude_desktop_config.json):"
    echo '   {'
    echo '     "mcpServers": {'
    echo '       "gitea-service": {'
    echo '         "command": "node",'
    echo '         "args": ["'${project_path}'/dist/index.js"],'
    echo '         "env": {'
    echo '           "GITEA_BASE_URL": "https://gitea.ktyun.cc",'
    echo '           "GITEA_API_TOKEN": "your_token_here"'
    echo '         }'
    echo '       }'
    echo '     }'
    echo '   }'
    echo ""
    echo "   VSCode Cline (.vscode/settings.json):"
    echo '   {'
    echo '     "cline.mcpServers": {'
    echo '       "gitea-service": {'
    echo '         "command": "node",'
    echo '         "args": ["'${project_path}'/dist/index.js"],'
    echo '         "env": {'
    echo '           "GITEA_BASE_URL": "https://gitea.ktyun.cc",'
    echo '           "GITEA_API_TOKEN": "your_token_here"'
    echo '         }'
    echo '       }'
    echo '     }'
    echo '   }'
    echo ""
    log_info "For detailed documentation, see: ${project_path}/README.md"
    log_info "For initialization guide, see: ${project_path}/docs/initialization.md"
    echo ""
}

# Main installation process
main() {
    echo ""
    log_info "=========================================="
    log_info "Gitea MCP Server - Installation"
    log_info "=========================================="
    echo ""

    # Check prerequisites
    check_prerequisites

    # Install dependencies
    install_dependencies

    # Build project
    build_project

    # Show configuration instructions
    show_config_instructions
}

# Run main function
main
