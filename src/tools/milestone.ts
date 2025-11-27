/**
 * Gitea Milestone Management Tools
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type { GiteaMilestone } from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:milestone');

export interface MilestoneToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 创建里程碑
 */
export async function createMilestone(
  ctx: MilestoneToolsContext,
  args: {
    title: string;
    description?: string;
    due_on?: string;
    owner?: string;
    repo?: string;
    token?: string;
  }
) {
  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);
  logger.info({ owner, repo, title: args.title }, 'Creating milestone');

  const requestBody: {
    title: string;
    description?: string;
    due_on?: string;
  } = {
    title: args.title,
  };

  if (args.description) {
    requestBody.description = args.description;
  }

  if (args.due_on) {
    requestBody.due_on = args.due_on;
  }

  const milestone = await ctx.client.post<GiteaMilestone>(
    `/repos/${owner}/${repo}/milestones`,
    requestBody,
    args.token
  );

  logger.info({ id: milestone.id, title: milestone.title }, 'Milestone created');

  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    state: milestone.state,
    open_issues: milestone.open_issues,
    closed_issues: milestone.closed_issues,
    due_on: milestone.due_on,
    created_at: milestone.created_at,
    updated_at: milestone.updated_at,
  };
}

/**
 * 获取里程碑列表
 */
export async function listMilestones(
  ctx: MilestoneToolsContext,
  args: {
    owner?: string;
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    page?: number;
    limit?: number;
    token?: string;
  }
) {
  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);
  logger.info({ owner, repo, state: args.state }, 'Listing milestones');

  const query: Record<string, string | number> = {};
  if (args.state) query.state = args.state;
  if (args.page) query.page = args.page;
  if (args.limit) query.limit = args.limit;

  const milestones = await ctx.client.get<GiteaMilestone[]>(`/repos/${owner}/${repo}/milestones`, query, args.token);

  logger.info({ count: milestones.length }, 'Milestones retrieved');

  return {
    milestones: milestones.map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      state: m.state,
      open_issues: m.open_issues,
      closed_issues: m.closed_issues,
      due_on: m.due_on,
      created_at: m.created_at,
      updated_at: m.updated_at,
    })),
    total: milestones.length,
  };
}

/**
 * 获取里程碑详情
 */
export async function getMilestone(
  ctx: MilestoneToolsContext,
  args: {
    id: number;
    owner?: string;
    repo?: string;
    token?: string;
  }
) {
  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);
  logger.info({ owner, repo, id: args.id }, 'Getting milestone');

  const milestone = await ctx.client.get<GiteaMilestone>(
    `/repos/${owner}/${repo}/milestones/${args.id}`,
    undefined,
    args.token
  );

  logger.info({ id: milestone.id, title: milestone.title }, 'Milestone retrieved');

  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    state: milestone.state,
    open_issues: milestone.open_issues,
    closed_issues: milestone.closed_issues,
    due_on: milestone.due_on,
    created_at: milestone.created_at,
    updated_at: milestone.updated_at,
    closed_at: milestone.closed_at,
  };
}

/**
 * 更新里程碑
 */
export async function updateMilestone(
  ctx: MilestoneToolsContext,
  args: {
    id: number;
    title?: string;
    description?: string;
    due_on?: string;
    state?: 'open' | 'closed';
    owner?: string;
    repo?: string;
    token?: string;
  }
) {
  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);
  logger.info({ owner, repo, id: args.id }, 'Updating milestone');

  const requestBody: {
    title?: string;
    description?: string;
    due_on?: string;
    state?: string;
  } = {};

  if (args.title !== undefined) requestBody.title = args.title;
  if (args.description !== undefined) requestBody.description = args.description;
  if (args.due_on !== undefined) requestBody.due_on = args.due_on;
  if (args.state !== undefined) requestBody.state = args.state;

  const milestone = await ctx.client.patch<GiteaMilestone>(
    `/repos/${owner}/${repo}/milestones/${args.id}`,
    requestBody,
    args.token
  );

  logger.info({ id: milestone.id, title: milestone.title }, 'Milestone updated');

  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    state: milestone.state,
    open_issues: milestone.open_issues,
    closed_issues: milestone.closed_issues,
    due_on: milestone.due_on,
    updated_at: milestone.updated_at,
  };
}

/**
 * 删除里程碑
 */
export async function deleteMilestone(
  ctx: MilestoneToolsContext,
  args: {
    id: number;
    owner?: string;
    repo?: string;
    token?: string;
  }
) {
  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);
  logger.info({ owner, repo, id: args.id }, 'Deleting milestone');

  await ctx.client.delete(`/repos/${owner}/${repo}/milestones/${args.id}`, args.token);

  logger.info({ id: args.id }, 'Milestone deleted');

  return {
    success: true,
    message: `Milestone ${args.id} deleted successfully`,
  };
}
