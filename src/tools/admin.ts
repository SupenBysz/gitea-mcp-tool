import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'admin-tools' });

export interface AdminToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Create user (admin only)
export interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  login_name?: string;
  must_change_password?: boolean;
  send_notify?: boolean;
  source_id?: number;
  visibility?: string;
}

export async function createUser(
  ctx: AdminToolsContext,
  params: CreateUserParams
): Promise<unknown> {
  logger.info({ username: params.username, email: params.email }, 'Creating user (admin)');

  const body: any = {
    username: params.username,
    email: params.email,
    password: params.password,
  };

  if (params.full_name !== undefined) body.full_name = params.full_name;
  if (params.login_name !== undefined) body.login_name = params.login_name;
  if (params.must_change_password !== undefined) body.must_change_password = params.must_change_password;
  if (params.send_notify !== undefined) body.send_notify = params.send_notify;
  if (params.source_id !== undefined) body.source_id = params.source_id;
  if (params.visibility !== undefined) body.visibility = params.visibility;

  const response = await ctx.client.request({
    method: 'POST',
    path: '/admin/users',
    body,
  });

  return response.data;
}

// Delete user (admin only)
export interface DeleteUserParams {
  username: string;
  purge?: boolean;
}

export async function deleteUser(
  ctx: AdminToolsContext,
  params: DeleteUserParams
): Promise<unknown> {
  logger.info({ username: params.username, purge: params.purge }, 'Deleting user (admin)');

  const queryParams: Record<string, string> = {};
  if (params.purge !== undefined) queryParams.purge = String(params.purge);

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/admin/users/${encodeURIComponent(params.username)}`,
    params: queryParams,
  });

  return response.data;
}

// Edit user (admin only)
export interface EditUserParams {
  username: string;
  active?: boolean;
  admin?: boolean;
  allow_create_organization?: boolean;
  allow_git_hook?: boolean;
  allow_import_local?: boolean;
  description?: string;
  email?: string;
  full_name?: string;
  location?: string;
  login_name?: string;
  max_repo_creation?: number;
  must_change_password?: boolean;
  password?: string;
  prohibit_login?: boolean;
  restricted?: boolean;
  source_id?: number;
  visibility?: string;
  website?: string;
}

export async function editUser(
  ctx: AdminToolsContext,
  params: EditUserParams
): Promise<unknown> {
  logger.info({ username: params.username }, 'Editing user (admin)');

  const body: any = {};

  if (params.active !== undefined) body.active = params.active;
  if (params.admin !== undefined) body.admin = params.admin;
  if (params.allow_create_organization !== undefined) body.allow_create_organization = params.allow_create_organization;
  if (params.allow_git_hook !== undefined) body.allow_git_hook = params.allow_git_hook;
  if (params.allow_import_local !== undefined) body.allow_import_local = params.allow_import_local;
  if (params.description !== undefined) body.description = params.description;
  if (params.email !== undefined) body.email = params.email;
  if (params.full_name !== undefined) body.full_name = params.full_name;
  if (params.location !== undefined) body.location = params.location;
  if (params.login_name !== undefined) body.login_name = params.login_name;
  if (params.max_repo_creation !== undefined) body.max_repo_creation = params.max_repo_creation;
  if (params.must_change_password !== undefined) body.must_change_password = params.must_change_password;
  if (params.password !== undefined) body.password = params.password;
  if (params.prohibit_login !== undefined) body.prohibit_login = params.prohibit_login;
  if (params.restricted !== undefined) body.restricted = params.restricted;
  if (params.source_id !== undefined) body.source_id = params.source_id;
  if (params.visibility !== undefined) body.visibility = params.visibility;
  if (params.website !== undefined) body.website = params.website;

  const response = await ctx.client.request({
    method: 'PATCH',
    path: `/admin/users/${encodeURIComponent(params.username)}`,
    body,
  });

  return response.data;
}
