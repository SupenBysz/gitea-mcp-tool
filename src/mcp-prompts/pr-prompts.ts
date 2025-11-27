/**
 * Pull Request Prompts
 *
 * This module provides MCP prompts for Gitea pull request creation, review, and management.
 */

import { PromptContext } from './index.js';

/**
 * Register pull request-related prompts
 *
 * @param context - The prompt context containing the MCP server
 */
export function registerPRPrompts(context: PromptContext): void {
  const { server } = context;

  // Prompt: Create pull request
  server.registerPrompt(
    '创建PR',
    {
      description: '交互式创建 Gitea Pull Request 的提示模板',
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';
      const headInfo = args.head ? `${args.head}` : '待指定';
      const baseInfo = args.base ? `${args.base}` : 'main';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我在 ${ownerInfo}/${repoInfo} 仓库中创建一个 Pull Request。

**分支信息**：
- 源分支（head）: ${headInfo}
- 目标分支（base）: ${baseInfo}

**请提供以下信息**：

**1. 标题** （必需）
简洁明确的 PR 标题，概括本次变更的核心内容。

**2. 描述** （必需）
详细描述本次变更，建议包括：

**变更概述**
- 本次 PR 做了什么？
- 为什么需要这些变更？

**变更内容**
列出主要的变更点：
- 新增功能 A
- 修复 Bug B
- 重构模块 C
- ...

**技术方案**
简要说明实现方案和关键技术点

**测试情况**
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 手动测试已完成
- [ ] 性能测试（如需要）

**相关 Issue**
关联的 Issue 编号（例如：Closes #123, Fixes #456）

**注意事项**
需要审查者特别关注的地方

**3. 审查者** （可选）
指定审查者的用户名列表

**4. 标签** （可选）
为 PR 添加标签，例如：
- feature - 新功能
- bugfix - Bug修复
- refactor - 代码重构
- documentation - 文档更新
- breaking-change - 破坏性变更

**5. 里程碑** （可选）
指定此 PR 归属的里程碑（版本）ID

**创建流程**：
1. 我会先使用 \`gitea_pr_list\` 检查是否已存在类似的 PR
2. 使用 \`gitea_pr_create\` 创建 PR
3. 创建成功后返回 PR 链接

请提供上述信息，或者告诉我直接使用默认描述创建。`,
            },
          },
        ],
      };
    }
  );
}
