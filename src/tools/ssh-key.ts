import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'ssh-key-tools' });

export interface SSHKeyToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// List SSH keys
export async function listSSHKeys(ctx: SSHKeyToolsContext): Promise<unknown> {
  logger.info('Listing SSH keys');

  const response = await ctx.client.request({
    method: 'GET',
    path: '/user/keys',
  });

  return response.data;
}

// Get SSH key by ID
export interface GetSSHKeyParams {
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
  });

  return response.data;
}

// Create SSH key
export interface CreateSSHKeyParams {
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
  });

  return response.data;
}

// Delete SSH key
export interface DeleteSSHKeyParams {
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
  });

  return response.data;
}
