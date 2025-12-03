/**
 * Release Tools
 * 发布版本管理工具
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:release');

/**
 * Release 工具上下文
 */
export interface ReleaseToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * Release 参数
 */
export interface ReleaseParams {
  owner?: string;
  repo?: string;
  token?: string;
}

export interface CreateReleaseParams extends ReleaseParams {
  tag_name: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  target_commitish?: string;
}

export interface GetReleaseParams extends ReleaseParams {
  id: number;
}

export interface ListReleasesParams extends ReleaseParams {
  page?: number;
  limit?: number;
  draft?: boolean;
  prerelease?: boolean;
}

export interface UpdateReleaseParams extends ReleaseParams {
  id: number;
  tag_name?: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  target_commitish?: string;
}

export interface DeleteReleaseParams extends ReleaseParams {
  id: number;
}

export interface GetReleaseByTagParams extends ReleaseParams {
  tag: string;
}

export interface CreateReleaseAttachmentParams extends ReleaseParams {
  id: number;
  name: string;
  attachment: string; // Base64 encoded file content
}

export interface ListReleaseAttachmentsParams extends ReleaseParams {
  id: number;
}

export interface GetReleaseAttachmentParams extends ReleaseParams {
  id: number;
  attachment_id: number;
}

export interface DeleteReleaseAttachmentParams extends ReleaseParams {
  id: number;
  attachment_id: number;
}

/**
 * 创建发布版本
 */
export async function createRelease(
  ctx: ReleaseToolsContext,
  params: CreateReleaseParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, tag: params.tag_name }, 'Creating release');

  const body: any = {
    tag_name: params.tag_name,
    name: params.name || params.tag_name,
    body: params.body || '',
    draft: params.draft || false,
    prerelease: params.prerelease || false,
  };

  if (params.target_commitish) {
    body.target_commitish = params.target_commitish;
  }

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/releases`,
    body,
    token: params.token,
  });

  return response.data;
}

/**
 * 获取发布版本详情
 */
export async function getRelease(
  ctx: ReleaseToolsContext,
  params: GetReleaseParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, id: params.id }, 'Getting release');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/releases/${params.id}`,
    token: params.token,
  });

  return response.data;
}

/**
 * 通过 Tag 获取发布版本
 */
export async function getReleaseByTag(
  ctx: ReleaseToolsContext,
  params: GetReleaseByTagParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, tag: params.tag }, 'Getting release by tag');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/releases/tags/${params.tag}`,
    token: params.token,
  });

  return response.data;
}

/**
 * 列出发布版本
 */
export async function listReleases(
  ctx: ReleaseToolsContext,
  params: ListReleasesParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo }, 'Listing releases');

  const query: Record<string, string | number | boolean | undefined> = {
    page: params.page,
    limit: params.limit,
  };

  if (params.draft !== undefined) {
    query.draft = params.draft;
  }

  if (params.prerelease !== undefined) {
    query.pre_release = params.prerelease;
  }

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/releases`,
    query,
    token: params.token,
  });

  return response.data;
}

/**
 * 更新发布版本
 */
export async function updateRelease(
  ctx: ReleaseToolsContext,
  params: UpdateReleaseParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, id: params.id }, 'Updating release');

  const body: any = {};

  if (params.tag_name !== undefined) body.tag_name = params.tag_name;
  if (params.name !== undefined) body.name = params.name;
  if (params.body !== undefined) body.body = params.body;
  if (params.draft !== undefined) body.draft = params.draft;
  if (params.prerelease !== undefined) body.prerelease = params.prerelease;
  if (params.target_commitish !== undefined) body.target_commitish = params.target_commitish;

  const response = await ctx.client.request({
    method: 'PATCH',
    path: `/repos/${owner}/${repo}/releases/${params.id}`,
    body,
    token: params.token,
  });

  return response.data;
}

/**
 * 删除发布版本
 */
export async function deleteRelease(
  ctx: ReleaseToolsContext,
  params: DeleteReleaseParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, id: params.id }, 'Deleting release');

  await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/releases/${params.id}`,
    token: params.token,
  });

  return { success: true, message: 'Release deleted successfully' };
}

/**
 * 列出发布版本附件
 */
export async function listReleaseAttachments(
  ctx: ReleaseToolsContext,
  params: ListReleaseAttachmentsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, id: params.id }, 'Listing release attachments');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/releases/${params.id}/assets`,
    token: params.token,
  });

  return response.data;
}

/**
 * 获取发布版本附件详情
 */
export async function getReleaseAttachment(
  ctx: ReleaseToolsContext,
  params: GetReleaseAttachmentParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info(
    { owner, repo, releaseId: params.id, attachmentId: params.attachment_id },
    'Getting release attachment'
  );

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/releases/${params.id}/assets/${params.attachment_id}`,
    token: params.token,
  });

  return response.data;
}

/**
 * 删除发布版本附件
 */
export async function deleteReleaseAttachment(
  ctx: ReleaseToolsContext,
  params: DeleteReleaseAttachmentParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info(
    { owner, repo, releaseId: params.id, attachmentId: params.attachment_id },
    'Deleting release attachment'
  );

  await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/releases/${params.id}/assets/${params.attachment_id}`,
    token: params.token,
  });

  return { success: true, message: 'Release attachment deleted successfully' };
}
