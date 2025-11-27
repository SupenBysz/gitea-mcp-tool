import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:organization');

export interface OrganizationToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Base params with token
export interface OrganizationParams {
  token?: string;
}

// Create organization
export interface CreateOrganizationParams extends OrganizationParams {
  username: string;
  full_name?: string;
  description?: string;
  website?: string;
  location?: string;
  email?: string;
  visibility?: 'public' | 'limited' | 'private';
  repo_admin_change_team_access?: boolean;
}

export async function createOrganization(
  ctx: OrganizationToolsContext,
  params: CreateOrganizationParams
): Promise<unknown> {
  logger.info({ username: params.username }, 'Creating organization');

  const body: any = { username: params.username };
  if (params.full_name) body.full_name = params.full_name;
  if (params.description) body.description = params.description;
  if (params.website) body.website = params.website;
  if (params.location) body.location = params.location;
  if (params.email) body.email = params.email;
  if (params.visibility) body.visibility = params.visibility;
  if (params.repo_admin_change_team_access !== undefined) {
    body.repo_admin_change_team_access = params.repo_admin_change_team_access;
  }

  const response = await ctx.client.request({
    method: 'POST',
    path: '/orgs',
    body,
    token: params.token,
  });

  return response.data;
}

// Update organization
export interface UpdateOrganizationParams extends OrganizationParams {
  org: string;
  full_name?: string;
  description?: string;
  website?: string;
  location?: string;
  visibility?: 'public' | 'limited' | 'private';
  repo_admin_change_team_access?: boolean;
}

export async function updateOrganization(
  ctx: OrganizationToolsContext,
  params: UpdateOrganizationParams
): Promise<unknown> {
  logger.info({ org: params.org }, 'Updating organization');

  const body: any = {};
  if (params.full_name !== undefined) body.full_name = params.full_name;
  if (params.description !== undefined) body.description = params.description;
  if (params.website !== undefined) body.website = params.website;
  if (params.location !== undefined) body.location = params.location;
  if (params.visibility) body.visibility = params.visibility;
  if (params.repo_admin_change_team_access !== undefined) {
    body.repo_admin_change_team_access = params.repo_admin_change_team_access;
  }

  const response = await ctx.client.request({
    method: 'PATCH',
    path: `/orgs/${encodeURIComponent(params.org)}`,
    body,
    token: params.token,
  });

  return response.data;
}

// Delete organization
export interface DeleteOrganizationParams extends OrganizationParams {
  org: string;
}

export async function deleteOrganization(
  ctx: OrganizationToolsContext,
  params: DeleteOrganizationParams
): Promise<unknown> {
  logger.info({ org: params.org }, 'Deleting organization');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/orgs/${encodeURIComponent(params.org)}`,
    token: params.token,
  });

  return response.data;
}

// List organization repositories
export interface ListOrgReposParams extends OrganizationParams {
  org: string;
  page?: number;
  limit?: number;
}

export async function listOrganizationRepos(
  ctx: OrganizationToolsContext,
  params: ListOrgReposParams
): Promise<unknown> {
  logger.info({ org: params.org }, 'Listing organization repositories');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/orgs/${encodeURIComponent(params.org)}/repos`,
    query: queryParams,
    token: params.token,
  });

  return response.data;
}
