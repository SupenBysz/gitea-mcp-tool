# v0.9.1 - 私有仓库认证支持

## 更新内容

本版本为补丁版本，主要添加私有仓库的快速安装认证支持。

## 新增功能

### 私有仓库认证支持
- **环境变量认证** (`GITEA_API_TOKEN`)
  - 支持通过环境变量提供访问令牌
  - 自动检测认证状态并提示用户
  - 同时支持 curl 和 wget 的认证方式
  - 为私有/内部仓库提供友好的错误提示

- **认证工作流程**
  - API 版本检测支持认证头
  - 发布包下载支持认证头
  - 认证失败时提供清晰的错误信息和指导

## 优化改进

- 改进错误提示信息的可读性
- 更新默认版本检测为 v0.9.0
- 增强对私有仓库的支持

## 使用方法

### 公开仓库（无需认证）
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

### 私有/内部仓库（需要认证）
```bash
export GITEA_API_TOKEN=your_token_here
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

## 安装

### 快速安装（推荐）
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

### 下载安装包
下载下方的 `gitea-mcp-v0.9.1.tar.gz` 并解压：
```bash
tar -xzf gitea-mcp-v0.9.1.tar.gz
cd gitea-mcp-v0.9.1
# 查看 INSTALL.txt 了解配置方法
```

## 安全校验

**SHA256 校验和：**
```
b667d5405df6bcf4b437d659e79927f1f627d000fa7bf6b0c8c50fc67ea6fb49
```

验证下载文件：
```bash
shasum -a 256 gitea-mcp-v0.9.1.tar.gz
```

## 文档

- [README](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [初始化指南](./docs/initialization.md)
- [上下文管理](./docs/context-management.md)
- [动态令牌](./docs/dynamic-token.md)
- [发布流程](./RELEASE.md)

## 从 v0.9.0 升级

本版本完全向下兼容，无需特殊升级步骤：

1. 使用快速安装脚本自动安装新版本，或
2. 下载新的发布包并替换旧版本

配置文件格式保持不变，现有配置可以继续使用。

---

**完整变更日志**：https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/compare/v0.9.0...v0.9.1

**当前版本**：v0.9.1 | **工具总数**：46个 | **发布日期**：2025-11-23
