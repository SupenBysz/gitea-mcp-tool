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

    if (result.length === 0) {
      info('没有找到仓库', options);
      return;
    }

    const repos = result.map((repo: any) => ({
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

    outputDetails({
      fullName: result.full_name,
      description: result.description || '-',
      private: result.private,
      fork: result.fork,
      defaultBranch: result.default_branch,
      language: result.language || '-',
      stars: result.stars_count,
      watchers: result.watchers_count,
      forks: result.forks_count,
      openIssues: result.open_issues_count,
      openPRs: result.open_pr_counter,
      size: `${(result.size / 1024).toFixed(2)} MB`,
      created: result.created_at?.split('T')[0],
      updated: result.updated_at?.split('T')[0],
      cloneUrl: result.clone_url,
      sshUrl: result.ssh_url,
      website: result.website || '-',
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

    success(`仓库创建成功: ${result.full_name}`, options);
    outputDetails({
      fullName: result.full_name,
      cloneUrl: result.clone_url,
      sshUrl: result.ssh_url,
      htmlUrl: result.html_url,
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

    if (!result.data || result.data.length === 0) {
      info('没有找到匹配的仓库', options);
      return;
    }

    const repos = result.data.map((repo: any) => ({
      name: repo.full_name,
      description: repo.description || '-',
      stars: repo.stars_count,
      updated: repo.updated_at?.split('T')[0] || '-',
    }));

    info(`找到 ${result.ok ? result.data.length : 0} 个仓库`, options);
    outputList(repos, options);
  } catch (err: any) {
    error(`搜索仓库失败: ${err.message}`);
    process.exit(1);
  }
}
