/**
 * User and Organization Management Tools
 *
 * 用户和组织管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type { GiteaUser, GiteaOrganization } from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:user');

export interface UserToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 获取用户信息
 */
export async function getUser(
  ctx: UserToolsContext,
  args: {
    username: string;
  }
) {
  logger.debug({ args }, 'Getting user');

  const user = await ctx.client.get<GiteaUser>(`/users/${args.username}`);

  logger.debug({ username: args.username }, 'User retrieved');

  return {
    success: true,
    user: {
      id: user.id,
      login: user.login,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      location: user.location,
      website: user.website,
      description: user.description,
      followers_count: user.followers_count,
      following_count: user.following_count,
      starred_repos_count: user.starred_repos_count,
      created: user.created,
    },
  };
}

/**
 * 列出用户的组织
 */
export async function listUserOrganizations(
  ctx: UserToolsContext,
  args: {
    username?: string;
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing user organizations');

  const username = args.username || (await ctx.client.getCurrentUser()).login;

  const orgs = await ctx.client.get<GiteaOrganization[]>(`/users/${username}/orgs`, {
    page: args.page || 1,
    limit: args.limit || 30,
  });

  logger.debug({ count: orgs.length }, 'Organizations listed');

  return {
    success: true,
    organizations: orgs.map((org) => ({
      id: org.id,
      name: org.name,
      full_name: org.full_name,
      avatar_url: org.avatar_url,
      description: org.description,
      website: org.website,
      location: org.location,
      visibility: org.visibility,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: orgs.length,
    },
  };
}

/**
 * 获取组织信息
 */
export async function getOrganization(
  ctx: UserToolsContext,
  args: {
    org: string;
  }
) {
  logger.debug({ args }, 'Getting organization');

  const org = await ctx.client.get<GiteaOrganization>(`/orgs/${args.org}`);

  logger.debug({ org: args.org }, 'Organization retrieved');

  return {
    success: true,
    organization: {
      id: org.id,
      name: org.name,
      full_name: org.full_name,
      avatar_url: org.avatar_url,
      description: org.description,
      website: org.website,
      location: org.location,
      visibility: org.visibility,
      repo_admin_change_team_access: org.repo_admin_change_team_access,
    },
  };
}

/**
 * 列出组织成员
 */
export async function listOrganizationMembers(
  ctx: UserToolsContext,
  args: {
    org: string;
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing organization members');

  const members = await ctx.client.get<GiteaUser[]>(`/orgs/${args.org}/members`, {
    page: args.page || 1,
    limit: args.limit || 30,
  });

  logger.debug({ count: members.length }, 'Organization members listed');

  return {
    success: true,
    members: members.map((member) => ({
      id: member.id,
      login: member.login,
      full_name: member.full_name,
      email: member.email,
      avatar_url: member.avatar_url,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: members.length,
    },
  };
}
