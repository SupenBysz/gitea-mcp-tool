# 更新日志 / Changelog

所有重要的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

#### Issue 评论完整操作支持
- **MCP 工具** (4个新增)
  - `gitea_issue_comments_list` - 列出 Issue 所有评论
  - `gitea_issue_comment_get` - 获取单个评论详情
  - `gitea_issue_comment_edit` - 编辑评论内容
  - `gitea_issue_comment_delete` - 删除评论
- **CLI 命令** (4个新增)
  - `keactl issue comments <index>` - 列出 Issue 评论
  - `keactl issue comment-get <id>` - 获取评论详情
  - `keactl issue comment-edit <id> --body "内容"` - 编辑评论
  - `keactl issue comment-delete <id>` - 删除评论

#### Issue 被依赖列表查询
- **MCP 工具** (1个新增)
  - `gitea_issue_blocks_list` - 获取依赖当前 Issue 的其他 Issue 列表（反向依赖查询）

### 修复
- 中文 Wiki 页面获取 404 问题 (#47)
  - 优化 Wiki 页面名称变体生成逻辑
  - 对于非 ASCII 页面（如中文），优先使用 `.md` 后缀
  - 改进 URL 编码处理
- Codex 无法发现 MCP：新增项目级 `.mcp.json` 分发并在 README 增补通用客户端配置指引，确保 Codex/通用 MCP 客户端可自动检测 gitea-mcp-tool。
- 配置加载回退：服务器启动时将从 `.gitea-mcp.json` / `.gitea-mcp.local.json` / 全局配置解析 baseUrl 与 token（含 tokenRef/apiTokenEnv），不再仅依赖环境变量。
- 发行脚本：`pack.sh` 将 `.mcp.json` 打入发布包；`.gitignore` 忽略 `.mcp.local.json`。

### 文档
- README 更新工具数量为 217 个 MCP 工具
- README 新增 CLI 评论操作命令说明
- README 新增 Codex/LM Studio 等通用 MCP 客户端的 `.mcp.json` 示例与 token 配置提示

---

## [1.3.0] - 2025-11-23

### 🎉 新增

#### 交互式提示模板
- ✅ **项目看板初始化提示** (`init-project-board`)
  - 交互式引导用户选择看板类型和工作流
  - 支持 12 种预置看板类型（Bug追踪、部署实施、运维管理等）
  - 支持 4 种工作流方案（极简版、标准版、全面版、敏捷迭代版）
  - 自动创建看板、列和预置标签
  - 详细文档：`docs/project-board-schemes.md`

#### 工具管理
- ✅ **一键升级工具** (`gitea_mcp_upgrade`)
  - 自动检测当前版本
  - 交互式确认升级流程
  - 自动下载最新发布包
  - 自动安装到 `~/.gitea-mcp` 目录
  - 升级指南：`docs/upgrade-guide.md`

#### 看板模板配置
- ✅ **看板模板定义** (`config/board-templates.json`)
  - 12 种看板类型的完整配置
  - 4 种工作流方案的列定义
  - 每种看板类型的预置标签配置
  - 智能推荐最佳工作流方案

### 📚 文档
- ✅ 新增 `docs/project-board-schemes.md` - 项目看板方案详细说明
- ✅ 新增 `docs/upgrade-guide.md` - 升级指南和故障排查
- ✅ 更新 README.md - 添加新功能说明

### 计划中
- 更多测试覆盖
- 看板模板自动导入功能
- 批量Issue创建功能

---

## [0.9.0] - 2025-11-23

### 🎉 新增

#### 预构建发布系统
- ✅ **快速安装脚本** (`install-quick.sh`)
  - 一键下载并安装预构建版本
  - 自动检测最新发布版本（通过 Gitea API）
  - 无需编译，只需 Node.js 18+
  - 安装大小从 ~10MB+ 降至 ~76KB
  - 安装时间从数分钟降至 ~10 秒
  - 安装目录：`~/.gitea-mcp/`
- ✅ **发布打包脚本** (`pack.sh`)
  - 自动创建最小化运行时包
  - 仅包含必要文件（dist/, docs/, README.md）
  - 生成 SHA256 校验和用于安全验证
  - 创建便携式 tar.gz 分发包
- ✅ **三种安装方式**
  - **Quick**: 下载预构建版本（推荐，最快）
  - **Standard**: 从源码安装（包含 pnpm install 和 build）
  - **Manual**: 手动克隆和配置（完全控制）

#### 自动化安装
- ✅ **标准安装脚本** (`install.sh`)
  - 自动检查先决条件（Node.js 18+, pnpm, git）
  - 一键克隆仓库、安装依赖、构建项目
  - 彩色日志输出，清晰的进度指示
  - 自动生成配置示例
  - 错误处理和回滚机制

#### 发布流程文档
- ✅ **完整发布指南** (`RELEASE.md`)
  - 版本更新步骤（npm version）
  - 构建和打包流程
  - Gitea 发布创建指南
  - 发布说明模板（包含 SHA256 校验和）
  - 安装验证步骤
  - 回滚操作指南
  - 未来自动化发布建议

### 📚 文档

#### 专业化重构
- ✅ **文档风格指南** (`DOCUMENTATION_STYLE_GUIDE.md`)
  - 识别并移除 AI 生成风格元素
  - 移除 321 个装饰性 emoji
  - 转换会话式语气为专业技术写作
  - 移除营销语言和冗余修饰
  - 减少过度强调
  - 提供逐文件重构清单
- ✅ **README.md 重构**
  - 采用专业技术文档风格
  - 清晰的功能特性描述
  - 三种安装方法说明
  - 修正配置路径示例
  - 添加"配置示例"标签和说明
- ✅ **配置路径修正**
  - 修复不正确的路径：`/path/to/KysionAiStack/packages/gitea-mcp-tool/`
  - 更新为正确路径：`/path/to/gitea-mcp/dist/index.js`
  - 明确标注为配置示例模板

### 🔧 优化

- ✅ 改进文档可读性和专业性
- ✅ 简化部署流程（从多步骤到一条命令）
- ✅ 减少安装包大小（~99% 减少：从 ~10MB 到 ~76KB）
- ✅ 加快安装速度（从数分钟到秒级）
- ✅ 增强用户体验（彩色日志、进度提示、错误处理）

### 📦 依赖

- ✅ 优化 package.json 用于发布打包
- ✅ 分离开发依赖和运行时依赖
- ✅ 最小化发布包依赖项

### 🛠️ 构建和部署

- ✅ `.gitignore` 更新
  - 排除发布包文件（`*.tar.gz`）
  - 排除临时构建目录（`temp_gitea-mcp-*`, `gitea-mcp-v*`）

---

## [0.8.1] - 2025-11-23

### 🎉 新增

#### 配置初始化系统
- ✅ **交互式配置向导** (`gitea_mcp_init`)
  - 8 步交互式配置流程
  - 自动检测 Git 仓库信息（服务器、owner、repo）
  - 支持多种 Token 创建方式（用户名密码、手动输入、缓存、环境变量）
  - 灵活的 Token 存储策略（全局、本地、环境变量）
  - 配置预览和确认
  - 自动创建项目配置文件

#### 多语言支持
- ✅ **i18n 国际化系统**
  - 完整的中英文语言包
  - 支持动态语言切换
  - 语言偏好持久化到全局配置
- ✅ **语言管理工具**
  - `gitea_mcp_language_set` - 切换界面语言
  - `gitea_mcp_language_get` - 查看当前语言和支持的语言列表

#### 配置管理系统
- ✅ **三级配置架构**
  - 全局配置 (`~/.gitea-mcp/config.json`)
  - 项目配置 (`.gitea-mcp.json`)
  - 本地配置 (`.gitea-mcp.local.json`)
- ✅ **全局配置管理器** (`src/config/global.ts`)
  - 多服务器管理
  - Token 缓存和复用
  - 最近项目历史
  - 用户偏好设置
- ✅ **项目配置管理器** (`src/config/project.ts`)
  - 项目级配置（团队共享）
  - 本地配置（个人私密）
  - 配置合并和优先级处理
  - 自动添加 `.gitea-mcp.local.json` 到 `.gitignore`

#### Git 自动检测
- ✅ **Git 仓库信息检测** (`src/utils/git-detector.ts`)
  - 自动读取 Git remote URL
  - 解析服务器地址、owner、repo
  - 支持 SSH 和 HTTPS 格式
  - 支持灵活的 SSH 用户名（`git@` 和 `gitea@`）

### 🔧 优化

- ✅ 改进 Git URL 解析正则表达式
  - 修复仅支持 `git@` 用户名的问题
  - 现在支持任意 SSH 用户名（如 `gitea@`）
- ✅ 增强配置文件验证
- ✅ 优化错误提示信息
- ✅ 改进交互式提示体验

### 📚 文档

- ✅ 更新 README.md
  - 添加初始化系统介绍
  - 更新快速开始指南
  - 添加新工具说明
  - 更新开发进度表
- ✅ 新增 `docs/initialization.md`
  - 完整的初始化系统文档
  - 详细的配置说明
  - 最佳实践指南
  - 故障排查手册
- ✅ 新增 `CHANGELOG.md`
  - 完整的版本迭代记录

### 🧪 测试

- ✅ 创建 `test-init.ts` 综合测试脚本
  - i18n 系统测试
  - Git 检测测试
  - 全局配置管理测试
  - 项目配置管理测试
  - 语言切换测试
- ✅ 所有测试通过

### 🐛 修复

- ✅ 修复 Git URL 解析失败问题 ([#issue-link])
  - **问题**: SSH URL 以 `gitea@` 开头时解析失败
  - **原因**: 正则表达式仅匹配 `git@` 前缀
  - **解决**: 改用 `/^[^@]+@([^:]+):(.+)$/` 支持任意用户名

### 📦 依赖

- ✅ 新增 `uuid` - 用于生成唯一 ID
- ✅ 新增 `prompts` - 用于交互式命令行界面

---

## [0.5.0] - 2025-10-30

### 🎉 新增

#### Wiki 管理功能
- ✅ **Wiki 管理工具** (8个)
  - `gitea_wiki_list` - 列出所有 Wiki 页面
  - `gitea_wiki_get` - 获取 Wiki 页面内容
  - `gitea_wiki_create` - 创建新 Wiki 页面
  - `gitea_wiki_update` - 更新 Wiki 页面
  - `gitea_wiki_delete` - 删除 Wiki 页面
  - `gitea_wiki_revisions` - 获取页面修订历史
  - `gitea_wiki_get_revision` - 获取特定版本内容
  - `gitea_wiki_search` - 搜索 Wiki 页面

### 📚 文档

- ✅ 添加 Wiki 管理使用示例
- ✅ 更新工具列表

---

## [0.4.0] - 2025-10-25

### 🎉 新增

#### Milestone 里程碑管理
- ✅ **Milestone 管理工具** (5个)
  - `gitea_milestone_create` - 创建里程碑
  - `gitea_milestone_list` - 列出里程碑
  - `gitea_milestone_get` - 获取里程碑详情
  - `gitea_milestone_update` - 更新里程碑
  - `gitea_milestone_delete` - 删除里程碑

#### 用户和组织管理
- ✅ **用户/组织管理工具** (4个)
  - `gitea_user_get` - 获取用户信息
  - `gitea_user_orgs` - 列出用户的组织
  - `gitea_org_get` - 获取组织信息
  - `gitea_org_members` - 列出组织成员

---

## [0.3.0] - 2025-10-20

### 🎉 新增

#### Project 看板管理
- ✅ **Project 管理工具** (7个)
  - `gitea_project_create` - 创建项目看板
  - `gitea_project_get` - 获取项目详情
  - `gitea_project_list` - 列出项目看板
  - `gitea_project_update` - 更新项目看板
  - `gitea_project_delete` - 删除项目看板
  - `gitea_project_columns` - 列出项目的列
  - `gitea_project_column_create` - 创建项目列

---

## [0.2.0] - 2025-10-15

### 🎉 新增

#### Pull Request 管理
- ✅ **PR 管理工具** (6个)
  - `gitea_pr_create` - 创建 Pull Request
  - `gitea_pr_get` - 获取 PR 详情
  - `gitea_pr_list` - 列出 Pull Requests
  - `gitea_pr_update` - 更新 Pull Request
  - `gitea_pr_merge` - 合并 Pull Request
  - `gitea_pr_review` - 审查 Pull Request

### 🔧 优化

- ✅ 改进错误处理
- ✅ 优化 API 调用性能
- ✅ 增强类型定义

---

## [0.1.0] - 2025-10-10

### 🎉 新增

#### 基础框架
- ✅ MCP Server 基础架构
- ✅ Gitea API 客户端封装
- ✅ 配置管理系统
- ✅ 日志系统

#### 上下文管理
- ✅ **上下文管理工具** (3个)
  - `gitea_context_get` - 获取当前上下文
  - `gitea_context_set` - 设置默认上下文
  - `gitea_user_current` - 获取当前用户信息

#### 仓库管理
- ✅ **Repository 管理工具** (5个)
  - `gitea_repo_create` - 创建仓库
  - `gitea_repo_get` - 获取仓库详情
  - `gitea_repo_list` - 列出仓库
  - `gitea_repo_delete` - 删除仓库
  - `gitea_repo_search` - 搜索仓库

#### Issue 管理
- ✅ **Issue 管理工具** (6个)
  - `gitea_issue_create` - 创建 Issue
  - `gitea_issue_get` - 获取 Issue 详情
  - `gitea_issue_list` - 列出 Issues
  - `gitea_issue_update` - 更新 Issue
  - `gitea_issue_comment` - 添加 Issue 评论
  - `gitea_issue_close` - 关闭 Issue

### 📚 文档

- ✅ 创建 README.md
- ✅ 添加配置指南
- ✅ 添加使用示例

---

## 版本号说明

本项目使用 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号 (Major)**: 不兼容的 API 修改
- **次版本号 (Minor)**: 向下兼容的功能性新增
- **修订号 (Patch)**: 向下兼容的问题修正

## 图例

- 🎉 **新增** - 新功能
- 🔧 **优化** - 功能改进
- 🐛 **修复** - Bug 修复
- 📚 **文档** - 文档更新
- 🧪 **测试** - 测试相关
- 📦 **依赖** - 依赖更新
- ⚠️ **废弃** - 即将移除的功能
- 🗑️ **移除** - 已移除的功能

## 链接

- [Git 仓库](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [问题追踪](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/issues)
- [Pull Requests](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/pulls)
