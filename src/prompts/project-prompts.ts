/**
 * Project Board Prompts
 *
 * This module provides MCP prompts for Gitea project board initialization and management.
 */

import { PromptContext } from './index.js';

/**
 * Register project board-related prompts
 *
 * @param context - The prompt context containing the MCP server
 */
export function registerProjectPrompts(context: PromptContext): void {
  const { server } = context;

  // Prompt: Initialize project board
  server.prompt(
    {
      name: 'gitea-mcp-tool:初始化项目看板',
      description: '交互式初始化 Gitea 项目看板的提示模板',
      arguments: [
        {
          name: 'owner',
          description: 'Repository owner (username or organization)',
          required: false,
        },
        {
          name: 'repo',
          description: 'Repository name',
          required: false,
        },
      ],
    },
    async (args) => {
      const ownerInfo = args.owner ? `owner="${args.owner}"` : '使用上下文默认值';
      const repoInfo = args.repo ? `repo="${args.repo}"` : '使用上下文默认值';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我初始化 Gitea 项目看板。

**仓库信息**：
- Owner: ${ownerInfo}
- Repo: ${repoInfo}

**项目看板类型**（从以下12种中选择）：

1. **Bug追踪看板** - 集中管理和追踪软件缺陷
2. **部署实施看板** - 管理系统部署、上线、发布流程
3. **运维管理看板** - 日常运维任务、系统维护、监控告警
4. **文档维护看板** - 管理技术文档、用户手册、API文档
5. **优化改进看板** - 代码重构、性能优化、技术债务管理
6. **功能开发看板** - 新功能设计、开发、交付
7. **测试管理看板** - 测试用例编写、测试执行、缺陷跟踪
8. **安全与合规看板** - 安全漏洞修复、合规性审查、安全加固
9. **研发运营看板** - CI/CD流水线、基础设施即代码、自动化工具
10. **客户支持看板** - 客户反馈、支持工单、功能请求
11. **设计与原型看板** - UI/UX设计、原型评审、设计系统维护
12. **数据与分析看板** - 数据需求、报表开发、数据质量管理

**工作流方案**（4种可选）：

**极简版（3状态）** - 适合个人项目和小团队
  待办 → 进行中 → 已完成

**标准版（5状态）** - 适合小型团队和标准开发流程
  待办事项 → 计划中 → 进行中 → 测试验证 → 已完成

**全面版（8状态）** - 适合中大型团队和企业级项目
  待办事项 → 需求分析 → 设计评审 → 开发中 → 代码审查 → 测试中 → 预发布 → 已完成

**敏捷迭代版（6状态）** - 适合Scrum敏捷团队
  待办池 → Sprint待办 → 开发中 → 代码评审 → 测试/验收 → 已完成

**请告诉我**：
1. 你想创建哪种类型的看板？（输入1-12的数字）
2. 你想使用哪种工作流方案？（极简版/标准版/全面版/敏捷迭代版）

**我会执行以下操作**：
1. 使用 \`gitea_project_create\` 创建项目看板
2. 使用 \`gitea_project_column_create\` 创建对应的看板列
3. 根据看板类型，使用 \`gitea_label_repo_create\` 创建预置标签
4. 提供看板使用指南

更多详细信息，请参考项目中的 docs/project-board-schemes.md 文档。`,
            },
          },
        ],
      };
    }
  );

  // Prompt: Manage project board
  server.prompt(
    {
      name: 'gitea-mcp-tool:管理项目看板',
      description: '管理现有 Gitea 项目看板（查看、更新、添加卡片）',
      arguments: [
        {
          name: 'owner',
          description: 'Repository owner',
          required: false,
        },
        {
          name: 'repo',
          description: 'Repository name',
          required: false,
        },
        {
          name: 'project_id',
          description: 'Project ID to manage',
          required: false,
        },
      ],
    },
    async (args) => {
      const ownerInfo = args.owner ? `owner="${args.owner}"` : '使用上下文默认值';
      const repoInfo = args.repo ? `repo="${args.repo}"` : '使用上下文默认值';
      const projectInfo = args.project_id ? `ID=${args.project_id}` : '待选择';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我管理 Gitea 项目看板。

**仓库信息**：
- Owner: ${ownerInfo}
- Repo: ${repoInfo}
- Project: ${projectInfo}

**可用操作**：

1. **查看项目列表**
   使用 \`gitea_project_list\` 列出所有项目看板

2. **查看项目详情**
   使用 \`gitea_project_get\` 查看特定项目的详细信息
   使用 \`gitea_project_columns\` 查看项目的所有列

3. **更新项目**
   使用 \`gitea_project_update\` 修改项目标题、描述或状态

4. **管理列**
   使用 \`gitea_project_column_create\` 创建新列
   移动和组织现有的列

5. **添加 Issue 到看板**
   使用 \`gitea_project_add_issue\` 将 Issue 添加到指定列

**请告诉我你想执行哪个操作**，我会使用相应的工具来完成。`,
            },
          },
        ],
      };
    }
  );
}
