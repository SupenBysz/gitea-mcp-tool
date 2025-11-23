import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'following-tools' });

export interface FollowingToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// List following (users that current user or specific user follows)
export interface ListFollowingParams {
  username?: string;
  page?: number;
  limit?: number;
}

export async function listFollowing(
  ctx: FollowingToolsContext,
  params: ListFollowingParams = {}
): Promise<unknown> {
  const path = params.username
    ? `/users/${encodeURIComponent(params.username)}/following`
    : '/user/following';

  logger.info({ path, username: params.username }, 'Listing following');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path,
    params: queryParams,
  });

  return response.data;
}

// List followers (users that follow current user or specific user)
export interface ListFollowersParams {
  username?: string;
  page?: number;
  limit?: number;
}

export async function listFollowers(
  ctx: FollowingToolsContext,
  params: ListFollowersParams = {}
): Promise<unknown> {
  const path = params.username
    ? `/users/${encodeURIComponent(params.username)}/followers`
    : '/user/followers';

  logger.info({ path, username: params.username }, 'Listing followers');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path,
    params: queryParams,
  });

  return response.data;
}

// Check if current user follows a specific user
export interface CheckFollowingParams {
  username: string;
}

export async function checkFollowing(
  ctx: FollowingToolsContext,
  params: CheckFollowingParams
): Promise<unknown> {
  logger.info({ username: params.username }, 'Checking if following user');

  try {
    const response = await ctx.client.request({
      method: 'GET',
      path: `/user/following/${encodeURIComponent(params.username)}`,
    });
    return { following: response.status === 204 || response.status === 200 };
  } catch (error: any) {
    if (error.status === 404) {
      return { following: false };
    }
    throw error;
  }
}

// Follow a user
export interface FollowUserParams {
  username: string;
}

export async function followUser(
  ctx: FollowingToolsContext,
  params: FollowUserParams
): Promise<unknown> {
  logger.info({ username: params.username }, 'Following user');

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/user/following/${encodeURIComponent(params.username)}`,
  });

  return { success: true, message: `Followed ${params.username}` };
}

// Unfollow a user
export interface UnfollowUserParams {
  username: string;
}

export async function unfollowUser(
  ctx: FollowingToolsContext,
  params: UnfollowUserParams
): Promise<unknown> {
  logger.info({ username: params.username }, 'Unfollowing user');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/user/following/${encodeURIComponent(params.username)}`,
  });

  return { success: true, message: `Unfollowed ${params.username}` };
}
