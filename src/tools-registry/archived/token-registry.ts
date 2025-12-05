/**
 * Token Tools Registry
 * API Token 管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as TokenTools from '../tools/token.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:token');

/**
 * 注册所有 Token 管理工具
 */
export function registerTokenTools(mcpServer: McpServer, ctx: ToolContext) {
  // Token工具使用特殊的context（需要config而不是client）
  const tokenToolsContext = {
    config: ctx.client['config'],
  };

  // gitea_token_create - 创建 API Token
  mcpServer.registerTool(
    'gitea_token_create',
    {
      title: '创建 API Token',
      description: 'Create a new API token',
      inputSchema: z.object({
        name: z.string().min(1).describe('Token name'),
        scopes: z.array(z.string()).optional().describe('Token scopes/permissions'),
      }),
    },
    async (args) => {
      try {
        const result = await TokenTools.createTokenWithPassword(tokenToolsContext as any, args as any);
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

  // gitea_token_list - 列出 API Tokens
  mcpServer.registerTool(
    'gitea_token_list',
    {
      title: '列出 API Tokens',
      description: 'List API tokens',
      inputSchema: z.object({
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
      }),
    },
    async (args) => {
      try {
        const result = await TokenTools.listTokens(tokenToolsContext as any, args as any);
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

  // gitea_token_delete - 删除 API Token
  mcpServer.registerTool(
    'gitea_token_delete',
    {
      title: '删除 API Token',
      description: 'Delete an API token',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Token ID'),
      }),
    },
    async (args) => {
      try {
        const result = await TokenTools.deleteToken(tokenToolsContext as any, args as any);
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

  logger.info('Registered 3 token tools');
}
