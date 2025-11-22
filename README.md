# Gitea Service MCP Server

Gitea API 的 MCP（Model Context Protocol）协议适配器，让 AI 助手（Claude Desktop、Cline、Continue 等）能够直接操作 Gitea 仓库、Issue、Pull Request 等。

## ✨ 功能特性

### 🎯 当前版本: v0.5.0

提供 **44 个工具**，涵盖 Gitea 核心功能的完整操作：

- ✅ **上下文管理** (3个工具)
  - 设置默认 owner 和 repo，简化后续操作
  - 自动从环境变量加载默认上下文
  - 获取当前认证用户信息

- ✅ **仓库管理** (5个工具)
  - 创建、查询、列表、删除、搜索仓库
  - 支持私有仓库、自动初始化等高级选项

- ✅ **Issue 管理** (6个工具)
  - 创建、更新、评论、关闭 Issue
  - 支持标签、里程碑、指派人等功能
  - 列表查询和搜索

- ✅ **Pull Request 管理** (6个工具)
  - 创建、更新、合并、审查 PR
  - 支持多种合并策略（merge、rebase、squash）
  - PR 列表和详情查询

- ✅ **Project 看板管理** (7个工具)
  - 创建、更新、删除项目看板
  - 管理看板列（columns）
  - 支持看板状态管理

- ✅ **Milestone 里程碑管理** (5个工具)
  - 创建、查询、更新、删除里程碑
  - 支持截止日期设置
  - 查询里程碑统计信息

- ✅ **用户/组织管理** (4个工具)
  - 查询用户信息和组织
  - 列出组织成员
  - 用户组织关系管理

- ✅ **Wiki 管理** (8个工具) 🆕
  - 创建、查询、更新、删除 Wiki 页面
  - 查看页面修订历史
  - 获取特定版本的页面内容
  - 搜索 Wiki 页面

### 🔐 认证支持

- API Token 认证（推荐）
- Username + Password 认证

## 📦 安装

```bash
# 克隆仓库
git clone https://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git
cd entai-gitea-mcp

# 安装依赖
pnpm install

# 构建
pnpm build
```

## 🚀 快速开始

### 1. 配置环境变量

创建 `.env` 文件（或在 MCP 客户端配置中设置环境变量）：

```bash
# Gitea 服务器配置（必填）
GITEA_BASE_URL=https://gitea.ktyun.cc

# 认证配置（二选一）
# 方式 1: API Token（推荐）
GITEA_API_TOKEN=your_token_here

# 方式 2: Username + Password
# GITEA_USERNAME=your_username
# GITEA_PASSWORD=your_password

# 默认上下文（可选）
GITEA_DEFAULT_OWNER=Kysion
GITEA_DEFAULT_REPO=KysionAiStack

# 其他配置（可选）
LOG_LEVEL=info
GITEA_TIMEOUT=30000
```

### 2. 获取 API Token

1. 登录 Gitea
2. 进入 **设置 → 应用**
3. 点击 **生成新令牌**
4. 复制令牌并设置到 `GITEA_API_TOKEN`

### 3. 配置 MCP 客户端

#### Claude Desktop

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gitea-service": {
      "command": "node",
      "args": [
        "/path/to/KysionAiStack/packages/gitea-service-mcp/dist/index.js"
      ],
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token_here",
        "GITEA_DEFAULT_OWNER": "Kysion",
        "GITEA_DEFAULT_REPO": "entai-gitea-mcp"
      }
    }
  }
}
```

#### Cline (VSCode)

编辑 `.vscode/settings.json`:

```json
{
  "cline.mcpServers": {
    "gitea-service": {
      "command": "node",
      "args": [
        "/path/to/KysionAiStack/packages/gitea-service-mcp/dist/index.js"
      ],
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### Continue (VSCode/JetBrains)

编辑 `~/.continue/config.json`:

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
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  ]
}
```

### 4. 重启客户端

重启 Claude Desktop / VSCode，MCP Server 将自动启动。

## 🔧 可用工具

共提供 **36 个工具**，完整覆盖 Gitea 核心功能。

### 1️⃣ 上下文管理 (3个)

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_context_get` | 获取当前上下文 | - |
| `gitea_context_set` | 设置默认上下文 | `owner?`, `repo?` |
| `gitea_user_current` | 获取当前用户信息 | - |

### 2️⃣ 仓库管理 (5个)

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_repo_create` | 创建仓库 | `name`, `owner?`, `description?`, `private?`, `auto_init?` |
| `gitea_repo_get` | 获取仓库详情 | `owner?`, `repo?` |
| `gitea_repo_list` | 列出仓库 | `owner?`, `page?`, `limit?` |
| `gitea_repo_delete` | 删除仓库 | `owner?`, `repo?` |
| `gitea_repo_search` | 搜索仓库 | `q`, `sort?`, `order?`, `page?`, `limit?` |

### 3️⃣ Issue 管理 (6个)

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_issue_create` | 创建 Issue | `title`, `body?`, `owner?`, `repo?`, `assignees?`, `labels?`, `milestone?` |
| `gitea_issue_get` | 获取 Issue 详情 | `index`, `owner?`, `repo?` |
| `gitea_issue_list` | 列出 Issues | `owner?`, `repo?`, `state?`, `labels?`, `q?`, `page?`, `limit?` |
| `gitea_issue_update` | 更新 Issue | `index`, `title?`, `body?`, `state?`, `assignees?`, `milestone?` |
| `gitea_issue_comment` | 添加 Issue 评论 | `index`, `body`, `owner?`, `repo?` |
| `gitea_issue_close` | 关闭 Issue | `index`, `owner?`, `repo?` |

### 4️⃣ Pull Request 管理 (6个)

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_pr_create` | 创建 Pull Request | `title`, `head`, `base`, `body?`, `owner?`, `repo?`, `assignees?`, `labels?` |
| `gitea_pr_get` | 获取 PR 详情 | `index`, `owner?`, `repo?` |
| `gitea_pr_list` | 列出 Pull Requests | `owner?`, `repo?`, `state?`, `sort?`, `page?`, `limit?` |
| `gitea_pr_update` | 更新 Pull Request | `index`, `title?`, `body?`, `state?`, `assignees?`, `milestone?` |
| `gitea_pr_merge` | 合并 Pull Request | `index`, `merge_method?`, `merge_title?`, `merge_message?`, `delete_branch_after_merge?` |
| `gitea_pr_review` | 审查 Pull Request | `index`, `body`, `owner?`, `repo?` |

### 5️⃣ Project 看板管理 (7个)

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_project_create` | 创建项目看板 | `title`, `description?`, `owner?`, `repo?` |
| `gitea_project_get` | 获取项目详情 | `id`, `owner?`, `repo?` |
| `gitea_project_list` | 列出项目看板 | `owner?`, `repo?`, `state?`, `page?`, `limit?` |
| `gitea_project_update` | 更新项目看板 | `id`, `title?`, `description?`, `state?` |
| `gitea_project_delete` | 删除项目看板 | `id`, `owner?`, `repo?` |
| `gitea_project_columns` | 列出项目的列 | `id`, `owner?`, `repo?` |
| `gitea_project_column_create` | 创建项目列 | `id`, `title`, `owner?`, `repo?` |

### 6️⃣ Milestone 里程碑管理 (5个)

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_milestone_create` | 创建里程碑 | `title`, `description?`, `due_on?`, `owner?`, `repo?` |
| `gitea_milestone_list` | 列出里程碑 | `owner?`, `repo?`, `state?`, `page?`, `limit?` |
| `gitea_milestone_get` | 获取里程碑详情 | `id`, `owner?`, `repo?` |
| `gitea_milestone_update` | 更新里程碑 | `id`, `title?`, `description?`, `due_on?`, `state?` |
| `gitea_milestone_delete` | 删除里程碑 | `id`, `owner?`, `repo?` |

### 7️⃣ 用户/组织管理 (4个)

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_user_get` | 获取用户信息 | `username` |
| `gitea_user_orgs` | 列出用户的组织 | `username?`, `page?`, `limit?` |
| `gitea_org_get` | 获取组织信息 | `org` |
| `gitea_org_members` | 列出组织成员 | `org`, `page?`, `limit?` |

### 8️⃣ Wiki 管理 (8个) 🆕

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_wiki_list` | 列出所有 Wiki 页面 | `owner?`, `repo?`, `page?`, `limit?` |
| `gitea_wiki_get` | 获取 Wiki 页面内容 | `pageName`, `owner?`, `repo?` |
| `gitea_wiki_create` | 创建新 Wiki 页面 | `title`, `content`, `message?`, `owner?`, `repo?` |
| `gitea_wiki_update` | 更新 Wiki 页面 | `pageName`, `title?`, `content?`, `message?`, `owner?`, `repo?` |
| `gitea_wiki_delete` | 删除 Wiki 页面 | `pageName`, `owner?`, `repo?` |
| `gitea_wiki_revisions` | 获取页面修订历史 | `pageName`, `page?`, `limit?`, `owner?`, `repo?` |
| `gitea_wiki_get_revision` | 获取特定版本内容 | `pageName`, `revision`, `owner?`, `repo?` |
| `gitea_wiki_search` | 搜索 Wiki 页面 | `query`, `limit?`, `owner?`, `repo?` |

> **💡 提示**: 标记为 `?` 的参数为可选参数。未提供 `owner` 和 `repo` 时，将使用默认上下文。

## 📖 使用示例

### 1. 上下文管理

```typescript
// 设置默认上下文
gitea_context_set({
  owner: "Kysion",
  repo: "KysionAiStack"
})

// 获取当前上下文
gitea_context_get()

// 获取当前用户信息
gitea_user_current()
```

### 2. 创建和管理 Issue

```typescript
// 创建 Issue
gitea_issue_create({
  title: "修复登录问题",
  body: "用户无法登录系统，需要修复验证逻辑",
  labels: [1, 2],  // 标签 ID
  assignees: ["developer1"]
})

// 列出所有 open 状态的 Issues
gitea_issue_list({
  state: "open",
  limit: 20
})

// 添加评论
gitea_issue_comment({
  index: 1,
  body: "已经定位到问题，将在下个版本修复"
})

// 关闭 Issue
gitea_issue_close({ index: 1 })
```

### 3. Pull Request 工作流

```typescript
// 创建 Pull Request
gitea_pr_create({
  title: "feat: 添加用户认证功能",
  head: "feature/auth",
  base: "main",
  body: "## 变更说明\n- 添加 JWT 认证\n- 实现用户登录/登出\n\n## 测试\n- ✅ 单元测试通过\n- ✅ 集成测试通过"
})

// 审查 PR
gitea_pr_review({
  index: 5,
  body: "LGTM! 代码质量很好，可以合并。"
})

// 合并 PR（使用 squash 策略）
gitea_pr_merge({
  index: 5,
  merge_method: "squash",
  merge_title: "feat: 添加用户认证功能 (#5)",
  delete_branch_after_merge: true
})
```

### 4. 仓库管理

```typescript
// 创建新仓库
gitea_repo_create({
  name: "my-new-project",
  description: "这是一个新项目",
  private: false,
  auto_init: true
})

// 搜索仓库
gitea_repo_search({
  q: "kubernetes",
  sort: "stars",
  order: "desc",
  limit: 10
})

// 列出用户的所有仓库
gitea_repo_list({
  owner: "Kysion",
  limit: 50
})
```

### 5. Project 看板管理

```typescript
// 创建项目看板
gitea_project_create({
  title: "Sprint 2025-Q1",
  description: "第一季度开发计划"
})

// 创建看板列
gitea_project_column_create({
  id: 1,
  title: "To Do"
})

gitea_project_column_create({
  id: 1,
  title: "In Progress"
})

gitea_project_column_create({
  id: 1,
  title: "Done"
})

// 列出项目的所有列
gitea_project_columns({ id: 1 })
```

### 6. Milestone 里程碑管理

```typescript
// 创建里程碑
gitea_milestone_create({
  title: "v1.0.0 Release",
  description: "第一个正式版本发布",
  due_on: "2025-12-31T23:59:59Z"
})

// 列出所有里程碑
gitea_milestone_list({
  state: "open",
  limit: 10
})

// 获取里程碑详情
gitea_milestone_get({
  id: 1
})

// 更新里程碑
gitea_milestone_update({
  id: 1,
  title: "v1.0.0 Release (Updated)",
  state: "open"
})

// 关闭里程碑
gitea_milestone_update({
  id: 1,
  state: "closed"
})

// 删除里程碑
gitea_milestone_delete({
  id: 1
})
```

### 7. 用户和组织

```typescript
// 获取用户信息
gitea_user_get({
  username: "developer1"
})

// 列出用户的组织
gitea_user_orgs({
  username: "developer1"
})

// 获取组织信息
gitea_org_get({
  org: "Kysion"
})

// 列出组织成员
gitea_org_members({
  org: "Kysion",
  limit: 50
})
```

### 8. Wiki 管理 🆕

```typescript
// 列出所有 Wiki 页面
gitea_wiki_list()

// 创建新 Wiki 页面
gitea_wiki_create({
  title: "Installation Guide",
  content: `# Installation Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 15+

## Steps
1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Run migrations
5. Start the server`,
  message: "Initial installation guide"
})

// 获取页面内容
gitea_wiki_get({
  pageName: "Home"
})

// 更新页面
gitea_wiki_update({
  pageName: "Home",
  content: `# Welcome to KysionAiStack

Updated content...`,
  message: "Update welcome message"
})

// 查看修订历史
gitea_wiki_revisions({
  pageName: "API-Guide",
  limit: 10
})

// 获取特定版本
gitea_wiki_get_revision({
  pageName: "Home",
  revision: "abc123..."
})

// 搜索 Wiki 页面
gitea_wiki_search({
  query: "installation",
  limit: 5
})

// 删除页面
gitea_wiki_delete({
  pageName: "Old-Page"
})
```

### 💡 使用技巧

1. **设置默认上下文**: 在开始工作前，使用 `gitea_context_set` 设置默认的 owner 和 repo，后续操作无需重复指定。

2. **批量操作**: 可以结合 Issue 列表和更新操作，实现批量处理。

3. **工作流自动化**: 组合多个工具实现 Git 工作流自动化，如自动创建 Issue、PR、合并等。

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 代码检查
pnpm lint
```

## 📁 项目结构

```
gitea-service-mcp/
├── src/
│   ├── index.ts              # MCP Server 入口
│   ├── config.ts             # 配置管理
│   ├── logger.ts             # 日志系统
│   ├── gitea-client.ts       # Gitea API 客户端
│   ├── context-manager.ts    # 上下文管理器
│   ├── types/
│   │   └── gitea.ts          # Gitea API 类型定义
│   └── tools/                # MCP 工具模块
│       ├── repository.ts     # 仓库管理工具 (5个)
│       ├── issue.ts          # Issue 管理工具 (6个)
│       ├── pull-request.ts   # PR 管理工具 (6个)
│       ├── project.ts        # Project 管理工具 (7个)
│       └── user.ts           # 用户/组织管理工具 (4个)
├── config/
│   └── README.md             # 配置指南
├── dist/                     # 构建输出目录
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## 📚 相关文档

- [设计文档](../../docs/modules/gitea-service-mcp/DESIGN.md)
- [配置指南](./config/README.md)
- [Gitea API 文档](https://docs.gitea.com/api/1.21/)
- [MCP 协议规范](https://modelcontextprotocol.io/)

## 🐛 问题反馈

请在 [Gitea Issue](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/issues) 中提交问题。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Pull Request！

---

## 📊 开发进度

| 阶段 | 功能 | 工具数 | 状态 |
|------|------|--------|------|
| Phase 1 | 基础框架 + 上下文管理 | 3 | ✅ 已完成 |
| Phase 2 | Repository + Issue + PR 管理 | 17 | ✅ 已完成 |
| Phase 3 | Project + Milestone + 用户/组织 | 16 | ✅ 已完成 |
| Phase 4 | Wiki 管理 | 8 | ✅ 已完成 |
| Phase 5 | 文档 + 测试 + 示例 | - | 🚧 进行中 |

**当前版本**: v0.5.0 | **工具总数**: 44个

**最新更新**: 2025-10-30
- ✅ 完成 Phase 4 Wiki 管理功能 🆕
- ✅ 新增 Wiki 管理（8个工具）
  - 创建、查询、更新、删除 Wiki 页面
  - 查看修订历史和特定版本内容
  - 搜索 Wiki 页面
- ✅ 完整的使用文档和示例
