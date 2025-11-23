#!/bin/bash

# Gitea MCP Server - Local Deployment Script
# 一键部署脚本：构建并部署到 ~/.gitea-mcp/ 供 Claude Code 使用

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# 全局变量
DEPLOY_MODE=""
TARGET_DIR="$HOME/.gitea-mcp"

# 打印标题
print_header() {
    echo ""
    echo -e "${CYAN}=========================================="
    echo -e "  Gitea MCP Server - 本地部署工具"
    echo -e "==========================================${NC}"
    echo ""
}

# 主菜单
show_main_menu() {
    local choice
    while true; do
        print_header
        echo "请选择部署模式："
        echo ""

        PS3=$'\n'"请输入选项编号 (1-4): "
        select opt in "仅部署 MCP Server" "仅部署 CLI 工具 (keactl)" "部署全部 (MCP + CLI)" "退出"; do
            case $opt in
                "仅部署 MCP Server")
                    DEPLOY_MODE="mcp"
                    confirm_deployment
                    break 2
                    ;;
                "仅部署 CLI 工具 (keactl)")
                    DEPLOY_MODE="cli"
                    confirm_deployment
                    break 2
                    ;;
                "部署全部 (MCP + CLI)")
                    DEPLOY_MODE="all"
                    confirm_deployment
                    break 2
                    ;;
                "退出")
                    echo ""
                    log_info "已取消部署"
                    exit 0
                    ;;
                *)
                    log_error "无效的选项，请重新选择"
                    break
                    ;;
            esac
        done
    done
}

# 确认部署
confirm_deployment() {
    echo ""
    echo -e "${CYAN}----------------------------------------${NC}"
    case $DEPLOY_MODE in
        "mcp")
            echo "📦 部署模式: 仅 MCP Server"
            echo "📂 目标目录: $TARGET_DIR"
            echo "📄 部署文件: dist/index.js"
            ;;
        "cli")
            echo "📦 部署模式: 仅 CLI 工具"
            echo "📂 目标目录: $TARGET_DIR"
            echo "📄 部署文件: dist/cli/index.js"
            ;;
        "all")
            echo "📦 部署模式: 全部 (MCP + CLI)"
            echo "📂 目标目录: $TARGET_DIR"
            echo "📄 部署文件: dist/index.js, dist/cli/index.js"
            ;;
    esac
    echo -e "${CYAN}----------------------------------------${NC}"
    echo ""

    PS3=$'\n'"请选择操作 (1-3): "
    select action in "确认部署" "返回上一步" "退出"; do
        case $action in
            "确认部署")
                perform_deployment
                break
                ;;
            "返回上一步")
                show_main_menu
                break
                ;;
            "退出")
                echo ""
                log_info "已取消部署"
                exit 0
                ;;
            *)
                log_error "无效的选项，请重新选择"
                ;;
        esac
    done
}

# 执行构建
perform_build() {
    log_step "构建项目..."
    if ! npm run build; then
        log_error "构建失败！"
        exit 1
    fi
    log_success "构建完成"
}

# 部署 MCP Server
deploy_mcp() {
    log_step "部署 MCP Server 到 $TARGET_DIR..."

    # 清理旧的 MCP 文件
    rm -f "$TARGET_DIR/dist/index.js" "$TARGET_DIR/dist/index.js.map" 2>/dev/null || true

    # 创建目录
    mkdir -p "$TARGET_DIR/dist"

    # 复制 MCP 文件
    cp dist/index.js "$TARGET_DIR/dist/"
    cp dist/index.js.map "$TARGET_DIR/dist/" 2>/dev/null || true

    log_success "MCP Server 部署完成"
}

# 部署 CLI 工具
deploy_cli() {
    log_step "部署 CLI 工具到 $TARGET_DIR..."

    # 清理旧的 CLI 文件
    rm -rf "$TARGET_DIR/dist/cli" 2>/dev/null || true

    # 创建目录
    mkdir -p "$TARGET_DIR/dist/cli"

    # 复制 CLI 文件
    cp -r dist/cli/* "$TARGET_DIR/dist/cli/"

    log_success "CLI 工具部署完成"
}

# 部署公共文件
deploy_common() {
    log_step "部署公共文件..."

    # 复制 package.json 和文档
    cp package.json "$TARGET_DIR/"
    cp README.md "$TARGET_DIR/" 2>/dev/null || true

    # 复制文档目录
    if [ -d "docs" ]; then
        rm -rf "$TARGET_DIR/docs" 2>/dev/null || true
        cp -r docs "$TARGET_DIR/" 2>/dev/null || true
    fi

    log_success "公共文件部署完成"
}

# 执行部署
perform_deployment() {
    echo ""
    echo -e "${CYAN}=========================================="
    echo -e "  开始部署"
    echo -e "==========================================${NC}"
    echo ""

    # Step 1: Build
    perform_build
    echo ""

    # Step 2: Deploy based on mode
    case $DEPLOY_MODE in
        "mcp")
            deploy_mcp
            deploy_common
            ;;
        "cli")
            deploy_cli
            deploy_common
            ;;
        "all")
            deploy_mcp
            deploy_cli
            deploy_common
            ;;
    esac
    echo ""

    # Step 3: Verify and show results
    show_deployment_result

    # 部署完成后的操作选择
    post_deployment_menu
}

# 显示部署结果
show_deployment_result() {
    log_step "验证部署..."

    VERSION=$(node -p "require('./package.json').version")

    echo ""
    echo -e "${CYAN}=========================================="
    echo -e "  部署成功完成！"
    echo -e "==========================================${NC}"
    echo ""
    echo "📦 版本: v${VERSION}"
    echo "📂 路径: $TARGET_DIR/"
    echo ""

    case $DEPLOY_MODE in
        "mcp")
            if [ -f "$TARGET_DIR/dist/index.js" ]; then
                SIZE=$(du -h "$TARGET_DIR/dist/index.js" | cut -f1)
                echo "✅ MCP Server: $TARGET_DIR/dist/index.js (${SIZE})"
                echo ""
                log_info "配置说明:"
                echo "  1. 编辑 Claude Code 配置文件: ~/.claude.json"
                echo "  2. 确认配置指向: \"args\": [\"$TARGET_DIR/dist/index.js\"]"
                echo "  3. 重启 Claude Code 即可使用"
            fi
            ;;
        "cli")
            if [ -f "$TARGET_DIR/dist/cli/index.js" ]; then
                SIZE=$(du -h "$TARGET_DIR/dist/cli/index.js" | cut -f1)
                echo "✅ CLI 工具: $TARGET_DIR/dist/cli/index.js (${SIZE})"
                echo ""
                log_info "使用说明:"
                echo "  可以通过以下方式使用 keactl:"
                echo "  1. 直接调用: node $TARGET_DIR/dist/cli/index.js"
                echo "  2. 创建别名: alias keactl='node $TARGET_DIR/dist/cli/index.js'"
                echo "  3. 全局安装: npm install -g ."
                echo ""
                log_info "快速开始:"
                echo "  keactl config init    # 初始化配置"
                echo "  keactl user current   # 查看当前用户"
                echo "  keactl --help         # 查看帮助"
            fi
            ;;
        "all")
            if [ -f "$TARGET_DIR/dist/index.js" ]; then
                SIZE_MCP=$(du -h "$TARGET_DIR/dist/index.js" | cut -f1)
                echo "✅ MCP Server: $TARGET_DIR/dist/index.js (${SIZE_MCP})"
            fi
            if [ -f "$TARGET_DIR/dist/cli/index.js" ]; then
                SIZE_CLI=$(du -h "$TARGET_DIR/dist/cli/index.js" | cut -f1)
                echo "✅ CLI 工具: $TARGET_DIR/dist/cli/index.js (${SIZE_CLI})"
            fi
            echo ""
            log_info "MCP Server 配置:"
            echo "  1. 编辑 ~/.claude.json"
            echo "  2. 确认: \"args\": [\"$TARGET_DIR/dist/index.js\"]"
            echo "  3. 重启 Claude Code"
            echo ""
            log_info "CLI 工具使用:"
            echo "  keactl config init    # 初始化配置"
            echo "  keactl --help         # 查看帮助"
            ;;
    esac
    echo ""
}

# 部署后菜单
post_deployment_menu() {
    PS3=$'\n'"请选择操作 (1-3): "
    select action in "再次部署" "查看文档" "退出"; do
        case $action in
            "再次部署")
                show_main_menu
                break
                ;;
            "查看文档")
                show_docs_menu
                break
                ;;
            "退出")
                echo ""
                log_success "感谢使用！"
                exit 0
                ;;
            *)
                log_error "无效的选项，请重新选择"
                ;;
        esac
    done
}

# 文档菜单
show_docs_menu() {
    echo ""
    echo -e "${CYAN}=========================================="
    echo -e "  文档和资源"
    echo -e "==========================================${NC}"
    echo ""

    PS3=$'\n'"请选择要查看的文档 (1-4): "
    select doc in "CLI 使用指南" "初始化文档" "上下文管理文档" "返回"; do
        case $doc in
            "CLI 使用指南")
                if [ -f "$TARGET_DIR/docs/cli-guide.md" ]; then
                    less "$TARGET_DIR/docs/cli-guide.md"
                else
                    log_warn "文档文件不存在: $TARGET_DIR/docs/cli-guide.md"
                fi
                show_docs_menu
                break
                ;;
            "初始化文档")
                if [ -f "$TARGET_DIR/docs/initialization.md" ]; then
                    less "$TARGET_DIR/docs/initialization.md"
                else
                    log_warn "文档文件不存在: $TARGET_DIR/docs/initialization.md"
                fi
                show_docs_menu
                break
                ;;
            "上下文管理文档")
                if [ -f "$TARGET_DIR/docs/context-management.md" ]; then
                    less "$TARGET_DIR/docs/context-management.md"
                else
                    log_warn "文档文件不存在: $TARGET_DIR/docs/context-management.md"
                fi
                show_docs_menu
                break
                ;;
            "返回")
                post_deployment_menu
                break
                ;;
            *)
                log_error "无效的选项，请重新选择"
                ;;
        esac
    done
}

# 检查依赖
check_dependencies() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi

    if [ ! -f "package.json" ]; then
        log_error "未找到 package.json，请在项目根目录下运行此脚本"
        exit 1
    fi
}

# 主函数
main() {
    # 检查依赖
    check_dependencies

    # 显示主菜单
    show_main_menu
}

# 运行主函数
main
