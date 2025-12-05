# v1.x → v2.0 迁移指南

本文档帮助用户从 Gitea MCP Tool v1.x 升级到 v2.0。

## 目录

- [版本概述](#版本概述)
- [Breaking Changes](#breaking-changes)
- [升级步骤](#升级步骤)
- [迁移映射表](#迁移映射表)
- [配置变更](#配置变更)
- [常见问题](#常见问题)

---

## 版本概述

### v1.x 特点
- 218 个 MCP 工具
- 所有 Gitea API 操作都通过 MCP 工具
- 高 Context 消耗

### v2.0 特点
- ~22 个智能 MCP 工具（减少 90%）
- 200+ keactl CLI 命令
- 混合架构：智能分析用 MCP，CRUD 操作用 CLI
- 低 Context 消耗，高效率

---

## Breaking Changes

### 1. MCP 工具数量变化

| 版本 | MCP 工具数 | 说明 |
|------|-----------|------|
| v1.x | 218 | 全功能 MCP |
| v2.0 | ~22 | 智能工具 + CLI |

### 2. 移除的 MCP 工具

以下工具已从 MCP 中移除，改为通过 `keactl` CLI 提供：

#### 仓库相关 (Repository)
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_repo_list` | `keactl repo list` |
| `gitea_repo_get` | `keactl repo get` |
| `gitea_repo_create` | `keactl repo create` |
| `gitea_repo_update` | `keactl repo update` |
| `gitea_repo_delete` | `keactl repo delete` |
| `gitea_repo_search` | `keactl repo search` |
| `gitea_repo_fork` | `keactl repo fork` |
| `gitea_repo_transfer` | `keactl repo transfer` |

#### Issue 相关
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_issue_list` | `keactl issue list` |
| `gitea_issue_get` | `keactl issue get` |
| `gitea_issue_update` | `keactl issue update` |
| `gitea_issue_close` | `keactl issue close` |
| `gitea_issue_comment` | `keactl issue comment` |
| `gitea_issue_labels_*` | `keactl issue labels *` |
| `gitea_issue_assignees_*` | `keactl issue assignees *` |

> **注意**: `gitea_issue_create` 保留为智能工具，提供 AI 辅助创建功能

#### PR 相关
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_pr_list` | `keactl pr list` |
| `gitea_pr_get` | `keactl pr get` |
| `gitea_pr_update` | `keactl pr update` |
| `gitea_pr_merge` | `keactl pr merge` |
| `gitea_pr_review` | `keactl pr review` |
| `gitea_pr_diff` | `keactl pr diff` |

> **注意**: `gitea_pr_create` 保留为智能工具

#### 分支相关 (Branch)
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_branch_list` | `keactl branch list` |
| `gitea_branch_get` | `keactl branch get` |
| `gitea_branch_create` | `keactl branch create` |
| `gitea_branch_delete` | `keactl branch delete` |
| `gitea_branch_protection_*` | `keactl branch protection *` |

#### 标签相关 (Label)
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_label_list` | `keactl label list` |
| `gitea_label_get` | `keactl label get` |
| `gitea_label_create` | `keactl label create` |
| `gitea_label_update` | `keactl label update` |
| `gitea_label_delete` | `keactl label delete` |

#### 里程碑相关 (Milestone)
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_milestone_list` | `keactl milestone list` |
| `gitea_milestone_get` | `keactl milestone get` |
| `gitea_milestone_create` | `keactl milestone create` |
| `gitea_milestone_update` | `keactl milestone update` |
| `gitea_milestone_delete` | `keactl milestone delete` |

#### Release 相关
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_release_list` | `keactl release list` |
| `gitea_release_get` | `keactl release get` |
| `gitea_release_create` | `keactl release create` |
| `gitea_release_update` | `keactl release update` |
| `gitea_release_delete` | `keactl release delete` |

#### Wiki 相关
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_wiki_list` | `keactl wiki list` |
| `gitea_wiki_get` | `keactl wiki get` |
| `gitea_wiki_create` | `keactl wiki create` |
| `gitea_wiki_update` | `keactl wiki update` |
| `gitea_wiki_delete` | `keactl wiki delete` |

#### 组织相关 (Organization)
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_org_list` | `keactl org list` |
| `gitea_org_get` | `keactl org get` |
| `gitea_org_members` | `keactl org members` |
| `gitea_org_repos` | `keactl org repos` |
| `gitea_org_teams_*` | `keactl org team *` |

#### 用户相关 (User)
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_user_get` | `keactl user get` |
| `gitea_user_repos` | `keactl user repos` |
| `gitea_user_orgs` | `keactl user orgs` |

#### 通知相关 (Notification)
| v1.x 工具 | v2.0 替代 |
|-----------|----------|
| `gitea_notification_list` | `keactl notification list` |
| `gitea_notification_mark` | `keactl notification mark` |

### 3. 保留的 MCP 工具

以下工具继续作为 MCP 工具提供：

#### 基础设施 (5 个)
- `gitea_init` - 初始化项目配置
- `gitea_mcp_upgrade` - 升级 MCP 工具
- `gitea_context_get` - 获取当前上下文
- `gitea_context_set` - 设置默认上下文
- `gitea_user_current` - 获取当前用户

#### 智能内容生成 (2 个)
- `gitea_issue_create` - AI 辅助创建 Issue
- `gitea_pr_create` - AI 辅助创建 PR

#### 工作流智能分析 (10 个)
- `gitea_workflow_init`
- `gitea_workflow_load_config`
- `gitea_workflow_sync_labels`
- `gitea_workflow_sync_board`
- `gitea_workflow_check_issues`
- `gitea_workflow_infer_labels`
- `gitea_workflow_check_blocked`
- `gitea_workflow_escalate_priority`
- `gitea_workflow_sync_status`
- `gitea_workflow_generate_report`

#### 规范检查 (5 个)
- `gitea_compliance_init`
- `gitea_compliance_check_branch`
- `gitea_compliance_check_commit`
- `gitea_compliance_check_pr`
- `gitea_compliance_check_all`

---

## 升级步骤

### 1. 升级安装

```bash
# 升级到最新版本
npm update -g gitea-mcp-tool

# 或指定 v2.0 版本
npm install -g gitea-mcp-tool@2.0.0

# 验证版本
gitea-mcp --version
```

### 2. 重启 MCP 客户端

升级后需要重启 MCP 客户端以加载新版本：

- **Claude Desktop**: 完全退出并重新打开
- **Claude CLI**: 重新启动终端
- **VS Code (Cline/Continue)**: 重新加载窗口

### 3. 验证安装

```bash
# 检查 keactl CLI 是否可用
keactl --version
keactl --help

# 测试基本功能
keactl repo list
```

### 4. 调整使用方式

将原来的 MCP 工具调用改为 CLI 命令：

```
# v1.x 方式（MCP 工具）
gitea_repo_list()
gitea_issue_get({ index: 42 })

# v2.0 方式（CLI 命令）
keactl repo list
keactl issue get 42
```

---

## 配置变更

### 无需变更

v2.0 保持配置兼容，以下配置无需修改：

- 配置文件位置
- 环境变量名称
- API Token 格式

### 配置文件示例

```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "command": "gitea-mcp",
      "env": {
        "GITEA_BASE_URL": "https://your-gitea-server.com",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

---

## 常见问题

### Q: 为什么移除这些 MCP 工具？

**A**: 为了优化 AI 上下文消耗。

- 每个 MCP 工具都会占用 AI 的上下文窗口
- 218 个工具导致上下文快速耗尽
- 精简到 ~22 个智能工具，减少 90% token 消耗
- CRUD 操作通过 CLI 完成，功能不受影响

### Q: CLI 功能是否完整？

**A**: 完整。

- keactl CLI 提供 200+ 命令
- 覆盖所有 Gitea API 操作
- AI 可以通过 Bash 工具调用 CLI

### Q: 如何回退到 v1.x？

**A**: 安装指定版本：

```bash
npm install -g gitea-mcp-tool@1.x.x
```

> **注意**: v1.x 已停止维护，建议使用 v2.0

### Q: AI 能自动使用 CLI 吗？

**A**: 能。

AI 会根据任务自动选择：
- 智能分析任务 → 使用 MCP 工具
- CRUD 操作 → 通过 Bash 调用 keactl CLI

### Q: 迁移需要修改代码吗？

**A**: 取决于使用方式。

- **AI 交互使用**: 无需修改，AI 自动适应
- **脚本集成**: 需要将 MCP 工具调用改为 CLI 命令

### Q: Prompts 有变化吗？

**A**: 有。

- v1.x: 9 个 Prompts
- v2.0: 8 个 Prompts
- 移除: 项目看板相关 Prompts（功能合并到工作流工具）

### Q: 新版本有什么新功能？

**A**: v2.0 新增：

1. **工作流智能分析** - 10 个工作流管理工具
2. **规范检查** - 5 个代码规范检查工具
3. **CI/CD 配置** - keactl cicd 命令集
4. **混合使用模式** - MCP + CLI 高效协作

---

## 获取帮助

如果在迁移过程中遇到问题：

- [提交 Issue](https://github.com/SupenBysz/gitea-mcp-tool/issues)
- [查看 Wiki](https://github.com/SupenBysz/gitea-mcp-tool/wiki)
- [混合使用指南](./hybrid-usage.md)
