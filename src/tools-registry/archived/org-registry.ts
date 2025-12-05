/**
 * Organization Tools Registry
 * 组织管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as UserTools from '../tools/user.js';
import * as OrganizationTools from '../tools/organization.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:org');

/**
 * 注册所有 Organization 管理工具
 */
export function registerOrganizationTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_org_get - 获取组织信息
  mcpServer.registerTool(
    'gitea_org_get',
    {
      title: '获取组织信息',
      description: 'Get organization details',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await UserTools.getOrganization(toolsContext, args as any);
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

  // gitea_org_members - 列出组织成员
  mcpServer.registerTool(
    'gitea_org_members',
    {
      title: '列出组织成员',
      description: 'List organization members',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await UserTools.listOrganizationMembers(toolsContext, args as any);
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

  // gitea_org_create - 创建组织
  mcpServer.registerTool(
    'gitea_org_create',
    {
      title: '创建组织',
      description: 'Create an organization',
      inputSchema: z.object({
        username: z.string().min(1).describe('Organization username (identifier)'),
        full_name: z.string().optional().describe('Full display name of the organization'),
        description: z.string().optional().describe('Organization description'),
        website: z.string().optional().describe('Organization website URL'),
        location: z.string().optional().describe('Organization location'),
        email: z.string().optional().describe('Organization email address'),
        visibility: z.enum(['public', 'limited', 'private']).optional().describe('Organization visibility (default: public)'),
        repo_admin_change_team_access: z.boolean().optional().describe('Whether repo admins can change team access'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await OrganizationTools.createOrganization(toolsContext, args as any);
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

  // gitea_org_update - 更新组织
  mcpServer.registerTool(
    'gitea_org_update',
    {
      title: '更新组织',
      description: 'Edit/update an organization',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        full_name: z.string().optional().describe('Full display name of the organization'),
        description: z.string().optional().describe('Organization description'),
        website: z.string().optional().describe('Organization website URL'),
        location: z.string().optional().describe('Organization location'),
        visibility: z.enum(['public', 'limited', 'private']).optional().describe('Organization visibility'),
        repo_admin_change_team_access: z.boolean().optional().describe('Whether repo admins can change team access'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await OrganizationTools.updateOrganization(toolsContext, args as any);
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

  // gitea_org_delete - 删除组织
  mcpServer.registerTool(
    'gitea_org_delete',
    {
      title: '删除组织',
      description: 'Delete an organization',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name to delete'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await OrganizationTools.deleteOrganization(toolsContext, args as any);
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

  // gitea_org_repos - 列出组织仓库
  mcpServer.registerTool(
    'gitea_org_repos',
    {
      title: '列出组织仓库',
      description: "List an organization's repositories",
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await OrganizationTools.listOrganizationRepos(toolsContext, args as any);
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

  logger.info('Registered 6 organization tools');
}
