# v0.9.2 - 交互式输入修复

## 更新内容

本版本为补丁版本，主要修复通过 `curl | bash` 管道执行安装脚本时交互式输入无法工作的问题。

## Bug 修复

### 修复管道执行时交互式输入失败

**问题描述：**
- 通过 `curl | bash` 管道执行 `install-quick.sh` 时，所有交互式提示被自动跳过
- 用户无法选择是否运行配置向导
- 配置向导中的所有输入（URL、Token、客户端选择）都无法正常工作

**根本原因：**
在管道执行环境中，标准输入流被 curl 的输出占用，`read` 命令无法从终端读取用户输入。

**修复方案：**
在所有 `read` 命令中添加 `< /dev/tty`，强制从终端设备读取输入，而不是从标准输入流读取。

**修复范围：**
- `install-quick.sh`: 1 处
  - 配置向导询问提示
- `configure-clients.sh`: 8 处
  - Claude Desktop/CLI/VSCode 配置目录创建确认（3 处）
  - 客户端选择菜单输入（1 处）
  - Gitea 服务器地址输入（2 处）
  - API Token 输入（2 处）

## 影响

现在用户可以正常使用一键安装命令：
```bash
curl -fsSL -H "Authorization: token ${GITEA_API_TOKEN}" \
  https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

安装完成后会正常提示：
- 是否运行配置向导
- 输入 Gitea 服务器地址（有默认值）
- 输入 API Token（支持保持环境变量值）
- 选择要配置的 MCP 客户端

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

下载下方的 `gitea-mcp-v0.9.2.tar.gz` 并解压：
```bash
tar -xzf gitea-mcp-v0.9.2.tar.gz
cd gitea-mcp-v0.9.2
# 查看 INSTALL.txt 了解配置方法
```

## 安全校验

**SHA256 校验和：**
```
4d6826ee3ef45911dcc5028927fcaef6f636c141d7692b3baf3f639a5fe1a9af
```

验证下载文件：
```bash
shasum -a 256 gitea-mcp-v0.9.2.tar.gz
```

## 文档

- [README](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [初始化指南](./docs/initialization.md)
- [上下文管理](./docs/context-management.md)
- [动态令牌](./docs/dynamic-token.md)
- [发布流程](./RELEASE.md)

## 从 v0.9.1 升级

本版本完全向下兼容，无需特殊升级步骤：

1. 使用快速安装脚本自动安装新版本，或
2. 下载新的发布包并替换旧版本

配置文件格式保持不变，现有配置可以继续使用。

## 变更日志

### 修复
- 修复通过 `curl | bash` 管道执行时交互式输入无法工作的问题
- 所有 `read` 命令现在使用 `< /dev/tty` 从终端读取输入

### 改进
- 改进配置向导的交互式参数收集体验
- 添加 Claude CLI 作为独立的配置目标
- 优化 Gitea URL 和 API Token 的输入提示

---

**完整变更日志**：https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/compare/v0.9.1...v0.9.2

**当前版本**：v0.9.2 | **工具总数**：46个 | **发布日期**：2025-11-23
