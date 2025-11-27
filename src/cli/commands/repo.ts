/**
 * 仓库管理命令
 */

import { createClient, createContextManager, resolveOwnerRepo, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, outputList, warning, info } from '../utils/output.js';
import {
  createRepository,
  getRepository,
  listRepositories,
  deleteRepository,
  searchRepositories,
} from '../../tools/repository.js';
import prompts from 'prompts';

/**
 * 列出仓库
 */
export async function repoList(options: ClientOptions & {
  owner?: string;
  limit?: string;
  page?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);

    const result = await listRepositories({ client, contextManager }, {
      owner: options.owner,
      limit: parseInt(options.limit || '20'),
      page: parseInt(options.page || '1'),
    });

    if (result.repositories.length === 0) {
      info('没有找到仓库', options);
      return;
    }

    const repos = result.repositories.map((repo: any) => ({
      name: repo.full_name,
      description: repo.description || '-',
      private: repo.private ? 'Yes' : 'No',
      stars: repo.stars_count,
      forks: repo.forks_count,
      updated: repo.updated_at?.split('T')[0] || '-',
    }));

    outputList(repos, options);
  } catch (err: any) {
    error(`列出仓库失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取仓库详情
 */
export async function repoGet(options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await getRepository({ client, contextManager }, { owner, repo });
    const repository = result.repository;

    outputDetails({
      fullName: repository.full_name,
      description: repository.description || '-',
      private: repository.private,
      fork: repository.fork,
      defaultBranch: repository.default_branch,
      language: repository.language || '-',
      stars: repository.stars_count,
      watchers: repository.watchers_count,
      forks: repository.forks_count,
      openIssues: repository.open_issues_count,
      openPRs: repository.open_pr_counter,
      size: `${(repository.size / 1024).toFixed(2)} MB`,
      created: repository.created_at?.split('T')[0],
      updated: repository.updated_at?.split('T')[0],
      cloneUrl: repository.clone_url,
      sshUrl: repository.ssh_url,
      website: repository.website || '-',
    }, options);
  } catch (err: any) {
    error(`获取仓库详情失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建仓库
 */
export async function repoCreate(options: ClientOptions & {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  owner?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);

    const result = await createRepository({ client, contextManager }, {
      name: options.name,
      description: options.description,
      private: options.private,
      auto_init: options.autoInit,
      owner: options.owner,
    });

    success(`仓库创建成功: ${result.repository.full_name}`, options);
    outputDetails({
      fullName: result.repository.full_name,
      cloneUrl: result.repository.clone_url,
      sshUrl: result.repository.ssh_url,
      htmlUrl: result.repository.html_url,
    }, options);
  } catch (err: any) {
    error(`创建仓库失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 删除仓库
 */
export async function repoDelete(options: ClientOptions & {
  owner?: string;
  repo?: string;
  yes?: boolean;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    // 确认删除
    if (!options.yes) {
      warning(`即将删除仓库: ${owner}/${repo}`, options);
      const response = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: '确认删除？此操作不可恢复',
        initial: false,
      });

      if (!response.confirm) {
        info('已取消删除操作', options);
        return;
      }
    }

    await deleteRepository({ client, contextManager }, { owner, repo });
    success(`仓库已删除: ${owner}/${repo}`, options);
  } catch (err: any) {
    error(`删除仓库失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 搜索仓库
 */
export async function repoSearch(query: string, options: ClientOptions & {
  limit?: string;
  page?: string;
}) {
  try {
    const client = await createClient(options);

    const result = await searchRepositories({ client, contextManager: await createContextManager(client, options) }, {
      q: query,
      limit: parseInt(options.limit || '10'),
      page: parseInt(options.page || '1'),
    });

    if (!result.repositories || result.repositories.length === 0) {
      info('没有找到匹配的仓库', options);
      return;
    }

    const repos = result.repositories.map((repo: any) => ({
      name: repo.full_name,
      description: repo.description || '-',
      stars: repo.stars_count,
      updated: repo.updated_at?.split('T')[0] || '-',
    }));

    info(`找到 ${result.repositories.length} 个仓库`, options);
    outputList(repos, options);
  } catch (err: any) {
    error(`搜索仓库失败: ${err.message}`);
    process.exit(1);
  }
}
