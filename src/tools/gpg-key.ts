import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'gpg-key-tools' });

export interface GPGKeyToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// List GPG keys
export async function listGPGKeys(ctx: GPGKeyToolsContext): Promise<unknown> {
  logger.info('Listing GPG keys');
  const response = await ctx.client.request({
    method: 'GET',
    path: '/user/gpg_keys',
  });
  return response.data;
}

// Get GPG key by ID
export interface GetGPGKeyParams {
  id: number;
}

export async function getGPGKey(
  ctx: GPGKeyToolsContext,
  params: GetGPGKeyParams
): Promise<unknown> {
  logger.info({ id: params.id }, 'Getting GPG key');
  const response = await ctx.client.request({
    method: 'GET',
    path: `/user/gpg_keys/${params.id}`,
  });
  return response.data;
}

// Create GPG key
export interface CreateGPGKeyParams {
  armored_public_key: string;
  armored_signature?: string;
}

export async function createGPGKey(
  ctx: GPGKeyToolsContext,
  params: CreateGPGKeyParams
): Promise<unknown> {
  logger.info('Creating GPG key');
  const body: any = {
    armored_public_key: params.armored_public_key,
  };
  if (params.armored_signature) {
    body.armored_signature = params.armored_signature;
  }
  const response = await ctx.client.request({
    method: 'POST',
    path: '/user/gpg_keys',
    body,
  });
  return response.data;
}

// Delete GPG key
export interface DeleteGPGKeyParams {
  id: number;
}

export async function deleteGPGKey(
  ctx: GPGKeyToolsContext,
  params: DeleteGPGKeyParams
): Promise<unknown> {
  logger.info({ id: params.id }, 'Deleting GPG key');
  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/user/gpg_keys/${params.id}`,
  });
  return response.data;
}
