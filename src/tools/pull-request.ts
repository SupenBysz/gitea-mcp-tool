/**
 * Pull Request Management Tools
 *
 * PR 管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type {
  GiteaPullRequest,
  CreatePullRequestOptions,
  UpdatePullRequestOptions,
  MergePullRequestOptions,
  PullRequestListOptions,
  GiteaComment,
  CreateCommentOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:pull-request');

export interface PullRequestToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 创建 Pull Request
 */
export async function createPullRequest(
  ctx: PullRequestToolsContext,
  args: {
    owner?: string;
    repo?: string;
    title: string;
    head: string;
    base: string;
    body?: string;
    assignee?: string;
    assignees?: string[];
    milestone?: number;
    labels?: number[];
    due_date?: string;
  }
) {
  logger.debug({ args }, 'Creating pull request');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const createOptions: CreatePullRequestOptions = {
    title: args.title,
    head: args.head,
    base: args.base,
    body: args.body,
    assignee: args.assignee,
    assignees: args.assignees,
    milestone: args.milestone,
    labels: args.labels,
    due_date: args.due_date,
  };

  const pr = await ctx.client.post<GiteaPullRequest>(
    `/repos/${owner}/${repo}/pulls`,
    createOptions
  );

  logger.info({ owner, repo, pr: pr.number }, 'Pull request created successfully');

  return {
    success: true,
    pull_request: {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      user: {
        id: pr.user.id,
        login: pr.user.login,
      },
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
      },
      mergeable: pr.mergeable,
      merged: pr.merged,
      labels: pr.labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
      assignees: pr.assignees?.map((a) => ({ id: a.id, login: a.login })),
      milestone: pr.milestone
        ? { id: pr.milestone.id, title: pr.milestone.title }
        : null,
      html_url: pr.html_url,
      diff_url: pr.diff_url,
      patch_url: pr.patch_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    },
  };
}

/**
 * 获取 Pull Request 详情
 */
export async function getPullRequest(
  ctx: PullRequestToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
  }
) {
  logger.debug({ args }, 'Getting pull request');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const pr = await ctx.client.get<GiteaPullRequest>(
    `/repos/${owner}/${repo}/pulls/${args.index}`
  );

  logger.debug({ owner, repo, pr: pr.number }, 'Pull request retrieved');

  return {
    success: true,
    pull_request: {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      user: {
        id: pr.user.id,
        login: pr.user.login,
        full_name: pr.user.full_name,
      },
      head: {
        label: pr.head.label,
        ref: pr.head.ref,
        sha: pr.head.sha,
      },
      base: {
        label: pr.base.label,
        ref: pr.base.ref,
        sha: pr.base.sha,
      },
      mergeable: pr.mergeable,
      merged: pr.merged,
      merged_at: pr.merged_at,
      merged_by: pr.merged_by
        ? {
            id: pr.merged_by.id,
            login: pr.merged_by.login,
          }
        : null,
      labels: pr.labels.map((l) => ({
        id: l.id,
        name: l.name,
        color: l.color,
        description: l.description,
      })),
      assignees: pr.assignees?.map((a) => ({
        id: a.id,
        login: a.login,
        full_name: a.full_name,
      })),
      milestone: pr.milestone
        ? {
            id: pr.milestone.id,
            title: pr.milestone.title,
            state: pr.milestone.state,
            due_on: pr.milestone.due_on,
          }
        : null,
      comments: pr.comments,
      html_url: pr.html_url,
      diff_url: pr.diff_url,
      patch_url: pr.patch_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at,
    },
  };
}

/**
 * 列出 Pull Requests
 */
export async function listPullRequests(
  ctx: PullRequestToolsContext,
  args: {
    owner?: string;
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    sort?: 'oldest' | 'recentupdate' | 'leastupdate' | 'mostcomment' | 'leastcomment' | 'priority';
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing pull requests');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const listOptions: PullRequestListOptions = {
    state: args.state || 'open',
    sort: args.sort,
    page: args.page || 1,
    limit: args.limit || 30,
  };

  const prs = await ctx.client.get<GiteaPullRequest[]>(
    `/repos/${owner}/${repo}/pulls`,
    listOptions as any
  );

  logger.debug({ count: prs.length }, 'Pull requests listed');

  return {
    success: true,
    pull_requests: prs.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      user: {
        id: pr.user.id,
        login: pr.user.login,
      },
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
      },
      mergeable: pr.mergeable,
      merged: pr.merged,
      labels: pr.labels.map((l) => ({ id: l.id, name: l.name })),
      assignees: pr.assignees?.map((a) => ({ id: a.id, login: a.login })),
      comments: pr.comments,
      html_url: pr.html_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    })),
    pagination: {
      page: listOptions.page,
      limit: listOptions.limit,
      total: prs.length,
    },
  };
}

/**
 * 更新 Pull Request
 */
export async function updatePullRequest(
  ctx: PullRequestToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    title?: string;
    body?: string;
    assignee?: string;
    assignees?: string[];
    milestone?: number;
    state?: 'open' | 'closed';
    due_date?: string;
    unset_due_date?: boolean;
  }
) {
  logger.debug({ args }, 'Updating pull request');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const updateOptions: UpdatePullRequestOptions = {
    title: args.title,
    body: args.body,
    assignee: args.assignee,
    assignees: args.assignees,
    milestone: args.milestone,
    state: args.state,
    due_date: args.due_date,
    unset_due_date: args.unset_due_date,
  };

  const pr = await ctx.client.patch<GiteaPullRequest>(
    `/repos/${owner}/${repo}/pulls/${args.index}`,
    updateOptions
  );

  logger.info({ owner, repo, pr: pr.number }, 'Pull request updated successfully');

  return {
    success: true,
    pull_request: {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      labels: pr.labels.map((l) => ({ id: l.id, name: l.name })),
      assignees: pr.assignees?.map((a) => ({ id: a.id, login: a.login })),
      html_url: pr.html_url,
      updated_at: pr.updated_at,
    },
  };
}

/**
 * 合并 Pull Request
 */
export async function mergePullRequest(
  ctx: PullRequestToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    merge_method?: 'merge' | 'rebase' | 'rebase-merge' | 'squash';
    merge_title?: string;
    merge_message?: string;
    delete_branch_after_merge?: boolean;
  }
) {
  logger.debug({ args }, 'Merging pull request');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const mergeOptions: MergePullRequestOptions = {
    Do: args.merge_method || 'merge',
    MergeTitleField: args.merge_title,
    MergeMessageField: args.merge_message,
    delete_branch_after_merge: args.delete_branch_after_merge,
  };

  await ctx.client.post(
    `/repos/${owner}/${repo}/pulls/${args.index}/merge`,
    mergeOptions
  );

  logger.info({ owner, repo, pr: args.index }, 'Pull request merged successfully');

  return {
    success: true,
    message: `Pull request #${args.index} has been merged`,
  };
}

/**
 * 审查 Pull Request (添加审查评论)
 */
export async function reviewPullRequest(
  ctx: PullRequestToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    body: string;
  }
) {
  logger.debug({ args }, 'Reviewing pull request');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const commentOptions: CreateCommentOptions = {
    body: args.body,
  };

  const comment = await ctx.client.post<GiteaComment>(
    `/repos/${owner}/${repo}/issues/${args.index}/comments`,
    commentOptions
  );

  logger.info({ owner, repo, pr: args.index }, 'Review comment added successfully');

  return {
    success: true,
    comment: {
      id: comment.id,
      body: comment.body,
      user: {
        id: comment.user.id,
        login: comment.user.login,
      },
      html_url: comment.html_url,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    },
  };
}
