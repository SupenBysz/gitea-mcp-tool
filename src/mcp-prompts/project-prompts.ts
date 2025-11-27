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

═══════════════════════════════════════════════════════════════
📋 可选看板类型（12种，已分类展开）
═══════════════════════════════════════════════════════════════

┌─【基础开发类】⭐ 最常用
│
├─ 1. 功能开发看板 [推荐: 敏捷迭代版 6状态]
│   适合场景: 新功能的快速迭代开发、产品功能交付
│   预置标签: feature, enhancement, user-story, api, integration
│   工作流程: 待办池 → Sprint待办 → 开发中 → 代码评审 → 测试/验收 → 已完成
│
├─ 2. Bug追踪看板 [推荐: 标准版 5状态] ⭐
│   适合场景: 软件缺陷追踪、问题修复管理
│   预置标签: bug, critical, high-priority, medium-priority, low-priority, hotfix
│   工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成
│
└─ 3. 优化改进看板 [推荐: 标准版 5状态] ⭐
    适合场景: 代码重构、性能优化、技术债务管理
    预置标签: refactor, performance, tech-debt, optimization, code-quality
    工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成

┌─【质量保障类】
│
├─ 4. 测试管理看板 [推荐: 标准版 5状态]
│   适合场景: 测试用例编写、测试执行、缺陷跟踪
│   预置标签: testing, test-case, integration-test, unit-test, qa
│   工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成
│
└─ 5. 安全与合规看板 [推荐: 标准版 5状态]
    适合场景: 安全漏洞修复、合规性审查、安全加固
    预置标签: security, vulnerability, compliance, audit, encryption
    工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成

┌─【运维部署类】
│
├─ 6. 部署实施看板 [推荐: 全面版 8状态]
│   适合场景: 系统部署、版本上线、发布流程管理
│   预置标签: deployment, release, rollback, staging, production
│   工作流程: 待办事项 → 需求分析 → 设计评审 → 开发中 → 代码审查 → 测试中 → 预发布 → 已完成
│
├─ 7. 运维管理看板 [推荐: 极简版 3状态]
│   适合场景: 日常运维任务、系统维护、监控告警处理
│   预置标签: ops, maintenance, monitoring, incident, infrastructure
│   工作流程: 待办 → 进行中 → 已完成
│
└─ 8. 研发运营看板 [推荐: 标准版 5状态]
    适合场景: CI/CD流水线、基础设施即代码、DevOps自动化
    预置标签: devops, ci-cd, automation, infrastructure, pipeline
    工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成

┌─【团队协作类】
│
├─ 9. 文档维护看板 [推荐: 标准版 5状态]
│   适合场景: 技术文档编写、用户手册维护、API文档更新
│   预置标签: documentation, api-docs, user-guide, tutorial, wiki
│   工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成
│
├─ 10. 客户支持看板 [推荐: 标准版 5状态]
│    适合场景: 客户反馈处理、支持工单管理、功能请求跟踪
│    预置标签: support, customer-feedback, feature-request, help-wanted
│    工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成
│
├─ 11. 设计与原型看板 [推荐: 标准版 5状态]
│    适合场景: UI/UX设计、原型评审、设计系统维护
│    预置标签: design, ui, ux, prototype, mockup, design-system
│    工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成
│
└─ 12. 数据与分析看板 [推荐: 标准版 5状态]
     适合场景: 数据需求分析、报表开发、数据质量管理
     预置标签: data, analytics, reporting, data-quality, etl
     工作流程: 待办事项 → 计划中 → 进行中 → 测试验证 → 已完成

═══════════════════════════════════════════════════════════════
🔄 工作流方案详解（4种可选）
═══════════════════════════════════════════════════════════════

【极简版】3状态 - 快速上手，适合个人项目
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ① 待办 → ② 进行中 → ③ 已完成

  状态说明:
  • 待办: 待处理的任务
  • 进行中: 正在处理
  • 已完成: 完成并验证

  适用团队: 1-2人，快速迭代项目

【标准版】5状态 - 平衡实用，适合小型团队 ⭐ 最推荐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ① 待办事项 → ② 计划中 → ③ 进行中 → ④ 测试验证 → ⑤ 已完成

  状态说明:
  • 待办事项: 新任务，待评估优先级
  • 计划中: 已规划，排期确定
  • 进行中: 正在开发/处理
  • 测试验证: 功能测试、质量检查
  • 已完成: 发布上线

  适用团队: 3-10人，标准开发流程

【全面版】8状态 - 流程完整，适合企业级项目
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ① 待办事项 → ② 需求分析 → ③ 设计评审 → ④ 开发中 →
  ⑤ 代码审查 → ⑥ 测试中 → ⑦ 预发布 → ⑧ 已完成

  状态说明:
  • 待办事项: 需求收集
  • 需求分析: 需求评审、可行性分析
  • 设计评审: 技术方案、架构设计
  • 开发中: 编码实现
  • 代码审查: Code Review
  • 测试中: 功能测试、集成测试
  • 预发布: 预发布环境验证
  • 已完成: 生产环境上线

  适用团队: 10+人，严格质量控制

【敏捷迭代版】6状态 - Scrum敏捷开发
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ① 待办池 → ② Sprint待办 → ③ 开发中 →
  ④ 代码评审 → ⑤ 测试/验收 → ⑥ 已完成

  状态说明:
  • 待办池: Product Backlog，所有待开发需求
  • Sprint待办: Sprint Backlog，本次迭代任务
  • 开发中: 当前Sprint开发中
  • 代码评审: PR Review、代码审查
  • 测试/验收: 测试验证、Product Owner验收
  • 已完成: Sprint完成，功能交付

  适用团队: 敏捷团队，2周一迭代

═══════════════════════════════════════════════════════════════
🎯 快速选择指南
═══════════════════════════════════════════════════════════════

  输入方式: 数字(1-12) 或 看板名称

  示例:
  • "1" 或 "功能开发看板"
  • "2" 或 "Bug追踪看板"

  我会根据你的选择:
  ✓ 智能推荐最佳工作流方案
  ✓ 允许你自定义调整
  ✓ 自动创建看板、列、标签
  ✓ 提供使用指南和看板链接

═══════════════════════════════════════════════════════════════

现在，请告诉我你想创建哪种类型的看板？`,
            },
          },
        ],
      };
    }
  );
}
