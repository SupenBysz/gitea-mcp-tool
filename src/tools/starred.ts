import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:starred');

export interface StarredToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Base params with token
export interface StarredParams {
  token?: string;
}

// List starred repositories (current user or specific user)
export interface ListStarredParams extends StarredParams {
  username?: string;
  page?: number;
  limit?: number;
}

export async function listStarredRepos(
  ctx: StarredToolsContext,
  params: ListStarredParams = {}
): Promise<unknown> {
  const path = params.username
    ? `/users/${encodeURIComponent(params.username)}/starred`
    : '/user/starred';

  logger.info({ path, username: params.username }, 'Listing starred repositories');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path,
    query: queryParams,
    token: params.token,
  });

  return response.data;
}

// Check if repository is starred
export interface CheckStarredParams extends StarredParams {
  owner?: string;
  repo?: string;
}

export async function checkStarred(
  ctx: StarredToolsContext,
  params: CheckStarredParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo }, 'Checking if repository is starred');

  try {
    const response = await ctx.client.request({
      method: 'GET',
      path: `/user/starred/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      token: params.token,
    });
    return { starred: response.status === 204 || response.status === 200 };
  } catch (error: any) {
    if (error.status === 404) {
      return { starred: false };
    }
    throw error;
  }
}

// Star a repository
export interface StarRepoParams extends StarredParams {
  owner?: string;
  repo?: string;
}

export async function starRepository(
  ctx: StarredToolsContext,
  params: StarRepoParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo }, 'Starring repository');

  await ctx.client.request({
    method: 'PUT',
    path: `/user/starred/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    token: params.token,
  });

  return { success: true, message: `Starred ${owner}/${repo}` };
}

// Unstar a repository
export interface UnstarRepoParams extends StarredParams {
  owner?: string;
  repo?: string;
}

export async function unstarRepository(
  ctx: StarredToolsContext,
  params: UnstarRepoParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo }, 'Unstarring repository');

  await ctx.client.request({
    method: 'DELETE',
    path: `/user/starred/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    token: params.token,
  });

  return { success: true, message: `Unstarred ${owner}/${repo}` };
}
