/**
 * Pull Request Tools Registry
 * PR 管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as PullRequestTools from '../tools/pull-request.js';
import type { ToolContext } from '../types.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:pr');

/**
 * 注册所有 Pull Request 管理工具
 */
export function registerPullRequestTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_pr_create - 创建 PR
  mcpServer.registerTool(
    'gitea_pr_create',
    {
      title: '创建 Pull Request',
      description: 'Create a new pull request',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        title: z.string().min(1).describe('PR title'),
        body: z.string().optional().describe('PR body/description'),
        head: z.string().min(1).describe('Branch name to merge from'),
        base: z.string().min(1).describe('Branch name to merge into'),
        assignees: z.array(z.string()).optional().describe('Usernames to assign'),
        labels: z.array(z.number()).optional().describe('Label IDs to attach'),
        milestone: z.number().optional().describe('Milestone ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PullRequestTools.createPullRequest(toolsContext, args as any);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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

  // gitea_pr_get - 获取 PR
  mcpServer.registerTool(
    'gitea_pr_get',
    {
      title: '获取 Pull Request',
      description: 'Get pull request details',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('PR index number'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PullRequestTools.getPullRequest(toolsContext, args as any);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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

  // gitea_pr_list - 列出 PRs
  mcpServer.registerTool(
    'gitea_pr_list',
    {
      title: '列出 Pull Requests',
      description: 'List repository pull requests',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        state: z
          .enum(['open', 'closed', 'all'])
          .optional()
          .describe('PR state filter (default: open)'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 20, max: 50)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PullRequestTools.listPullRequests(toolsContext, args as any);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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

  // gitea_pr_update - 更新 PR
  mcpServer.registerTool(
    'gitea_pr_update',
    {
      title: '更新 Pull Request',
      description: 'Update a pull request',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('PR index number'),
        title: z.string().optional().describe('New title'),
        body: z.string().optional().describe('New body/description'),
        assignees: z.array(z.string()).optional().describe('Usernames to assign'),
        labels: z.array(z.number()).optional().describe('Label IDs'),
        milestone: z.number().optional().describe('Milestone ID'),
        state: z.enum(['open', 'closed']).optional().describe('PR state'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PullRequestTools.updatePullRequest(toolsContext, args as any);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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

  // gitea_pr_merge - 合并 PR
  mcpServer.registerTool(
    'gitea_pr_merge',
    {
      title: '合并 Pull Request',
      description: 'Merge a pull request',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('PR index number'),
        Do: z
          .enum(['merge', 'rebase', 'rebase-merge', 'squash'])
          .optional()
          .describe('Merge method (default: merge)'),
        MergeCommitID: z.string().optional().describe('Optional merge commit ID'),
        MergeMessageField: z.string().optional().describe('Custom merge message'),
        MergeTitleField: z.string().optional().describe('Custom merge title'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PullRequestTools.mergePullRequest(toolsContext, args as any);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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

  // gitea_pr_review - 审查 PR
  mcpServer.registerTool(
    'gitea_pr_review',
    {
      title: '审查 Pull Request',
      description: 'Submit a pull request review',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('PR index number'),
        body: z.string().optional().describe('Review comment body'),
        event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT']).describe('Review event type'),
        comments: z
          .array(
            z.object({
              path: z.string().describe('File path'),
              body: z.string().describe('Comment body'),
              old_line_num: z.number().optional().describe('Old line number'),
              new_line_num: z.number().optional().describe('New line number'),
            })
          )
          .optional()
          .describe('Line-specific comments'),
      }),
    },
    async (args) => {
      try {
        const result = await PullRequestTools.reviewPullRequest(toolsContext, args as any);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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

  logger.info('Registered 6 pull request tools');
}
