import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as NotificationTools from '../tools/notification.js';
import { ToolContext } from '../types.js';

export function registerNotificationTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. List notifications
  mcpServer.registerTool(
    'gitea_notification_list',
    {
      title: '列出通知',
      description: "List user's notification threads",
      inputSchema: z.object({
        all: z.boolean().optional().describe('Show notifications marked as read (default: false)'),
        status_types: z.array(z.enum(['unread', 'read', 'pinned'])).optional().describe('Filter by status types'),
        subject_type: z.array(z.string()).optional().describe('Filter by subject type (e.g., "Issue", "PullRequest")'),
        since: z.string().optional().describe('Only show notifications updated after this time (RFC 3339)'),
        before: z.string().optional().describe('Only show notifications updated before this time (RFC 3339)'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await NotificationTools.listNotifications(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Mark notifications
  mcpServer.registerTool(
    'gitea_notification_mark',
    {
      title: '标记通知状态',
      description: 'Mark notification threads as read, pinned or unread',
      inputSchema: z.object({
        last_read_at: z.string().optional().describe('Timestamp to mark notifications as read up to (RFC 3339)'),
        all: z.boolean().optional().describe('Mark all notifications'),
        status_types: z.array(z.enum(['unread', 'read', 'pinned'])).optional().describe('Filter notifications by status'),
        to_status: z.enum(['read', 'unread', 'pinned']).optional().describe('Target status to set'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await NotificationTools.markNotifications(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Check new notifications
  mcpServer.registerTool(
    'gitea_notification_check_new',
    {
      title: '检查新通知',
      description: 'Check if unread notifications exist',
      inputSchema: z.object({}),
    },
    async (args) => {
      try {
        const result = await NotificationTools.checkNewNotifications(toolsContext);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Get notification thread
  mcpServer.registerTool(
    'gitea_notification_thread_get',
    {
      title: '获取通知详情',
      description: 'Get notification thread by ID',
      inputSchema: z.object({
        id: z.string().min(1).describe('Notification thread ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await NotificationTools.getNotificationThread(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 5. Mark notification thread as read
  mcpServer.registerTool(
    'gitea_notification_thread_mark_read',
    {
      title: '标记通知为已读',
      description: 'Mark notification thread as read by ID',
      inputSchema: z.object({
        id: z.string().min(1).describe('Notification thread ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await NotificationTools.markNotificationThread(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 6. List repository notifications
  mcpServer.registerTool(
    'gitea_notification_repo_list',
    {
      title: '列出仓库通知',
      description: "List user's notification threads on a specific repo",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        all: z.boolean().optional().describe('Show notifications marked as read (default: false)'),
        status_types: z.array(z.enum(['unread', 'read', 'pinned'])).optional().describe('Filter by status types'),
        subject_type: z.array(z.string()).optional().describe('Filter by subject type'),
        since: z.string().optional().describe('Only show notifications updated after this time (RFC 3339)'),
        before: z.string().optional().describe('Only show notifications updated before this time (RFC 3339)'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await NotificationTools.listRepoNotifications(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 7. Mark repository notifications
  mcpServer.registerTool(
    'gitea_notification_repo_mark',
    {
      title: '标记仓库通知状态',
      description: 'Mark notification threads as read, pinned or unread on a specific repo',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        last_read_at: z.string().optional().describe('Timestamp to mark notifications as read up to (RFC 3339)'),
        all: z.boolean().optional().describe('Mark all notifications'),
        status_types: z.array(z.enum(['unread', 'read', 'pinned'])).optional().describe('Filter notifications by status'),
        to_status: z.enum(['read', 'unread', 'pinned']).optional().describe('Target status to set'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await NotificationTools.markRepoNotifications(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
