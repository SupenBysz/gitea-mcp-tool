import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:tag');

export interface TagToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface TagParams {
  owner?: string;
  repo?: string;
  token?: string;
}

// List tags
export interface ListTagsParams extends TagParams {
  page?: number;
  limit?: number;
}

export async function listTags(
  ctx: TagToolsContext,
  params: ListTagsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing tags');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/tags`,
    query: queryParams,
    token: params.token,
  });

  return response.data;
}

// Create tag
export interface CreateTagParams extends TagParams {
  tag_name: string;
  target?: string;
  message?: string;
}

export async function createTag(
  ctx: TagToolsContext,
  params: CreateTagParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, tag_name: params.tag_name }, 'Creating tag');

  const body: any = {
    tag_name: params.tag_name,
  };

  if (params.target) body.target = params.target;
  if (params.message) body.message = params.message;

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/tags`,
    body,
    token: params.token,
  });

  return response.data;
}

// Get tag
export interface GetTagParams extends TagParams {
  tag: string;
}

export async function getTag(
  ctx: TagToolsContext,
  params: GetTagParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, tag: params.tag }, 'Getting tag');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/tags/${encodeURIComponent(params.tag)}`,
    token: params.token,
  });

  return response.data;
}

// Delete tag
export async function deleteTag(
  ctx: TagToolsContext,
  params: GetTagParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, tag: params.tag }, 'Deleting tag');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/tags/${encodeURIComponent(params.tag)}`,
    token: params.token,
  });

  return response.data;
}

// Get annotated tag object
export interface GetAnnotatedTagParams extends TagParams {
  sha: string;
}

export async function getAnnotatedTag(
  ctx: TagToolsContext,
  params: GetAnnotatedTagParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, sha: params.sha }, 'Getting annotated tag');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/git/tags/${params.sha}`,
    token: params.token,
  });

  return response.data;
}

// List tag protections
export interface ListTagProtectionsParams extends TagParams {
  page?: number;
  limit?: number;
}

export async function listTagProtections(
  ctx: TagToolsContext,
  params: ListTagProtectionsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing tag protections');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/tag_protections`,
    query: queryParams,
    token: params.token,
  });

  return response.data;
}

// Create tag protection
export interface CreateTagProtectionParams extends TagParams {
  name_pattern?: string;
  whitelist_usernames?: string[];
  whitelist_teams?: string[];
}

export async function createTagProtection(
  ctx: TagToolsContext,
  params: CreateTagProtectionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, name_pattern: params.name_pattern }, 'Creating tag protection');

  const body: any = {};

  if (params.name_pattern) body.name_pattern = params.name_pattern;
  if (params.whitelist_usernames) body.whitelist_usernames = params.whitelist_usernames;
  if (params.whitelist_teams) body.whitelist_teams = params.whitelist_teams;

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/tag_protections`,
    body,
    token: params.token,
  });

  return response.data;
}

// Get tag protection
export interface GetTagProtectionParams extends TagParams {
  id: number;
}

export async function getTagProtection(
  ctx: TagToolsContext,
  params: GetTagProtectionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, id: params.id }, 'Getting tag protection');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/tag_protections/${params.id}`,
    token: params.token,
  });

  return response.data;
}

// Update tag protection
export interface UpdateTagProtectionParams extends TagParams {
  id: number;
  name_pattern?: string;
  whitelist_usernames?: string[];
  whitelist_teams?: string[];
}

export async function updateTagProtection(
  ctx: TagToolsContext,
  params: UpdateTagProtectionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, id: params.id }, 'Updating tag protection');

  const body: any = {};

  if (params.name_pattern) body.name_pattern = params.name_pattern;
  if (params.whitelist_usernames) body.whitelist_usernames = params.whitelist_usernames;
  if (params.whitelist_teams) body.whitelist_teams = params.whitelist_teams;

  const response = await ctx.client.request({
    method: 'PATCH',
    path: `/repos/${owner}/${repo}/tag_protections/${params.id}`,
    body,
    token: params.token,
  });

  return response.data;
}

// Delete tag protection
export async function deleteTagProtection(
  ctx: TagToolsContext,
  params: GetTagProtectionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, id: params.id }, 'Deleting tag protection');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/tag_protections/${params.id}`,
    token: params.token,
  });

  return response.data;
}
