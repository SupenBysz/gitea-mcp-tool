import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:contents');

export interface ContentsToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface ContentsParams {
  owner?: string;
  repo?: string;
  token?: string;
}

// Identity for author/committer
export interface Identity {
  name?: string;
  email?: string;
}

// Get contents (file or directory)
export interface GetContentsParams extends ContentsParams {
  filepath: string;
  ref?: string;
}

export async function getContents(
  ctx: ContentsToolsContext,
  params: GetContentsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, filepath: params.filepath }, 'Getting contents');

  const queryParams: Record<string, string> = {};
  if (params.ref) {
    queryParams.ref = params.ref;
  }

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(params.filepath)}`,
    query: queryParams,
    token: params.token,
  });

  return response.data;
}

// Create file
export interface CreateFileParams extends ContentsParams {
  filepath: string;
  content: string;  // base64 encoded content
  message?: string;
  branch?: string;
  new_branch?: string;
  author?: Identity;
  committer?: Identity;
  signoff?: boolean;
  force_push?: boolean;
}

export async function createFile(
  ctx: ContentsToolsContext,
  params: CreateFileParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, filepath: params.filepath }, 'Creating file');

  const body: any = {
    content: params.content,
  };

  if (params.message) body.message = params.message;
  if (params.branch) body.branch = params.branch;
  if (params.new_branch) body.new_branch = params.new_branch;
  if (params.author) body.author = params.author;
  if (params.committer) body.committer = params.committer;
  if (params.signoff !== undefined) body.signoff = params.signoff;
  if (params.force_push !== undefined) body.force_push = params.force_push;

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(params.filepath)}`,
    body,
    token: params.token,
  });

  return response.data;
}

// Update file
export interface UpdateFileParams extends ContentsParams {
  filepath: string;
  content: string;  // base64 encoded content
  sha?: string;     // SHA of the file to update, or omit to create
  message?: string;
  branch?: string;
  new_branch?: string;
  from_path?: string;  // For rename/move operations
  author?: Identity;
  committer?: Identity;
  signoff?: boolean;
  force_push?: boolean;
}

export async function updateFile(
  ctx: ContentsToolsContext,
  params: UpdateFileParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, filepath: params.filepath }, 'Updating file');

  const body: any = {
    content: params.content,
  };

  if (params.sha) body.sha = params.sha;
  if (params.message) body.message = params.message;
  if (params.branch) body.branch = params.branch;
  if (params.new_branch) body.new_branch = params.new_branch;
  if (params.from_path) body.from_path = params.from_path;
  if (params.author) body.author = params.author;
  if (params.committer) body.committer = params.committer;
  if (params.signoff !== undefined) body.signoff = params.signoff;
  if (params.force_push !== undefined) body.force_push = params.force_push;

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(params.filepath)}`,
    body,
    token: params.token,
  });

  return response.data;
}

// Delete file
export interface DeleteFileParams extends ContentsParams {
  filepath: string;
  sha: string;  // SHA of the file to delete (required)
  message?: string;
  branch?: string;
  new_branch?: string;
  author?: Identity;
  committer?: Identity;
  signoff?: boolean;
  force_push?: boolean;
}

export async function deleteFile(
  ctx: ContentsToolsContext,
  params: DeleteFileParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, filepath: params.filepath }, 'Deleting file');

  const body: any = {
    sha: params.sha,
  };

  if (params.message) body.message = params.message;
  if (params.branch) body.branch = params.branch;
  if (params.new_branch) body.new_branch = params.new_branch;
  if (params.author) body.author = params.author;
  if (params.committer) body.committer = params.committer;
  if (params.signoff !== undefined) body.signoff = params.signoff;
  if (params.force_push !== undefined) body.force_push = params.force_push;

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(params.filepath)}`,
    body,
    token: params.token,
  });

  return response.data;
}

// Get raw file
export interface GetRawFileParams extends ContentsParams {
  filepath: string;
  ref?: string;
}

export async function getRawFile(
  ctx: ContentsToolsContext,
  params: GetRawFileParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, filepath: params.filepath }, 'Getting raw file');

  const queryParams: Record<string, string> = {};
  if (params.ref) {
    queryParams.ref = params.ref;
  }

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/raw/${encodeURIComponent(params.filepath)}`,
    query: queryParams,
    token: params.token,
  });

  // Raw file returns binary data, convert to string or base64 if needed
  return response.data;
}

// Download archive
export interface DownloadArchiveParams extends ContentsParams {
  archive: string;  // format: {ref}.{format} e.g. "main.zip" or "v1.0.0.tar.gz"
}

export async function downloadArchive(
  ctx: ContentsToolsContext,
  params: DownloadArchiveParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, archive: params.archive }, 'Downloading archive');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/archive/${encodeURIComponent(params.archive)}`,
    token: params.token,
  });

  return response.data;
}
