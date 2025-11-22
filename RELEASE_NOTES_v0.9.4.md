# v0.9.4 - 紧急修复版本

## 更新内容

本版本为 v0.9.3 的紧急修复版本，修复了 Claude CLI 配置的关键错误。

## 关键修复

### 修正 Claude CLI 配置路径和格式

**问题描述：**
- v0.9.3 中 Claude CLI 配置路径仍然错误
- 使用了 `~/.claude/claude_code_config.json`
- 实际应该是 `~/.claude.json`（顶层 `mcpServers` 字段）
- 配置格式缺少必需的 `"type": "stdio"` 字段

**修复方案：**
1. **configure-clients.sh**：
   - 更新所有平台的配置路径为 `~/.claude.json`
   - 添加 `create_mcp_config_stdio()` 函数（包含 `type: stdio`）
   - 重写 `configure_claude_cli()` 函数：
     - 正确更新 `~/.claude.json` 的顶层 `mcpServers` 字段
     - 添加 jq 依赖检查（必需）
     - 不创建新文件（文件应由 Claude CLI 自动创建）

2. **README.md**：
   - 更新配置文件路径说明
   - 添加 `"type": "stdio"` 字段示例
   - 添加重要说明和最佳实践

3. **INSTALL.txt**：
   - 更新 Claude CLI 配置路径
   - 添加详细的配置格式和注意事项

**正确的配置格式：**
```json
{
  "mcpServers": {
    "gitea-service": {
      "type": "stdio",  // Claude CLI 必需！
      "command": "node",
      "args": ["/path/to/.gitea-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token"
      }
    }
  }
}
```

**影响：**
Claude CLI 用户现在可以正确配置和使用 gitea-service，`/mcp` 命令将能够发现服务。

## 配置文件说明

**Claude CLI 配置文件：**
- 路径：`~/.claude.json` (所有平台)
- 这是 Claude Code 的主配置文件
- 包含用户设置、项目历史等信息
- **不要覆盖整个文件！**
- 只需在顶层 `mcpServers` 对象中添加条目

**与 Claude Desktop 的区别：**
| 项目 | Claude Desktop | Claude CLI |
|------|----------------|------------|
| 配置文件 | `~/Library/Application Support/Claude/claude_desktop_config.json` | `~/.claude.json` |
| 配置字段 | `mcpServers` | `mcpServers`（顶层） |
| 是否需要 type | ❌ 否 | ✅ 是（必须为 "stdio"） |
| 文件性质 | 仅 MCP 配置 | 完整的 Claude Code 配置 |

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

下载下方的 `gitea-mcp-v0.9.4.tar.gz` 并解压：
```bash
tar -xzf gitea-mcp-v0.9.4.tar.gz
cd gitea-mcp-v0.9.4

# 安装依赖
npm install --production

# 查看 INSTALL.txt 了解配置方法
```

## 安全校验

**SHA256 校验和：**
```
1f331a126fd229831e98e4a8053b3f16095d8412aca8fde3e4e7c39c2597c3a0
```

验证下载文件：
```bash
shasum -a 256 gitea-mcp-v0.9.4.tar.gz
```

## 文档

- [README](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [初始化指南](./docs/initialization.md)
- [上下文管理](./docs/context-management.md)
- [动态令牌](./docs/dynamic-token.md)
- [发布流程](./RELEASE.md)

## 从旧版本升级

### 从 v0.9.3 升级

**关键变更：Claude CLI 配置路径已更改！**

1. 使用快速安装脚本自动安装新版本：
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

2. **如果你之前手动配置了 Claude CLI，需要更新配置：**

旧的错误配置位置：
- ❌ `~/.claude/claude_code_config.json`

新的正确配置位置：
- ✅ `~/.claude.json`（顶层 `mcpServers` 字段）

**使用 jq 更新配置（推荐）：**
```bash
# 备份配置
cp ~/.claude.json ~/.claude.json.backup

# 添加 gitea-service（注意包含 "type": "stdio"）
jq '.mcpServers["gitea-service"] = {
  "type": "stdio",
  "command": "node",
  "args": ["'$HOME'/.gitea-mcp/dist/index.js"],
  "env": {
    "GITEA_BASE_URL": "https://gitea.ktyun.cc",
    "GITEA_API_TOKEN": "your_token_here"
  }
}' ~/.claude.json > ~/.claude.json.tmp && mv ~/.claude.json.tmp ~/.claude.json
```

或者使用配置向导自动更新：
```bash
bash ~/.gitea-mcp/../configure-clients.sh
```

3. 重启 Claude CLI 以应用更改

4. 使用 `/mcp` 命令验证 gitea-service 已被发现

### 从 v0.9.2 或更早版本升级

建议使用一键安装脚本重新安装，会自动处理所有配置：
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

## 变更日志

### 修复
- **[关键]** 修正 Claude CLI 配置路径从 `~/.claude/claude_code_config.json` 到 `~/.claude.json`
- **[关键]** 添加配置格式中缺失的 `"type": "stdio"` 字段
- 重写 `configure_claude_cli()` 函数以正确更新 `~/.claude.json`

### 改进
- 更新所有文档中的 Claude CLI 配置说明
- 添加配置文件性质和注意事项说明
- 改进配置脚本的错误处理和用户提示
- 添加 jq 依赖检查（配置 Claude CLI 时必需）

### 文档
- 更新 README.md 中的 Claude CLI 配置部分
- 更新 INSTALL.txt 中的配置说明
- 添加 Claude Desktop 与 Claude CLI 配置差异对比表
- 强调 `~/.claude.json` 是主配置文件，不应覆盖

---

**完整变更日志**：https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/compare/v0.9.3...v0.9.4

**当前版本**：v0.9.4 | **工具总数**：46个 | **发布日期**：2025-11-23
