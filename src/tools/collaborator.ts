import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'collaborator-tools' });

export interface CollaboratorToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface CollaboratorParams {
  owner?: string;
  repo?: string;
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
    params: queryParams,
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
  });

  return response.data;
}
