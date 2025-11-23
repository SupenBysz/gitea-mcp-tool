import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'starred-tools' });

export interface StarredToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// List starred repositories (current user or specific user)
export interface ListStarredParams {
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
    params: queryParams,
  });

  return response.data;
}

// Check if repository is starred
export interface CheckStarredParams {
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
export interface StarRepoParams {
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

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/user/starred/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
  });

  return { success: true, message: `Starred ${owner}/${repo}` };
}

// Unstar a repository
export interface UnstarRepoParams {
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

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/user/starred/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
  });

  return { success: true, message: `Unstarred ${owner}/${repo}` };
}
