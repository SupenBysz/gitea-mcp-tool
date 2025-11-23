import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'package-tools' });

export interface PackageToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// List packages for owner
export interface ListPackagesParams {
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
    params: queryParams,
  });

  return response.data;
}

// Get package details
export interface GetPackageParams {
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
  });

  return response.data;
}

// Delete package
export interface DeletePackageParams {
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
  });

  return response.data;
}

// List package files
export interface ListPackageFilesParams {
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
  });

  return response.data;
}
