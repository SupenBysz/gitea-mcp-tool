import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:collaborator');

export interface CollaboratorToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface CollaboratorParams {
  owner?: string;
  repo?: string;
  token?: string;
}

// List collaborators
export interface ListCollaboratorsParams extends CollaboratorParams {
  page?: number;
  limit?: number;
}

export async function listCollaborators(
  ctx: CollaboratorToolsContext,
  params: ListCollaboratorsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing collaborators');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/collaborators`,
    query: queryParams,
    token: params.token,
  });

  return response.data;
}

// Check if user is collaborator
export interface CheckCollaboratorParams extends CollaboratorParams {
  collaborator: string;
}

export async function checkCollaborator(
  ctx: CollaboratorToolsContext,
  params: CheckCollaboratorParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, collaborator: params.collaborator }, 'Checking collaborator');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/collaborators/${params.collaborator}`,
    token: params.token,
  });

  return response.data;
}

// Add or update collaborator
export interface AddCollaboratorParams extends CollaboratorParams {
  collaborator: string;
  permission?: 'read' | 'write' | 'admin';
}

export async function addCollaborator(
  ctx: CollaboratorToolsContext,
  params: AddCollaboratorParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, collaborator: params.collaborator }, 'Adding collaborator');

  const body: any = {};
  if (params.permission) body.permission = params.permission;

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${owner}/${repo}/collaborators/${params.collaborator}`,
    body,
    token: params.token,
  });

  return response.data;
}

// Delete collaborator
export async function deleteCollaborator(
  ctx: CollaboratorToolsContext,
  params: CheckCollaboratorParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, collaborator: params.collaborator }, 'Deleting collaborator');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/collaborators/${params.collaborator}`,
    token: params.token,
  });

  return response.data;
}

// Get collaborator permission
export async function getCollaboratorPermission(
  ctx: CollaboratorToolsContext,
  params: CheckCollaboratorParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, collaborator: params.collaborator }, 'Getting collaborator permission');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/collaborators/${params.collaborator}/permission`,
    token: params.token,
  });

  return response.data;
}
