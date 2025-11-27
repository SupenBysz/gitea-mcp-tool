import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:ssh-key');

export interface SSHKeyToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Base params with token
export interface SSHKeyParams {
  token?: string;
}

// List SSH keys
export async function listSSHKeys(
  ctx: SSHKeyToolsContext,
  params: SSHKeyParams = {}
): Promise<unknown> {
  logger.info('Listing SSH keys');

  const response = await ctx.client.request({
    method: 'GET',
    path: '/user/keys',
    token: params.token,
  });

  return response.data;
}

// Get SSH key by ID
export interface GetSSHKeyParams extends SSHKeyParams {
  id: number;
}

export async function getSSHKey(
  ctx: SSHKeyToolsContext,
  params: GetSSHKeyParams
): Promise<unknown> {
  logger.info({ id: params.id }, 'Getting SSH key');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/user/keys/${params.id}`,
    token: params.token,
  });

  return response.data;
}

// Create SSH key
export interface CreateSSHKeyParams extends SSHKeyParams {
  title: string;
  key: string;
  read_only?: boolean;
}

export async function createSSHKey(
  ctx: SSHKeyToolsContext,
  params: CreateSSHKeyParams
): Promise<unknown> {
  logger.info({ title: params.title }, 'Creating SSH key');

  const body: any = {
    title: params.title,
    key: params.key,
  };
  if (params.read_only !== undefined) body.read_only = params.read_only;

  const response = await ctx.client.request({
    method: 'POST',
    path: '/user/keys',
    body,
    token: params.token,
  });

  return response.data;
}

// Delete SSH key
export interface DeleteSSHKeyParams extends SSHKeyParams {
  id: number;
}

export async function deleteSSHKey(
  ctx: SSHKeyToolsContext,
  params: DeleteSSHKeyParams
): Promise<unknown> {
  logger.info({ id: params.id }, 'Deleting SSH key');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/user/keys/${params.id}`,
    token: params.token,
  });

  return response.data;
}
