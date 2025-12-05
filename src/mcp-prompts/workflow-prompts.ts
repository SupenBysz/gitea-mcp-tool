/**
 * Workflow Management Prompts
 *
 * This module provides MCP prompts for Issue workflow automation management.
 * Includes 5 prompts:
 * 1. 初始化工作流 - Interactive workflow configuration initialization
 * 2. 管理工作流 - Workflow management panel
 * 3. Issue巡检 - Smart issue health check
 * 4. 生成工作流报告 - Generate workflow analysis report
 * 5. 配置多项目工作流 - Batch workflow configuration for multiple projects
 */

import { PromptContext } from './index.js';

/**
 * Register workflow-related prompts
 *
 * @param context - The prompt context containing the MCP server
 */
export function registerWorkflowPrompts(context: PromptContext): void {
  const { server } = context;

  // Prompt 1: Initialize Workflow
  server.registerPrompt(
    '初始化工作流',
    {
      description: '交互式初始化项目 Issue 工作流配置，包含标签系统、项目看板和自动化规则',
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我为 ${ownerInfo}/${repoInfo} 仓库初始化 Issue 工作流配置。

**工作流配置将包含**：

1. **标签系统**
   - status/* - 状态标签 (backlog, in-progress, review, testing, done)
   - priority/* - 优先级标签 (P0紧急, P1高, P2中, P3低)
   - type/* - 类型标签 (bug, feature, docs, refactor, test, security)
   - area/* - 领域标签 (根据项目类型自动配置)
   - workflow/* - 工作流标签 (blocked, needs-info, needs-review, duplicate)

2. **项目看板**
   - 创建工作流看板，包含 5 个列：
     - Backlog (待处理)
     - In Progress (开发中)
     - Review (审查中)
     - Testing (测试中)
     - Done (已完成)
   - 每个列与对应的状态标签关联

3. **自动化规则**
   - 智能标签推断（基于 Issue 标题和内容）
   - 优先级自动升级（超时自动提升优先级）
   - 阻塞检测（超过 SLA 时间自动标记）
   - 状态同步（标签与看板位置双向同步）

**请选择项目类型**：

| 类型 | 说明 | 推荐领域标签 |
|------|------|-------------|
| \`backend\` | 后端项目 | api, database, auth, performance |
| \`frontend\` | 前端项目 | ui, ux, performance, responsive |
| \`fullstack\` | 全栈项目 | api, ui, database, auth |
| \`library\` | 库项目 | api, docs, examples, compatibility |

**请提供以下信息**：
1. 项目类型（backend/frontend/fullstack/library）
2. 主要编程语言（可选，如 go, typescript, python）

我将使用以下工具完成配置：
- \`gitea_workflow_init\` - 生成配置文件
- \`gitea_workflow_sync_labels\` - 同步标签
- \`gitea_workflow_sync_board\` - 创建项目看板`,
            },
          },
        ],
      };
    }
  );

  // Prompt 2: Manage Workflow
  server.registerPrompt(
    '管理工作流',
    {
      description: '工作流日常管理面板，支持同步标签、看板、检查配置一致性',
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我管理 ${ownerInfo}/${repoInfo} 仓库的 Issue 工作流。

**可用操作**：

| 操作 | 说明 | 工具 |
|------|------|------|
| 1. 查看配置 | 加载并显示当前工作流配置 | \`gitea_workflow_load_config\` |
| 2. 同步标签 | 根据配置创建/更新仓库标签 | \`gitea_workflow_sync_labels\` |
| 3. 同步看板 | 创建/更新项目看板和列 | \`gitea_workflow_sync_board\` |
| 4. 检查 Issue | 检查所有 Issue 的工作流一致性 | \`gitea_workflow_check_issues\` |
| 5. 状态同步 | 同步标签与看板位置 | \`gitea_workflow_sync_status\` |
| 6. 生成报告 | 生成工作流统计报告 | \`gitea_workflow_generate_report\` |

**请选择要执行的操作**（可多选）：

示例：
- "同步标签和看板" - 执行操作 2 和 3
- "全面检查" - 执行操作 1、4、6
- "查看当前状态" - 执行操作 1

请告诉我您想执行哪些操作？`,
            },
          },
        ],
      };
    }
  );

  // Prompt 3: Issue Health Check
  server.registerPrompt(
    'Issue巡检',
    {
      description: '智能 Issue 健康检查，识别问题并提供修复建议',
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';
      const issueNumber = args.issue_number ? `#${args.issue_number}` : '所有开放的';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请对 ${ownerInfo}/${repoInfo} 仓库的 ${issueNumber} Issue 进行健康检查。

**检查项目**：

| 检查项 | 说明 | 严重程度 |
|--------|------|----------|
| 标签完整性 | 是否有类型、优先级、状态标签 | 警告 |
| 阻塞检测 | 是否超过 SLA 时间未更新 | 严重 |
| 标签冲突 | 是否有多个互斥的标签 | 错误 |
| 看板同步 | 标签与看板位置是否一致 | 警告 |
| 智能推断 | 基于内容推断缺失的标签 | 建议 |

**输出内容**：

1. **健康度评分** (0-100)
2. **问题列表**
   - 严重问题（需要立即处理）
   - 警告（建议处理）
   - 建议（可选优化）
3. **修复建议**
   - 自动修复选项
   - 手动操作指南

**巡检选项**：
- 检查单个 Issue：提供 issue_number 参数
- 检查所有 Issue：不提供参数

我将使用以下工具进行检查：
- \`gitea_workflow_check_issues\` - 检查工作流规则
- \`gitea_workflow_infer_labels\` - 智能标签推断
- \`gitea_workflow_check_blocked\` - 检测阻塞 Issue

是否需要自动应用修复建议？（是/否）`,
            },
          },
        ],
      };
    }
  );

  // Prompt 4: Generate Workflow Report
  server.registerPrompt(
    '生成工作流报告',
    {
      description: '生成项目 Issue 工作流分析报告，包含统计数据和改进建议',
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';
      const timeRange = args.time_range || 'week';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请为 ${ownerInfo}/${repoInfo} 仓库生成工作流分析报告。

**报告维度**：

| 维度 | 内容 |
|------|------|
| 概览 | 开放/关闭 Issue 数量、健康度评分 |
| 状态分布 | 各状态标签的 Issue 数量 |
| 优先级分布 | P0-P3 各优先级的 Issue 数量 |
| 类型分布 | bug/feature/docs 等类型分布 |
| 阻塞分析 | 阻塞 Issue 列表和原因 |
| 效率指标 | 平均 Issue 年龄、解决时间 |

**报告时间范围**：
- \`day\` - 今日统计
- \`week\` - 本周统计（默认）
- \`month\` - 本月统计

**输出格式**：
- JSON 数据（用于程序处理）
- Markdown 报告（用于阅读分享）

**改进建议**：
报告末尾会包含基于数据分析的改进建议，例如：
- 阻塞 Issue 过多时的处理建议
- 优先级分布不均时的调整建议
- Issue 年龄过长时的加速建议

我将使用 \`gitea_workflow_generate_report\` 工具生成报告。

请确认报告时间范围（day/week/month），默认为 ${timeRange}：`,
            },
          },
        ],
      };
    }
  );

  // Prompt 5: Configure Multi-Project Workflow
  server.registerPrompt(
    '配置多项目工作流',
    {
      description: '批量为多个项目配置工作流，适用于组织级别的统一管理（使用 keactl CLI）',
    },
    async (args) => {
      const orgName = args.org || '指定组织';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我为 ${orgName} 组织下的多个仓库配置 Issue 工作流。

**MCP 2.0 混合模式说明**：
此功能使用 MCP 智能工具 + keactl CLI 混合模式完成。
- 获取组织仓库列表：使用 \`keactl repo list --owner <org>\` CLI 命令
- 配置工作流：使用 MCP 工具

**批量配置流程**：

1. **获取目标仓库列表**
   使用 keactl CLI 命令：
   \`\`\`bash
   # 列出组织下所有仓库
   keactl repo list --owner ${orgName}
   \`\`\`

2. **选择配置模式**
   | 模式 | 说明 |
   |------|------|
   | 统一模板 | 所有仓库使用相同的工作流配置 |
   | 按类型配置 | 根据仓库检测的项目类型自动选择模板 |
   | 自定义配置 | 为每个仓库单独指定配置 |

3. **为每个仓库执行配置**
   对每个目标仓库依次执行：
   - \`gitea_workflow_init\` - 生成配置文件
   - \`gitea_workflow_sync_labels\` - 同步标签
   - \`gitea_workflow_sync_board\` - 创建看板

4. **生成汇总报告**
   - 显示每个仓库的配置结果
   - 统计成功/失败数量

**请提供以下信息**：

1. 组织名称或仓库列表
2. 配置模式（统一模板/按类型配置/自定义配置）
3. 如选择统一模板，请指定项目类型（backend/frontend/fullstack/library）

**示例**：
- "为 Kysion 组织的所有仓库配置 backend 类型的工作流"
- "为 repo1, repo2, repo3 配置工作流，按项目类型自动选择模板"

请提供配置信息：`,
            },
          },
        ],
      };
    }
  );
}
