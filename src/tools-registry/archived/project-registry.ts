/**
 * Project Tools Registry
 * Project 看板管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as ProjectTools from '../tools/project.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:project');

/**
 * 注册所有 Project 管理工具
 */
export function registerProjectTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_project_create
  mcpServer.registerTool(
    'gitea_project_create',
    {
      title: '创建项目看板',
      description: 'Create a new project board',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        title: z.string().min(1).describe('Project title'),
        description: z.string().optional().describe('Project description'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ProjectTools.createProject(toolsContext, args as any);
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

  // gitea_project_get
  mcpServer.registerTool(
    'gitea_project_get',
    {
      title: '获取项目详情',
      description: 'Get project details',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Project ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ProjectTools.getProject(toolsContext, args as any);
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

  // gitea_project_list
  mcpServer.registerTool(
    'gitea_project_list',
    {
      title: '列出项目',
      description: 'List projects',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        state: z.enum(['open', 'closed', 'all']).optional().describe('Project state filter (default: open)'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ProjectTools.listProjects(toolsContext, args as any);
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

  // gitea_project_update
  mcpServer.registerTool(
    'gitea_project_update',
    {
      title: '更新项目',
      description: 'Update a project',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Project ID'),
        title: z.string().optional().describe('New project title'),
        description: z.string().optional().describe('New project description'),
        state: z.enum(['open', 'closed']).optional().describe('New state'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ProjectTools.updateProject(toolsContext, args as any);
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

  // gitea_project_delete
  mcpServer.registerTool(
    'gitea_project_delete',
    {
      title: '删除项目',
      description: 'Delete a project',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Project ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ProjectTools.deleteProject(toolsContext, args as any);
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

  // gitea_project_columns
  mcpServer.registerTool(
    'gitea_project_columns',
    {
      title: '列出项目列',
      description: 'List project columns',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Project ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ProjectTools.listProjectColumns(toolsContext, args as any);
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

  // gitea_project_column_create
  mcpServer.registerTool(
    'gitea_project_column_create',
    {
      title: '创建项目列',
      description: 'Create a project column',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Project ID'),
        title: z.string().min(1).describe('Column title'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ProjectTools.createProjectColumn(toolsContext, args as any);
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

  // gitea_project_add_issue
  mcpServer.registerTool(
    'gitea_project_add_issue',
    {
      title: '添加 Issue 到项目',
      description: 'Add an issue to a project column',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        projectId: z.number().int().positive().describe('Project ID'),
        columnId: z.number().int().positive().describe('Column ID'),
        issueIndex: z.number().int().positive().describe('Issue index'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ProjectTools.addIssueToProjectColumn(toolsContext, args as any);
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

  logger.info('Registered 8 project tools');
}
