/**
 * Label Tools Registry
 * Label 标签管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as LabelTools from '../tools/label.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:label');

/**
 * 注册所有 Label 管理工具
 */
export function registerLabelTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // ========== Repository Labels ==========

  // gitea_label_repo_create
  mcpServer.registerTool(
    'gitea_label_repo_create',
    {
      title: '创建仓库标签',
      description: 'Create a new label in a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        name: z.string().min(1).describe('Label name'),
        color: z.string().min(1).describe('Label color (hex code without #, e.g., "ff0000" for red)'),
        description: z.string().optional().describe('Label description'),
        exclusive: z.boolean().optional().describe('Whether this label is exclusive'),
        is_archived: z.boolean().optional().describe('Whether this label is archived'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.createRepoLabel(toolsContext, args as any);
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

  // gitea_label_repo_list
  mcpServer.registerTool(
    'gitea_label_repo_list',
    {
      title: '列出仓库标签',
      description: 'List all labels in a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.listRepoLabels(toolsContext, args as any);
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

  // gitea_label_repo_get
  mcpServer.registerTool(
    'gitea_label_repo_get',
    {
      title: '获取仓库标签详情',
      description: 'Get details of a specific repository label',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Label ID'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.getRepoLabel(toolsContext, args as any);
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

  // gitea_label_repo_update
  mcpServer.registerTool(
    'gitea_label_repo_update',
    {
      title: '更新仓库标签',
      description: 'Update a repository label',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Label ID'),
        name: z.string().optional().describe('New label name'),
        color: z.string().optional().describe('New label color'),
        description: z.string().optional().describe('New label description'),
        exclusive: z.boolean().optional().describe('Whether this label is exclusive'),
        is_archived: z.boolean().optional().describe('Whether this label is archived'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.updateRepoLabel(toolsContext, args as any);
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

  // gitea_label_repo_delete
  mcpServer.registerTool(
    'gitea_label_repo_delete',
    {
      title: '删除仓库标签',
      description: 'Delete a repository label',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Label ID'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.deleteRepoLabel(toolsContext, args as any);
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

  // ========== Organization Labels ==========

  // gitea_label_org_create
  mcpServer.registerTool(
    'gitea_label_org_create',
    {
      title: '创建组织标签',
      description: 'Create a new label in an organization',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        name: z.string().min(1).describe('Label name'),
        color: z.string().min(1).describe('Label color (hex code without #, e.g., "ff0000" for red)'),
        description: z.string().optional().describe('Label description'),
        exclusive: z.boolean().optional().describe('Whether this label is exclusive'),
        is_archived: z.boolean().optional().describe('Whether this label is archived'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.createOrgLabel(toolsContext, args as any);
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

  // gitea_label_org_list
  mcpServer.registerTool(
    'gitea_label_org_list',
    {
      title: '列出组织标签',
      description: 'List all labels in an organization',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.listOrgLabels(toolsContext, args as any);
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

  // gitea_label_org_get
  mcpServer.registerTool(
    'gitea_label_org_get',
    {
      title: '获取组织标签详情',
      description: 'Get details of a specific organization label',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        id: z.number().int().positive().describe('Label ID'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.getOrgLabel(toolsContext, args as any);
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

  // gitea_label_org_update
  mcpServer.registerTool(
    'gitea_label_org_update',
    {
      title: '更新组织标签',
      description: 'Update an organization label',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        id: z.number().int().positive().describe('Label ID'),
        name: z.string().optional().describe('New label name'),
        color: z.string().optional().describe('New label color'),
        description: z.string().optional().describe('New label description'),
        exclusive: z.boolean().optional().describe('Whether this label is exclusive'),
        is_archived: z.boolean().optional().describe('Whether this label is archived'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.updateOrgLabel(toolsContext, args as any);
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

  // gitea_label_org_delete
  mcpServer.registerTool(
    'gitea_label_org_delete',
    {
      title: '删除组织标签',
      description: 'Delete an organization label',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        id: z.number().int().positive().describe('Label ID'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.deleteOrgLabel(toolsContext, args as any);
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

  // ========== Issue Label Operations ==========

  // gitea_label_issue_add
  mcpServer.registerTool(
    'gitea_label_issue_add',
    {
      title: '添加 Issue 标签',
      description: 'Add labels to an issue',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('Issue number'),
        labels: z.array(z.number().int().positive()).describe('Array of label IDs to add'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.addIssueLabels(toolsContext, args as any);
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

  // gitea_label_issue_replace
  mcpServer.registerTool(
    'gitea_label_issue_replace',
    {
      title: '替换 Issue 标签',
      description: 'Replace all labels on an issue',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('Issue number'),
        labels: z.array(z.number().int().positive()).describe('Array of label IDs to set (replaces all existing labels)'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.replaceIssueLabels(toolsContext, args as any);
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

  // gitea_label_issue_remove
  mcpServer.registerTool(
    'gitea_label_issue_remove',
    {
      title: '移除 Issue 标签',
      description: 'Remove a specific label from an issue',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('Issue number'),
        id: z.number().int().positive().describe('Label ID to remove'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.removeIssueLabel(toolsContext, args as any);
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

  // gitea_label_issue_clear
  mcpServer.registerTool(
    'gitea_label_issue_clear',
    {
      title: '清除 Issue 标签',
      description: 'Clear all labels from an issue',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        index: z.number().int().positive().describe('Issue number'),
      }),
    },
    async (args) => {
      try {
        const result = await LabelTools.clearIssueLabels(toolsContext, args as any);
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

  logger.info('Registered 14 label tools');
}
