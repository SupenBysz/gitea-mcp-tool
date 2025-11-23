# Gitea MCP 工具升级指南

## 📦 升级方式

### 方式 1：使用 MCP 工具升级（推荐）

在支持 MCP 的客户端（Claude Desktop、Claude CLI 等）中，直接使用 `gitea_mcp_upgrade` 工具：

```
# 在 Claude Desktop 或 Claude CLI 中
请使用 gitea_mcp_upgrade 工具升级到最新版本
```

工具会：
1. 检查当前版本
2. 询问确认是否升级
3. 自动下载最新发布包
4. 安装到 `~/.gitea-mcp` 目录
5. 自动安装依赖

**注意**：升级完成后需要重启 MCP 客户端才能生效。

---

### 方式 2：使用安装脚本升级

#### 公开仓库

```bash
# 直接执行安装脚本（会覆盖现有安装）
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

#### 私有仓库

```bash
# 设置认证 Token
export GITEA_API_TOKEN=your_token_here

# 执行安装脚本
bash <(curl -fsSL -H "Authorization: token ${GITEA_API_TOKEN}" \
  https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh)
```

---

### 方式 3：从源码手动升级

```bash
# 1. Clone 或 pull 最新代码
cd ~/gitea-mcp-tool
git pull origin main

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 打包（可选）
bash pack.sh

# 5. 更新 MCP 客户端配置中的路径
# 指向新的 dist/index.js
```

---

## 🔍 检查当前版本

### 使用 MCP 工具

```
# 在 Claude Desktop 或 Claude CLI 中
请使用 gitea_user_current 工具查看服务器信息
```

### 使用命令行

```bash
# 查看已安装版本的 package.json
cat ~/.gitea-mcp/package.json | grep version

# 或者在源码目录
cat package.json | grep version
```

---

## 📋 版本历史

### v1.3.0（当前版本）
- ✅ 新增 `init-project-board` 提示模板
- ✅ 新增 `gitea_mcp_upgrade` 升级工具
- ✅ 支持 12 种项目看板类型
- ✅ 支持 4 种工作流方案
- ✅ 完整看板模板配置系统

### v1.2.0
- ✅ 重命名项目为 gitea-mcp-tool
- ✅ 199 个 API 工具，99% 覆盖度

### v1.1.0
- ✅ 大规模重构，采用 McpServer 高级 API
- ✅ 新增 Wiki、Team、Label 等工具
- ✅ 优化上下文管理
- ✅ 改进日志系统

### v1.0.0
- ✅ 初始版本
- ✅ 基础仓库、Issue、PR 管理
- ✅ 项目配置初始化

---

## 🚨 升级注意事项

### 配置文件兼容性

从 v1.0.x → v1.3.0：
- ✅ 配置文件完全兼容
- ✅ 无需修改配置
- ✅ 自动迁移旧配置

### 破坏性变更

**v1.2.0 → v1.3.0**
- 无破坏性变更

**v1.1.0 → v1.2.0**
- 无破坏性变更

**v1.0.x → v1.1.0**
- 工具注册方式变更（内部实现，不影响使用）
- API 结构调整（向后兼容）

---

## 🔧 升级故障排查

### 问题 1：升级后提示"命令不存在"

**原因**：MCP 客户端未重启

**解决**：
```bash
# 完全退出并重启 Claude Desktop 或 VSCode
```

---

### 问题 2：升级脚本下载失败

**原因**：网络连接问题或认证失败

**解决**：
```bash
# 检查网络连接
ping gitea.ktyun.cc

# 对于私有仓库，检查 Token 是否正确
echo $GITEA_API_TOKEN

# 手动下载脚本
curl -fsSL -H "Authorization: token ${GITEA_API_TOKEN}" \
  https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh \
  -o /tmp/install.sh

# 检查下载的脚本
cat /tmp/install.sh | head -n 10

# 执行安装
bash /tmp/install.sh
```

---

### 问题 3：升级后功能异常

**原因**：依赖未正确安装

**解决**：
```bash
# 进入安装目录
cd ~/.gitea-mcp

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重启 MCP 客户端
```

---

### 问题 4：无法找到 gitea_mcp_upgrade 工具

**原因**：使用的是旧版本

**解决**：
```bash
# 使用安装脚本手动升级
bash <(curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh)
```

---

## 🎯 最佳实践

### 1. 定期检查更新

建议每月检查一次更新：
```
# 在 Claude Desktop 中
请检查 gitea-mcp-tool 是否有新版本，如有请使用 gitea_mcp_upgrade 升级
```

### 2. 备份配置

升级前备份配置文件：
```bash
# 备份项目配置
cp .gitea-mcp.json .gitea-mcp.json.backup

# 备份客户端配置
# Claude Desktop
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json \
   ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup

# VSCode Cline
cp .vscode/settings.json .vscode/settings.json.backup
```

### 3. 测试新版本

升级后建议测试常用功能：
```
# 测试基础功能
gitea_user_current
gitea_context_get
gitea_repo_list

# 测试新功能
使用 init-project-board 提示模板创建测试看板
```

### 4. 查看变更日志

升级前查看 [CHANGELOG.md](../CHANGELOG.md) 了解变更内容。

---

## 📚 相关文档

- [安装指南](../README.md#安装)
- [配置指南](./interactive-features.md)
- [变更日志](../CHANGELOG.md)
- [项目看板方案](./project-board-schemes.md)

---

**最后更新**: 2025-11-23
**当前版本**: v1.3.0
