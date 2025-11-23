/**
 * Starred Tools Registry
 * 星标仓库管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as StarredTools from '../tools/starred.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:starred');

/**
 * 注册所有 Starred 管理工具
 */
export function registerStarredTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_starred_list - 列出星标仓库
  mcpServer.registerTool(
    'gitea_starred_list',
    {
      title: '列出星标仓库',
      description: "List starred repositories (current user or specific user)",
      inputSchema: z.object({
        username: z.string().optional().describe('Username to list starred repos for. If omitted, lists current user\'s starred repos'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
      }),
    },
    async (args) => {
      try {
        const result = await StarredTools.listStarredRepos(toolsContext, args as any);
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

  // gitea_starred_check - 检查仓库是否已星标
  mcpServer.registerTool(
    'gitea_starred_check',
    {
      title: '检查仓库是否已星标',
      description: 'Check if the current user has starred a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
      }),
    },
    async (args) => {
      try {
        const result = await StarredTools.checkStarred(toolsContext, args as any);
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

  // gitea_starred_star - 星标仓库
  mcpServer.registerTool(
    'gitea_starred_star',
    {
      title: '星标仓库',
      description: 'Star a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
      }),
    },
    async (args) => {
      try {
        const result = await StarredTools.starRepository(toolsContext, args as any);
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

  // gitea_starred_unstar - 取消星标
  mcpServer.registerTool(
    'gitea_starred_unstar',
    {
      title: '取消星标',
      description: 'Unstar a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
      }),
    },
    async (args) => {
      try {
        const result = await StarredTools.unstarRepository(toolsContext, args as any);
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

  logger.info('Registered 4 starred tools');
}
