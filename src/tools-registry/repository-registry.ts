/**
 * Repository Tools Registry
 * 仓库管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as RepositoryTools from '../tools/repository.js';
import type { ToolContext } from '../index-new.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:repository');

/**
 * 注册所有仓库管理工具
 */
export function registerRepositoryTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_repo_create - 创建仓库
  mcpServer.registerTool(
    'gitea_repo_create',
    {
      title: '创建仓库',
      description: 'Create a new repository',
      inputSchema: z.object({
        name: z.string().min(1).describe('Repository name'),
        owner: z
          .string()
          .optional()
          .describe('Owner (username or organization). Uses context if not provided'),
        description: z.string().optional().describe('Repository description'),
        private: z.boolean().optional().describe('Whether repository is private'),
        auto_init: z.boolean().optional().describe('Auto-initialize with README'),
        gitignores: z.string().optional().describe('Gitignore template name'),
        license: z.string().optional().describe('License template name'),
        readme: z.string().optional().describe('README template name'),
      }),
    },
    async (args) => {
      try {
        const result = await RepositoryTools.createRepository(toolsContext, args as any);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, 'Failed to create repository');
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // gitea_repo_get - 获取仓库详情
  mcpServer.registerTool(
    'gitea_repo_get',
    {
      title: '获取仓库详情',
      description: 'Get repository details',
      inputSchema: z.object({
        owner: z
          .string()
          .optional()
          .describe('Repository owner. Uses context if not provided'),
        repo: z
          .string()
          .optional()
          .describe('Repository name. Uses context if not provided'),
      }),
    },
    async (args) => {
      try {
        const result = await RepositoryTools.getRepository(toolsContext, args as any);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // gitea_repo_list - 列出仓库
  mcpServer.registerTool(
    'gitea_repo_list',
    {
      title: '列出仓库',
      description: 'List repositories',
      inputSchema: z.object({
        owner: z
          .string()
          .optional()
          .describe('Owner to list repos for. Lists current user repos if not provided'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 20, max: 50)'),
      }),
    },
    async (args) => {
      try {
        const result = await RepositoryTools.listRepositories(toolsContext, args as any);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // gitea_repo_delete - 删除仓库
  mcpServer.registerTool(
    'gitea_repo_delete',
    {
      title: '删除仓库',
      description: 'Delete a repository',
      inputSchema: z.object({
        owner: z
          .string()
          .optional()
          .describe('Repository owner. Uses context if not provided'),
        repo: z
          .string()
          .optional()
          .describe('Repository name. Uses context if not provided'),
      }),
    },
    async (args) => {
      try {
        const result = await RepositoryTools.deleteRepository(toolsContext, args as any);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // gitea_repo_search - 搜索仓库
  mcpServer.registerTool(
    'gitea_repo_search',
    {
      title: '搜索仓库',
      description: 'Search for repositories',
      inputSchema: z.object({
        q: z.string().min(1).describe('Search query'),
        topic: z.boolean().optional().describe('Search in topic'),
        includeDesc: z.boolean().optional().describe('Include description in search'),
        uid: z.number().optional().describe('User ID to filter by'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 10, max: 50)'),
      }),
    },
    async (args) => {
      try {
        const result = await RepositoryTools.searchRepositories(toolsContext, args as any);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  logger.info('Registered 5 repository tools');
}
