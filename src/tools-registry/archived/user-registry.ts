/**
 * User Tools Registry
 * 用户管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as UserTools from '../tools/user.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:user');

/**
 * 注册所有 User 管理工具
 */
export function registerUserTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_user_current - 获取当前用户 (已在 index.ts 中注册)

  // gitea_user_get - 获取用户信息
  mcpServer.registerTool(
    'gitea_user_get',
    {
      title: '获取用户信息',
      description: 'Get user details',
      inputSchema: z.object({
        username: z.string().min(1).describe('Username'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await UserTools.getUser(toolsContext, args as any);
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

  // gitea_user_orgs - 列出用户所属组织
  mcpServer.registerTool(
    'gitea_user_orgs',
    {
      title: '列出用户所属组织',
      description: 'List user organizations',
      inputSchema: z.object({
        username: z.string().min(1).describe('Username'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await UserTools.listUserOrganizations(toolsContext, args as any);
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

  logger.info('Registered 2 additional user tools (current user registered in main file)');
}
