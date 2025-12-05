# MCP 客户端配置指南

本文档提供 Gitea MCP Tool 在各种 MCP 客户端中的详细配置说明。

## 目录

- [环境变量](#环境变量)
- [Claude Desktop](#claude-desktop)
- [Claude CLI](#claude-cli)
- [OpenCode](#opencode)
- [Cline (VS Code)](#cline-vs-code)
- [Cursor](#cursor)
- [Continue](#continue)
- [通用 .mcp.json](#通用-mcpjson)
- [故障排除](#故障排除)

---

## 环境变量

所有客户端配置都支持以下环境变量：

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `GITEA_BASE_URL` | 是 | Gitea 服务器地址，如 `https://gitea.example.com` |
| `GITEA_API_TOKEN` | 是 | Gitea API 访问令牌 |
| `GITEA_DEFAULT_OWNER` | 否 | 默认仓库所有者（用户名或组织名） |
| `GITEA_DEFAULT_REPO` | 否 | 默认仓库名称 |

### 获取 API Token

1. 登录 Gitea 服务器
2. 进入 **设置** → **应用**
3. 在 **管理访问令牌** 中生成新令牌
4. 选择需要的权限范围（建议：repo, user, admin:org）
5. 复制生成的令牌

---

## Claude Desktop

### macOS

配置文件位置：`~/Library/Application Support/Claude/claude_desktop_config.json`

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

### Windows

配置文件位置：`%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "command": "gitea-mcp.cmd",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

> **注意**：Windows 下需要使用 `gitea-mcp.cmd` 而非 `gitea-mcp`

### 配置完成后

重启 Claude Desktop 应用以加载新配置。

---

## Claude CLI

配置文件位置：`~/.claude.json`

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

### 使用项目级配置

也可以在项目根目录创建 `.mcp.json` 文件（见[通用 .mcp.json](#通用-mcpjson)章节）。

---

## OpenCode

### 全局配置

配置文件位置：`~/.config/opencode/config.json`

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

### 项目级配置

在项目根目录创建 `opencode.json`：

```json
{
  "mcp": {
    "gitea-mcp-tool": {
      "type": "local",
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here",
        "GITEA_DEFAULT_OWNER": "your-org",
        "GITEA_DEFAULT_REPO": "your-repo"
      }
    }
  }
}
```

---

## Cline (VS Code)

### 配置步骤

1. 打开 VS Code
2. 安装 Cline 扩展
3. 打开 Cline 设置（Command Palette → "Cline: Open Settings"）
4. 在 MCP Servers 部分添加配置

### 配置文件

Cline 配置位置：`~/.config/cline/mcp_settings.json`（或 VS Code 设置）

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "command": "gitea-mcp",
      "args": [],
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### VS Code settings.json 方式

```json
{
  "cline.mcpServers": {
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

---

## Cursor

### 配置文件

Cursor MCP 配置位置：`~/.cursor/mcp.json`

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

### 项目级配置

在项目根目录创建 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here",
        "GITEA_DEFAULT_OWNER": "your-org",
        "GITEA_DEFAULT_REPO": "your-repo"
      }
    }
  }
}
```

---

## Continue

### VS Code 配置

Continue 配置位置：`~/.continue/config.json`

```json
{
  "mcpServers": [
    {
      "name": "gitea-mcp-tool",
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  ]
}
```

### JetBrains IDE 配置

配置位置：`~/.continue/config.json`（与 VS Code 相同）

---

## 通用 .mcp.json

在项目根目录创建 `.mcp.json` 文件，支持大多数 MCP 客户端：

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "type": "stdio",
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://gitea.example.com",
        "GITEA_DEFAULT_OWNER": "your-org",
        "GITEA_DEFAULT_REPO": "your-repo"
      }
    }
  }
}
```

### 安全提示

> **重要**：不要将 `GITEA_API_TOKEN` 直接写入 `.mcp.json` 并提交到版本控制。
>
> 推荐做法：
> 1. 将 token 设置为系统环境变量
> 2. 在 `.mcp.json` 中省略 token，由环境变量提供
> 3. 将 `.mcp.json` 添加到 `.gitignore`

### 使用环境变量

在 shell 配置文件（如 `~/.bashrc`、`~/.zshrc`）中添加：

```bash
export GITEA_API_TOKEN="your_token_here"
```

---

## 故障排除

### 常见问题

#### 1. "command not found: gitea-mcp"

**原因**：gitea-mcp-tool 未正确安装或未在 PATH 中

**解决方案**：
```bash
# 确认已全局安装
npm install -g gitea-mcp-tool

# 验证安装
which gitea-mcp
gitea-mcp --version
```

#### 2. "Authentication failed"

**原因**：API Token 无效或权限不足

**解决方案**：
1. 检查 token 是否正确复制（无多余空格）
2. 确认 token 未过期
3. 验证 token 有足够权限

#### 3. "Connection refused"

**原因**：GITEA_BASE_URL 配置错误

**解决方案**：
1. 确认 URL 格式正确（包含 https://）
2. 确认 Gitea 服务器可访问
3. 检查是否需要 VPN 或代理

#### 4. Windows 下无法启动

**原因**：命令扩展名问题

**解决方案**：
- 使用 `gitea-mcp.cmd` 而非 `gitea-mcp`
- 或使用完整路径：`C:\Users\<user>\AppData\Roaming\npm\gitea-mcp.cmd`

### 调试模式

启用详细日志：

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here",
        "DEBUG": "gitea-mcp:*"
      }
    }
  }
}
```

### 获取帮助

- [提交 Issue](https://github.com/SupenBysz/gitea-mcp-tool/issues)
- [查看 Wiki](https://github.com/SupenBysz/gitea-mcp-tool/wiki)
