/**
 * Team Management Tools
 *
 * 团队管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type {
  GiteaTeam,
  GiteaUser,
  GiteaRepository,
  CreateTeamOptions,
  UpdateTeamOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:team');

export interface TeamToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 创建团队
 */
export async function createTeam(
  ctx: TeamToolsContext,
  args: {
    org: string;
    name: string;
    description?: string;
    permission?: 'read' | 'write' | 'admin';
    can_create_org_repo?: boolean;
    includes_all_repositories?: boolean;
    units?: string[];
  }
) {
  logger.debug({ args }, 'Creating team');

  const createOptions: CreateTeamOptions = {
    name: args.name,
    description: args.description,
    permission: args.permission || 'read',
    can_create_org_repo: args.can_create_org_repo || false,
    includes_all_repositories: args.includes_all_repositories || false,
    units: args.units,
  };

  const team = await ctx.client.post<GiteaTeam>(
    `/orgs/${args.org}/teams`,
    createOptions
  );

  logger.info({ org: args.org, team: team.name }, 'Team created successfully');

  return {
    success: true,
    team: {
      id: team.id,
      name: team.name,
      description: team.description,
      permission: team.permission,
      can_create_org_repo: team.can_create_org_repo,
      includes_all_repositories: team.includes_all_repositories,
    },
  };
}

/**
 * 列出组织的所有团队
 */
export async function listTeams(
  ctx: TeamToolsContext,
  args: {
    org: string;
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing teams');

  const teams = await ctx.client.get<GiteaTeam[]>(`/orgs/${args.org}/teams`, {
    page: args.page || 1,
    limit: args.limit || 30,
  });

  logger.debug({ count: teams.length }, 'Teams listed');

  return {
    success: true,
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      permission: team.permission,
      can_create_org_repo: team.can_create_org_repo,
      includes_all_repositories: team.includes_all_repositories,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: teams.length,
    },
  };
}

/**
 * 获取团队详情
 */
export async function getTeam(
  ctx: TeamToolsContext,
  args: {
    id: number;
  }
) {
  logger.debug({ args }, 'Getting team');

  const team = await ctx.client.get<GiteaTeam>(`/teams/${args.id}`);

  logger.debug({ team: team.name }, 'Team retrieved');

  return {
    success: true,
    team: {
      id: team.id,
      name: team.name,
      description: team.description,
      organization: {
        id: team.organization.id,
        name: team.organization.name,
        full_name: team.organization.full_name,
      },
      permission: team.permission,
      can_create_org_repo: team.can_create_org_repo,
      includes_all_repositories: team.includes_all_repositories,
      units: team.units,
    },
  };
}

/**
 * 更新团队
 */
export async function updateTeam(
  ctx: TeamToolsContext,
  args: {
    id: number;
    name?: string;
    description?: string;
    permission?: 'read' | 'write' | 'admin';
    can_create_org_repo?: boolean;
    includes_all_repositories?: boolean;
    units?: string[];
  }
) {
  logger.debug({ args }, 'Updating team');

  const updateOptions: UpdateTeamOptions = {
    name: args.name,
    description: args.description,
    permission: args.permission,
    can_create_org_repo: args.can_create_org_repo,
    includes_all_repositories: args.includes_all_repositories,
    units: args.units,
  };

  const team = await ctx.client.patch<GiteaTeam>(
    `/teams/${args.id}`,
    updateOptions
  );

  logger.info({ team: team.name }, 'Team updated successfully');

  return {
    success: true,
    team: {
      id: team.id,
      name: team.name,
      description: team.description,
      permission: team.permission,
      can_create_org_repo: team.can_create_org_repo,
      includes_all_repositories: team.includes_all_repositories,
    },
  };
}

/**
 * 删除团队
 */
export async function deleteTeam(
  ctx: TeamToolsContext,
  args: {
    id: number;
  }
) {
  logger.debug({ args }, 'Deleting team');

  await ctx.client.delete(`/teams/${args.id}`);

  logger.info({ team: args.id }, 'Team deleted successfully');

  return {
    success: true,
    message: `Team #${args.id} has been deleted`,
  };
}

/**
 * 列出团队成员
 */
export async function listTeamMembers(
  ctx: TeamToolsContext,
  args: {
    id: number;
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing team members');

  const members = await ctx.client.get<GiteaUser[]>(`/teams/${args.id}/members`, {
    page: args.page || 1,
    limit: args.limit || 30,
  });

  logger.debug({ count: members.length }, 'Team members listed');

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

/**
 * 添加成员到团队
 */
export async function addTeamMember(
  ctx: TeamToolsContext,
  args: {
    id: number;
    username: string;
  }
) {
  logger.debug({ args }, 'Adding member to team');

  await ctx.client.put(`/teams/${args.id}/members/${args.username}`);

  logger.info(
    { team: args.id, username: args.username },
    'Member added to team successfully'
  );

  return {
    success: true,
    message: `User ${args.username} has been added to team #${args.id}`,
  };
}

/**
 * 从团队移除成员
 */
export async function removeTeamMember(
  ctx: TeamToolsContext,
  args: {
    id: number;
    username: string;
  }
) {
  logger.debug({ args }, 'Removing member from team');

  await ctx.client.delete(`/teams/${args.id}/members/${args.username}`);

  logger.info(
    { team: args.id, username: args.username },
    'Member removed from team successfully'
  );

  return {
    success: true,
    message: `User ${args.username} has been removed from team #${args.id}`,
  };
}

/**
 * 列出团队可访问的仓库
 */
export async function listTeamRepos(
  ctx: TeamToolsContext,
  args: {
    id: number;
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing team repositories');

  const repos = await ctx.client.get<GiteaRepository[]>(
    `/teams/${args.id}/repos`,
    {
      page: args.page || 1,
      limit: args.limit || 30,
    }
  );

  logger.debug({ count: repos.length }, 'Team repositories listed');

  return {
    success: true,
    repositories: repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: repos.length,
    },
  };
}

/**
 * 为团队添加仓库访问权限
 */
export async function addTeamRepo(
  ctx: TeamToolsContext,
  args: {
    id: number;
    org: string;
    repo: string;
  }
) {
  logger.debug({ args }, 'Adding repository to team');

  await ctx.client.put(`/teams/${args.id}/repos/${args.org}/${args.repo}`);

  logger.info(
    { team: args.id, repo: `${args.org}/${args.repo}` },
    'Repository added to team successfully'
  );

  return {
    success: true,
    message: `Repository ${args.org}/${args.repo} has been added to team #${args.id}`,
  };
}

/**
 * 移除团队的仓库访问权限
 */
export async function removeTeamRepo(
  ctx: TeamToolsContext,
  args: {
    id: number;
    org: string;
    repo: string;
  }
) {
  logger.debug({ args }, 'Removing repository from team');

  await ctx.client.delete(`/teams/${args.id}/repos/${args.org}/${args.repo}`);

  logger.info(
    { team: args.id, repo: `${args.org}/${args.repo}` },
    'Repository removed from team successfully'
  );

  return {
    success: true,
    message: `Repository ${args.org}/${args.repo} has been removed from team #${args.id}`,
  };
}
