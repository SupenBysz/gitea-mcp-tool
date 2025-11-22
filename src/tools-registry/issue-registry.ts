/**
 * Issue Tools Registry
 * Issue 管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as IssueTools from '../tools/issue.js';
import type { ToolContext } from '../index-new.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:issue');

/**
 * 注册所有 Issue 管理工具
 */
export function registerIssueTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_issue_create - 创建 Issue
  mcpServer.registerTool(
    'gitea_issue_create',
    {
      title: '创建 Issue',
      description: 'Create a new issue',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        title: z.string().min(1).describe('Issue title'),
        body: z.string().optional().describe('Issue body/description'),
        assignees: z.array(z.string()).optional().describe('Usernames to assign'),
        labels: z.array(z.number()).optional().describe('Label IDs to attach'),
        milestone: z.number().optional().describe('Milestone ID'),
      }),
    },
    async (args) => {
      try {
        const result = await IssueTools.createIssue(toolsContext, args as any);
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

  // gitea_issue_get - 获取 Issue
  mcpServer.registerTool(
    'gitea_issue_get',
    {
      title: '获取 Issue',
      description: 'Get issue details',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('Issue index number'),
      }),
    },
    async (args) => {
      try {
        const result = await IssueTools.getIssue(toolsContext, args as any);
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

  // gitea_issue_list - 列出 Issues
  mcpServer.registerTool(
    'gitea_issue_list',
    {
      title: '列出 Issues',
      description: 'List repository issues',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        state: z
          .enum(['open', 'closed', 'all'])
          .optional()
          .describe('Issue state filter (default: open)'),
        labels: z.string().optional().describe('Comma-separated label names'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 20, max: 50)'),
      }),
    },
    async (args) => {
      try {
        const result = await IssueTools.listIssues(toolsContext, args as any);
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

  // gitea_issue_update - 更新 Issue
  mcpServer.registerTool(
    'gitea_issue_update',
    {
      title: '更新 Issue',
      description: 'Update an issue',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('Issue index number'),
        title: z.string().optional().describe('New title'),
        body: z.string().optional().describe('New body/description'),
        assignees: z.array(z.string()).optional().describe('Usernames to assign'),
        labels: z.array(z.number()).optional().describe('Label IDs'),
        milestone: z.number().optional().describe('Milestone ID'),
        state: z.enum(['open', 'closed']).optional().describe('Issue state'),
      }),
    },
    async (args) => {
      try {
        const result = await IssueTools.updateIssue(toolsContext, args as any);
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

  // gitea_issue_comment - 添加评论
  mcpServer.registerTool(
    'gitea_issue_comment',
    {
      title: '添加 Issue 评论',
      description: 'Add a comment to an issue',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('Issue index number'),
        body: z.string().min(1).describe('Comment body'),
      }),
    },
    async (args) => {
      try {
        const result = await IssueTools.commentIssue(toolsContext, args as any);
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

  // gitea_issue_close - 关闭 Issue
  mcpServer.registerTool(
    'gitea_issue_close',
    {
      title: '关闭 Issue',
      description: 'Close an issue',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('Issue index number'),
      }),
    },
    async (args) => {
      try {
        const result = await IssueTools.closeIssue(toolsContext, args as any);
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

  logger.info('Registered 6 issue tools');
}
