/**
 * Wiki Tools Registry
 * Wiki 文档管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as WikiTools from '../tools/wiki.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:wiki');

/**
 * 注册所有 Wiki 管理工具
 */
export function registerWikiTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_wiki_create
  mcpServer.registerTool(
    'gitea_wiki_create',
    {
      title: '创建 Wiki 页面',
      description: 'Create a new wiki page',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        title: z.string().min(1).describe('Page title'),
        content: z.string().describe('Page content (Markdown)'),
        message: z.string().optional().describe('Commit message'),
      }),
    },
    async (args) => {
      try {
        const result = await WikiTools.createWikiPage(toolsContext, args as any);
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

  // gitea_wiki_get
  mcpServer.registerTool(
    'gitea_wiki_get',
    {
      title: '获取 Wiki 页面',
      description: 'Get wiki page content',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.string().min(1).describe('Page title'),
      }),
    },
    async (args) => {
      try {
        const result = await WikiTools.getWikiPage(toolsContext, args as any);
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

  // gitea_wiki_list
  mcpServer.registerTool(
    'gitea_wiki_list',
    {
      title: '列出 Wiki 页面',
      description: 'List wiki pages',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
      }),
    },
    async (args) => {
      try {
        const result = await WikiTools.listWikiPages(toolsContext, args as any);
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

  // gitea_wiki_update
  mcpServer.registerTool(
    'gitea_wiki_update',
    {
      title: '更新 Wiki 页面',
      description: 'Update a wiki page',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.string().min(1).describe('Page title'),
        title: z.string().optional().describe('New page title'),
        content: z.string().describe('New page content (Markdown)'),
        message: z.string().optional().describe('Commit message'),
      }),
    },
    async (args) => {
      try {
        const result = await WikiTools.updateWikiPage(toolsContext, args as any);
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

  // gitea_wiki_delete
  mcpServer.registerTool(
    'gitea_wiki_delete',
    {
      title: '删除 Wiki 页面',
      description: 'Delete a wiki page',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.string().min(1).describe('Page title'),
      }),
    },
    async (args) => {
      try {
        const result = await WikiTools.deleteWikiPage(toolsContext, args as any);
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

  // gitea_wiki_revisions
  mcpServer.registerTool(
    'gitea_wiki_revisions',
    {
      title: '列出 Wiki 修订历史',
      description: 'List wiki page revisions',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.string().min(1).describe('Page title'),
      }),
    },
    async (args) => {
      try {
        const result = await WikiTools.getWikiRevisions(toolsContext, args as any);
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

  // gitea_wiki_get_revision
  mcpServer.registerTool(
    'gitea_wiki_get_revision',
    {
      title: '获取指定修订版本',
      description: 'Get a specific wiki page revision',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.string().min(1).describe('Page title'),
        revision: z.string().min(1).describe('Revision SHA'),
      }),
    },
    async (args) => {
      try {
        const result = await WikiTools.getWikiPageRevision(toolsContext, args as any);
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

  // gitea_wiki_search
  mcpServer.registerTool(
    'gitea_wiki_search',
    {
      title: '搜索 Wiki',
      description: 'Search wiki pages',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        query: z.string().min(1).describe('Search query'),
      }),
    },
    async (args) => {
      try {
        const result = await WikiTools.searchWikiPages(toolsContext, args as any);
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

  logger.info('Registered 8 wiki tools');
}
