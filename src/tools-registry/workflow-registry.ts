/**
 * Workflow Tools Registry
 * 工作流管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as WorkflowTools from '../tools/workflow.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:workflow');

/**
 * 注册所有工作流管理工具
 */
export function registerWorkflowTools(mcpServer: McpServer, ctx: ToolContext) {
  // 1. gitea_workflow_init - 初始化工作流配置
  mcpServer.registerTool(
    'gitea_workflow_init',
    {
      title: '初始化工作流配置',
      description:
        'Initialize Issue workflow configuration for a project. Generates .gitea/issue-workflow.yaml with labels, board columns, and automation rules based on project type.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        project_type: z
          .enum(['backend', 'frontend', 'fullstack', 'library'])
          .describe('Project type for template selection'),
        language: z.string().optional().describe('Primary programming language (e.g., go, typescript, python)'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowInit(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 2. gitea_workflow_load_config - 加载工作流配置
  mcpServer.registerTool(
    'gitea_workflow_load_config',
    {
      title: '加载工作流配置',
      description:
        'Load and parse the workflow configuration from .gitea/issue-workflow.yaml. Returns the parsed config and validation results.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowLoadConfig(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 3. gitea_workflow_sync_labels - 同步标签系统
  mcpServer.registerTool(
    'gitea_workflow_sync_labels',
    {
      title: '同步标签系统',
      description:
        'Sync repository labels based on workflow configuration. Creates status/*, priority/*, type/* and other labels defined in the config.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        dry_run: z.boolean().optional().describe('Preview changes without applying (default: false)'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowSyncLabels(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 4. gitea_workflow_sync_board - 同步项目看板
  mcpServer.registerTool(
    'gitea_workflow_sync_board',
    {
      title: '同步项目看板',
      description:
        'Create or update project board with columns mapped to status labels. Columns: Backlog, In Progress, Review, Testing, Done.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        board_name: z.string().optional().describe('Project board name (default: from config)'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowSyncBoard(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 5. gitea_workflow_check_issues - 检查并应用工作流规则
  mcpServer.registerTool(
    'gitea_workflow_check_issues',
    {
      title: '检查 Issue 工作流',
      description:
        'Check all open issues against workflow rules. Identifies missing labels, conflicts, and provides suggestions for improvement.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        issue_number: z.number().optional().describe('Check only a specific issue (optional)'),
        rules: z.array(z.string()).optional().describe('Apply only specific rules (optional)'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowCheckIssues(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 6. gitea_workflow_infer_labels - 智能标签推断
  mcpServer.registerTool(
    'gitea_workflow_infer_labels',
    {
      title: '智能标签推断',
      description:
        'Infer labels for an issue based on title and body content. Uses keyword matching and pattern recognition to suggest type, priority, and area labels.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        issue_number: z.number().describe('Issue number to analyze'),
        auto_apply: z.boolean().optional().describe('Automatically apply inferred labels (default: false)'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowInferLabels(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 7. gitea_workflow_check_blocked - 检测阻塞 Issue
  mcpServer.registerTool(
    'gitea_workflow_check_blocked',
    {
      title: '检测阻塞 Issue',
      description:
        'Detect issues that are blocked or exceeding SLA. Checks for stale issues based on priority-specific time limits.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        threshold_hours: z.number().optional().describe('Override default SLA hours threshold'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowCheckBlocked(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 8. gitea_workflow_escalate_priority - 优先级升级
  mcpServer.registerTool(
    'gitea_workflow_escalate_priority',
    {
      title: '优先级升级',
      description:
        'Automatically escalate priority for aged issues. P3→P2 after 30 days, P2→P1 after 14 days, P1→P0 after 3 days. Security issues are always P0.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        dry_run: z.boolean().optional().describe('Preview changes without applying (default: false)'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowEscalatePriority(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 9. gitea_workflow_sync_status - 状态双向同步
  mcpServer.registerTool(
    'gitea_workflow_sync_status',
    {
      title: '状态双向同步',
      description:
        'Synchronize issue status labels with project board column positions. Supports label-to-board, board-to-label, or bidirectional sync.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        direction: z
          .enum(['label-to-board', 'board-to-label', 'both'])
          .describe('Sync direction'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowSyncStatus(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // 10. gitea_workflow_generate_report - 生成工作流报告
  mcpServer.registerTool(
    'gitea_workflow_generate_report',
    {
      title: '生成工作流报告',
      description:
        'Generate a comprehensive workflow report including issue statistics, health score, and recommendations. Output in JSON and Markdown formats.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        time_range: z
          .enum(['day', 'week', 'month'])
          .optional()
          .describe('Time range for statistics (default: all time)'),
      }),
    },
    async (args) => {
      try {
        const result = await WorkflowTools.workflowGenerateReport(
          { client: ctx.client, contextManager: ctx.contextManager },
          args
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  logger.info('Registered 10 workflow tools');
}
