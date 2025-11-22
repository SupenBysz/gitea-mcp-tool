# v0.9.0 - 预构建发布与文档专业化

## 更新内容

本版本实现了预构建发布系统，大幅简化部署流程，并对所有文档进行了中文化和专业化重构。

## 新增功能

### 预构建发布系统
- **快速安装脚本** (`install-quick.sh`)
  - 一键下载并安装预构建版本
  - 自动检测最新发布版本（通过 Gitea API）
  - 无需编译，只需 Node.js 18+
  - 安装大小从 ~10MB+ 降至 ~76KB
  - 安装时间从数分钟降至 ~10 秒
  - 安装目录：`~/.gitea-mcp/`

- **发布打包脚本** (`pack.sh`)
  - 自动创建最小化运行时包
  - 仅包含必要文件（dist/, docs/, README.md）
  - 生成 SHA256 校验和用于安全验证
  - 创建便携式 tar.gz 分发包

- **三种安装方式**
  - **Quick**: 下载预构建版本（推荐，最快）
  - **Standard**: 从源码安装（包含 pnpm install 和 build）
  - **Manual**: 手动克隆和配置（完全控制）

### 自动化安装
- **标准安装脚本** (`install.sh`)
  - 自动检查先决条件（Node.js 18+, pnpm, git）
  - 一键克隆仓库、安装依赖、构建项目
  - 彩色日志输出，清晰的进度指示
  - 自动生成配置示例
  - 错误处理和回滚机制

### 发布流程文档
- **完整发布指南** (`RELEASE.md`)
  - 版本更新步骤（npm version）
  - 构建和打包流程
  - Gitea 发布创建指南
  - 发布说明模板（包含 SHA256 校验和）
  - 安装验证步骤
  - 回滚操作指南
  - 未来自动化发布建议

## 文档更新

### 专业化重构
- **文档风格指南** (`DOCUMENTATION_STYLE_GUIDE.md`)
  - 识别并移除 AI 生成风格元素
  - 移除 321 个装饰性 emoji
  - 转换会话式语气为专业技术写作
  - 移除营销语言和冗余修饰
  - 减少过度强调
  - 提供逐文件重构清单

- **README.md 重构**
  - 采用专业技术文档风格
  - 完全中文化
  - 清晰的功能特性描述
  - 三种安装方法说明
  - 修正配置路径示例
  - 添加"配置示例"标签和说明

- **RELEASE.md 中文化**
  - 完整的中文发布流程
  - 清晰的步骤说明
  - 专业的检查清单

- **docs/initialization.md 专业化**
  - 移除所有装饰性 emoji
  - 简化视觉装饰
  - 保持专业技术写作风格
  - 内容保持完整

### 配置路径修正
- 修复不正确的路径：`/path/to/KysionAiStack/packages/gitea-service-mcp/`
- 更新为正确路径：`/path/to/gitea-mcp/dist/index.js`
- 明确标注为配置示例模板

## 优化改进

- 改进文档可读性和专业性
- 简化部署流程（从多步骤到一条命令）
- 减少安装包大小（~99% 减少：从 ~10MB 到 ~76KB）
- 加快安装速度（从数分钟到秒级）
- 增强用户体验（彩色日志、进度提示、错误处理）

## 依赖更新

- 优化 package.json 用于发布打包
- 分离开发依赖和运行时依赖
- 最小化发布包依赖项

## 构建和部署

- `.gitignore` 更新
  - 排除发布包文件（`*.tar.gz`）
  - 排除临时构建目录（`temp_gitea-mcp-*`, `gitea-mcp-v*`）

## 安装

### 快速安装（推荐）
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

### 下载安装包
下载下方的 `gitea-mcp-v0.9.0.tar.gz` 并解压：
```bash
tar -xzf gitea-mcp-v0.9.0.tar.gz
cd gitea-mcp-v0.9.0
# 查看 INSTALL.txt 了解配置方法
```

## 安全校验

**SHA256 校验和：**
```
9fc8c84edae3eb3125de71fb0c42d44a100d0edcda96a8b8fcce59c51ebf534d
```

验证下载文件：
```bash
shasum -a 256 gitea-mcp-v0.9.0.tar.gz
```

## 文档

- [README](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [初始化指南](./docs/initialization.md)
- [上下文管理](./docs/context-management.md)
- [动态令牌](./docs/dynamic-token.md)
- [发布流程](./RELEASE.md)

## 从 v0.8.1 升级

本版本向下兼容，无需特殊升级步骤：

1. 使用快速安装脚本自动安装新版本，或
2. 下载新的发布包并替换旧版本

配置文件格式保持不变，现有配置可以继续使用。

---

**完整变更日志**：https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/compare/v0.8.1...v0.9.0

**当前版本**：v0.9.0 | **工具总数**：46个 | **发布日期**：2025-11-23
