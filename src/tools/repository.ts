/**
 * Repository Management Tools
 *
 * 仓库管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type {
  GiteaRepository,
  CreateRepoOptions,
  SearchRepoOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:repository');

export interface RepositoryToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 创建仓库
 */
export async function createRepository(
  ctx: RepositoryToolsContext,
  args: {
    name: string;
    owner?: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
    gitignores?: string;
    license?: string;
    readme?: string;
  }
) {
  logger.debug({ args }, 'Creating repository');

  const owner = ctx.contextManager.resolveOwner(args.owner);

  const createOptions: CreateRepoOptions = {
    name: args.name,
    description: args.description,
    private: args.private,
    auto_init: args.auto_init,
    gitignores: args.gitignores,
    license: args.license,
    readme: args.readme,
  };

  // 判断是用户还是组织
  const currentUser = await ctx.client.getCurrentUser();
  const isOrg = owner !== currentUser.login;

  let repo: GiteaRepository;
  if (isOrg) {
    // 在组织下创建
    repo = await ctx.client.post<GiteaRepository>(
      `/orgs/${owner}/repos`,
      createOptions
    );
  } else {
    // 在用户下创建
    repo = await ctx.client.post<GiteaRepository>('/user/repos', createOptions);
  }

  logger.info({ owner, repo: repo.name }, 'Repository created successfully');

  return {
    success: true,
    repository: {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      default_branch: repo.default_branch,
      created_at: repo.created_at,
    },
  };
}

/**
 * 获取仓库详情
 */
export async function getRepository(
  ctx: RepositoryToolsContext,
  args: {
    owner?: string;
    repo?: string;
  }
) {
  logger.debug({ args }, 'Getting repository');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const repository = await ctx.client.get<GiteaRepository>(`/repos/${owner}/${repo}`);

  logger.debug({ owner, repo }, 'Repository retrieved');

  return {
    success: true,
    repository: {
      id: repository.id,
      owner: {
        id: repository.owner.id,
        login: repository.owner.login,
        full_name: repository.owner.full_name,
      },
      name: repository.name,
      full_name: repository.full_name,
      description: repository.description,
      private: repository.private,
      fork: repository.fork,
      template: repository.template,
      empty: repository.empty,
      mirror: repository.mirror,
      size: repository.size,
      language: repository.language,
      html_url: repository.html_url,
      ssh_url: repository.ssh_url,
      clone_url: repository.clone_url,
      website: repository.website,
      stars_count: repository.stars_count,
      forks_count: repository.forks_count,
      watchers_count: repository.watchers_count,
      open_issues_count: repository.open_issues_count,
      open_pr_counter: repository.open_pr_counter,
      default_branch: repository.default_branch,
      archived: repository.archived,
      created_at: repository.created_at,
      updated_at: repository.updated_at,
      permissions: repository.permissions,
    },
  };
}

/**
 * 列出仓库
 */
export async function listRepositories(
  ctx: RepositoryToolsContext,
  args: {
    owner?: string;
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing repositories');

  const page = args.page || 1;
  const limit = args.limit || 30;

  let repositories: GiteaRepository[];

  if (args.owner) {
    // 列出指定用户/组织的仓库
    const owner = ctx.contextManager.resolveOwner(args.owner);
    repositories = await ctx.client.get<GiteaRepository[]>(`/users/${owner}/repos`, {
      page,
      limit,
    });
  } else {
    // 列出当前用户的仓库
    repositories = await ctx.client.get<GiteaRepository[]>('/user/repos', {
      page,
      limit,
    });
  }

  logger.debug({ count: repositories.length }, 'Repositories listed');

  return {
    success: true,
    repositories: repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      fork: repo.fork,
      html_url: repo.html_url,
      stars_count: repo.stars_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      updated_at: repo.updated_at,
    })),
    pagination: {
      page,
      limit,
      total: repositories.length,
    },
  };
}

/**
 * 删除仓库
 */
export async function deleteRepository(
  ctx: RepositoryToolsContext,
  args: {
    owner?: string;
    repo?: string;
  }
) {
  logger.debug({ args }, 'Deleting repository');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  await ctx.client.delete(`/repos/${owner}/${repo}`);

  logger.info({ owner, repo }, 'Repository deleted successfully');

  return {
    success: true,
    message: `Repository ${owner}/${repo} has been deleted`,
  };
}

/**
 * 搜索仓库
 */
export async function searchRepositories(
  ctx: RepositoryToolsContext,
  args: {
    q: string;
    uid?: number;
    starred_by?: number;
    private?: boolean;
    template?: boolean;
    archived?: boolean;
    sort?: 'alpha' | 'created' | 'updated' | 'size' | 'id';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Searching repositories');

  const searchOptions: SearchRepoOptions = {
    q: args.q,
    uid: args.uid,
    starred_by: args.starred_by,
    private: args.private,
    template: args.template,
    archived: args.archived,
    sort: args.sort || 'updated',
    order: args.order || 'desc',
    page: args.page || 1,
    limit: args.limit || 30,
  };

  const result = await ctx.client.get<{ data: GiteaRepository[]; ok: boolean }>(
    '/repos/search',
    searchOptions as any
  );

  logger.debug({ count: result.data.length }, 'Repositories found');

  return {
    success: true,
    repositories: result.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      fork: repo.fork,
      html_url: repo.html_url,
      stars_count: repo.stars_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      updated_at: repo.updated_at,
    })),
    total: result.data.length,
  };
}
