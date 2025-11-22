# Gitea Service MCP 配置指南

本文档详细说明 Gitea Service MCP Server 的所有配置选项、认证方式、以及各种 MCP 客户端的配置示例。

## 📋 目录

- [配置选项](#配置选项)
- [认证配置](#认证配置)
- [客户端配置示例](#客户端配置示例)
- [上下文配置](#上下文配置)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)

## 配置选项

### 必填配置

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `GITEA_BASE_URL` | Gitea 服务器地址 | `http://10.16.72.101:3008` |

### 认证配置（二选一）

**方式 1: API Token（推荐）**

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `GITEA_API_TOKEN` | Gitea API 令牌 | `abc123...` |

**方式 2: Username + Password**

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `GITEA_USERNAME` | Gitea 用户名 | `ai-orchestrator` |
| `GITEA_PASSWORD` | Gitea 密码 | `your_password` |

### 可选配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `GITEA_DEFAULT_OWNER` | 默认 owner（用户名或组织） | - | `Kysion` |
| `GITEA_DEFAULT_REPO` | 默认仓库名 | - | `KysionAiStack` |
| `LOG_LEVEL` | 日志级别 | `info` | `debug`, `info`, `warn`, `error` |
| `GITEA_TIMEOUT` | API 请求超时时间（毫秒） | `30000` | `60000` |
| `NODE_ENV` | 运行环境 | `development` | `production` |

## 认证配置

### 方式 1: API Token（推荐）

API Token 认证更安全，支持细粒度权限控制，推荐在生产环境使用。

#### 1. 生成 API Token

1. 登录 Gitea
2. 点击右上角头像 → **设置**
3. 进入 **应用** 标签
4. 在 **管理访问令牌** 部分，点击 **生成新令牌**
5. 填写令牌名称（如 `mcp-server`）
6. 选择权限（建议选择所需的最小权限）
7. 点击 **生成令牌**
8. **复制令牌**（只显示一次，请妥善保存）

#### 2. 配置 Token

```bash
GITEA_BASE_URL=http://10.16.72.101:3008
GITEA_API_TOKEN=your_generated_token_here
```

### 方式 2: Username + Password

用户名密码认证简单直接，适合开发测试环境。

```bash
GITEA_BASE_URL=http://10.16.72.101:3008
GITEA_USERNAME=your_username
GITEA_PASSWORD=your_password
```

⚠️ **安全提示**：
- 生产环境请使用 API Token
- 不要将密码提交到版本控制系统
- 建议使用环境变量或密钥管理工具

## 客户端配置示例

### Claude Desktop

**配置文件位置**: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### 完整配置示例

```json
{
  "mcpServers": {
    "gitea-service": {
      "command": "node",
      "args": [
        "/path/to/KysionAiStack/packages/gitea-service-mcp/dist/index.js"
      ],
      "env": {
        "GITEA_BASE_URL": "http://10.16.72.101:3008",
        "GITEA_API_TOKEN": "your_token_here",
        "GITEA_DEFAULT_OWNER": "Kysion",
        "GITEA_DEFAULT_REPO": "KysionAiStack",
        "LOG_LEVEL": "info",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### 最小配置示例

```json
{
  "mcpServers": {
    "gitea-service": {
      "command": "node",
      "args": [
        "/path/to/KysionAiStack/packages/gitea-service-mcp/dist/index.js"
      ],
      "env": {
        "GITEA_BASE_URL": "http://10.16.72.101:3008",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Cline (VSCode Extension)

**配置文件位置**:
- 项目级：`.vscode/settings.json`
- 用户级：`~/Library/Application Support/Code/User/settings.json`

#### 项目级配置（推荐）

```json
{
  "cline.mcpServers": {
    "gitea-service": {
      "command": "node",
      "args": [
        "${workspaceFolder}/packages/gitea-service-mcp/dist/index.js"
      ],
      "env": {
        "GITEA_BASE_URL": "http://10.16.72.101:3008",
        "GITEA_API_TOKEN": "${env:GITEA_API_TOKEN}",
        "GITEA_DEFAULT_OWNER": "Kysion",
        "GITEA_DEFAULT_REPO": "KysionAiStack"
      }
    }
  }
}
```

#### 用户级配置

```json
{
  "cline.mcpServers": {
    "gitea-service": {
      "command": "node",
      "args": [
        "/absolute/path/to/gitea-service-mcp/dist/index.js"
      ],
      "env": {
        "GITEA_BASE_URL": "http://10.16.72.101:3008",
        "GITEA_USERNAME": "your_username",
        "GITEA_PASSWORD": "your_password"
      }
    }
  }
}
```

### Continue (VSCode/JetBrains)

**配置文件位置**: `~/.continue/config.json`

```json
{
  "mcpServers": [
    {
      "name": "gitea-service",
      "command": "node",
      "args": [
        "/path/to/KysionAiStack/packages/gitea-service-mcp/dist/index.js"
      ],
      "env": {
        "GITEA_BASE_URL": "http://10.16.72.101:3008",
        "GITEA_API_TOKEN": "your_token_here",
        "GITEA_DEFAULT_OWNER": "Kysion",
        "GITEA_DEFAULT_REPO": "KysionAiStack",
        "LOG_LEVEL": "info"
      }
    }
  ]
}
```

### 其他 MCP 客户端

大多数 MCP 客户端都支持类似的配置格式，核心要素：

```json
{
  "command": "node",
  "args": ["<path-to-dist/index.js>"],
  "env": {
    "GITEA_BASE_URL": "<gitea-url>",
    "GITEA_API_TOKEN": "<your-token>"
  }
}
```

## 上下文配置

### 什么是上下文？

上下文（Context）是指默认的 `owner` 和 `repo`，设置后可以简化后续操作，避免每次都指定。

### 配置方式

#### 1. 环境变量配置（推荐）

在 MCP 客户端配置中设置：

```json
{
  "env": {
    "GITEA_DEFAULT_OWNER": "Kysion",
    "GITEA_DEFAULT_REPO": "KysionAiStack"
  }
}
```

#### 2. 运行时配置

使用 `gitea_context_set` 工具动态设置：

```typescript
// 设置 owner
gitea_context_set({ owner: "Kysion" })

// 设置 repo
gitea_context_set({ repo: "KysionAiStack" })

// 同时设置
gitea_context_set({
  owner: "Kysion",
  repo: "KysionAiStack"
})
```

### 上下文优先级

工具参数 > 运行时上下文 > 环境变量默认值

```typescript
// 假设上下文: owner=Kysion, repo=KysionAiStack

// 使用默认上下文
gitea_repo_get()
// → 等同于 gitea_repo_get(owner="Kysion", repo="KysionAiStack")

// 覆盖上下文
gitea_repo_get(owner="OtherOwner", repo="OtherRepo")
// → 使用参数指定的值
```

## 常见问题

### 1. 连接失败

**问题**: `Failed to connect to Gitea server`

**解决方案**:
- 检查 `GITEA_BASE_URL` 是否正确
- 确认 Gitea 服务器是否可访问
- 检查网络连接和防火墙设置

### 2. 认证失败

**问题**: `Gitea API Error: 401 Unauthorized`

**解决方案**:
- 检查 API Token 是否正确
- 确认 Token 是否过期
- 验证 Username/Password 是否正确
- 确保至少配置了一种认证方式

### 3. 环境变量未生效

**问题**: 配置的环境变量没有生效

**解决方案**:
- 检查 JSON 格式是否正确
- 确认配置文件路径是否正确
- 重启 MCP 客户端
- 检查是否有语法错误（逗号、引号等）

### 4. 找不到 dist/index.js

**问题**: `Cannot find module 'dist/index.js'`

**解决方案**:
- 运行 `pnpm build` 构建项目
- 检查路径是否为绝对路径
- 确认文件确实存在

### 5. 日志在哪里查看？

**日志输出位置**:
- Claude Desktop: 查看应用日志
- VSCode (Cline/Continue): 查看扩展输出面板
- 开发模式: 直接在控制台输出

设置 `LOG_LEVEL=debug` 可以看到详细日志。

## 最佳实践

### 1. 安全性

- ✅ 使用 API Token 而非密码
- ✅ 使用环境变量存储敏感信息
- ✅ 不要将配置文件提交到公开仓库
- ✅ 定期更换 API Token
- ✅ 为不同客户端使用不同的 Token

### 2. 性能

- ✅ 设置合理的超时时间（默认 30 秒）
- ✅ 生产环境使用 `NODE_ENV=production`
- ✅ 使用上下文减少参数传递

### 3. 开发

- ✅ 开发环境使用 `LOG_LEVEL=debug`
- ✅ 使用项目级配置（`.vscode/settings.json`）
- ✅ 使用 `pnpm dev` 进行本地开发

### 4. 上下文管理

- ✅ 为常用仓库设置默认上下文
- ✅ 多仓库项目使用运行时切换上下文
- ✅ 使用 `gitea_context_get` 确认当前上下文

## 配置模板

### 生产环境配置

```json
{
  "mcpServers": {
    "gitea-service": {
      "command": "node",
      "args": ["/path/to/gitea-service-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "http://10.16.72.101:3008",
        "GITEA_API_TOKEN": "${env:GITEA_API_TOKEN}",
        "GITEA_DEFAULT_OWNER": "Kysion",
        "GITEA_DEFAULT_REPO": "KysionAiStack",
        "LOG_LEVEL": "warn",
        "NODE_ENV": "production",
        "GITEA_TIMEOUT": "30000"
      }
    }
  }
}
```

### 开发环境配置

```json
{
  "mcpServers": {
    "gitea-service": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/gitea-service-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "http://10.16.72.101:3008",
        "GITEA_USERNAME": "dev-user",
        "GITEA_PASSWORD": "dev-password",
        "GITEA_DEFAULT_OWNER": "Kysion",
        "GITEA_DEFAULT_REPO": "KysionAiStack",
        "LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      }
    }
  }
}
```

## 获取帮助

如果遇到配置问题：

1. 查看 [主文档](../README.md)
2. 查看 [设计文档](../../../docs/modules/gitea-service-mcp/DESIGN.md)
3. 提交 [Issue](http://10.16.72.101:3008/Kysion/KysionAiStack/issues)

---

**更新时间**: 2025-01-07
**版本**: Phase 1
