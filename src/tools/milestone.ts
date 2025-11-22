/**
 * Gitea Milestone Management Tools
 */

import { GiteaClient } from '../gitea-client.js';
import { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:milestone');

/**
 * 创建里程碑
 */
export async function createMilestone(
  args: {
    title: string;
    description?: string;
    due_on?: string;
    owner?: string;
    repo?: string;
  },
  client: GiteaClient,
  context: ContextManager
) {
  const { owner, repo } = context.resolveOwnerRepo(args.owner, args.repo);
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

  const milestone = await client.post(
    `/repos/${owner}/${repo}/milestones`,
    requestBody
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
  args: {
    owner?: string;
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    page?: number;
    limit?: number;
  },
  client: GiteaClient,
  context: ContextManager
) {
  const { owner, repo } = context.resolveOwnerRepo(args.owner, args.repo);
  logger.info({ owner, repo, state: args.state }, 'Listing milestones');

  const query: Record<string, string | number> = {};
  if (args.state) query.state = args.state;
  if (args.page) query.page = args.page;
  if (args.limit) query.limit = args.limit;

  const milestones = await client.get(`/repos/${owner}/${repo}/milestones`, query);

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
  args: {
    id: number;
    owner?: string;
    repo?: string;
  },
  client: GiteaClient,
  context: ContextManager
) {
  const { owner, repo } = context.resolveOwnerRepo(args.owner, args.repo);
  logger.info({ owner, repo, id: args.id }, 'Getting milestone');

  const milestone = await client.get(
    `/repos/${owner}/${repo}/milestones/${args.id}`
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
  args: {
    id: number;
    title?: string;
    description?: string;
    due_on?: string;
    state?: 'open' | 'closed';
    owner?: string;
    repo?: string;
  },
  client: GiteaClient,
  context: ContextManager
) {
  const { owner, repo } = context.resolveOwnerRepo(args.owner, args.repo);
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

  const milestone = await client.patch(
    `/repos/${owner}/${repo}/milestones/${args.id}`,
    requestBody
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
  args: {
    id: number;
    owner?: string;
    repo?: string;
  },
  client: GiteaClient,
  context: ContextManager
) {
  const { owner, repo } = context.resolveOwnerRepo(args.owner, args.repo);
  logger.info({ owner, repo, id: args.id }, 'Deleting milestone');

  await client.delete(`/repos/${owner}/${repo}/milestones/${args.id}`);

  logger.info({ id: args.id }, 'Milestone deleted');

  return {
    success: true,
    message: `Milestone ${args.id} deleted successfully`,
  };
}
