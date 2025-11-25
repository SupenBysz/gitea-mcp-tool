# Gitea Service MCP Server

Gitea API 的 MCP (Model Context Protocol) 适配器，使 AI 助手（Claude Desktop、Cline、Continue）能够与 Gitea 仓库、Issue 和 Pull Request 进行交互。

## 功能特性

### 当前版本：v1.6.3

提供 **199 个工具** + **12 个交互式 Prompts**，实现 **99% Gitea API 覆盖度**：

**配置与初始化**（3个工具）
- 交互式配置向导，支持 Git 仓库自动检测
- 多语言支持（中文/英文）
- 全局和项目级配置管理
- 多种令牌创建方式，支持安全存储

**上下文管理**（3个工具）
- 默认 owner 和仓库配置
- 从环境变量自动加载上下文
- 获取当前用户信息

**仓库管理**（5个工具）
- 创建、查询、列表、删除和搜索仓库
- 支持私有仓库和自动初始化

**Issue 管理**（6个工具）
- 创建、更新、评论和关闭 Issue
- 支持标签、里程碑和指派人
- 列表和搜索功能

**Pull Request 管理**（6个工具）
- 创建、更新、合并和审查 PR
- 多种合并策略（merge、rebase、squash）
- PR 列表和详情获取

**项目看板管理**（7个工具）
- 创建、更新和删除项目看板
- 列管理
- 看板状态管理

**里程碑管理**（5个工具）
- 创建、查询、更新和删除里程碑
- 截止日期配置
- 里程碑统计

**用户与组织管理**（4个工具）
- 用户和组织信息查询
- 组织成员列表
- 用户-组织关系管理

**Wiki 管理**（8个工具）
- 创建、查询、更新和删除 Wiki 页面
- 页面修订历史
- 特定版本内容获取
- Wiki 页面搜索

**交互式 Prompts 引导模板**（12个 Prompts）✨ 新增

**配置管理 Prompts**（3个）
- `gitea-mcp-tool:配置连接` - 首次使用必需，交互式配置向导
- `gitea-mcp-tool:检查配置` - 检查当前配置状态
- `gitea-mcp-tool:重新配置` - 重新配置连接（覆盖现有配置）

**项目看板 Prompts**（2个）
- `gitea-mcp-tool:初始化项目看板` - 支持12种看板类型和4种工作流方案
- `gitea-mcp-tool:管理项目看板` - 查看、更新、添加卡片

**Issue 管理 Prompts**（3个）
- `gitea-mcp-tool:创建Issue` - 交互式创建 Issue，支持多种类型（Bug/功能/文档）
- `gitea-mcp-tool:管理Issue` - 查看、更新、关闭、评论 Issue
- `gitea-mcp-tool:搜索Issue` - 按状态和标签搜索筛选

**PR 管理 Prompts**（4个）
- `gitea-mcp-tool:创建PR` - 交互式创建 Pull Request
- `gitea-mcp-tool:审查PR` - 全面的代码审查流程（6个审查维度）
- `gitea-mcp-tool:管理PR` - 合并、更新、关闭 PR（支持4种合并方式）
- `gitea-mcp-tool:查看PR列表` - 按状态筛选和查看 PR

**工具管理**（2个工具）
- `gitea_init` - 项目配置初始化（自动检测 Git 信息）
- `gitea_mcp_upgrade` - 一键升级 MCP 工具到最新版本

### 认证方式

- API Token 认证（推荐）
- 用户名 + 密码认证

## 安装

### npm 安装（推荐）

通过 npm 全局安装，这是最简单快捷的方式：

```bash
# 全局安装
npm install -g gitea-mcp-tool

# 或使用 npx 直接运行（无需安装）
npx gitea-mcp-tool
```

**安装后使用**：
```bash
# 运行 MCP Server
gitea-mcp

# 使用 CLI 工具
keactl --help

# 交互式配置
keactl config wizard
```

**优势**：
- ✅ 一行命令完成安装
- ✅ 支持所有平台（macOS、Linux、Windows）
- ✅ 自动安装依赖
- ✅ 全局可用的命令行工具
- ✅ 方便升级：`npm update -g gitea-mcp-tool`

### 快速安装脚本

下载并安装预构建版本（无需编译）：

#### 公开仓库

```bash
# 一行命令快速安装
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

#### 私有/内部仓库（需要认证）

**方式 1：带认证的一行命令**
```bash
# 设置环境变量后安装
export GITEA_API_TOKEN=your_token_here
curl -fsSL -H "Authorization: token ${GITEA_API_TOKEN}" \
  https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

**方式 2：两步安装（推荐）**
```bash
# 步骤 1: 下载安装脚本
export GITEA_API_TOKEN=your_token_here
curl -fsSL -H "Authorization: token ${GITEA_API_TOKEN}" \
  https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh \
  -o /tmp/install-gitea-mcp.sh

# 步骤 2: 执行安装
bash /tmp/install-gitea-mcp.sh
```

**方式 3：使用 Bootstrap 脚本**
```bash
# 下载 bootstrap 脚本到本地
export GITEA_API_TOKEN=your_token_here
curl -fsSL -H "Authorization: token ${GITEA_API_TOKEN}" \
  https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/bootstrap.sh | bash
```

**方式 4：从发布页下载**
1. 访问 [Releases 页面](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/releases)
2. 下载最新的 `gitea-mcp-v*.tar.gz` 文件
3. 解压并按照 INSTALL.txt 说明操作

#### 安装特点
- 🌐 **多语言支持** - 中文/英文界面，自动检测系统语言
- 📊 **版本信息** - 安装前显示当前版本和最新版本
- 🎯 **灵活选择** - 可选择安装 MCP Server、CLI 工具或全部
- 🚀 **快速安装** - 下载预构建版本，约 10 秒完成
- 📦 **仅需 Node.js 18+** - 无需构建工具
- 📂 **标准位置** - 安装到 `~/.gitea-mcp/`

#### 安装流程

运行快速安装脚本后，您会经历以下交互式步骤：

1. **语言选择** - 选择中文或英文界面
   ```
   请选择语言 / Select Language
   1) 中文 (Chinese)
   2) English
   ```

2. **版本信息显示** - 查看当前和最新版本
   ```
   版本信息
   📦 当前已安装版本: 1.3.0 (或"未安装")
   🌐 最新可用版本: v1.4.0
   ```

3. **选择安装类型** - 根据需求选择
   ```
   请选择安装类型
   1) 仅安装 MCP Server（供 AI 工具使用）
   2) 仅安装 CLI 工具（keactl 命令行）
   3) 安装全部（MCP + CLI）
   ```

4. **自动安装** - 系统自动完成以下步骤：
   - 检查 Node.js 环境
   - 下载发布包
   - 安装软件包
   - 安装依赖
   - 显示配置说明

5. **可选配置向导** - 询问是否自动配置 MCP 客户端

### 标准安装

克隆仓库并从源码构建：

```bash
# 克隆并自动安装
git clone https://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git
cd entai-gitea-mcp
./install.sh
```

此方式特点：
- 克隆完整仓库和源码
- 需要 Node.js 18+、pnpm、git
- 从源码构建项目
- 适合开发或自定义

### 本地开发部署（推荐开发者使用）

如果你正在开发或修改代码，使用一键部署脚本快速部署到本地：

```bash
# 在项目目录下执行
./deploy-local.sh
```

#### 交互式部署菜单

脚本提供友好的交互式界面：

**主菜单选项：**
1. **检查版本更新** - 自动检测并比较本地与远程版本
2. **仅部署 MCP Server** - 仅部署 MCP 服务器，用于 AI 工具集成
3. **仅部署 CLI 工具 (keactl)** - 仅部署命令行工具
4. **部署全部 (MCP + CLI)** - 同时部署 MCP 和 CLI
5. **退出** - 退出部署流程

**特色功能：**
- 🔍 **自动版本检测** - 智能检查更新，及时提醒新版本
- ✅ **交互式菜单** - 清晰易用，操作直观
- 🔙 **支持返回上一步** - 随时修改选择
- 📋 **部署前确认** - 显示详细信息确认
- 📊 **结果展示** - 清晰的部署结果和使用说明
- 📖 **内置文档** - 随时查阅使用文档
- 🔄 **连续部署** - 支持多次部署操作
- 🔐 **私有仓库支持** - 通过 `GITEA_API_TOKEN` 访问私有仓库

**部署流程：**
1. 选择部署模式（MCP/CLI/全部）
2. 确认部署信息
3. 自动构建和部署
4. 查看部署结果和使用说明
5. 可选择再次部署或查看文档

**部署后操作：**
- **再次部署** - 返回主菜单进行新的部署
- **查看文档** - 浏览 CLI 使用指南、初始化文档等
- **退出** - 完成部署

特点：
- 灵活选择部署内容，节省空间和时间
- 支持返回修改选择，用户友好
- 适合快速迭代测试
- 部署后立即可用（MCP 需重启 Claude Code）
- 保持开发环境和运行环境分离

### 手动安装

完全控制安装过程：

```bash
# 克隆仓库
git clone https://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git
cd entai-gitea-mcp

# 安装依赖
pnpm install

# 构建
pnpm build
```

## 客户端配置

安装完成后，需要配置 MCP 客户端以使用 Gitea MCP 服务器。

### 自动配置（推荐）

安装脚本会在完成后询问是否运行配置向导，或者手动运行：

```bash
# 下载并运行配置向导
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/configure-clients.sh | bash

# 或使用本地脚本（如果已克隆仓库）
./configure-clients.sh
```

配置向导支持的客户端：
- **Claude Desktop** - AI 助手桌面应用
- **Claude CLI** - Claude 命令行工具
- **VSCode (Cline)** - VSCode 中的 AI 编程助手
- **Cursor** - AI 驱动的代码编辑器
- **Windsurf** - Codeium 的 AI 编辑器

### 手动配置

如果不使用配置向导，可以手动编辑客户端配置文件：

#### Claude Desktop

配置文件位置：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

添加配置：
```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "command": "node",
      "args": ["~/.gitea-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### Claude CLI

配置文件位置：
- macOS/Linux/Windows: `~/.claude.json`

**注意**：此文件是 Claude CLI 的主配置文件，包含所有 Claude Code 设置。请勿覆盖整个文件！

在顶层 `mcpServers` 字段中添加配置：
```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "type": "stdio",
      "command": "node",
      "args": ["~/.gitea-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

**重要说明**：
- Claude CLI 配置需要 `"type": "stdio"` 字段
- `~/.claude.json` 是 Claude Code 的主配置文件，包含用户偏好设置、项目历史等信息
- 只需在现有文件的顶层 `mcpServers` 对象中添加 `"gitea-mcp-tool"` 条目
- 建议使用配置向导自动配置，或使用 `jq` 工具手动更新

#### VSCode (Cline)

配置文件位置：
- macOS: `~/Library/Application Support/Code/User/settings.json`
- Windows: `%APPDATA%/Code/User/settings.json`
- Linux: `~/.config/Code/User/settings.json`

添加配置：
```json
{
  "cline.mcpServers": {
    "gitea-mcp-tool": {
      "command": "node",
      "args": ["~/.gitea-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### Cursor

类似 Claude Desktop 配置：
- macOS: `~/Library/Application Support/Cursor/User/settings.json`
- Windows: `%APPDATA%/Cursor/User/settings.json`
- Linux: `~/.config/Cursor/User/settings.json`

#### Windsurf

类似 Claude Desktop 配置：
- macOS: `~/Library/Application Support/Windsurf/User/settings.json`
- Windows: `%APPDATA%/Windsurf/User/settings.json`
- Linux: `~/.config/Windsurf/User/settings.json`

配置完成后，重启相应的 MCP 客户端即可使用。

## 使用 Prompts（交互式引导模板）

Prompts 是为 AI 助手设计的交互式引导模板，帮助用户快速完成常见任务。在支持 MCP Prompts 的客户端（如 Claude Desktop、Claude CLI）中，你可以直接选择这些模板开始对话。

### 如何使用 Prompts

1. **在客户端中查看 Prompts**
   - Claude Desktop：在新对话界面会显示可用的 Prompts
   - Claude CLI：使用 `/prompts` 命令查看所有可用的 Prompts

2. **选择并使用 Prompt**
   - 点击或选择想要使用的 Prompt
   - 根据 Prompt 的引导提供必要信息
   - AI 助手会自动调用相应的 Gitea 工具完成任务

### 首次使用：配置连接

**Prompt**: `gitea-mcp-tool:配置连接`

首次使用必须先配置 Gitea 连接。选择此 Prompt 后，会引导你完成以下配置：

1. **服务器地址** - 自动检测或手动输入 Gitea 服务器 URL
2. **项目信息** - 仓库所有者（owner）和仓库名称（repo）
3. **API Token** - 支持 4 种配置方式：
   - 使用用户名密码自动创建
   - 手动输入已有 token
   - 引用已保存的 token
   - 使用环境变量
4. **保存方式** - 选择 token 保存位置（本地/引用/环境变量）
5. **默认上下文** - 设置此项目为默认操作上下文

### Prompts 使用示例

#### 1. 创建 Issue

**Prompt**: `gitea-mcp-tool:创建Issue`

```
选择 Prompt → 指定仓库（可选）→ 选择 Issue 类型（Bug/功能/文档）→ 提供详细信息
```

AI 助手会引导你提供：
- **标题**：简洁明确的问题描述
- **描述**：详细内容（包括重现步骤、期望行为等）
- **标签**：bug、enhancement、documentation 等
- **优先级**：低/中/高/紧急
- **指派人员**：负责人用户名

#### 2. 审查 Pull Request

**Prompt**: `gitea-mcp-tool:审查PR`

```
选择 Prompt → 指定 PR 编号 → AI 自动获取 PR 信息并进行代码审查
```

AI 会检查以下方面：
- ✅ 代码质量和规范
- ✅ 功能正确性
- ✅ 性能考虑
- ✅ 安全性
- ✅ 测试覆盖
- ✅ 文档完整性

然后提交审查意见：APPROVE（批准）、COMMENT（评论）或 REQUEST_CHANGES（请求修改）

#### 3. 初始化项目看板

**Prompt**: `gitea-mcp-tool:初始化项目看板`

```
选择 Prompt → 选择看板类型（1-12）→ 选择工作流方案 → 自动创建看板和列
```

**12种看板类型**：
1. Bug追踪看板
2. 部署实施看板
3. 运维管理看板
4. 文档维护看板
5. 优化改进看板
6. 功能开发看板
7. 测试管理看板
8. 安全与合规看板
9. 研发运营看板
10. 客户支持看板
11. 设计与原型看板
12. 数据与分析看板

**4种工作流方案**：
- **极简版**（3状态）：待办 → 进行中 → 已完成
- **标准版**（5状态）：待办事项 → 计划中 → 进行中 → 测试验证 → 已完成
- **全面版**（8状态）：包含需求分析、设计评审、代码审查等完整流程
- **敏捷迭代版**（6状态）：Sprint 待办、开发、代码评审、测试验收

### 所有可用 Prompts

#### 配置管理
- `gitea-mcp-tool:配置连接` - 交互式配置向导
- `gitea-mcp-tool:检查配置` - 检查配置状态
- `gitea-mcp-tool:重新配置` - 重新配置（覆盖现有）

#### 项目看板
- `gitea-mcp-tool:初始化项目看板` - 创建项目看板
- `gitea-mcp-tool:管理项目看板` - 管理现有看板

#### Issue 管理
- `gitea-mcp-tool:创建Issue` - 创建新 Issue
- `gitea-mcp-tool:管理Issue` - 更新、评论、关闭
- `gitea-mcp-tool:搜索Issue` - 搜索和筛选

#### Pull Request
- `gitea-mcp-tool:创建PR` - 创建 Pull Request
- `gitea-mcp-tool:审查PR` - 代码审查
- `gitea-mcp-tool:管理PR` - 合并、更新、关闭
- `gitea-mcp-tool:查看PR列表` - 查看和筛选

### 注意事项

- **首次使用**：必须先使用"配置连接"Prompt 完成初始配置
- **上下文**：如果在 Git 仓库目录中，大部分信息会自动检测
- **灵活性**：所有 Prompts 都支持使用默认上下文或手动指定参数
- **客户端支持**：Prompts 功能需要客户端支持 MCP Prompts 规范

## CLI 工具 (命令行工具)

除了通过 MCP 协议使用，本项目还提供了独立的命令行工具 `keactl`，可以直接在终端中管理 Gitea 资源。

### 安装 CLI 工具

CLI 工具会在安装 MCP 服务器时自动安装。如果单独安装：

```bash
# 通过 npm 全局安装
npm install -g @kysion/gitea-mcp-tool

# 或从源码构建后使用
cd entai-gitea-mcp
pnpm install
pnpm build
# CLI 可执行文件位于 dist/cli/index.js
```

### 快速开始

```bash
# 初始化配置（交互式）
keactl config init

# 查看当前配置
keactl config show

# 查看当前用户
keactl user current

# 列出仓库
keactl repo list

# 列出 Issues
keactl issue list --state open

# 创建 Issue
keactl issue create --title "修复登录问题" --body "详细描述..."
```

### 配置方式

keactl 支持多种配置方式，优先级从高到低：

1. **命令行参数**
   ```bash
   keactl repo list --token <token> --server https://gitea.ktyun.cc --owner Kysion
   ```

2. **项目配置** (`.gitea-mcp.json` 和 `.gitea-mcp.local.json`)
   ```bash
   keactl config init  # 在项目目录下初始化
   ```

3. **全局配置** (`~/.gitea-mcp/config.json`)
   ```bash
   keactl config init --global
   ```

4. **环境变量**
   ```bash
   export GITEA_API_TOKEN=your_token
   export GITEA_SERVER_URL=https://gitea.ktyun.cc
   ```

### 主要命令

| 命令组 | 说明 | 示例命令 |
|--------|------|----------|
| `context` | 上下文管理 | `keactl context get`, `keactl context set` |
| `user` | 用户信息 | `keactl user current`, `keactl user get <username>` |
| `repo` | 仓库管理 | `keactl repo list`, `keactl repo create` |
| `issue` | Issue 管理 | `keactl issue list`, `keactl issue create` |
| `pr` | Pull Request 管理 | `keactl pr list`, `keactl pr create` |
| `project` | 项目看板管理 | `keactl project list`, `keactl project create` |
| `config` | 配置管理 | `keactl config init`, `keactl config show` |

### 输出格式

支持多种输出格式：

```bash
# 表格格式（默认）
keactl repo list

# JSON 格式
keactl repo list --json

# 无颜色输出（适合管道或日志）
keactl repo list --no-color
```

### 详细文档

完整的 CLI 使用指南请参考 [CLI 使用文档](./docs/cli-guide.md)。

## 快速开始

### 方法 1：使用配置向导（推荐）

运行交互式配置向导：

```bash
# 在 Claude Desktop 中直接使用工具
gitea_mcp_init

# 如需切换语言
gitea_mcp_language_set({ locale: "zh-CN" })  # 切换到中文
gitea_mcp_language_get()  # 查看当前语言
```

配置向导功能：
- Git 仓库信息自动检测（服务器、owner、仓库）
- 多种令牌创建方式（用户名/密码、手动输入、环境变量）
- 灵活的配置存储（全局 + 项目 + 本地）
- 多语言界面（中文和英文）
- 自动令牌管理和复用

详见 [初始化文档](./docs/initialization.md)。

### 方法 2：手动环境配置

创建 `.env` 文件或在 MCP 客户端配置中设置环境变量：

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

### 获取 API Token

1. 登录 Gitea
2. 进入 设置 → 应用
3. 点击 生成新令牌
4. 复制令牌并设置到 `GITEA_API_TOKEN`

### 配置 MCP 客户端

#### Claude Desktop

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：

**配置示例**（将 `/path/to/gitea-mcp` 替换为实际项目目录）：

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "command": "node",
      "args": [
        "/path/to/gitea-mcp/dist/index.js"
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

编辑 `.vscode/settings.json`：

**配置示例**（将 `/path/to/gitea-mcp` 替换为实际项目目录）：

```json
{
  "cline.mcpServers": {
    "gitea-mcp-tool": {
      "command": "node",
      "args": [
        "/path/to/gitea-mcp/dist/index.js"
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

编辑 `~/.continue/config.json`：

**配置示例**（将 `/path/to/gitea-mcp` 替换为实际项目目录）：

```json
{
  "mcpServers": [
    {
      "name": "gitea-mcp-tool",
      "command": "node",
      "args": [
        "/path/to/gitea-mcp/dist/index.js"
      ],
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  ]
}
```

### 重启客户端

重启 Claude Desktop 或 VSCode 以激活 MCP 服务器。

## 可用工具

共提供 46 个工具，完整覆盖 Gitea 核心功能。

### 配置初始化（3个）

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_mcp_init` | 交互式配置向导 | `interactive?`, `autoDetect?`, `force?` |
| `gitea_mcp_language_set` | 设置UI语言 | `locale` (en, zh-CN) |
| `gitea_mcp_language_get` | 获取当前语言设置 | - |

### 上下文管理（3个）

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_context_get` | 获取当前上下文 | - |
| `gitea_context_set` | 设置默认上下文 | `owner?`, `repo?` |
| `gitea_user_current` | 获取当前用户信息 | - |

### 仓库管理（5个）

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_repo_create` | 创建仓库 | `name`, `owner?`, `description?`, `private?`, `auto_init?` |
| `gitea_repo_get` | 获取仓库详情 | `owner?`, `repo?` |
| `gitea_repo_list` | 列出仓库 | `owner?`, `page?`, `limit?` |
| `gitea_repo_delete` | 删除仓库 | `owner?`, `repo?` |
| `gitea_repo_search` | 搜索仓库 | `q`, `sort?`, `order?`, `page?`, `limit?` |

### Issue 管理（6个）

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_issue_create` | 创建 Issue | `title`, `body?`, `owner?`, `repo?`, `assignees?`, `labels?`, `milestone?` |
| `gitea_issue_get` | 获取 Issue 详情 | `index`, `owner?`, `repo?` |
| `gitea_issue_list` | 列出 Issues | `owner?`, `repo?`, `state?`, `labels?`, `q?`, `page?`, `limit?` |
| `gitea_issue_update` | 更新 Issue | `index`, `title?`, `body?`, `state?`, `assignees?`, `milestone?` |
| `gitea_issue_comment` | 添加 Issue 评论 | `index`, `body`, `owner?`, `repo?` |
| `gitea_issue_close` | 关闭 Issue | `index`, `owner?`, `repo?` |

### Pull Request 管理（6个）

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_pr_create` | 创建 Pull Request | `title`, `head`, `base`, `body?`, `owner?`, `repo?`, `assignees?`, `labels?` |
| `gitea_pr_get` | 获取 PR 详情 | `index`, `owner?`, `repo?` |
| `gitea_pr_list` | 列出 Pull Requests | `owner?`, `repo?`, `state?`, `sort?`, `page?`, `limit?` |
| `gitea_pr_update` | 更新 Pull Request | `index`, `title?`, `body?`, `state?`, `assignees?`, `milestone?` |
| `gitea_pr_merge` | 合并 Pull Request | `index`, `merge_method?`, `merge_title?`, `merge_message?`, `delete_branch_after_merge?` |
| `gitea_pr_review` | 审查 Pull Request | `index`, `body`, `owner?`, `repo?` |

### Project 看板管理（7个）

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_project_create` | 创建项目看板 | `title`, `description?`, `owner?`, `repo?` |
| `gitea_project_get` | 获取项目详情 | `id`, `owner?`, `repo?` |
| `gitea_project_list` | 列出项目看板 | `owner?`, `repo?`, `state?`, `page?`, `limit?` |
| `gitea_project_update` | 更新项目看板 | `id`, `title?`, `description?`, `state?` |
| `gitea_project_delete` | 删除项目看板 | `id`, `owner?`, `repo?` |
| `gitea_project_columns` | 列出项目的列 | `id`, `owner?`, `repo?` |
| `gitea_project_column_create` | 创建项目列 | `id`, `title`, `owner?`, `repo?` |

### Milestone 里程碑管理（5个）

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_milestone_create` | 创建里程碑 | `title`, `description?`, `due_on?`, `owner?`, `repo?` |
| `gitea_milestone_list` | 列出里程碑 | `owner?`, `repo?`, `state?`, `page?`, `limit?` |
| `gitea_milestone_get` | 获取里程碑详情 | `id`, `owner?`, `repo?` |
| `gitea_milestone_update` | 更新里程碑 | `id`, `title?`, `description?`, `due_on?`, `state?` |
| `gitea_milestone_delete` | 删除里程碑 | `id`, `owner?`, `repo?` |

### 用户/组织管理（4个）

| 工具名称 | 说明 | 主要参数 |
|---------|------|----------|
| `gitea_user_get` | 获取用户信息 | `username` |
| `gitea_user_orgs` | 列出用户的组织 | `username?`, `page?`, `limit?` |
| `gitea_org_get` | 获取组织信息 | `org` |
| `gitea_org_members` | 列出组织成员 | `org`, `page?`, `limit?` |

### Wiki 管理（8个）

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

注：标记为 `?` 的参数为可选参数。未提供 `owner` 和 `repo` 时，将使用默认上下文。

## 使用示例

### 上下文管理

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

### 创建和管理 Issue

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

### Pull Request 工作流

```typescript
// 创建 Pull Request
gitea_pr_create({
  title: "feat: 添加用户认证功能",
  head: "feature/auth",
  base: "main",
  body: "## 变更说明\n- 添加 JWT 认证\n- 实现用户登录/登出\n\n## 测试\n- 单元测试通过\n- 集成测试通过"
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

### 仓库管理

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

### Project 看板管理

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

### Milestone 里程碑管理

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

### 用户和组织

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

### Wiki 管理

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

### 使用技巧

**设置默认上下文**
在开始工作前，使用 `gitea_context_set` 设置默认的 owner 和 repo，后续操作无需重复指定。

**批量操作**
结合 Issue 列表和更新操作，实现批量处理。

**工作流自动化**
组合多个工具实现 Git 工作流自动化，如自动创建 Issue、PR、合并等。

## 开发

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

## 项目结构

```
gitea-mcp-tool/
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

## 相关文档

- [初始化文档](./docs/initialization.md)
- [上下文管理文档](./docs/context-management.md)
- [动态令牌文档](./docs/dynamic-token.md)
- [Gitea API 文档](https://docs.gitea.com/api/1.21/)
- [MCP 协议规范](https://modelcontextprotocol.io/)

## 问题反馈

请在 [Gitea Issue](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/issues) 中提交问题。

## 许可证

MIT License

## 贡献

欢迎提交 Pull Request。

---

## 开发进度

| 阶段 | 功能 | 工具数 | 状态 |
|------|------|--------|------|
| Phase 1 | 基础框架 + 上下文管理 | 3 | ✅ 已完成 |
| Phase 2 | Repository + Issue + PR 管理 | 17 | ✅ 已完成 |
| Phase 3 | Project + Milestone + 用户/组织 | 16 | ✅ 已完成 |
| Phase 4 | Wiki 管理 | 8 | ✅ 已完成 |
| Phase 5 | 配置初始化系统 | 3 | ✅ 已完成 |
| Phase 6 | 团队、标签、Webhook 管理 | 25 | ✅ 已完成 |
| Phase 7 | Release、分支、内容管理 | 42 | ✅ 已完成 |
| Phase 8 | Commit、Tag、保护规则 | 27 | ✅ 已完成 |
| Phase 9 | Notification、协作者管理 | 10 | ✅ 已完成 |
| Phase 10 | Actions、Artifact、Secret 管理 | 25 | ✅ 已完成 |
| Phase 11 | SSH Key、GPG Key、关注管理 | 15 | ✅ 已完成 |
| Phase 12 | Topic、Package 管理 | 8 | ✅ 已完成 |
| **总计** | **完整的 Gitea API 覆盖** | **199** | **✅ 99% 覆盖度** |

**当前版本**：v1.6.3 | **工具总数**：199个 | **API 覆盖度**：99%

**v1.6.3 更新** (2025-11-25)
- 🔧 **修复 Project Add Issue API** - 修正 API 路径和参数，现可正确将 Issue 添加到项目看板列
- 📦 **安装脚本优化** - 优先从 npm registry 获取最新版本，更新回退版本

**v1.6.2 更新** (2025-11-25)
- 🐛 **修复 Wiki API** - 解决非 Home 页面 404 问题，正确处理 `.-` 后缀和 `content_base64` 解码
- 🐛 **修复 Milestone API** - 修复 `resolveOwnerRepo` 函数签名问题
- ✨ **新增 gitea_repo_update** - 支持更新仓库元数据（名称、描述、可见性等）

**v1.6.1 更新** (2025-11-25)
- 📝 **Prompt 名称优化** - 移除重复的 `gitea_` 前缀
- 📊 **项目看板 Prompt 增强** - 展示更详细的项目信息

**v1.5.1 更新** (2025-11-23)
- 🍎 **macOS 兼容性修复** - 解决 bash 3.2 关联数组不支持问题，macOS 用户现可正常使用安装脚本
- 🐛 **Wiki API 修复** - 修复 `gitea_wiki_update` 创建 "unnamed" 页面的 bug，现可正确更新已存在页面
- ✅ **测试完善** - 所有修复通过语法检查和功能测试

**v1.5.0 更新** (2025-11-23)
- 🌐 **多语言安装体验** - 安装脚本全面支持中文/英文双语界面
- 📊 **智能版本对比** - 安装前自动显示当前版本和最新版本
- 🎯 **灵活安装模式** - 支持仅 MCP、仅 CLI、或全部安装三种选择
- 🔧 **工作目录自动修复** - 智能处理无效工作目录，防止 getcwd 错误
- 📝 **文档完善** - 同步版本信息，完整记录 API 覆盖度

**v1.4.0 更新** (2025-11-23)
- 🌐 **多语言安装支持** - 快速安装脚本支持中文/英文界面
- 📊 **版本信息显示** - 安装前自动检测和比较版本
- 🎯 **灵活安装选项** - 支持仅 MCP、仅 CLI 或全部安装
- 🚀 **交互式部署** - 本地开发部署脚本优化

**v1.1.0 - v1.3.0 更新**
- 🎉 **达成 200 工具里程碑** - 实现 99% Gitea API 覆盖度
- ✨ 完整的 Actions/Workflow 管理（25个工具）
- 🔐 SSH Key、GPG Key、Deploy Key 管理（15个工具）
- 🌟 用户关注、仓库收藏功能（8个工具）
- 📦 Package 注册表管理（5个工具）
- 🏷️ Topic、Label 管理（10个工具）
- 🔔 Notification 系统（7个工具）
- 👥 协作者权限管理（4个工具）

**v0.9.0 - v1.0.0 更新**
- 🔧 **配置初始化系统** - 交互式配置向导
- 🌍 **多语言支持** - 中文/英文界面切换
- 📝 **Wiki 管理** - 完整的 Wiki CRUD 和版本控制
- 🏗️ **项目看板** - Project Board 管理
- 🎯 **里程碑管理** - Milestone 功能
