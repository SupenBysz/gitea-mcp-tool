/**
 * Label Management Tools
 *
 * Label 管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type {
  GiteaLabel,
  CreateLabelOptions,
  UpdateLabelOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:label');

export interface LabelToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// ============================================================
// 仓库 Label 管理
// ============================================================

/**
 * 创建仓库 Label
 */
export async function createRepoLabel(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    name: string;
    color: string;
    description?: string;
    exclusive?: boolean;
    is_archived?: boolean;
    token?: string;
  }
) {
  logger.debug({ args }, 'Creating repository label');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const labelOptions: CreateLabelOptions = {
    name: args.name,
    color: args.color,
    description: args.description,
    exclusive: args.exclusive,
    is_archived: args.is_archived,
  };

  const label = await ctx.client.post<GiteaLabel>(
    `/repos/${owner}/${repo}/labels`,
    labelOptions,
    args.token
  );

  logger.info({ owner, repo, label: label.name }, 'Repository label created successfully');

  return {
    success: true,
    label: {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      exclusive: label.exclusive,
      is_archived: label.is_archived,
      url: label.url,
    },
  };
}

/**
 * 列出仓库所有 Labels
 */
export async function listRepoLabels(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    page?: number;
    limit?: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Listing repository labels');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const labels = await ctx.client.get<GiteaLabel[]>(`/repos/${owner}/${repo}/labels`, {
    page: args.page || 1,
    limit: args.limit || 30,
  }, args.token);

  logger.debug({ count: labels.length }, 'Repository labels listed');

  return {
    success: true,
    labels: labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      exclusive: label.exclusive,
      is_archived: label.is_archived,
      url: label.url,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: labels.length,
    },
  };
}

/**
 * 获取仓库 Label 详情
 */
export async function getRepoLabel(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Getting repository label');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const label = await ctx.client.get<GiteaLabel>(`/repos/${owner}/${repo}/labels/${args.id}`, undefined, args.token);

  logger.debug({ label: label.name }, 'Repository label retrieved');

  return {
    success: true,
    label: {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      exclusive: label.exclusive,
      is_archived: label.is_archived,
      url: label.url,
    },
  };
}

/**
 * 更新仓库 Label
 */
export async function updateRepoLabel(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    name?: string;
    color?: string;
    description?: string;
    exclusive?: boolean;
    is_archived?: boolean;
    token?: string;
  }
) {
  logger.debug({ args }, 'Updating repository label');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const updateOptions: UpdateLabelOptions = {
    name: args.name,
    color: args.color,
    description: args.description,
    exclusive: args.exclusive,
    is_archived: args.is_archived,
  };

  const label = await ctx.client.patch<GiteaLabel>(
    `/repos/${owner}/${repo}/labels/${args.id}`,
    updateOptions,
    args.token
  );

  logger.info({ owner, repo, label: label.name }, 'Repository label updated successfully');

  return {
    success: true,
    label: {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      exclusive: label.exclusive,
      is_archived: label.is_archived,
      url: label.url,
    },
  };
}

/**
 * 删除仓库 Label
 */
export async function deleteRepoLabel(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Deleting repository label');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  await ctx.client.delete(`/repos/${owner}/${repo}/labels/${args.id}`, undefined, args.token);

  logger.info({ owner, repo, label_id: args.id }, 'Repository label deleted successfully');

  return {
    success: true,
    message: `Label #${args.id} has been deleted from ${owner}/${repo}`,
  };
}

// ============================================================
// 组织 Label 管理
// ============================================================

/**
 * 创建组织 Label
 */
export async function createOrgLabel(
  ctx: LabelToolsContext,
  args: {
    org: string;
    name: string;
    color: string;
    description?: string;
    exclusive?: boolean;
    is_archived?: boolean;
    token?: string;
  }
) {
  logger.debug({ args }, 'Creating organization label');

  const labelOptions: CreateLabelOptions = {
    name: args.name,
    color: args.color,
    description: args.description,
    exclusive: args.exclusive,
    is_archived: args.is_archived,
  };

  const label = await ctx.client.post<GiteaLabel>(
    `/orgs/${args.org}/labels`,
    labelOptions,
    args.token
  );

  logger.info({ org: args.org, label: label.name }, 'Organization label created successfully');

  return {
    success: true,
    label: {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      exclusive: label.exclusive,
      is_archived: label.is_archived,
      url: label.url,
    },
  };
}

/**
 * 列出组织所有 Labels
 */
export async function listOrgLabels(
  ctx: LabelToolsContext,
  args: {
    org: string;
    page?: number;
    limit?: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Listing organization labels');

  const labels = await ctx.client.get<GiteaLabel[]>(`/orgs/${args.org}/labels`, {
    page: args.page || 1,
    limit: args.limit || 30,
  }, args.token);

  logger.debug({ count: labels.length }, 'Organization labels listed');

  return {
    success: true,
    labels: labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      exclusive: label.exclusive,
      is_archived: label.is_archived,
      url: label.url,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: labels.length,
    },
  };
}

/**
 * 获取组织 Label 详情
 */
export async function getOrgLabel(
  ctx: LabelToolsContext,
  args: {
    org: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Getting organization label');

  const label = await ctx.client.get<GiteaLabel>(`/orgs/${args.org}/labels/${args.id}`, undefined, args.token);

  logger.debug({ label: label.name }, 'Organization label retrieved');

  return {
    success: true,
    label: {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      exclusive: label.exclusive,
      is_archived: label.is_archived,
      url: label.url,
    },
  };
}

/**
 * 更新组织 Label
 */
export async function updateOrgLabel(
  ctx: LabelToolsContext,
  args: {
    org: string;
    id: number;
    name?: string;
    color?: string;
    description?: string;
    exclusive?: boolean;
    is_archived?: boolean;
    token?: string;
  }
) {
  logger.debug({ args }, 'Updating organization label');

  const updateOptions: UpdateLabelOptions = {
    name: args.name,
    color: args.color,
    description: args.description,
    exclusive: args.exclusive,
    is_archived: args.is_archived,
  };

  const label = await ctx.client.patch<GiteaLabel>(
    `/orgs/${args.org}/labels/${args.id}`,
    updateOptions,
    args.token
  );

  logger.info({ org: args.org, label: label.name }, 'Organization label updated successfully');

  return {
    success: true,
    label: {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      exclusive: label.exclusive,
      is_archived: label.is_archived,
      url: label.url,
    },
  };
}

/**
 * 删除组织 Label
 */
export async function deleteOrgLabel(
  ctx: LabelToolsContext,
  args: {
    org: string;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Deleting organization label');

  await ctx.client.delete(`/orgs/${args.org}/labels/${args.id}`, undefined, args.token);

  logger.info({ org: args.org, label_id: args.id }, 'Organization label deleted successfully');

  return {
    success: true,
    message: `Label #${args.id} has been deleted from organization ${args.org}`,
  };
}

// ============================================================
// Issue Label 操作
// ============================================================

/**
 * 为 Issue 添加 Labels
 */
export async function addIssueLabels(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    labels: number[];
    token?: string;
  }
) {
  logger.debug({ args }, 'Adding labels to issue');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const labels = await ctx.client.post<GiteaLabel[]>(
    `/repos/${owner}/${repo}/issues/${args.index}/labels`,
    { labels: args.labels },
    args.token
  );

  logger.info(
    { owner, repo, issue: args.index, labels: labels.length },
    'Labels added to issue successfully'
  );

  return {
    success: true,
    labels: labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
    })),
  };
}

/**
 * 替换 Issue 的所有 Labels
 */
export async function replaceIssueLabels(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    labels: number[];
    token?: string;
  }
) {
  logger.debug({ args }, 'Replacing issue labels');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  const labels = await ctx.client.put<GiteaLabel[]>(
    `/repos/${owner}/${repo}/issues/${args.index}/labels`,
    { labels: args.labels },
    args.token
  );

  logger.info(
    { owner, repo, issue: args.index, labels: labels.length },
    'Issue labels replaced successfully'
  );

  return {
    success: true,
    labels: labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
    })),
  };
}

/**
 * 删除 Issue 的特定 Label
 */
export async function removeIssueLabel(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    id: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Removing label from issue');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  await ctx.client.delete(`/repos/${owner}/${repo}/issues/${args.index}/labels/${args.id}`, undefined, args.token);

  logger.info(
    { owner, repo, issue: args.index, label_id: args.id },
    'Label removed from issue successfully'
  );

  return {
    success: true,
    message: `Label #${args.id} has been removed from issue #${args.index}`,
  };
}

/**
 * 清除 Issue 的所有 Labels
 */
export async function clearIssueLabels(
  ctx: LabelToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Clearing all labels from issue');

  const owner = args.owner || ctx.contextManager.getOwner();
  const repo = args.repo || ctx.contextManager.getRepo();

  await ctx.client.delete(`/repos/${owner}/${repo}/issues/${args.index}/labels`, undefined, args.token);

  logger.info(
    { owner, repo, issue: args.index },
    'All labels cleared from issue successfully'
  );

  return {
    success: true,
    message: `All labels have been cleared from issue #${args.index}`,
  };
}
