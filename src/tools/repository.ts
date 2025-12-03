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
  UpdateRepoOptions,
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
    token?: string;
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
      createOptions,
      args.token
    );
  } else {
    // 在用户下创建
    repo = await ctx.client.post<GiteaRepository>('/user/repos', createOptions, args.token);
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
    token?: string;
  }
) {
  logger.debug({ args }, 'Getting repository');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const repository = await ctx.client.get<GiteaRepository>(`/repos/${owner}/${repo}`, undefined, args.token);

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
 * 更新仓库
 */
export async function updateRepository(
  ctx: RepositoryToolsContext,
  args: {
    owner?: string;
    repo?: string;
    name?: string;
    description?: string;
    website?: string;
    private?: boolean;
    template?: boolean;
    has_issues?: boolean;
    has_wiki?: boolean;
    has_pull_requests?: boolean;
    has_projects?: boolean;
    has_releases?: boolean;
    has_packages?: boolean;
    has_actions?: boolean;
    default_branch?: string;
    archived?: boolean;
    allow_merge_commits?: boolean;
    allow_rebase?: boolean;
    allow_rebase_explicit?: boolean;
    allow_squash_merge?: boolean;
    allow_rebase_update?: boolean;
    default_delete_branch_after_merge?: boolean;
    default_merge_style?: 'merge' | 'rebase' | 'rebase-merge' | 'squash';
    default_allow_maintainer_edit?: boolean;
    ignore_whitespace_conflicts?: boolean;
    token?: string;
  }
) {
  logger.debug({ args }, 'Updating repository');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 构建更新选项，只包含提供的字段
  const updateOptions: UpdateRepoOptions = {};

  if (args.name !== undefined) updateOptions.name = args.name;
  if (args.description !== undefined) updateOptions.description = args.description;
  if (args.website !== undefined) updateOptions.website = args.website;
  if (args.private !== undefined) updateOptions.private = args.private;
  if (args.template !== undefined) updateOptions.template = args.template;
  if (args.has_issues !== undefined) updateOptions.has_issues = args.has_issues;
  if (args.has_wiki !== undefined) updateOptions.has_wiki = args.has_wiki;
  if (args.has_pull_requests !== undefined) updateOptions.has_pull_requests = args.has_pull_requests;
  if (args.has_projects !== undefined) updateOptions.has_projects = args.has_projects;
  if (args.has_releases !== undefined) updateOptions.has_releases = args.has_releases;
  if (args.has_packages !== undefined) updateOptions.has_packages = args.has_packages;
  if (args.has_actions !== undefined) updateOptions.has_actions = args.has_actions;
  if (args.default_branch !== undefined) updateOptions.default_branch = args.default_branch;
  if (args.archived !== undefined) updateOptions.archived = args.archived;
  if (args.allow_merge_commits !== undefined) updateOptions.allow_merge_commits = args.allow_merge_commits;
  if (args.allow_rebase !== undefined) updateOptions.allow_rebase = args.allow_rebase;
  if (args.allow_rebase_explicit !== undefined) updateOptions.allow_rebase_explicit = args.allow_rebase_explicit;
  if (args.allow_squash_merge !== undefined) updateOptions.allow_squash_merge = args.allow_squash_merge;
  if (args.allow_rebase_update !== undefined) updateOptions.allow_rebase_update = args.allow_rebase_update;
  if (args.default_delete_branch_after_merge !== undefined) updateOptions.default_delete_branch_after_merge = args.default_delete_branch_after_merge;
  if (args.default_merge_style !== undefined) updateOptions.default_merge_style = args.default_merge_style;
  if (args.default_allow_maintainer_edit !== undefined) updateOptions.default_allow_maintainer_edit = args.default_allow_maintainer_edit;
  if (args.ignore_whitespace_conflicts !== undefined) updateOptions.ignore_whitespace_conflicts = args.ignore_whitespace_conflicts;

  const repository = await ctx.client.patch<GiteaRepository>(
    `/repos/${owner}/${repo}`,
    updateOptions,
    args.token
  );

  logger.info({ owner, repo: repository.name }, 'Repository updated successfully');

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
      has_issues: repository.has_issues,
      has_wiki: repository.has_wiki,
      has_pull_requests: repository.has_pull_requests,
      has_projects: repository.has_projects,
      has_releases: repository.has_releases,
      has_packages: repository.has_packages,
      has_actions: repository.has_actions,
      allow_merge_commits: repository.allow_merge_commits,
      allow_rebase: repository.allow_rebase,
      allow_rebase_explicit: repository.allow_rebase_explicit,
      allow_squash_merge: repository.allow_squash_merge,
      allow_rebase_update: repository.allow_rebase_update,
      default_delete_branch_after_merge: repository.default_delete_branch_after_merge,
      default_merge_style: repository.default_merge_style,
      default_allow_maintainer_edit: repository.default_allow_maintainer_edit,
      ignore_whitespace_conflicts: repository.ignore_whitespace_conflicts,
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
    token?: string;
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
    }, args.token);
  } else {
    // 列出当前用户的仓库
    repositories = await ctx.client.get<GiteaRepository[]>('/user/repos', {
      page,
      limit,
    }, args.token);
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
    token?: string;
  }
) {
  logger.debug({ args }, 'Deleting repository');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  await ctx.client.delete(`/repos/${owner}/${repo}`, undefined, args.token);

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
    token?: string;
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
    searchOptions as any,
    args.token
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
