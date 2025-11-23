import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'commit-tools' });

export interface CommitToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface CommitParams {
  owner?: string;
  repo?: string;
}

// List commits
export interface ListCommitsParams extends CommitParams {
  sha?: string;
  path?: string;
  since?: string;
  until?: string;
  stat?: boolean;
  verification?: boolean;
  files?: boolean;
  page?: number;
  limit?: number;
  not?: string;
}

export async function listCommits(
  ctx: CommitToolsContext,
  params: ListCommitsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing commits');

  const queryParams: Record<string, string> = {};
  if (params.sha) queryParams.sha = params.sha;
  if (params.path) queryParams.path = params.path;
  if (params.since) queryParams.since = params.since;
  if (params.until) queryParams.until = params.until;
  if (params.stat !== undefined) queryParams.stat = String(params.stat);
  if (params.verification !== undefined) queryParams.verification = String(params.verification);
  if (params.files !== undefined) queryParams.files = String(params.files);
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);
  if (params.not) queryParams.not = params.not;

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/commits`,
    params: queryParams,
  });

  return response.data;
}

// Get single commit
export interface GetCommitParams extends CommitParams {
  sha: string;
}

export async function getCommit(
  ctx: CommitToolsContext,
  params: GetCommitParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, sha: params.sha }, 'Getting commit');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/git/commits/${params.sha}`,
  });

  return response.data;
}

// Get commit diff or patch
export interface GetCommitDiffParams extends CommitParams {
  sha: string;
  diffType: 'diff' | 'patch';
}

export async function getCommitDiff(
  ctx: CommitToolsContext,
  params: GetCommitDiffParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, sha: params.sha, diffType: params.diffType }, 'Getting commit diff');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/git/commits/${params.sha}.${params.diffType}`,
  });

  return response.data;
}

// Get commit combined status
export interface GetCommitStatusParams extends CommitParams {
  ref: string;
  page?: number;
  limit?: number;
}

export async function getCommitCombinedStatus(
  ctx: CommitToolsContext,
  params: GetCommitStatusParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, ref: params.ref }, 'Getting commit combined status');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/commits/${encodeURIComponent(params.ref)}/status`,
    params: queryParams,
  });

  return response.data;
}

// List commit statuses
export async function listCommitStatuses(
  ctx: CommitToolsContext,
  params: GetCommitStatusParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, ref: params.ref }, 'Listing commit statuses');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/commits/${encodeURIComponent(params.ref)}/statuses`,
    params: queryParams,
  });

  return response.data;
}

// Create commit status
export interface CreateCommitStatusParams extends CommitParams {
  sha: string;
  state: 'pending' | 'success' | 'error' | 'failure' | 'warning' | 'skipped';
  context?: string;
  description?: string;
  target_url?: string;
}

export async function createCommitStatus(
  ctx: CommitToolsContext,
  params: CreateCommitStatusParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, sha: params.sha, state: params.state }, 'Creating commit status');

  const body: any = {
    state: params.state,
  };

  if (params.context) body.context = params.context;
  if (params.description) body.description = params.description;
  if (params.target_url) body.target_url = params.target_url;

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/statuses/${params.sha}`,
    body,
  });

  return response.data;
}
