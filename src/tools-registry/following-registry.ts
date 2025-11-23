/**
 * Following Tools Registry
 * 用户关注管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as FollowingTools from '../tools/following.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:following');

/**
 * 注册所有 Following 管理工具
 */
export function registerFollowingTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_following_list - 列出关注的用户
  mcpServer.registerTool(
    'gitea_following_list',
    {
      title: '列出关注的用户',
      description: 'List users that the current user or a specific user follows',
      inputSchema: z.object({
        username: z.string().optional().describe('Username to list following for. If omitted, lists current user\'s following'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
      }),
    },
    async (args) => {
      try {
        const result = await FollowingTools.listFollowing(toolsContext, args as any);
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

  // gitea_followers_list - 列出粉丝
  mcpServer.registerTool(
    'gitea_followers_list',
    {
      title: '列出粉丝',
      description: 'List users that follow the current user or a specific user',
      inputSchema: z.object({
        username: z.string().optional().describe('Username to list followers for. If omitted, lists current user\'s followers'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
      }),
    },
    async (args) => {
      try {
        const result = await FollowingTools.listFollowers(toolsContext, args as any);
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

  // gitea_following_check - 检查是否关注某用户
  mcpServer.registerTool(
    'gitea_following_check',
    {
      title: '检查是否关注某用户',
      description: 'Check if the current user follows a specific user',
      inputSchema: z.object({
        username: z.string().min(1).describe('Username to check'),
      }),
    },
    async (args) => {
      try {
        const result = await FollowingTools.checkFollowing(toolsContext, args as any);
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

  // gitea_following_follow - 关注用户
  mcpServer.registerTool(
    'gitea_following_follow',
    {
      title: '关注用户',
      description: 'Follow a user',
      inputSchema: z.object({
        username: z.string().min(1).describe('Username to follow'),
      }),
    },
    async (args) => {
      try {
        const result = await FollowingTools.followUser(toolsContext, args as any);
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

  // gitea_following_unfollow - 取消关注
  mcpServer.registerTool(
    'gitea_following_unfollow',
    {
      title: '取消关注',
      description: 'Unfollow a user',
      inputSchema: z.object({
        username: z.string().min(1).describe('Username to unfollow'),
      }),
    },
    async (args) => {
      try {
        const result = await FollowingTools.unfollowUser(toolsContext, args as any);
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

  logger.info('Registered 5 following tools');
}
