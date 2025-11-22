# v0.9.5 - 功能增强版本

## 更新内容

本版本添加了期待已久的项目配置初始化工具，解决了无法通过 MCP 调用创建配置文件的问题。

## 新功能

### 添加 `gitea_init` MCP 工具

**功能描述：**
- 通过 MCP 调用初始化项目配置文件 (`.gitea-mcp.json`)
- 自动检测 Git 仓库信息（owner, repo, Gitea URL）
- 支持手动指定配置参数
- 可选设置为默认上下文
- 支持强制覆盖已有配置

**工具参数：**

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `owner` | string | 否 | - | 仓库所有者（从 Git 自动检测） |
| `repo` | string | 否 | - | 仓库名称（从 Git 自动检测） |
| `gitea_url` | string | 否 | - | Gitea 服务器 URL（从 Git 自动检测） |
| `set_as_default` | boolean | 否 | true | 是否设为默认上下文 |
| `force` | boolean | 否 | false | 强制覆盖已有配置 |

**使用示例：**

1. **自动检测（推荐）** - 在 Git 仓库中使用：
```json
{
  "name": "gitea_init"
}
```

2. **手动指定参数：**
```json
{
  "name": "gitea_init",
  "arguments": {
    "owner": "Kysion",
    "repo": "my-project",
    "gitea_url": "https://gitea.ktyun.cc"
  }
}
```

3. **强制覆盖已有配置：**
```json
{
  "name": "gitea_init",
  "arguments": {
    "force": true
  }
}
```

**返回结果：**
```json
{
  "success": true,
  "message": "Project configuration initialized successfully",
  "filesCreated": ["/path/to/.gitea-mcp.json"],
  "config": {
    "version": "1.0",
    "gitea": {
      "url": "https://gitea.ktyun.cc",
      "name": "gitea.ktyun.cc"
    },
    "project": {
      "owner": "Kysion",
      "repo": "my-project"
    },
    "defaults": {
      "setAsDefaultContext": true
    }
  },
  "detectedInfo": {
    "isGitRepo": true,
    "detectedOwner": "Kysion",
    "detectedRepo": "my-project",
    "detectedUrl": "https://gitea.ktyun.cc"
  },
  "defaultContext": {
    "owner": "Kysion",
    "repo": "my-project"
  }
}
```

### Git 信息自动检测

`gitea_init` 工具会自动从当前工作目录的 Git 仓库检测：
- Repository owner（所有者）
- Repository name（仓库名）
- Gitea server URL（从 Git remote）

如果检测失败或不在 Git 仓库中，需要手动提供参数。

## 修复的问题

**问题 1：MCP 工具列表中缺少初始化工具**
- ❌ 之前：文档中提到 `gitea_mcp_init` 但实际不存在
- ✅ 现在：添加了 `gitea_init` 工具，可以在工具列表中看到

**问题 2：无法通过 MCP 调用创建项目配置**
- ❌ 之前：只有交互式命令行向导（MCP 环境无法使用）
- ✅ 现在：通过 `gitea_init` 工具可以创建 `.gitea-mcp.json`

## 技术改进

- 导入项目配置管理器 (`getProjectConfig`)
- 导入 Git 检测工具 (`detectGitInfo`)
- 在 ListToolsRequestSchema 中注册 `gitea_init` 工具
- 在 CallToolRequestSchema 中实现完整处理逻辑
- 自动检测与手动参数的优雅降级机制

## 安装

### 快速安装（推荐）

**公开仓库：**
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

**私有/内部仓库：**
```bash
export GITEA_API_TOKEN=your_token_here
curl -fsSL -H "Authorization: token ${GITEA_API_TOKEN}" \
  https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

### 下载安装包

下载下方的 `gitea-mcp-v0.9.5.tar.gz` 并解压：
```bash
tar -xzf gitea-mcp-v0.9.5.tar.gz
cd gitea-mcp-v0.9.5

# 安装依赖
npm install --production

# 查看 INSTALL.txt 了解配置方法
```

## 安全校验

**SHA256 校验和：**
```
44df2c3a381390f8bea494f778db2138f71284d5805832f4558ca9cbe98da1c9
```

验证下载文件：
```bash
shasum -a 256 gitea-mcp-v0.9.5.tar.gz
```

## 文档

- [README](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [初始化指南](./docs/initialization.md)
- [上下文管理](./docs/context-management.md)
- [动态令牌](./docs/dynamic-token.md)
- [发布流程](./RELEASE.md)

## 从旧版本升级

### 从 v0.9.4 或更早版本升级

直接使用快速安装脚本更新：
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

安装完成后重启 MCP 客户端，新的 `gitea_init` 工具将自动可用。

### 使用新功能

在任何 Git 仓库中，通过你的 MCP 客户端调用 `gitea_init` 工具：

1. **Claude Desktop**: 直接说 "Initialize Gitea MCP configuration"
2. **Claude CLI**: 使用工具调用功能
3. **其他 MCP 客户端**: 查找 `gitea_init` 工具并调用

## 变更日志

### 新增
- **[重要]** 添加 `gitea_init` MCP 工具用于项目配置初始化
- 支持 Git 仓库信息自动检测
- 支持手动指定配置参数
- 支持设置默认上下文
- 支持强制覆盖已有配置

### 修复
- 修复文档中提到但实际不存在的 `gitea_mcp_init` 工具
- 修复无法通过 MCP 调用创建项目配置的问题

### 改进
- 完善错误提示信息（显示自动检测结果）
- 返回详细的配置创建信息
- 返回 Git 检测信息供用户确认

---

**完整变更日志**：https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/compare/v0.9.4...v0.9.5

**当前版本**：v0.9.5 | **工具总数**：47个（新增 1 个） | **发布日期**：2025-11-23
