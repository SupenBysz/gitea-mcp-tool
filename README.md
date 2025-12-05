# Gitea MCP Tool

Gitea API 的 MCP (Model Context Protocol) 服务器，让 AI 助手能够与 Gitea 进行交互。

[![npm version](https://img.shields.io/npm/v/gitea-mcp-tool.svg)](https://www.npmjs.com/package/gitea-mcp-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-SupenBysz%2Fgitea--mcp--tool-blue?logo=github)](https://github.com/SupenBysz/gitea-mcp-tool)

## v2.0 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Gitea MCP Tool v2.0                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐          ┌─────────────────────────┐  │
│  │   MCP Server    │          │      keactl CLI         │  │
│  │  (Lite Mode)    │          │    (Full Features)      │  │
│  ├─────────────────┤          ├─────────────────────────┤  │
│  │ ~22 智能工具    │          │ 200+ 命令               │  │
│  │ • 智能分析      │          │ • 完整 CRUD 操作        │  │
│  │ • 内容生成      │          │ • Issue/PR/Repo 管理    │  │
│  │ • 工作流管理    │          │ • Wiki/Release/Branch   │  │
│  │ • 规范检查      │          │ • CI/CD 配置            │  │
│  └────────┬────────┘          └────────────┬────────────┘  │
│           │                                │               │
│           └────────────┬───────────────────┘               │
│                        ▼                                   │
│              ┌─────────────────┐                           │
│              │   Gitea API     │                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## 特性

- **MCP 智能工具** - ~22 个智能分析、内容生成、工作流管理工具
- **keactl CLI** - 200+ 命令，完整 CRUD 操作（Issue/PR/Repo/Wiki/Release）
- **低 Context 消耗** - MCP Lite 模式优化，减少 90% token 使用
- **多客户端支持** - Claude Desktop/CLI、OpenCode、Codex、Cline、Cursor
- **8 个交互式 Prompts** - 引导式操作模板

## 快速安装

```bash
# npm 安装（推荐）
npm install -g gitea-mcp-tool

# 或使用安装脚本
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

## 配置

### 1. 配置 MCP 客户端

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

**Claude CLI** (`~/.claude.json`):

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "type": "stdio",
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

**OpenCode** (`~/.config/opencode/config.json`):

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "type": "stdio",
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

**通用 MCP 配置** (`.mcp.json` 放在项目根目录):

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "type": "stdio",
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_DEFAULT_OWNER": "Kysion",
        "GITEA_DEFAULT_REPO": "entai-gitea-mcp"
      }
    }
  }
}
```

> 在运行前，请在环境变量中提供 `GITEA_API_TOKEN`，否则服务器会因缺少认证而启动失败。

### 2. 获取 API Token

1. 登录 Gitea → 设置 → 应用
2. 生成新令牌
3. 复制到配置文件

### 3. 重启客户端

## MCP + CLI 混合使用

v2.0 采用 **MCP 智能工具 + keactl CLI** 混合模式：

| 操作类型 | 推荐方式 | 示例 |
|---------|---------|------|
| 智能分析 | MCP 工具 | `gitea_workflow_infer_labels`、`gitea_compliance_check_all` |
| 内容生成 | MCP 工具 | `gitea_issue_create`、`gitea_pr_create` |
| CRUD 操作 | keactl CLI | `keactl issue list`、`keactl repo get` |
| 批量操作 | keactl CLI | `keactl issue close 1,2,3` |

### MCP 智能工具示例

```typescript
// 智能标签推断
gitea_workflow_infer_labels({ issue_number: 42, auto_apply: true })

// 规范检查
gitea_compliance_check_all()

// 生成工作流报告
gitea_workflow_generate_report({ time_range: "week" })

// AI 辅助创建 Issue
gitea_issue_create({ title: "Bug: 登录失败", body: "详细描述..." })
```

### keactl CLI 示例

```bash
# 仓库操作
keactl repo list
keactl repo get

# Issue 操作
keactl issue list --state open
keactl issue get 42
keactl issue create --title "Bug" --body "描述"
keactl issue close 42

# PR 操作
keactl pr list
keactl pr create --title "feat: 新功能" --head feature --base main
keactl pr merge 1

# Wiki 操作
keactl wiki list
keactl wiki get "Home"
keactl wiki create --title "Guide" --content "# 指南"

# Release 操作
keactl release list
keactl release create --tag v1.0.0

# Branch 操作
keactl branch list
keactl branch create feature/new

# CI/CD 配置
keactl cicd init
keactl cicd status
keactl cicd validate
```

## MCP 工具清单

### 基础设施 (5 个)

| 工具 | 说明 |
|------|------|
| `gitea_init` | 初始化项目配置 |
| `gitea_mcp_upgrade` | 升级 MCP 工具 |
| `gitea_context_get` | 获取当前上下文 |
| `gitea_context_set` | 设置默认上下文 |
| `gitea_user_current` | 获取当前用户 |

### 智能内容生成 (2 个)

| 工具 | 说明 |
|------|------|
| `gitea_issue_create` | AI 辅助创建 Issue |
| `gitea_pr_create` | AI 辅助创建 PR |

### 工作流智能分析 (10 个)

| 工具 | 说明 |
|------|------|
| `gitea_workflow_init` | 初始化工作流配置 |
| `gitea_workflow_load_config` | 加载工作流配置 |
| `gitea_workflow_sync_labels` | 同步标签系统 |
| `gitea_workflow_sync_board` | 同步项目看板 |
| `gitea_workflow_check_issues` | 检查 Issue 工作流 |
| `gitea_workflow_infer_labels` | 智能标签推断 |
| `gitea_workflow_check_blocked` | 检测阻塞 Issue |
| `gitea_workflow_escalate_priority` | 优先级自动升级 |
| `gitea_workflow_sync_status` | 状态双向同步 |
| `gitea_workflow_generate_report` | 生成工作流报告 |

### 规范检查 (5 个)

| 工具 | 说明 |
|------|------|
| `gitea_compliance_init` | 初始化规范配置 |
| `gitea_compliance_check_branch` | 检查分支命名 |
| `gitea_compliance_check_commit` | 检查提交信息 |
| `gitea_compliance_check_pr` | 检查 PR 规范 |
| `gitea_compliance_check_all` | 全面规范检查 |

## 文档

### 本地文档

- [多客户端配置指南](./docs/configuration.md) - Claude Desktop/CLI、OpenCode、Cline、Cursor、Continue 配置
- [MCP + CLI 混合使用指南](./docs/hybrid-usage.md)
- [v1.x → v2.0 迁移指南](./docs/migration.md)
- [更新日志](./CHANGELOG.md)

### Wiki 文档

详细文档请参阅 [Wiki](https://github.com/SupenBysz/gitea-mcp-tool/wiki):

- [安装指南](https://github.com/SupenBysz/gitea-mcp-tool/wiki/Installation)
- [MCP 工具列表](https://github.com/SupenBysz/gitea-mcp-tool/wiki/Tools)
- [keactl CLI 指南](https://github.com/SupenBysz/gitea-mcp-tool/wiki/CLI)

## 版本

**当前版本**: v2.0.0-beta | **MCP 工具数**: ~22 | **CLI 命令数**: 200+

## 许可证

MIT License

## 问题反馈

[提交 Issue](https://github.com/SupenBysz/gitea-mcp-tool/issues)
