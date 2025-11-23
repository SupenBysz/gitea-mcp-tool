/**
 * Release Tools Registry
 * Release 发布版本管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as ReleaseTools from '../tools/release.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:release');

/**
 * 注册所有 Release 管理工具
 */
export function registerReleaseTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_release_create
  mcpServer.registerTool(
    'gitea_release_create',
    {
      title: '创建发布版本',
      description: 'Create a new release for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        tag_name: z.string().min(1).describe('Tag name (e.g., v1.0.0)'),
        name: z.string().optional().describe('Release name (defaults to tag_name)'),
        body: z.string().optional().describe('Release description/notes (Markdown supported)'),
        draft: z.boolean().optional().describe('Create as draft (default: false)'),
        prerelease: z.boolean().optional().describe('Mark as prerelease (default: false)'),
        target_commitish: z.string().optional().describe('Target branch or commit SHA (default: default branch)'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.createRelease(toolsContext, args as any);
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

  // gitea_release_get
  mcpServer.registerTool(
    'gitea_release_get',
    {
      title: '获取发布版本详情',
      description: 'Get release details by ID',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Release ID'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.getRelease(toolsContext, args as any);
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

  // gitea_release_get_by_tag
  mcpServer.registerTool(
    'gitea_release_get_by_tag',
    {
      title: '通过Tag获取发布版本',
      description: 'Get release details by tag name',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        tag: z.string().min(1).describe('Tag name (e.g., v1.0.0)'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.getReleaseByTag(toolsContext, args as any);
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

  // gitea_release_list
  mcpServer.registerTool(
    'gitea_release_list',
    {
      title: '列出发布版本',
      description: 'List all releases for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
        draft: z.boolean().optional().describe('Filter by draft status'),
        prerelease: z.boolean().optional().describe('Filter by prerelease status'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.listReleases(toolsContext, args as any);
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

  // gitea_release_update
  mcpServer.registerTool(
    'gitea_release_update',
    {
      title: '更新发布版本',
      description: 'Update a release',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Release ID'),
        tag_name: z.string().optional().describe('New tag name'),
        name: z.string().optional().describe('New release name'),
        body: z.string().optional().describe('New release description/notes'),
        draft: z.boolean().optional().describe('Update draft status'),
        prerelease: z.boolean().optional().describe('Update prerelease status'),
        target_commitish: z.string().optional().describe('New target branch or commit SHA'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.updateRelease(toolsContext, args as any);
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

  // gitea_release_delete
  mcpServer.registerTool(
    'gitea_release_delete',
    {
      title: '删除发布版本',
      description: 'Delete a release',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Release ID'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.deleteRelease(toolsContext, args as any);
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

  // gitea_release_attachments
  mcpServer.registerTool(
    'gitea_release_attachments',
    {
      title: '列出发布版本附件',
      description: 'List all attachments for a release',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Release ID'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.listReleaseAttachments(toolsContext, args as any);
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

  // gitea_release_attachment_get
  mcpServer.registerTool(
    'gitea_release_attachment_get',
    {
      title: '获取发布版本附件详情',
      description: 'Get release attachment details',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Release ID'),
        attachment_id: z.number().int().positive().describe('Attachment ID'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.getReleaseAttachment(toolsContext, args as any);
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

  // gitea_release_attachment_delete
  mcpServer.registerTool(
    'gitea_release_attachment_delete',
    {
      title: '删除发布版本附件',
      description: 'Delete a release attachment',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Release ID'),
        attachment_id: z.number().int().positive().describe('Attachment ID'),
      }),
    },
    async (args) => {
      try {
        const result = await ReleaseTools.deleteReleaseAttachment(toolsContext, args as any);
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

  logger.info('Registered 9 release tools');
}
