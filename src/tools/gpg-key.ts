import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:gpg-key');

export interface GPGKeyToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Base params with token
export interface GPGKeyParams {
  token?: string;
}

// List GPG keys
export async function listGPGKeys(
  ctx: GPGKeyToolsContext,
  params: GPGKeyParams = {}
): Promise<unknown> {
  logger.info('Listing GPG keys');
  const response = await ctx.client.request({
    method: 'GET',
    path: '/user/gpg_keys',
    token: params.token,
  });
  return response.data;
}

// Get GPG key by ID
export interface GetGPGKeyParams extends GPGKeyParams {
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
    token: params.token,
  });
  return response.data;
}

// Create GPG key
export interface CreateGPGKeyParams extends GPGKeyParams {
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
    token: params.token,
  });
  return response.data;
}

// Delete GPG key
export interface DeleteGPGKeyParams extends GPGKeyParams {
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
    token: params.token,
  });
  return response.data;
}
