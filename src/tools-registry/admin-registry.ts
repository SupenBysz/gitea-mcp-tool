/**
 * Admin Tools Registry
 * 管理员工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as AdminTools from '../tools/admin.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:admin');

/**
 * 注册所有 Admin 管理工具
 */
export function registerAdminTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_admin_user_create - 创建用户 (管理员)
  mcpServer.registerTool(
    'gitea_admin_user_create',
    {
      title: '创建用户 (管理员)',
      description: 'Create a new user (admin only)',
      inputSchema: z.object({
        username: z.string().min(1).describe('Username'),
        email: z.string().email().describe('Email address'),
        password: z.string().min(1).describe('Password'),
        full_name: z.string().optional().describe('Full name'),
        login_name: z.string().optional().describe('Login name'),
        must_change_password: z.boolean().optional().describe('Must change password on first login'),
        send_notify: z.boolean().optional().describe('Send email notification'),
        source_id: z.number().optional().describe('Authentication source ID'),
        visibility: z.string().optional().describe('User visibility (public, limited, private)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await AdminTools.createUser(toolsContext, args as any);
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

  // gitea_admin_user_delete - 删除用户 (管理员)
  mcpServer.registerTool(
    'gitea_admin_user_delete',
    {
      title: '删除用户 (管理员)',
      description: 'Delete a user (admin only)',
      inputSchema: z.object({
        username: z.string().min(1).describe('Username to delete'),
        purge: z.boolean().optional().describe('Purge user data completely'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await AdminTools.deleteUser(toolsContext, args as any);
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

  // gitea_admin_user_edit - 编辑用户 (管理员)
  mcpServer.registerTool(
    'gitea_admin_user_edit',
    {
      title: '编辑用户 (管理员)',
      description: 'Edit user settings (admin only)',
      inputSchema: z.object({
        username: z.string().min(1).describe('Username to edit'),
        active: z.boolean().optional().describe('Is user active'),
        admin: z.boolean().optional().describe('Is user admin'),
        allow_create_organization: z.boolean().optional().describe('Allow creating organizations'),
        allow_git_hook: z.boolean().optional().describe('Allow Git hooks'),
        allow_import_local: z.boolean().optional().describe('Allow importing local repos'),
        description: z.string().optional().describe('User description'),
        email: z.string().email().optional().describe('Email address'),
        full_name: z.string().optional().describe('Full name'),
        location: z.string().optional().describe('Location'),
        login_name: z.string().optional().describe('Login name'),
        max_repo_creation: z.number().optional().describe('Max repositories to create (-1 for unlimited)'),
        must_change_password: z.boolean().optional().describe('Must change password'),
        password: z.string().optional().describe('New password'),
        prohibit_login: z.boolean().optional().describe('Prohibit user login'),
        restricted: z.boolean().optional().describe('Is restricted user'),
        source_id: z.number().optional().describe('Authentication source ID'),
        visibility: z.string().optional().describe('User visibility (public, limited, private)'),
        website: z.string().optional().describe('User website'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await AdminTools.editUser(toolsContext, args as any);
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

  logger.info('Registered 3 admin tools');
}
