/**
 * Pull Request 管理命令
 */

import { createClient, createContextManager, resolveOwnerRepo, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, outputList, info } from '../utils/output.js';
import {
  createPullRequest,
  getPullRequest,
  listPullRequests,
  mergePullRequest,
} from '../../tools/pull-request.js';

/**
 * 列出 Pull Requests
 */
export async function prList(options: ClientOptions & {
  owner?: string;
  repo?: string;
  state?: string;
  limit?: string;
  page?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await listPullRequests({ client, contextManager }, {
      owner,
      repo,
      state: options.state as 'open' | 'closed' | 'all',
      limit: parseInt(options.limit || '20'),
      page: parseInt(options.page || '1'),
    });

    if (result.pull_requests.length === 0) {
      info('没有找到 Pull Requests', options);
      return;
    }

    const prs = result.pull_requests.map((pr: any) => ({
      '#': pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.user?.login || '-',
      head: pr.head?.ref || '-',
      base: pr.base?.ref || '-',
      mergeable: pr.mergeable ? 'Yes' : 'No',
      updated: pr.updated_at?.split('T')[0] || '-',
    }));

    outputList(prs, options);
  } catch (err: any) {
    error(`列出 Pull Requests 失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取 PR 详情
 */
export async function prGet(index: number, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await getPullRequest({ client, contextManager }, { owner, repo, index });
    const pr = result.pull_request;

    outputDetails({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.user?.login || '-',
      assignees: pr.assignees?.map((a: any) => a.login).join(', ') || '-',
      labels: pr.labels?.map((l: any) => l.name).join(', ') || '-',
      milestone: pr.milestone?.title || '-',
      headBranch: pr.head?.ref || '-',
      baseBranch: pr.base?.ref || '-',
      mergeable: pr.mergeable,
      merged: pr.merged,
      draft: (pr as any).draft,
      comments: pr.comments,
      additions: (pr as any).additions,
      deletions: (pr as any).deletions,
      changedFiles: (pr as any).changed_files,
      created: pr.created_at?.split('T')[0],
      updated: pr.updated_at?.split('T')[0],
      body: pr.body || '(无内容)',
      url: pr.html_url,
    }, options);
  } catch (err: any) {
    error(`获取 PR 详情失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建 PR
 */
export async function prCreate(options: ClientOptions & {
  owner?: string;
  repo?: string;
  title: string;
  head: string;
  base: string;
  body?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await createPullRequest({ client, contextManager }, {
      owner,
      repo,
      title: options.title,
      head: options.head,
      base: options.base,
      body: options.body,
    });

    success(`Pull Request 创建成功: #${result.pull_request.number}`, options);
    outputDetails({
      number: result.pull_request.number,
      title: result.pull_request.title,
      head: result.pull_request.head?.ref,
      base: result.pull_request.base?.ref,
      url: result.pull_request.html_url,
    }, options);
  } catch (err: any) {
    error(`创建 Pull Request 失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 合并 PR
 */
export async function prMerge(index: number, options: ClientOptions & {
  owner?: string;
  repo?: string;
  method?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    await mergePullRequest({ client, contextManager }, {
      owner,
      repo,
      index,
      merge_method: options.method as 'merge' | 'rebase' | 'rebase-merge' | 'squash',
    });

    success(`Pull Request #${index} 已合并`, options);
  } catch (err: any) {
    error(`合并 Pull Request 失败: ${err.message}`);
    process.exit(1);
  }
}
