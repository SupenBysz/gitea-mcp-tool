# v0.9.3 - 重要修复版本

## 更新内容

本版本为重要修复版本，解决了影响用户使用的关键问题。

## 重要修复

### 1. 修复 Claude CLI 配置路径错误

**问题描述：**
- Claude CLI 配置路径设置错误
- 使用了错误的 `~/.config/claude/mcp_config.json`
- 导致 Claude CLI 无法发现 gitea-service

**修复方案：**
- 更正为正确路径：`~/.claude/claude_code_config.json`
- 适用于所有平台（macOS/Linux/Windows）
- 更新配置向导脚本和文档

**影响：**
Claude CLI 用户现在可以正常使用 `/mcp` 命令发现和使用 gitea-service。

### 2. 添加依赖自动安装

**问题描述：**
- 发布包中只有编译后代码，没有 node_modules
- 导致 MCP 服务器启动时报错：`Cannot find package '@modelcontextprotocol/sdk'`
- 用户需要手动运行 `npm install` 才能使用

**修复方案：**
- 在 `install-quick.sh` 中添加 `install_dependencies()` 函数
- 安装完成后自动运行 `npm install --production`
- 添加 npm 可用性检查

**影响：**
用户使用一键安装后，MCP 服务器可以立即启动使用，无需额外操作。

## 配置路径验证

所有 MCP 客户端配置路径已完整验证：

| 客户端 | 配置文件路径 | 配置字段 | 状态 |
|--------|-------------|---------|------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | `mcpServers` | ✅ 已验证 |
| Claude CLI | `~/.claude/claude_code_config.json` | `mcpServers` | ✅ 已修复 |
| VSCode (Cline) | `~/Library/Application Support/Code/User/settings.json` | `cline.mcpServers` | ✅ 已验证 |
| Cursor | `~/Library/Application Support/Cursor/User/settings.json` | `mcpServers` | ✅ 已验证 |
| Windsurf | `~/Library/Application Support/Windsurf/User/settings.json` | `mcpServers` | ⚠️ 推测 |

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

下载下方的 `gitea-mcp-v0.9.3.tar.gz` 并解压：
```bash
tar -xzf gitea-mcp-v0.9.3.tar.gz
cd gitea-mcp-v0.9.3

# 安装依赖
npm install --production

# 查看 INSTALL.txt 了解配置方法
```

## 安全校验

**SHA256 校验和：**
```
eecc98bc3aac11d201f1360f4107785ce422164f6cdfa0dcaebea833bb98d6b7
```

验证下载文件：
```bash
shasum -a 256 gitea-mcp-v0.9.3.tar.gz
```

## 文档

- [README](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [初始化指南](./docs/initialization.md)
- [上下文管理](./docs/context-management.md)
- [动态令牌](./docs/dynamic-token.md)
- [发布流程](./RELEASE.md)

## 从旧版本升级

### 从 v0.9.2 升级

1. 使用快速安装脚本自动安装新版本：
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

2. **重要：如果你使用 Claude CLI，需要更新配置文件路径**

原配置文件（错误）：
```
~/.config/claude/mcp_config.json
```

新配置文件（正确）：
```
~/.claude/claude_code_config.json
```

可以使用配置向导自动更新：
```bash
bash ~/.gitea-mcp/../configure-clients.sh
```

或手动移动配置：
```bash
# 如果旧配置存在
if [ -f ~/.config/claude/mcp_config.json ]; then
  mkdir -p ~/.claude
  mv ~/.config/claude/mcp_config.json ~/.claude/claude_code_config.json
fi
```

3. 重启 Claude CLI 以应用更改

### 从 v0.9.1 或更早版本升级

建议使用一键安装脚本重新安装，会自动处理所有配置。

## 变更日志

### 修复
- **[关键]** 修复 Claude CLI 配置路径从 `~/.config/claude/mcp_config.json` 到 `~/.claude/claude_code_config.json`
- **[关键]** 添加依赖自动安装，解决服务器启动失败问题
- 在安装脚本中添加 npm 可用性检查

### 改进
- 更新 README.md 中的 Claude CLI 配置文档
- 统一所有平台的 Claude CLI 配置路径说明
- 改进安装流程（现在是 5 步而非 4 步）

### 文档
- 添加完整的配置路径验证报告
- 明确不同客户端的配置字段差异
- 更新升级指南

---

**完整变更日志**：https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/compare/v0.9.2...v0.9.3

**当前版本**：v0.9.3 | **工具总数**：46个 | **发布日期**：2025-11-23
