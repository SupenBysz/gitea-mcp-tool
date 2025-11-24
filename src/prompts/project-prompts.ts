/**
 * Project Board Prompts
 *
 * This module provides MCP prompts for Gitea project board initialization.
 */

import { PromptContext } from './index.js';

/**
 * Register project board-related prompts
 *
 * @param context - The prompt context containing the MCP server
 */
export function registerProjectPrompts(context: PromptContext): void {
  const { server } = context;

  // Prompt: Initialize project board (只保留1个prompt)
  server.registerPrompt(
    '初始化项目看板',
    {
      description: '交互式初始化 Gitea 项目看板（12种类型 × 4种工作流）',
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
              text: `请帮我在 ${ownerInfo}/${repoInfo} 仓库中初始化一个 Gitea 项目看板。

**可选看板类型**（12种，已分类）：

【基础开发类】⭐ 最常用
1. **功能开发看板** - 新功能设计、开发、交付
2. **Bug追踪看板** - 集中管理和追踪软件缺陷 ⭐
3. **优化改进看板** - 代码重构、性能优化、技术债务 ⭐

【质量保障类】
4. **测试管理看板** - 测试用例编写、测试执行、缺陷跟踪
5. **安全与合规看板** - 安全漏洞修复、合规性审查、安全加固

【运维部署类】
6. **部署实施看板** - 系统部署、上线、发布流程
7. **运维管理看板** - 日常运维任务、系统维护、监控告警
8. **研发运营看板** - CI/CD流水线、基础设施即代码、自动化工具

【团队协作类】
9. **文档维护看板** - 技术文档、用户手册、API文档
10. **客户支持看板** - 客户反馈、支持工单、功能请求
11. **设计与原型看板** - UI/UX设计、原型评审、设计系统维护
12. **数据与分析看板** - 数据需求、报表开发、数据质量管理

**工作流方案**（4种可选）：

**极简版（3状态）** - 适合个人项目和小团队
  待办 → 进行中 → 已完成

**标准版（5状态）** - 适合小型团队和标准开发流程 [最推荐] ⭐
  待办事项 → 计划中 → 进行中 → 测试验证 → 已完成

**全面版（8状态）** - 适合中大型团队和企业级项目
  待办事项 → 需求分析 → 设计评审 → 开发中 → 代码审查 → 测试中 → 预发布 → 已完成

**敏捷迭代版（6状态）** - 适合Scrum敏捷团队
  待办池 → Sprint待办 → 开发中 → 代码评审 → 测试/验收 → 已完成

**智能推荐机制**：
- Bug追踪看板 → 推荐标准版(5状态)
- 部署实施看板 → 推荐全面版(8状态)
- 运维管理看板 → 推荐极简版(3状态)
- 功能开发看板 → 推荐敏捷迭代版(6状态)
- 其他类型 → 推荐标准版(5状态)

**交互流程**：
1. 你选择看板类型（输入1-12的数字或名称）
2. 我根据类型智能推荐最佳工作流方案
3. 你确认或调整工作流方案
4. 我自动创建：
   - 项目看板
   - 看板列（对应工作流状态）
   - 预置标签（对应看板类型）
5. 提供使用指南和看板链接

更多详细方案说明，请参考 docs/project-board-schemes.md 文档。

现在，请告诉我你想创建哪种类型的看板？（输入数字1-12或名称）`,
            },
          },
        ],
      };
    }
  );
}
