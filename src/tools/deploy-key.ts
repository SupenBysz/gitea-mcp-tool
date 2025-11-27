import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:deploy-key');

export interface DeployKeyToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface DeployKeyParams {
  owner?: string;
  repo?: string;
  token?: string;
}

// List deploy keys
export async function listDeployKeys(
  ctx: DeployKeyToolsContext,
  params: DeployKeyParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing deploy keys');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/keys`,
    token: params.token,
  });

  return response.data;
}

// Get deploy key by ID
export interface GetDeployKeyParams extends DeployKeyParams {
  id: number;
}

export async function getDeployKey(
  ctx: DeployKeyToolsContext,
  params: GetDeployKeyParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, id: params.id }, 'Getting deploy key');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/keys/${params.id}`,
    token: params.token,
  });

  return response.data;
}

// Create deploy key
export interface CreateDeployKeyParams extends DeployKeyParams {
  title: string;
  key: string;
  read_only?: boolean;
}

export async function createDeployKey(
  ctx: DeployKeyToolsContext,
  params: CreateDeployKeyParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, title: params.title }, 'Creating deploy key');

  const body: any = {
    title: params.title,
    key: params.key,
  };
  if (params.read_only !== undefined) body.read_only = params.read_only;

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/keys`,
    body,
    token: params.token,
  });

  return response.data;
}

// Delete deploy key
export interface DeleteDeployKeyParams extends DeployKeyParams {
  id: number;
}

export async function deleteDeployKey(
  ctx: DeployKeyToolsContext,
  params: DeleteDeployKeyParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, id: params.id }, 'Deleting deploy key');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/keys/${params.id}`,
    token: params.token,
  });

  return response.data;
}
