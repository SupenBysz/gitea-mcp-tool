/**
 * Webhook Management Tools
 *
 * Webhook 管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type {
  GiteaWebhook,
  CreateWebhookOptions,
  UpdateWebhookOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:webhook');

export interface WebhookToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// ============================================================
// 仓库 Webhook 管理
// ============================================================

/**
 * 创建仓库 Webhook
 */
export async function createRepoWebhook(
  ctx: WebhookToolsContext,
  args: {
    owner?: string;
    repo?: string;
    type: string;
    config: {
      url: string;
      content_type: string;
      secret?: string;
      [key: string]: string | undefined;
    };
    events?: string[];
    active?: boolean;
    branch_filter?: string;
    authorization_header?: string;
    token?: string;
  }
) {
  logger.debug({ args }, 'Creating repository webhook');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const webhookOptions: CreateWebhookOptions = {
    type: args.type as any,
    config: args.config,
    events: args.events || ['push'],
    active: args.active !== undefined ? args.active : true,
    branch_filter: args.branch_filter,
    authorization_header: args.authorization_header,
  };

  const webhook = await ctx.client.post<GiteaWebhook>(
    `/repos/${owner}/${repo}/hooks`,
    webhookOptions,
    args.token
  );

  logger.info({ owner, repo, webhook_id: webhook.id, type: webhook.type }, 'Repository webhook created successfully');

  return {
    success: true,
    webhook: {
      id: webhook.id,
      type: webhook.type,
      active: webhook.active,
      config: webhook.config,
      events: webhook.events,
      branch_filter: webhook.branch_filter,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    },
  };
}

/**
 * 列出仓库所有 Webhooks
 */
export async function listRepoWebhooks(
  ctx: WebhookToolsContext,
  args: {
    owner?: string;
    repo?: string;
    page?: number;
    limit?: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Listing repository webhooks');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const webhooks = await ctx.client.get<GiteaWebhook[]>(`/repos/${owner}/${repo}/hooks`, {
    page: args.page || 1,
    limit: args.limit || 30,
  }, args.token);

  logger.debug({ count: webhooks.length }, 'Repository webhooks listed');

  return {
    success: true,
    webhooks: webhooks.map((webhook) => ({
      id: webhook.id,
      type: webhook.type,
      active: webhook.active,
      config: webhook.config,
      events: webhook.events,
      branch_filter: webhook.branch_filter,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: webhooks.length,
    },
  };
}

/**
 * 获取仓库 Webhook 详情
 */
export async function getRepoWebhook(
  ctx: WebhookToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Getting repository webhook');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const webhook = await ctx.client.get<GiteaWebhook>(`/repos/${owner}/${repo}/hooks/${args.id}`, undefined, args.token);

  logger.debug({ webhook_id: webhook.id, type: webhook.type }, 'Repository webhook retrieved');

  return {
    success: true,
    webhook: {
      id: webhook.id,
      type: webhook.type,
      active: webhook.active,
      config: webhook.config,
      events: webhook.events,
      branch_filter: webhook.branch_filter,
      authorization_header: webhook.authorization_header,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    },
  };
}

/**
 * 更新仓库 Webhook
 */
export async function updateRepoWebhook(
  ctx: WebhookToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    config?: Record<string, string>;
    events?: string[];
    active?: boolean;
    branch_filter?: string;
    authorization_header?: string;
    token?: string;
  }
) {
  logger.debug({ args }, 'Updating repository webhook');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const updateOptions: UpdateWebhookOptions = {
    config: args.config,
    events: args.events,
    active: args.active,
    branch_filter: args.branch_filter,
    authorization_header: args.authorization_header,
  };

  const webhook = await ctx.client.patch<GiteaWebhook>(
    `/repos/${owner}/${repo}/hooks/${args.id}`,
    updateOptions,
    args.token
  );

  logger.info({ owner, repo, webhook_id: webhook.id }, 'Repository webhook updated successfully');

  return {
    success: true,
    webhook: {
      id: webhook.id,
      type: webhook.type,
      active: webhook.active,
      config: webhook.config,
      events: webhook.events,
      branch_filter: webhook.branch_filter,
      updated_at: webhook.updated_at,
    },
  };
}

/**
 * 删除仓库 Webhook
 */
export async function deleteRepoWebhook(
  ctx: WebhookToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Deleting repository webhook');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  await ctx.client.delete(`/repos/${owner}/${repo}/hooks/${args.id}`, undefined, args.token);

  logger.info({ owner, repo, webhook_id: args.id }, 'Repository webhook deleted successfully');

  return {
    success: true,
    message: `Webhook #${args.id} has been deleted from ${owner}/${repo}`,
  };
}

/**
 * 测试仓库 Webhook
 */
export async function testRepoWebhook(
  ctx: WebhookToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Testing repository webhook');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  await ctx.client.post(`/repos/${owner}/${repo}/hooks/${args.id}/tests`, {}, args.token);

  logger.info({ owner, repo, webhook_id: args.id }, 'Repository webhook test triggered successfully');

  return {
    success: true,
    message: `Test event has been sent to webhook #${args.id}`,
  };
}

// ============================================================
// 组织 Webhook 管理
// ============================================================

/**
 * 创建组织 Webhook
 */
export async function createOrgWebhook(
  ctx: WebhookToolsContext,
  args: {
    org: string;
    type: string;
    config: {
      url: string;
      content_type: string;
      secret?: string;
      [key: string]: string | undefined;
    };
    events?: string[];
    active?: boolean;
    branch_filter?: string;
    authorization_header?: string;
    token?: string;
  }
) {
  logger.debug({ args }, 'Creating organization webhook');

  const webhookOptions: CreateWebhookOptions = {
    type: args.type as any,
    config: args.config,
    events: args.events || ['push'],
    active: args.active !== undefined ? args.active : true,
    branch_filter: args.branch_filter,
    authorization_header: args.authorization_header,
  };

  const webhook = await ctx.client.post<GiteaWebhook>(
    `/orgs/${args.org}/hooks`,
    webhookOptions,
    args.token
  );

  logger.info({ org: args.org, webhook_id: webhook.id, type: webhook.type }, 'Organization webhook created successfully');

  return {
    success: true,
    webhook: {
      id: webhook.id,
      type: webhook.type,
      active: webhook.active,
      config: webhook.config,
      events: webhook.events,
      branch_filter: webhook.branch_filter,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    },
  };
}

/**
 * 列出组织所有 Webhooks
 */
export async function listOrgWebhooks(
  ctx: WebhookToolsContext,
  args: {
    org: string;
    page?: number;
    limit?: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Listing organization webhooks');

  const webhooks = await ctx.client.get<GiteaWebhook[]>(`/orgs/${args.org}/hooks`, {
    page: args.page || 1,
    limit: args.limit || 30,
  }, args.token);

  logger.debug({ count: webhooks.length }, 'Organization webhooks listed');

  return {
    success: true,
    webhooks: webhooks.map((webhook) => ({
      id: webhook.id,
      type: webhook.type,
      active: webhook.active,
      config: webhook.config,
      events: webhook.events,
      branch_filter: webhook.branch_filter,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: webhooks.length,
    },
  };
}

/**
 * 获取组织 Webhook 详情
 */
export async function getOrgWebhook(
  ctx: WebhookToolsContext,
  args: {
    org: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Getting organization webhook');

  const webhook = await ctx.client.get<GiteaWebhook>(`/orgs/${args.org}/hooks/${args.id}`, undefined, args.token);

  logger.debug({ webhook_id: webhook.id, type: webhook.type }, 'Organization webhook retrieved');

  return {
    success: true,
    webhook: {
      id: webhook.id,
      type: webhook.type,
      active: webhook.active,
      config: webhook.config,
      events: webhook.events,
      branch_filter: webhook.branch_filter,
      authorization_header: webhook.authorization_header,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    },
  };
}

/**
 * 更新组织 Webhook
 */
export async function updateOrgWebhook(
  ctx: WebhookToolsContext,
  args: {
    org: string;
    id: number;
    config?: Record<string, string>;
    events?: string[];
    active?: boolean;
    branch_filter?: string;
    authorization_header?: string;
    token?: string;
  }
) {
  logger.debug({ args }, 'Updating organization webhook');

  const updateOptions: UpdateWebhookOptions = {
    config: args.config,
    events: args.events,
    active: args.active,
    branch_filter: args.branch_filter,
    authorization_header: args.authorization_header,
  };

  const webhook = await ctx.client.patch<GiteaWebhook>(
    `/orgs/${args.org}/hooks/${args.id}`,
    updateOptions,
    args.token
  );

  logger.info({ org: args.org, webhook_id: webhook.id }, 'Organization webhook updated successfully');

  return {
    success: true,
    webhook: {
      id: webhook.id,
      type: webhook.type,
      active: webhook.active,
      config: webhook.config,
      events: webhook.events,
      branch_filter: webhook.branch_filter,
      updated_at: webhook.updated_at,
    },
  };
}

/**
 * 删除组织 Webhook
 */
export async function deleteOrgWebhook(
  ctx: WebhookToolsContext,
  args: {
    org: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Deleting organization webhook');

  await ctx.client.delete(`/orgs/${args.org}/hooks/${args.id}`, undefined, args.token);

  logger.info({ org: args.org, webhook_id: args.id }, 'Organization webhook deleted successfully');

  return {
    success: true,
    message: `Webhook #${args.id} has been deleted from organization ${args.org}`,
  };
}
