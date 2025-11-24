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
  server.registerPrompt(
    '创建Issue',
    {
      description: '交互式创建 Gitea Issue 的提示模板',
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
}
