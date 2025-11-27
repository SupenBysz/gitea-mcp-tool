/**
 * Milestone Tools Registry
 * Milestone 管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as MilestoneTools from '../tools/milestone.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:milestone');

/**
 * 注册所有 Milestone 管理工具
 */
export function registerMilestoneTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_milestone_create - 创建 Milestone
  mcpServer.registerTool(
    'gitea_milestone_create',
    {
      title: '创建 Milestone',
      description: 'Create a new milestone',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        title: z.string().min(1).describe('Milestone title'),
        description: z.string().optional().describe('Milestone description'),
        due_on: z.string().optional().describe('Due date (ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await MilestoneTools.createMilestone(toolsContext, args as any);
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

  // gitea_milestone_get - 获取 Milestone
  mcpServer.registerTool(
    'gitea_milestone_get',
    {
      title: '获取 Milestone',
      description: 'Get milestone details',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Milestone ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await MilestoneTools.getMilestone(toolsContext, args as any);
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

  // gitea_milestone_list - 列出 Milestones
  mcpServer.registerTool(
    'gitea_milestone_list',
    {
      title: '列出 Milestones',
      description: 'List repository milestones',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        state: z
          .enum(['open', 'closed', 'all'])
          .optional()
          .describe('Milestone state filter (default: open)'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await MilestoneTools.listMilestones(toolsContext, args as any);
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

  // gitea_milestone_update - 更新 Milestone
  mcpServer.registerTool(
    'gitea_milestone_update',
    {
      title: '更新 Milestone',
      description: 'Update a milestone',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Milestone ID'),
        title: z.string().optional().describe('New milestone title'),
        description: z.string().optional().describe('New milestone description'),
        due_on: z.string().optional().describe('New due date (ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ)'),
        state: z.enum(['open', 'closed']).optional().describe('Milestone state'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await MilestoneTools.updateMilestone(toolsContext, args as any);
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

  // gitea_milestone_delete - 删除 Milestone
  mcpServer.registerTool(
    'gitea_milestone_delete',
    {
      title: '删除 Milestone',
      description: 'Delete a milestone',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Milestone ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await MilestoneTools.deleteMilestone(toolsContext, args as any);
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

  logger.info('Registered 5 milestone tools');
}
