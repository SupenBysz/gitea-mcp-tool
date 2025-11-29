# Gitea MCP Tool

Gitea API 的 MCP (Model Context Protocol) 服务器，让 AI 助手能够与 Gitea 进行交互。

[![npm version](https://img.shields.io/npm/v/gitea-mcp-tool.svg)](https://www.npmjs.com/package/gitea-mcp-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-SupenBysz%2Fgitea--mcp--tool-blue?logo=github)](https://github.com/SupenBysz/gitea-mcp-tool)

## 特性

- **203 个工具** - 覆盖 99% Gitea API + CI/CD 配置
- **12 个交互式 Prompts** - 引导式操作模板
- **多客户端支持** - Claude Desktop、Claude CLI、Cline、Cursor、Windsurf
- **CLI 工具** - `keactl` 命令行工具

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

**通用 (.mcp.json，适用于 Codex/LM Studio 等遵循 MCP 的客户端)** (`.mcp.json` 放在项目根目录):

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

> 在运行前，请在环境变量中提供 `GITEA_API_TOKEN`（或直接在 `.mcp.json` 中填写），否则服务器会因缺少认证而启动失败。

### 2. 获取 API Token

1. 登录 Gitea → 设置 → 应用
2. 生成新令牌
3. 复制到配置文件

### 3. 重启客户端

## 基本使用

```typescript
// 设置上下文
gitea_context_set({ owner: "Kysion", repo: "my-project" })

// Issue 操作
gitea_issue_create({ title: "Bug: 登录失败", body: "详细描述..." })
gitea_issue_list({ state: "open" })

// PR 操作
gitea_pr_create({ title: "feat: 新功能", head: "feature", base: "main" })
gitea_pr_merge({ index: 1, merge_method: "squash" })

// Wiki 操作
gitea_wiki_create({ title: "Guide", content: "# 指南\n..." })
```

## CLI 工具

```bash
# 配置
keactl init                    # 交互式初始化
keactl config init             # 初始化项目配置

# 仓库操作
keactl repo list
keactl issue list --state open
keactl issue create --title "Bug" --body "描述"

# CI/CD 配置
keactl cicd init               # 初始化 CI/CD 配置
keactl cicd templates          # 列出可用模板
keactl cicd status             # 查看配置状态
keactl cicd validate           # 验证配置
```

## 文档

详细文档请参阅 [Wiki](https://github.com/SupenBysz/gitea-mcp-tool/wiki):

- [安装指南](https://github.com/SupenBysz/gitea-mcp-tool/wiki/Installation)
- [配置说明](https://github.com/SupenBysz/gitea-mcp-tool/wiki/Configuration)
- [工具列表](https://github.com/SupenBysz/gitea-mcp-tool/wiki/Tools)
- [Prompts 使用](https://github.com/SupenBysz/gitea-mcp-tool/wiki/Prompts)
- [CLI 指南](https://github.com/SupenBysz/gitea-mcp-tool/wiki/CLI)
- [API 参考](https://github.com/SupenBysz/gitea-mcp-tool/wiki/API-Reference)
- [更新日志](https://github.com/SupenBysz/gitea-mcp-tool/wiki/Changelog)

## 版本

**当前版本**: v1.7.4 | **工具数**: 203 | **API 覆盖**: 99%

## 许可证

MIT License

## 问题反馈

[提交 Issue](https://github.com/SupenBysz/gitea-mcp-tool/issues)
