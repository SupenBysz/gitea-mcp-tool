/**
 * Team Tools Registry
 * 团队管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as TeamTools from '../tools/team.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:team');

/**
 * 注册所有 Team 管理工具
 */
export function registerTeamTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_team_create
  mcpServer.registerTool(
    'gitea_team_create',
    {
      title: '创建团队',
      description: 'Create a new team',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        name: z.string().min(1).describe('Team name'),
        description: z.string().optional().describe('Team description'),
        permission: z.enum(['read', 'write', 'admin']).optional().describe('Permission level (default: read)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.createTeam(toolsContext, args as any);
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

  // gitea_team_get
  mcpServer.registerTool(
    'gitea_team_get',
    {
      title: '获取团队详情',
      description: 'Get team details',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.getTeam(toolsContext, args as any);
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

  // gitea_team_list
  mcpServer.registerTool(
    'gitea_team_list',
    {
      title: '列出团队',
      description: 'List organization teams',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.listTeams(toolsContext, args as any);
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

  // gitea_team_update
  mcpServer.registerTool(
    'gitea_team_update',
    {
      title: '更新团队',
      description: 'Update a team',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
        name: z.string().optional().describe('New team name'),
        description: z.string().optional().describe('New description'),
        permission: z.enum(['read', 'write', 'admin']).optional().describe('New permission level'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.updateTeam(toolsContext, args as any);
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

  // gitea_team_delete
  mcpServer.registerTool(
    'gitea_team_delete',
    {
      title: '删除团队',
      description: 'Delete a team',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.deleteTeam(toolsContext, args as any);
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

  // gitea_team_members
  mcpServer.registerTool(
    'gitea_team_members',
    {
      title: '列出团队成员',
      description: 'List team members',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.listTeamMembers(toolsContext, args as any);
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

  // gitea_team_add_member
  mcpServer.registerTool(
    'gitea_team_add_member',
    {
      title: '添加团队成员',
      description: 'Add a member to a team',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
        username: z.string().min(1).describe('Username to add'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.addTeamMember(toolsContext, args as any);
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

  // gitea_team_remove_member
  mcpServer.registerTool(
    'gitea_team_remove_member',
    {
      title: '移除团队成员',
      description: 'Remove a member from a team',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
        username: z.string().min(1).describe('Username to remove'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.removeTeamMember(toolsContext, args as any);
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

  // gitea_team_repos
  mcpServer.registerTool(
    'gitea_team_repos',
    {
      title: '列出团队仓库',
      description: 'List team repositories',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.listTeamRepos(toolsContext, args as any);
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

  // gitea_team_add_repo
  mcpServer.registerTool(
    'gitea_team_add_repo',
    {
      title: '添加团队仓库',
      description: 'Add a repository to a team',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
        owner: z.string().min(1).describe('Repository owner'),
        repo: z.string().min(1).describe('Repository name'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.addTeamRepo(toolsContext, args as any);
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

  // gitea_team_remove_repo
  mcpServer.registerTool(
    'gitea_team_remove_repo',
    {
      title: '移除团队仓库',
      description: 'Remove a repository from a team',
      inputSchema: z.object({
        id: z.number().int().positive().describe('Team ID'),
        owner: z.string().min(1).describe('Repository owner'),
        repo: z.string().min(1).describe('Repository name'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TeamTools.removeTeamRepo(toolsContext, args as any);
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

  logger.info('Registered 11 team tools');
}
