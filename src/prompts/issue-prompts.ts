/**
 * Issue Management Prompts
 *
 * This module provides MCP prompts for Gitea issue creation and management.
 */

import { PromptContext } from './index.js';

/**
 * Register issue-related prompts
 *
 * @param context - The prompt context containing the MCP server
 */
export function registerIssuePrompts(context: PromptContext): void {
  const { server } = context;

  // Prompt: Create issue
  server.prompt(
    {
      name: 'gitea-mcp-tool:创建Issue',
      description: '交互式创建 Gitea Issue 的提示模板',
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
          name: 'issue_type',
          description: 'Issue type (bug, feature, documentation, etc.)',
          required: false,
        },
      ],
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';
      const issueTypeHint = args.issue_type
        ? `\n**Issue 类型**：${args.issue_type}`
        : '';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我在 ${ownerInfo}/${repoInfo} 仓库中创建一个新的 Issue。${issueTypeHint}

**请提供以下信息**：

**1. 标题** （必需）
简洁明确的标题，描述问题或需求的核心内容。

**2. 描述** （必需）
详细描述 Issue 的内容，建议包括：

对于 **Bug**：
- 问题描述：遇到了什么问题？
- 当前行为：实际发生了什么？
- 期望行为：应该发生什么？
- 重现步骤：如何复现这个问题？
  1. 步骤一
  2. 步骤二
  3. ...
- 环境信息：操作系统、浏览器版本、软件版本等
- 相关日志或截图（如果有）

对于 **功能需求**：
- 需求背景：为什么需要这个功能？
- 功能描述：希望实现什么功能？
- 使用场景：在什么情况下使用？
- 预期效果：实现后会有什么价值？

对于 **文档**：
- 文档类型：API文档、用户手册、开发指南等
- 需要改进的内容
- 改进建议

**3. 标签** （可选）
选择合适的标签，例如：
- bug - 软件缺陷
- enhancement - 功能增强
- documentation - 文档相关
- question - 问题咨询
- help wanted - 寻求帮助
- good first issue - 适合新手

**4. 里程碑** （可选）
指定此 Issue 归属的里程碑（版本）ID

**5. 指派给** （可选）
指定负责人的用户名列表

**6. 优先级** （可选）
说明此 Issue 的优先级：低/中/高/紧急

请提供上述信息，我会使用 \`gitea_issue_create\` 工具创建 Issue。`,
            },
          },
        ],
      };
    }
  );

  // Prompt: Manage issue
  server.prompt(
    {
      name: 'gitea-mcp-tool:管理Issue',
      description: '管理现有 Gitea Issue（查看、更新、关闭、评论）',
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
          name: 'issue_number',
          description: 'Issue number to manage',
          required: false,
        },
      ],
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';
      const issueInfo = args.issue_number ? `#${args.issue_number}` : '待选择';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我管理 ${ownerInfo}/${repoInfo} 仓库中的 Issue ${issueInfo}。

**可用操作**：

**1. 查看 Issue**
- \`gitea_issue_list\` - 列出所有 Issue（可按状态、标签筛选）
- \`gitea_issue_get\` - 获取特定 Issue 的详细信息

**2. 更新 Issue**
使用 \`gitea_issue_update\` 可以修改：
- 标题和描述
- 状态（open/closed）
- 标签
- 里程碑
- 指派人员

**3. 评论 Issue**
- \`gitea_issue_comment\` - 添加评论
- 可以在评论中 @ 提及其他用户
- 支持 Markdown 格式

**4. 关闭 Issue**
- \`gitea_issue_close\` - 关闭 Issue
- 或使用 \`gitea_issue_update\` 设置 state="closed"

**5. 标签管理**
- \`gitea_label_issue_add\` - 添加标签
- \`gitea_label_issue_remove\` - 移除标签
- \`gitea_label_issue_replace\` - 替换所有标签

**6. 关联到项目看板**
- \`gitea_project_add_issue\` - 将 Issue 添加到项目看板

**请告诉我你想执行哪个操作**，我会使用相应的工具来完成。

如果还没有指定 Issue 编号，我可以先列出 Issue 列表供你选择。`,
            },
          },
        ],
      };
    }
  );

  // Prompt: Search issues
  server.prompt(
    {
      name: 'gitea-mcp-tool:搜索Issue',
      description: '搜索和筛选 Gitea Issue',
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
      ],
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
              text: `请帮我搜索 ${ownerInfo}/${repoInfo} 仓库中的 Issue。

**搜索条件**（请告诉我你的筛选条件）：

**1. 状态筛选**
- open - 未关闭的 Issue（默认）
- closed - 已关闭的 Issue
- all - 所有 Issue

**2. 标签筛选**
按标签名称筛选（逗号分隔），例如：
- "bug" - 只显示 bug
- "bug,high-priority" - 显示带有 bug 和高优先级标签的 Issue

**3. 分页参数**
- page - 页码（默认：1）
- limit - 每页数量（默认：20，最大：50）

**使用示例**：

- 查看所有未关闭的 Bug：
  state=open, labels="bug"

- 查看已关闭的功能请求：
  state=closed, labels="enhancement"

- 查看所有高优先级 Issue：
  labels="high-priority"

我会使用 \`gitea_issue_list\` 工具根据你的条件搜索 Issue。

**请告诉我你的筛选条件**，或者直接说"显示所有未关闭的 Issue"。`,
            },
          },
        ],
      };
    }
  );
}
