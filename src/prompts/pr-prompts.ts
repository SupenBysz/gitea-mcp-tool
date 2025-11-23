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
  server.prompt(
    {
      name: 'gitea-mcp-tool:创建PR',
      description: '交互式创建 Gitea Pull Request 的提示模板',
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
          name: 'head',
          description: 'Source branch (branch to merge from)',
          required: false,
        },
        {
          name: 'base',
          description: 'Target branch (branch to merge into, default: main)',
          required: false,
        },
      ],
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

  // Prompt: Review pull request
  server.prompt(
    {
      name: 'gitea-mcp-tool:审查PR',
      description: '交互式审查 Gitea Pull Request 的提示模板',
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
          name: 'pr_number',
          description: 'Pull Request number',
          required: false,
        },
      ],
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';
      const prInfo = args.pr_number ? `#${args.pr_number}` : '待选择';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我审查 ${ownerInfo}/${repoInfo} 仓库中的 Pull Request ${prInfo}。

**审查流程**：

**1. 获取 PR 信息**
我会使用 \`gitea_pr_get\` 获取 PR 的详细信息：
- PR 标题和描述
- 源分支和目标分支
- 提交历史
- 文件变更统计

**2. 代码审查重点**
我会重点检查以下方面：

**代码质量**
- 代码是否符合项目规范？
- 是否有明显的代码异味？
- 命名是否清晰易懂？
- 注释是否充分？

**功能正确性**
- 是否实现了预期功能？
- 是否有逻辑错误？
- 边界条件是否处理正确？

**性能考虑**
- 是否有性能问题？
- 是否有资源泄漏风险？
- 查询效率是否合理？

**安全性**
- 是否有安全漏洞？
- 输入验证是否充分？
- 敏感数据是否正确处理？

**测试覆盖**
- 是否包含测试代码？
- 测试覆盖是否充分？
- 是否有边界测试？

**文档完整性**
- API 文档是否更新？
- README 是否需要更新？
- 变更日志是否记录？

**3. 提交审查意见**
根据审查结果，我会使用 \`gitea_pr_review\` 提交审查意见：

**✅ APPROVE（批准）**
- 代码质量好，没有发现问题
- 可以直接合并

**💬 COMMENT（评论）**
- 提出一些建议和改进点
- 但不阻止合并

**❌ REQUEST_CHANGES（请求修改）**
- 发现必须修改的问题
- 需要修改后才能合并

**4. 行级评论**（如需要）
如果需要对特定代码行提出意见，我可以添加行级评论。

**请告诉我**：
- 如果没有指定 PR 编号，我需要先列出未合并的 PR
- 你希望我重点关注哪些方面？
- 是否需要详细的逐行审查？

我会开始审查流程。`,
            },
          },
        ],
      };
    }
  );

  // Prompt: Manage pull request
  server.prompt(
    {
      name: 'gitea-mcp-tool:管理PR',
      description: '管理现有 Gitea Pull Request（合并、更新、关闭）',
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
          name: 'pr_number',
          description: 'Pull Request number',
          required: false,
        },
      ],
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';
      const prInfo = args.pr_number ? `#${args.pr_number}` : '待选择';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我管理 ${ownerInfo}/${repoInfo} 仓库中的 Pull Request ${prInfo}。

**可用操作**：

**1. 查看 PR**
- \`gitea_pr_list\` - 列出所有 PR（可按状态筛选）
- \`gitea_pr_get\` - 获取特定 PR 的详细信息

**2. 更新 PR**
使用 \`gitea_pr_update\` 可以修改：
- 标题和描述
- 标签
- 里程碑
- 指派人员
- 状态（open/closed）

**3. 合并 PR**
使用 \`gitea_pr_merge\` 合并 PR，支持多种合并方式：

**merge（普通合并）**
- 保留所有提交历史
- 创建一个合并提交
- 适合：需要完整保留开发历史

**squash（压缩合并）**
- 将所有提交压缩为一个
- 保持主分支历史简洁
- 适合：功能分支有很多小提交

**rebase（变基合并）**
- 将提交重新应用到目标分支
- 保持线性历史
- 适合：追求简洁的历史记录

**rebase-merge（变基后合并）**
- 先变基再创建合并提交
- 结合两种方式的优点

**4. 关闭 PR**
- 直接更新状态为 closed
- 或在合并时自动关闭

**5. 评论和讨论**
- 添加评论回复讨论
- @ 提及相关人员

**6. 管理标签**
- 添加或移除 PR 标签
- 标记 PR 的性质和状态

**请告诉我你想执行哪个操作**。

如果是合并操作，请告诉我：
- 使用哪种合并方式？
- 是否需要自定义合并提交消息？`,
            },
          },
        ],
      };
    }
  );

  // Prompt: List pull requests
  server.prompt(
    {
      name: 'gitea-mcp-tool:查看PR列表',
      description: '查看和筛选 Gitea Pull Request 列表',
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
          name: 'state',
          description: 'PR state filter (open, closed, all)',
          required: false,
        },
      ],
    },
    async (args) => {
      const ownerInfo = args.owner ? `${args.owner}` : '上下文默认值';
      const repoInfo = args.repo ? `${args.repo}` : '上下文默认值';
      const stateInfo = args.state ? `${args.state}` : 'open';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我查看 ${ownerInfo}/${repoInfo} 仓库的 Pull Request 列表。

**当前筛选**：
- 状态: ${stateInfo}

**筛选选项**：

**1. 按状态筛选**
- open - 未合并的 PR（默认）
- closed - 已关闭的 PR
- all - 所有 PR

**2. 分页参数**
- page - 页码（默认：1）
- limit - 每页数量（默认：20，最大：50）

**显示信息包括**：
- PR 编号和标题
- 作者
- 源分支 → 目标分支
- 状态和标签
- 创建/更新时间
- 审查状态

我会使用 \`gitea_pr_list\` 工具获取 PR 列表。

**请告诉我**：
- 要查看哪种状态的 PR？（open/closed/all）
- 是否需要特定页码的结果？

或者直接说"显示所有未合并的 PR"。`,
            },
          },
        ],
      };
    }
  );
}
