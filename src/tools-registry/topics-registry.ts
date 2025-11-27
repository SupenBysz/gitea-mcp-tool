/**
 * Topics Tools Registry
 * 仓库主题标签管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as TopicsTools from '../tools/topics.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:topics');

/**
 * 注册所有 Topics 管理工具
 */
export function registerTopicsTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_topics_list - 列出仓库主题
  mcpServer.registerTool(
    'gitea_topics_list',
    {
      title: '列出仓库主题',
      description: 'List repository topics',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TopicsTools.listTopics(toolsContext, args as any);
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

  // gitea_topics_replace - 替换所有仓库主题
  mcpServer.registerTool(
    'gitea_topics_replace',
    {
      title: '替换所有仓库主题',
      description: 'Replace all repository topics',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        topics: z.array(z.string()).describe('Array of topic names to set (replaces all existing topics)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TopicsTools.replaceTopics(toolsContext, args as any);
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

  // gitea_topics_add - 添加主题到仓库
  mcpServer.registerTool(
    'gitea_topics_add',
    {
      title: '添加主题到仓库',
      description: 'Add a topic to repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        topic: z.string().min(1).describe('Topic name to add'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TopicsTools.addTopic(toolsContext, args as any);
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

  // gitea_topics_delete - 从仓库删除主题
  mcpServer.registerTool(
    'gitea_topics_delete',
    {
      title: '从仓库删除主题',
      description: 'Delete a topic from repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        topic: z.string().min(1).describe('Topic name to delete'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TopicsTools.deleteTopic(toolsContext, args as any);
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

  logger.info('Registered 4 topics tools');
}
