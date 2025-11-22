# Gitea MCP 配置初始化系统

## 目录

- [概述](#概述)
- [核心功能](#核心功能)
- [快速开始](#快速开始)
- [配置文件](#配置文件)
- [工具详解](#工具详解)
- [最佳实践](#最佳实践)
- [故障排查](#故障排查)

## 概述

Gitea MCP 配置初始化系统提供了一套完整的交互式配置解决方案，让你能够快速、安全地配置 Gitea MCP Server。

### 设计目标

1. **简化配置流程** - 从手动编辑配置文件到交互式向导
2. **自动检测** - 智能识别 Git 仓库信息
3. **安全管理** - Token 的安全存储和复用
4. **灵活配置** - 三级配置系统满足不同场景
5. **多语言支持** - 中英文界面切换

## 核心功能

### 1. 交互式配置向导

`gitea_mcp_init` 提供 8 步交互式配置流程：

```
Gitea MCP Configuration Wizard

Step 1: Server Selection
  - Auto-detect from Git repository
  - Use existing global server
  - Add new server

Step 2: Project Information
  - Auto-detected from Git
  - Manual input

Step 3: Token Configuration
  - Create with username/password
  - Enter existing token
  - Use cached token
  - Use environment variable

Step 4: Token Save Method
  - Save to global config (reusable)
  - Save to local config (project-only)
  - Use environment variable (temporary)

Step 5: Default Context
  - Set as default for future operations

Step 6: Summary & Confirmation
  - Review all configurations

Step 7: Save Configuration
  - .gitea-mcp.json (public, committed)
  - .gitea-mcp.local.json (private, .gitignore)

Step 8: Complete
```

### 2. 多语言支持

#### 语言切换工具

```typescript
// 切换到中文
gitea_mcp_language_set({ locale: "zh-CN" })

// 切换到英文
gitea_mcp_language_set({ locale: "en" })

// 查看当前语言
gitea_mcp_language_get()
```

#### 支持的语言

| 语言代码 | 语言名称 | 状态 |
|---------|---------|------|
| `en` | English | 默认 |
| `zh-CN` | 简体中文 | 可用 |

### 3. 三级配置系统

#### 配置层级

```
1. Global Config (全局配置)
   位置: ~/.gitea-mcp/config.json
   用途: 多服务器管理、Token 缓存、最近项目

2. Project Config (项目配置)
   位置: .gitea-mcp.json
   用途: 项目团队共享配置
   提交: 应该提交到 Git

3. Local Config (本地配置)
   位置: .gitea-mcp.local.json
   用途: 个人私密配置（Token等）
   提交: 不应提交（自动添加到 .gitignore）
```

#### 配置优先级

```
Explicit Parameters (显式参数)
    ↓
Local Config (本地配置)
    ↓
Project Config (项目配置)
    ↓
Environment Variables (环境变量)
    ↓
Global Config (全局配置)
```

### 4. Git 自动检测

#### 支持的 Git URL 格式

```bash
# SSH 格式（标准）
git@gitea.ktyun.cc:Kysion/entai-gitea-mcp.git

# SSH 格式（自定义用户名）
gitea@gitea.ktyun.cc:Kysion/entai-gitea-mcp.git

# HTTPS 格式
https://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git

# HTTP 格式
http://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git
```

#### 检测信息

- Gitea 服务器 URL
- 仓库所有者 (owner)
- 仓库名称 (repo)
- 完整仓库路径

### 5. Token 管理

#### Token 创建方式

| 方式 | 说明 | 推荐场景 |
|-----|------|----------|
| **用户名密码** | 通过 Gitea API 自动创建 Token | 首次配置 |
| **手动输入** | 从 Gitea 设置页面复制已有 Token | 已有 Token |
| **使用缓存** | 复用全局配置中的 Token | 多项目配置 |
| **环境变量** | 从 `GITEA_API_TOKEN` 读取 | CI/CD 环境 |

#### Token 存储策略

| 策略 | 位置 | 安全性 | 复用性 |
|-----|------|--------|--------|
| **全局配置** | `~/.gitea-mcp/config.json` | 中等 | 高 |
| **本地配置** | `.gitea-mcp.local.json` | 较高 | 仅当前项目 |
| **环境变量** | 不持久化 | 高 | 临时 |

## 快速开始

### 方法一：完全自动化（推荐）

```bash
# 1. 进入你的 Git 仓库
cd /path/to/your/gitea/repo

# 2. 在 Claude Desktop 中运行
gitea_mcp_init
```

向导将自动：
- 检测 Git remote URL
- 解析服务器、owner、repo
- 引导完成所有配置

### 方法二：带参数运行

```typescript
// 非交互模式（适合自动化脚本）
gitea_mcp_init({
  interactive: false,
  autoDetect: true
})

// 强制重新配置（覆盖现有配置）
gitea_mcp_init({
  force: true
})
```

### 方法三：分步配置

```typescript
// 1. 先切换语言（可选）
gitea_mcp_language_set({ locale: "zh-CN" })

// 2. 运行配置向导
gitea_mcp_init()

// 3. 验证配置
gitea_context_get()
```

## 配置文件

### 全局配置

~/.gitea-mcp/config.json

```json
{
  "version": "1.0",
  "giteaServers": [
    {
      "id": "server-uuid-1",
      "name": "Kysion Gitea",
      "url": "https://gitea.ktyun.cc",
      "tokens": [
        {
          "id": "token-uuid-1",
          "name": "Main Token",
          "token": "encrypted-token-here",
          "username": "developer",
          "createdBy": "password",
          "isDefault": true,
          "createdAt": "2025-11-23T10:00:00Z",
          "lastUsed": "2025-11-23T10:00:00Z"
        }
      ],
      "isDefault": true,
      "createdAt": "2025-11-23T10:00:00Z",
      "lastUsed": "2025-11-23T10:00:00Z"
    }
  ],
  "recentProjects": [
    {
      "owner": "Kysion",
      "repo": "entai-gitea-mcp",
      "serverUrl": "https://gitea.ktyun.cc",
      "path": "/path/to/project",
      "lastAccessed": "2025-11-23T10:00:00Z"
    }
  ],
  "settings": {
    "language": "en",
    "theme": "auto"
  }
}
```

### 项目配置

.gitea-mcp.json

```json
{
  "version": "1.0",
  "gitea": {
    "url": "https://gitea.ktyun.cc",
    "serverRef": "server-uuid-1",
    "name": "Kysion Gitea"
  },
  "project": {
    "owner": "Kysion",
    "repo": "entai-gitea-mcp",
    "org": "Kysion"
  },
  "defaults": {
    "setAsDefaultContext": true
  }
}
```

### 本地配置

.gitea-mcp.local.json

```json
{
  "gitea": {
    "apiToken": "your-personal-token-here",
    "tokenRef": "token-uuid-1",
    "apiTokenEnv": "GITEA_API_TOKEN"
  },
  "overrides": {
    "owner": "MyPersonalAccount",
    "repo": "my-fork"
  }
}
```

## 工具详解

### gitea_mcp_init

#### 参数

```typescript
interface InitOptions {
  interactive?: boolean;    // 是否使用交互模式（默认: true）
  autoDetect?: boolean;     // 是否自动检测 Git 信息（默认: true）
  force?: boolean;          // 是否强制覆盖现有配置（默认: false）
}
```

#### 返回值

```typescript
interface InitResult {
  success: boolean;
  message: string;
  config?: {
    serverUrl: string;
    owner: string;
    repo: string;
    hasToken: boolean;
  };
  error?: string;
}
```

#### 使用示例

```typescript
// 基础使用
const result = await gitea_mcp_init();

// 非交互模式
const result = await gitea_mcp_init({
  interactive: false,
  autoDetect: true
});

// 强制重新配置
const result = await gitea_mcp_init({
  force: true
});
```

### gitea_mcp_language_set

#### 参数

```typescript
interface LanguageSetOptions {
  locale: 'en' | 'zh-CN';  // 语言代码
}
```

#### 返回值

```typescript
interface LanguageResult {
  success: boolean;
  message: string;
  currentLanguage?: string;
  error?: string;
}
```

#### 使用示例

```typescript
// 切换到中文
gitea_mcp_language_set({ locale: "zh-CN" })
// 返回: { success: true, message: "语言已更改为：简体中文", currentLanguage: "zh-CN" }

// 切换到英文
gitea_mcp_language_set({ locale: "en" })
// 返回: { success: true, message: "Language changed to: English", currentLanguage: "en" }
```

### gitea_mcp_language_get

#### 参数

无需参数。

#### 返回值

```typescript
interface LanguageInfo {
  success: boolean;
  message: string;
  currentLanguage: string;
  supportedLanguages: Array<{
    code: string;
    name: string;
  }>;
}
```

#### 使用示例

```typescript
gitea_mcp_language_get()
// 返回:
// {
//   success: true,
//   message: "Current language: English",
//   currentLanguage: "en",
//   supportedLanguages: [
//     { code: "en", name: "English" },
//     { code: "zh-CN", name: "简体中文 (Simplified Chinese)" }
//   ]
// }
```

## 最佳实践

### 1. 团队协作场景

```bash
# 项目管理员
1. 运行 gitea_mcp_init 创建项目配置
2. 提交 .gitea-mcp.json 到 Git
3. 确保 .gitea-mcp.local.json 在 .gitignore 中

# 团队成员
1. git clone 项目
2. 运行 gitea_mcp_init（会读取项目配置）
3. 仅需配置个人 Token
4. 本地配置 (.gitea-mcp.local.json) 不提交
```

### 2. 多项目管理

```bash
# 使用全局配置管理多个服务器和 Token
1. 首次配置时选择"保存到全局配置"
2. 后续项目可以复用已有 Token
3. 全局配置会记录最近访问的项目
```

### 3. CI/CD 集成

```bash
# 使用环境变量，不依赖配置文件
export GITEA_BASE_URL="https://gitea.ktyun.cc"
export GITEA_API_TOKEN="ci-token-here"
export GITEA_DEFAULT_OWNER="Kysion"
export GITEA_DEFAULT_REPO="entai-gitea-mcp"

# CI 脚本中直接使用 MCP 工具
gitea_issue_create(...)
```

### 4. 安全建议

**应该做的：**
- 使用 .gitea-mcp.local.json 存储个人 Token
- 确保 .local.json 在 .gitignore 中
- 定期更新和轮换 Token
- 使用最小权限原则创建 Token

**不应该做的：**
- 不要在 .gitea-mcp.json 中存储 Token
- 不要提交 .gitea-mcp.local.json 到 Git
- 不要在公共场所暴露配置文件
- 不要使用过期或不明来源的 Token

## 故障排查

### 问题 1: Git 检测失败

**症状**: "Failed to parse Git remote URL"

**解决方案**:
```bash
# 检查 Git remote 配置
git remote -v

# 确认 URL 格式正确
# 支持的格式: git@host:owner/repo.git, https://host/owner/repo.git

# 如果 remote 未配置
git remote add origin git@gitea.ktyun.cc:Kysion/entai-gitea-mcp.git
```

### 问题 2: Token 创建失败

**症状**: "Failed to create API token"

**解决方案**:
```bash
# 1. 检查用户名密码是否正确
# 2. 检查服务器 URL 是否可访问
# 3. 尝试手动创建 Token:
#    - 登录 Gitea
#    - 设置 → 应用 → 生成新令牌
#    - 复制 Token 并选择"手动输入"方式
```

### 问题 3: 配置文件权限问题

**症状**: "Failed to save config: EACCES"

**解决方案**:
```bash
# 检查目录权限
ls -la ~/.gitea-mcp/

# 修复权限
chmod 700 ~/.gitea-mcp/
chmod 600 ~/.gitea-mcp/config.json
```

### 问题 4: 语言切换不生效

**症状**: 界面语言没有变化

**解决方案**:
```typescript
// 1. 确认语言切换成功
const result = gitea_mcp_language_set({ locale: "zh-CN" });
console.log(result);

// 2. 检查当前语言
gitea_mcp_language_get();

// 3. 重新运行配置向导
gitea_mcp_init({ force: true });
```

### 问题 5: 多项目配置冲突

**症状**: 在不同项目间切换时配置混乱

**解决方案**:
```bash
# 确保每个项目都有独立的配置
cd project-a
gitea_mcp_init  # 创建 project-a 的配置

cd project-b
gitea_mcp_init  # 创建 project-b 的配置

# 使用项目配置优先级
# Local Config > Project Config > Global Config
```

## 技术实现

### 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Tools Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ gitea_mcp_   │  │ gitea_mcp_   │  │ gitea_mcp_   │ │
│  │ init         │  │ language_set │  │ language_get │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│               Configuration Management                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Global       │  │ Project      │  │ i18n         │ │
│  │ Config       │  │ Config       │  │ Manager      │ │
│  │ Manager      │  │ Manager      │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                  Utility Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Git          │  │ Token        │  │ Validation   │ │
│  │ Detector     │  │ Creator      │  │ Helper       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 核心模块

- **src/tools/init.ts** - 初始化向导主逻辑
- **src/tools/language.ts** - 语言切换工具
- **src/config/global.ts** - 全局配置管理
- **src/config/project.ts** - 项目配置管理
- **src/i18n/** - 国际化系统
- **src/utils/git-detector.ts** - Git 仓库检测

## 相关文档

- [主 README](../README.md)
- [上下文管理](./context-management.md)
- [动态 Token 管理](./dynamic-token.md)
- [Gitea API 文档](https://docs.gitea.com/api/1.21/)
- [MCP 协议规范](https://modelcontextprotocol.io/)

## 更新日志

### v0.8.1 (2025-11-23)

- 实现完整的初始化向导系统
- 添加多语言支持（中英文）
- 优化 Git URL 解析（支持灵活的 SSH 用户名）
- 完善三级配置系统
- 添加 Token 多种创建和存储方式

---

提示：如有问题或建议，请在 [Gitea Issues](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/issues) 中反馈。
