# Gitea MCP Tool

Gitea API 的 MCP (Model Context Protocol) 服务器，让 AI 助手能够与 Gitea 进行交互。

[![npm version](https://img.shields.io/npm/v/gitea-mcp-tool.svg)](https://www.npmjs.com/package/gitea-mcp-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 特性

- **199 个工具** - 覆盖 99% Gitea API
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
keactl config init

# 仓库操作
keactl repo list
keactl issue list --state open
keactl issue create --title "Bug" --body "描述"
```

## 文档

详细文档请参阅 [Wiki](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki):

- [安装指南](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki/Installation)
- [配置说明](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki/Configuration)
- [工具列表](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki/Tools)
- [Prompts 使用](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki/Prompts)
- [CLI 指南](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki/CLI)
- [API 参考](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki/API-Reference)
- [更新日志](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki/Changelog)

## 版本

**当前版本**: v1.7.0 | **工具数**: 199 | **API 覆盖**: 99%

## 许可证

MIT License

## 问题反馈

[提交 Issue](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/issues)
