import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:package');

export interface PackageToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Base params with token
export interface PackageParams {
  token?: string;
}

// List packages for owner
export interface ListPackagesParams extends PackageParams {
  owner?: string;
  page?: number;
  limit?: number;
  type?: string;
  q?: string;
}

export async function listPackages(
  ctx: PackageToolsContext,
  params: ListPackagesParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);

  logger.info({ owner }, 'Listing packages');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);
  if (params.type) queryParams.type = params.type;
  if (params.q) queryParams.q = params.q;

  const response = await ctx.client.request({
    method: 'GET',
    path: `/packages/${encodeURIComponent(owner)}`,
    query: queryParams,
    token: params.token,
  });

  return response.data;
}

// Get package details
export interface GetPackageParams extends PackageParams {
  owner?: string;
  type: string;
  name: string;
  version: string;
}

export async function getPackage(
  ctx: PackageToolsContext,
  params: GetPackageParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);

  logger.info({ owner, type: params.type, name: params.name, version: params.version }, 'Getting package');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/packages/${encodeURIComponent(owner)}/${encodeURIComponent(params.type)}/${encodeURIComponent(params.name)}/${encodeURIComponent(params.version)}`,
    token: params.token,
  });

  return response.data;
}

// Delete package
export interface DeletePackageParams extends PackageParams {
  owner?: string;
  type: string;
  name: string;
  version: string;
}

export async function deletePackage(
  ctx: PackageToolsContext,
  params: DeletePackageParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);

  logger.info({ owner, type: params.type, name: params.name, version: params.version }, 'Deleting package');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/packages/${encodeURIComponent(owner)}/${encodeURIComponent(params.type)}/${encodeURIComponent(params.name)}/${encodeURIComponent(params.version)}`,
    token: params.token,
  });

  return response.data;
}

// List package files
export interface ListPackageFilesParams extends PackageParams {
  owner?: string;
  type: string;
  name: string;
  version: string;
}

export async function listPackageFiles(
  ctx: PackageToolsContext,
  params: ListPackageFilesParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);

  logger.info({ owner, type: params.type, name: params.name, version: params.version }, 'Listing package files');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/packages/${encodeURIComponent(owner)}/${encodeURIComponent(params.type)}/${encodeURIComponent(params.name)}/${encodeURIComponent(params.version)}/files`,
    token: params.token,
  });

  return response.data;
}
