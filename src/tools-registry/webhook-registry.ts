/**
 * Webhook Tools Registry
 * Webhook 管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as WebhookTools from '../tools/webhook.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:webhook');

/**
 * Webhook 类型枚举
 */
const webhookTypeEnum = z.enum([
  'dingtalk',
  'discord',
  'gitea',
  'gogs',
  'msteams',
  'slack',
  'telegram',
  'feishu',
  'wechatwork',
  'packagist',
]);

/**
 * Webhook 配置对象
 */
const webhookConfigSchema = z.object({
  url: z.string().url().describe('Webhook URL'),
  content_type: z.string().describe('Content type (json or form)'),
  secret: z.string().optional().describe('Secret for payload signature'),
});

/**
 * 注册所有 Webhook 管理工具
 */
export function registerWebhookTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // ========== Repository Webhooks ==========

  // gitea_webhook_repo_create
  mcpServer.registerTool(
    'gitea_webhook_repo_create',
    {
      title: '创建仓库 Webhook',
      description: 'Create a webhook for a repository. Supports multiple webhook types including Gitea, Discord, Slack, DingTalk, Feishu, WeChatWork, etc.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        type: webhookTypeEnum.describe('Webhook type'),
        config: webhookConfigSchema.describe('Webhook configuration'),
        events: z.array(z.string()).optional().describe('Events to trigger webhook (default: ["push"]). Examples: push, create, delete, pull_request, issues, etc.'),
        active: z.boolean().optional().describe('Whether webhook is active (default: true)'),
        branch_filter: z.string().optional().describe('Branch filter pattern'),
        authorization_header: z.string().optional().describe('Authorization header value'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.createRepoWebhook(toolsContext, args as any);
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

  // gitea_webhook_repo_list
  mcpServer.registerTool(
    'gitea_webhook_repo_list',
    {
      title: '列出仓库 Webhooks',
      description: 'List all webhooks for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.listRepoWebhooks(toolsContext, args as any);
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

  // gitea_webhook_repo_get
  mcpServer.registerTool(
    'gitea_webhook_repo_get',
    {
      title: '获取仓库 Webhook 详情',
      description: 'Get details of a specific repository webhook',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Webhook ID'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.getRepoWebhook(toolsContext, args as any);
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

  // gitea_webhook_repo_update
  mcpServer.registerTool(
    'gitea_webhook_repo_update',
    {
      title: '更新仓库 Webhook',
      description: 'Update a repository webhook',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Webhook ID'),
        config: z.object({}).passthrough().optional().describe('New webhook configuration'),
        events: z.array(z.string()).optional().describe('New events list'),
        active: z.boolean().optional().describe('Whether webhook is active'),
        branch_filter: z.string().optional().describe('New branch filter'),
        authorization_header: z.string().optional().describe('New authorization header'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.updateRepoWebhook(toolsContext, args as any);
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

  // gitea_webhook_repo_delete
  mcpServer.registerTool(
    'gitea_webhook_repo_delete',
    {
      title: '删除仓库 Webhook',
      description: 'Delete a repository webhook',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Webhook ID'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.deleteRepoWebhook(toolsContext, args as any);
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

  // gitea_webhook_repo_test
  mcpServer.registerTool(
    'gitea_webhook_repo_test',
    {
      title: '测试仓库 Webhook',
      description: 'Send a test event to a repository webhook',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Webhook ID'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.testRepoWebhook(toolsContext, args as any);
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

  // ========== Organization Webhooks ==========

  // gitea_webhook_org_create
  mcpServer.registerTool(
    'gitea_webhook_org_create',
    {
      title: '创建组织 Webhook',
      description: 'Create a webhook for an organization',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        type: webhookTypeEnum.describe('Webhook type'),
        config: webhookConfigSchema.describe('Webhook configuration'),
        events: z.array(z.string()).optional().describe('Events to trigger webhook (default: ["push"])'),
        active: z.boolean().optional().describe('Whether webhook is active (default: true)'),
        branch_filter: z.string().optional().describe('Branch filter pattern'),
        authorization_header: z.string().optional().describe('Authorization header value'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.createOrgWebhook(toolsContext, args as any);
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

  // gitea_webhook_org_list
  mcpServer.registerTool(
    'gitea_webhook_org_list',
    {
      title: '列出组织 Webhooks',
      description: 'List all webhooks for an organization',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Items per page (default: 30)'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.listOrgWebhooks(toolsContext, args as any);
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

  // gitea_webhook_org_get
  mcpServer.registerTool(
    'gitea_webhook_org_get',
    {
      title: '获取组织 Webhook 详情',
      description: 'Get details of a specific organization webhook',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        id: z.number().int().positive().describe('Webhook ID'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.getOrgWebhook(toolsContext, args as any);
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

  // gitea_webhook_org_update
  mcpServer.registerTool(
    'gitea_webhook_org_update',
    {
      title: '更新组织 Webhook',
      description: 'Update an organization webhook',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        id: z.number().int().positive().describe('Webhook ID'),
        config: z.object({}).passthrough().optional().describe('New webhook configuration'),
        events: z.array(z.string()).optional().describe('New events list'),
        active: z.boolean().optional().describe('Whether webhook is active'),
        branch_filter: z.string().optional().describe('New branch filter'),
        authorization_header: z.string().optional().describe('New authorization header'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.updateOrgWebhook(toolsContext, args as any);
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

  // gitea_webhook_org_delete
  mcpServer.registerTool(
    'gitea_webhook_org_delete',
    {
      title: '删除组织 Webhook',
      description: 'Delete an organization webhook',
      inputSchema: z.object({
        org: z.string().min(1).describe('Organization name'),
        id: z.number().int().positive().describe('Webhook ID'),
      }),
    },
    async (args) => {
      try {
        const result = await WebhookTools.deleteOrgWebhook(toolsContext, args as any);
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

  logger.info('Registered 11 webhook tools');
}
