/**
 * Repository Tools Registry
 * 仓库管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as RepositoryTools from '../tools/repository.js';
import type { ToolContext } from '../types.js';
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
              token: tokenSchema,
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
              token: tokenSchema,
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

  // gitea_repo_update - 更新仓库
  mcpServer.registerTool(
    'gitea_repo_update',
    {
      title: '更新仓库',
      description: 'Update repository metadata (description, website, settings, etc.)',
      inputSchema: z.object({
        owner: z
          .string()
          .optional()
          .describe('Repository owner. Uses context if not provided'),
        repo: z
          .string()
          .optional()
          .describe('Repository name. Uses context if not provided'),
        name: z.string().optional().describe('New repository name'),
        description: z.string().optional().describe('Repository description'),
        website: z.string().optional().describe('Project website URL'),
        private: z.boolean().optional().describe('Whether repository is private'),
        template: z.boolean().optional().describe('Whether repository is a template'),
        has_issues: z.boolean().optional().describe('Enable issues'),
        has_wiki: z.boolean().optional().describe('Enable wiki'),
        has_pull_requests: z.boolean().optional().describe('Enable pull requests'),
        has_projects: z.boolean().optional().describe('Enable projects'),
        has_releases: z.boolean().optional().describe('Enable releases'),
        has_packages: z.boolean().optional().describe('Enable packages'),
        has_actions: z.boolean().optional().describe('Enable actions'),
        default_branch: z.string().optional().describe('Default branch name'),
        archived: z.boolean().optional().describe('Archive the repository'),
        allow_merge_commits: z.boolean().optional().describe('Allow merge commits'),
        allow_rebase: z.boolean().optional().describe('Allow rebase'),
        allow_rebase_explicit: z.boolean().optional().describe('Allow rebase explicit'),
        allow_squash_merge: z.boolean().optional().describe('Allow squash merge'),
        allow_rebase_update: z.boolean().optional().describe('Allow rebase update'),
        default_delete_branch_after_merge: z
          .boolean()
          .optional()
          .describe('Delete branch after merge by default'),
        default_merge_style: z
          .enum(['merge', 'rebase', 'rebase-merge', 'squash'])
          .optional()
          .describe('Default merge style'),
        default_allow_maintainer_edit: z
          .boolean()
          .optional()
          .describe('Allow maintainers to edit'),
        ignore_whitespace_conflicts: z
          .boolean()
          .optional()
          .describe('Ignore whitespace conflicts'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await RepositoryTools.updateRepository(toolsContext, args as any);
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
        logger.error({ error: errorMessage }, 'Failed to update repository');
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
              token: tokenSchema,
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
              token: tokenSchema,
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
              token: tokenSchema,
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

  logger.info('Registered 6 repository tools');
}
