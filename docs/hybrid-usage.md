# MCP + CLI 混合使用指南

本文档介绍 Gitea MCP Tool v2.0 的混合架构设计理念和最佳实践。

## 目录

- [架构概述](#架构概述)
- [MCP 智能工具](#mcp-智能工具)
- [keactl CLI](#keactl-cli)
- [混合使用场景](#混合使用场景)
- [最佳实践](#最佳实践)

---

## 架构概述

### 为什么采用混合架构？

v2.0 采用 **MCP 智能工具 + keactl CLI** 混合模式，原因如下：

1. **Context 优化** - MCP 工具从 218 个精简到 ~22 个，减少 90% token 消耗
2. **职责分离** - 智能分析用 MCP，CRUD 操作用 CLI
3. **灵活性** - AI 可根据任务自动选择最优方式
4. **完整功能** - CLI 保留全部 200+ 命令，不牺牲功能

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Gitea MCP Tool v2.0                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐          ┌─────────────────────────┐  │
│  │   MCP Server    │          │      keactl CLI         │  │
│  │  (Lite Mode)    │          │    (Full Features)      │  │
│  ├─────────────────┤          ├─────────────────────────┤  │
│  │ ~22 智能工具    │          │ 200+ 命令               │  │
│  │ • 智能分析      │          │ • 完整 CRUD 操作        │  │
│  │ • 内容生成      │          │ • Issue/PR/Repo 管理    │  │
│  │ • 工作流管理    │          │ • Wiki/Release/Branch   │  │
│  │ • 规范检查      │          │ • CI/CD 配置            │  │
│  └────────┬────────┘          └────────────┬────────────┘  │
│           │                                │               │
│           └────────────┬───────────────────┘               │
│                        ▼                                   │
│              ┌─────────────────┐                           │
│              │   Gitea API     │                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 分工原则

| 操作类型 | 推荐方式 | 原因 |
|---------|---------|------|
| 智能分析 | MCP 工具 | 需要 AI 理解和处理结果 |
| 内容生成 | MCP 工具 | AI 可直接使用生成结果 |
| 工作流管理 | MCP 工具 | 涉及复杂业务逻辑 |
| 规范检查 | MCP 工具 | 需要智能判断和建议 |
| CRUD 操作 | keactl CLI | 简单直接，无需 AI 处理 |
| 批量操作 | keactl CLI | CLI 更高效 |
| 数据查询 | keactl CLI | 返回结构化数据 |

---

## MCP 智能工具

### 工具分类

#### 1. 基础设施 (5 个)

| 工具 | 说明 | 使用场景 |
|------|------|---------|
| `gitea_init` | 初始化项目配置 | 首次配置项目 |
| `gitea_mcp_upgrade` | 升级 MCP 工具 | 检查和执行升级 |
| `gitea_context_get` | 获取当前上下文 | 确认当前工作仓库 |
| `gitea_context_set` | 设置默认上下文 | 切换工作仓库 |
| `gitea_user_current` | 获取当前用户 | 验证认证状态 |

#### 2. 智能内容生成 (2 个)

| 工具 | 说明 | 使用场景 |
|------|------|---------|
| `gitea_issue_create` | AI 辅助创建 Issue | 创建规范化 Issue |
| `gitea_pr_create` | AI 辅助创建 PR | 创建规范化 PR |

#### 3. 工作流智能分析 (10 个)

| 工具 | 说明 | 使用场景 |
|------|------|---------|
| `gitea_workflow_init` | 初始化工作流配置 | 首次配置工作流 |
| `gitea_workflow_load_config` | 加载工作流配置 | 查看当前配置 |
| `gitea_workflow_sync_labels` | 同步标签系统 | 批量创建/更新标签 |
| `gitea_workflow_sync_board` | 同步项目看板 | 创建/更新看板 |
| `gitea_workflow_check_issues` | 检查 Issue 工作流 | 识别问题 Issue |
| `gitea_workflow_infer_labels` | 智能标签推断 | 自动打标签 |
| `gitea_workflow_check_blocked` | 检测阻塞 Issue | 发现阻塞问题 |
| `gitea_workflow_escalate_priority` | 优先级自动升级 | 处理超时 Issue |
| `gitea_workflow_sync_status` | 状态双向同步 | 同步标签和看板 |
| `gitea_workflow_generate_report` | 生成工作流报告 | 项目健康度分析 |

#### 4. 规范检查 (5 个)

| 工具 | 说明 | 使用场景 |
|------|------|---------|
| `gitea_compliance_init` | 初始化规范配置 | 首次配置规范 |
| `gitea_compliance_check_branch` | 检查分支命名 | 验证分支规范 |
| `gitea_compliance_check_commit` | 检查提交信息 | 验证 commit 规范 |
| `gitea_compliance_check_pr` | 检查 PR 规范 | 验证 PR 规范 |
| `gitea_compliance_check_all` | 全面规范检查 | 一键检查所有规范 |

### 使用示例

```typescript
// 智能标签推断 - AI 分析 Issue 内容并自动打标签
gitea_workflow_infer_labels({ issue_number: 42, auto_apply: true })

// 规范检查 - AI 检查代码规范并给出建议
gitea_compliance_check_all()

// 生成报告 - AI 分析项目健康度
gitea_workflow_generate_report({ time_range: "week" })

// 创建 Issue - AI 辅助生成规范化 Issue
gitea_issue_create({
  title: "Bug: 登录失败",
  body: "用户点击登录按钮后页面无响应..."
})
```

---

## keactl CLI

### 命令概览

keactl 提供 200+ 命令，覆盖所有 Gitea API 操作：

```bash
keactl <resource> <action> [options]
```

### 常用命令

#### 仓库操作

```bash
# 列出仓库
keactl repo list
keactl repo list --owner org-name

# 获取仓库信息
keactl repo get
keactl repo get --owner user --repo name

# 搜索仓库
keactl repo search "keyword"
```

#### Issue 操作

```bash
# 列出 Issue
keactl issue list
keactl issue list --state open
keactl issue list --state closed --labels "bug,urgent"

# 获取 Issue 详情
keactl issue get 42

# 创建 Issue
keactl issue create --title "Bug" --body "描述"
keactl issue create --title "Feature" --labels "enhancement"

# 更新 Issue
keactl issue update 42 --title "New Title"
keactl issue update 42 --state closed

# 关闭 Issue
keactl issue close 42

# 添加评论
keactl issue comment 42 --body "评论内容"
```

#### PR 操作

```bash
# 列出 PR
keactl pr list
keactl pr list --state all

# 创建 PR
keactl pr create --title "feat: 新功能" --head feature --base main
keactl pr create --title "fix: 修复" --head fix/bug --base dev --body "详细描述"

# 合并 PR
keactl pr merge 1
keactl pr merge 1 --method squash

# 审查 PR
keactl pr review 1 --event APPROVE
keactl pr review 1 --event REQUEST_CHANGES --body "请修改..."
```

#### Wiki 操作

```bash
# 列出 Wiki 页面
keactl wiki list

# 获取 Wiki 页面
keactl wiki get "Home"
keactl wiki get "Guide/Installation"

# 创建 Wiki 页面
keactl wiki create --title "Guide" --content "# 指南内容"

# 更新 Wiki 页面
keactl wiki update "Guide" --content "# 更新后的内容"

# 删除 Wiki 页面
keactl wiki delete "Obsolete"
```

#### Release 操作

```bash
# 列出 Release
keactl release list

# 创建 Release
keactl release create --tag v1.0.0
keactl release create --tag v1.0.0 --name "Version 1.0" --body "Release notes..."

# 获取 Release
keactl release get --tag v1.0.0
```

#### Branch 操作

```bash
# 列出分支
keactl branch list

# 创建分支
keactl branch create feature/new
keactl branch create feature/new --from main

# 删除分支
keactl branch delete feature/old
```

#### CI/CD 操作

```bash
# 初始化 CI/CD 配置
keactl cicd init
keactl cicd init --template nodejs

# 查看 CI/CD 状态
keactl cicd status

# 验证 CI/CD 配置
keactl cicd validate
```

### AI 如何调用 CLI

AI 助手通过 Bash 工具调用 keactl：

```bash
# AI 执行：获取 Issue 列表
keactl issue list --state open

# AI 执行：批量关闭 Issue
keactl issue close 1 && keactl issue close 2 && keactl issue close 3

# AI 执行：查询并处理
keactl issue get 42 | jq '.labels'
```

---

## 混合使用场景

### 场景 1：Issue 工作流管理

**任务**：管理项目 Issue，确保工作流规范

```
用户: 帮我检查一下项目的 Issue 健康度

AI 操作流程:
1. [MCP] gitea_workflow_check_issues() - 检查所有 Issue 规范性
2. [MCP] gitea_workflow_check_blocked() - 检测阻塞 Issue
3. [MCP] gitea_workflow_generate_report({ time_range: "week" }) - 生成报告
4. [CLI] keactl issue list --state open - 获取详细列表（如需要）
```

### 场景 2：PR 审查和规范检查

**任务**：审查 PR 并检查代码规范

```
用户: 帮我检查 PR #5 是否符合规范

AI 操作流程:
1. [CLI] keactl pr get 5 - 获取 PR 详情
2. [MCP] gitea_compliance_check_pr() - 检查 PR 规范
3. [MCP] gitea_compliance_check_commit() - 检查提交信息
4. [MCP] gitea_compliance_check_branch() - 检查分支命名
5. [CLI] keactl pr review 5 --event COMMENT --body "检查报告..." - 添加审查评论
```

### 场景 3：创建规范化 Issue

**任务**：创建一个新功能 Issue

```
用户: 帮我创建一个关于用户登录功能的 Issue

AI 操作流程:
1. [MCP] gitea_issue_create({
     title: "feat: 添加用户登录功能",
     body: "## 背景\n...\n## 需求\n..."
   }) - AI 辅助生成规范化 Issue
2. [MCP] gitea_workflow_infer_labels({ issue_number: X, auto_apply: true }) - 自动打标签
```

### 场景 4：日常仓库操作

**任务**：查看仓库状态和最近活动

```
用户: 显示一下仓库的基本信息

AI 操作流程:
1. [CLI] keactl repo get - 获取仓库信息
2. [CLI] keactl issue list --state open --limit 5 - 最近的开放 Issue
3. [CLI] keactl pr list --state open --limit 5 - 最近的开放 PR
4. [CLI] keactl release list --limit 3 - 最近的 Release
```

---

## 最佳实践

### 何时使用 MCP 工具

- **需要 AI 分析结果时** - 如规范检查、标签推断
- **生成结构化内容时** - 如创建 Issue/PR
- **执行复杂业务逻辑时** - 如工作流同步、优先级升级
- **需要智能决策时** - 如阻塞检测、健康度评估

### 何时使用 CLI

- **简单 CRUD 操作** - 列表、获取、更新、删除
- **批量操作** - 关闭多个 Issue、批量打标签
- **数据查询** - 获取详细信息供 AI 分析
- **精确控制** - 需要指定具体参数时

### 效率优化建议

1. **先用 CLI 获取数据，再用 MCP 分析**
   ```
   keactl issue list --state open  # 获取数据
   gitea_workflow_check_issues()   # 分析问题
   ```

2. **批量操作优先用 CLI**
   ```bash
   # 好：一次性操作
   keactl issue close 1 && keactl issue close 2

   # 避免：多次 MCP 调用
   ```

3. **复杂任务拆分为 MCP + CLI 组合**
   ```
   # 1. MCP 分析
   gitea_workflow_infer_labels({ issue_number: 42 })

   # 2. CLI 执行
   keactl issue update 42 --labels "bug,priority/P1"
   ```

4. **利用 MCP 工具的智能特性**
   - `auto_apply: true` - 自动应用推断的标签
   - `dry_run: true` - 预览变更不实际执行

### 常见问题

**Q: 为什么不把所有功能都做成 MCP 工具？**

A: 每个 MCP 工具都会消耗 AI 上下文（token）。218 个工具会导致：
- 上下文快速耗尽
- 响应速度变慢
- 成本增加

**Q: CLI 命令 AI 能自动调用吗？**

A: 能。AI 通过 Bash 工具执行 keactl 命令，就像执行其他 shell 命令一样。

**Q: 如何查看所有可用的 CLI 命令？**

A: 使用 `keactl --help` 或 `keactl <resource> --help` 查看。
