import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:branch');

export interface BranchToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface BranchParams {
  owner?: string;
  repo?: string;
  token?: string;
}

// List branches
export interface ListBranchesParams extends BranchParams {
  page?: number;
  limit?: number;
}

export async function listBranches(
  ctx: BranchToolsContext,
  params: ListBranchesParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing branches');

  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/branches`,
    query: queryParams,
    token: params.token,
  });

  return response.data;
}

// Create branch
export interface CreateBranchParams extends BranchParams {
  new_branch_name: string;
  old_branch_name?: string;
  old_ref_name?: string;
}

export async function createBranch(
  ctx: BranchToolsContext,
  params: CreateBranchParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, branch: params.new_branch_name }, 'Creating branch');

  const body: any = {
    new_branch_name: params.new_branch_name,
  };

  if (params.old_branch_name) {
    body.old_branch_name = params.old_branch_name;
  }
  if (params.old_ref_name) {
    body.old_ref_name = params.old_ref_name;
  }

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/branches`,
    body,
    token: params.token,
  });

  return response.data;
}

// Get branch
export interface GetBranchParams extends BranchParams {
  branch: string;
}

export async function getBranch(
  ctx: BranchToolsContext,
  params: GetBranchParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, branch: params.branch }, 'Getting branch');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/branches/${encodeURIComponent(params.branch)}`,
    token: params.token,
  });

  return response.data;
}

// Delete branch
export interface DeleteBranchParams extends BranchParams {
  branch: string;
}

export async function deleteBranch(
  ctx: BranchToolsContext,
  params: DeleteBranchParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, branch: params.branch }, 'Deleting branch');

  await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/branches/${encodeURIComponent(params.branch)}`,
    token: params.token,
  });

  return { message: 'Branch deleted successfully' };
}

// Rename branch
export interface RenameBranchParams extends BranchParams {
  branch: string;
  new_name: string;
}

export async function renameBranch(
  ctx: BranchToolsContext,
  params: RenameBranchParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, branch: params.branch, newName: params.new_name }, 'Renaming branch');

  await ctx.client.request({
    method: 'PATCH',
    path: `/repos/${owner}/${repo}/branches/${encodeURIComponent(params.branch)}`,
    body: { new_name: params.new_name },
    token: params.token,
  });

  return { message: 'Branch renamed successfully' };
}

// List branch protections
export interface ListBranchProtectionsParams extends BranchParams {}

export async function listBranchProtections(
  ctx: BranchToolsContext,
  params: ListBranchProtectionsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing branch protections');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/branch_protections`,
    token: params.token,
  });

  return response.data;
}

// Create branch protection
export interface CreateBranchProtectionParams extends BranchParams {
  branch_name?: string;
  rule_name?: string;
  enable_push?: boolean;
  enable_push_whitelist?: boolean;
  push_whitelist_usernames?: string[];
  push_whitelist_teams?: string[];
  push_whitelist_deploy_keys?: boolean;
  enable_merge_whitelist?: boolean;
  merge_whitelist_usernames?: string[];
  merge_whitelist_teams?: string[];
  enable_status_check?: boolean;
  status_check_contexts?: string[];
  required_approvals?: number;
  enable_approvals_whitelist?: boolean;
  approvals_whitelist_usernames?: string[];
  approvals_whitelist_teams?: string[];
  block_on_rejected_reviews?: boolean;
  block_on_outdated_branch?: boolean;
  dismiss_stale_approvals?: boolean;
  require_signed_commits?: boolean;
  protected_file_patterns?: string;
  unprotected_file_patterns?: string;
}

export async function createBranchProtection(
  ctx: BranchToolsContext,
  params: CreateBranchProtectionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, rule: params.rule_name }, 'Creating branch protection');

  const body: any = {};

  // Copy all optional fields if they exist
  const fields = [
    'branch_name', 'rule_name', 'enable_push', 'enable_push_whitelist',
    'push_whitelist_usernames', 'push_whitelist_teams', 'push_whitelist_deploy_keys',
    'enable_merge_whitelist', 'merge_whitelist_usernames', 'merge_whitelist_teams',
    'enable_status_check', 'status_check_contexts', 'required_approvals',
    'enable_approvals_whitelist', 'approvals_whitelist_usernames', 'approvals_whitelist_teams',
    'block_on_rejected_reviews', 'block_on_outdated_branch', 'dismiss_stale_approvals',
    'require_signed_commits', 'protected_file_patterns', 'unprotected_file_patterns'
  ];

  for (const field of fields) {
    if ((params as any)[field] !== undefined) {
      body[field] = (params as any)[field];
    }
  }

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/branch_protections`,
    body,
    token: params.token,
  });

  return response.data;
}

// Get branch protection
export interface GetBranchProtectionParams extends BranchParams {
  name: string;
}

export async function getBranchProtection(
  ctx: BranchToolsContext,
  params: GetBranchProtectionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, name: params.name }, 'Getting branch protection');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(params.name)}`,
    token: params.token,
  });

  return response.data;
}

// Update branch protection
export interface UpdateBranchProtectionParams extends CreateBranchProtectionParams {
  name: string;
}

export async function updateBranchProtection(
  ctx: BranchToolsContext,
  params: UpdateBranchProtectionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, name: params.name }, 'Updating branch protection');

  const body: any = {};

  // Copy all optional fields if they exist (same as create)
  const fields = [
    'branch_name', 'rule_name', 'enable_push', 'enable_push_whitelist',
    'push_whitelist_usernames', 'push_whitelist_teams', 'push_whitelist_deploy_keys',
    'enable_merge_whitelist', 'merge_whitelist_usernames', 'merge_whitelist_teams',
    'enable_status_check', 'status_check_contexts', 'required_approvals',
    'enable_approvals_whitelist', 'approvals_whitelist_usernames', 'approvals_whitelist_teams',
    'block_on_rejected_reviews', 'block_on_outdated_branch', 'dismiss_stale_approvals',
    'require_signed_commits', 'protected_file_patterns', 'unprotected_file_patterns'
  ];

  for (const field of fields) {
    if ((params as any)[field] !== undefined) {
      body[field] = (params as any)[field];
    }
  }

  const response = await ctx.client.request({
    method: 'PATCH',
    path: `/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(params.name)}`,
    body,
    token: params.token,
  });

  return response.data;
}

// Delete branch protection
export interface DeleteBranchProtectionParams extends BranchParams {
  name: string;
}

export async function deleteBranchProtection(
  ctx: BranchToolsContext,
  params: DeleteBranchProtectionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, name: params.name }, 'Deleting branch protection');

  await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(params.name)}`,
    token: params.token,
  });

  return { message: 'Branch protection deleted successfully' };
}
