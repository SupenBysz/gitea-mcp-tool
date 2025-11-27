/**
 * Issue Management Tools
 *
 * Issue 管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type {
  GiteaIssue,
  CreateIssueOptions,
  UpdateIssueOptions,
  IssueListOptions,
  GiteaComment,
  CreateCommentOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:issue');

export interface IssueToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 创建 Issue
 */
export async function createIssue(
  ctx: IssueToolsContext,
  args: {
    owner?: string;
    repo?: string;
    title: string;
    body?: string;
    assignee?: string;
    assignees?: string[];
    milestone?: number;
    labels?: number[];
    due_date?: string;
    token?: string;
  }
) {
  logger.debug({ args }, 'Creating issue');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const createOptions: CreateIssueOptions = {
    title: args.title,
    body: args.body,
    assignee: args.assignee,
    assignees: args.assignees,
    milestone: args.milestone,
    labels: args.labels,
    due_date: args.due_date,
  };

  const issue = await ctx.client.post<GiteaIssue>(
    `/repos/${owner}/${repo}/issues`,
    createOptions,
    args.token
  );

  logger.info({ owner, repo, issue: issue.number }, 'Issue created successfully');

  return {
    success: true,
    issue: {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      user: {
        id: issue.user.id,
        login: issue.user.login,
      },
      labels: issue.labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
      assignees: issue.assignees?.map((a) => ({ id: a.id, login: a.login })),
      milestone: issue.milestone
        ? { id: issue.milestone.id, title: issue.milestone.title }
        : null,
      html_url: issue.html_url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    },
  };
}

/**
 * 获取 Issue 详情
 */
export async function getIssue(
  ctx: IssueToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Getting issue');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const issue = await ctx.client.get<GiteaIssue>(
    `/repos/${owner}/${repo}/issues/${args.index}`,
    undefined,
    args.token
  );

  logger.debug({ owner, repo, issue: issue.number }, 'Issue retrieved');

  return {
    success: true,
    issue: {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      user: {
        id: issue.user.id,
        login: issue.user.login,
        full_name: issue.user.full_name,
      },
      labels: issue.labels.map((l) => ({
        id: l.id,
        name: l.name,
        color: l.color,
        description: l.description,
      })),
      assignees: issue.assignees?.map((a) => ({
        id: a.id,
        login: a.login,
        full_name: a.full_name,
      })),
      milestone: issue.milestone
        ? {
            id: issue.milestone.id,
            title: issue.milestone.title,
            state: issue.milestone.state,
            due_on: issue.milestone.due_on,
          }
        : null,
      comments: issue.comments,
      html_url: issue.html_url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      due_date: issue.due_date,
    },
  };
}

/**
 * 列出 Issues
 */
export async function listIssues(
  ctx: IssueToolsContext,
  args: {
    owner?: string;
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    labels?: string;
    q?: string;
    page?: number;
    limit?: number;
    milestones?: string;
    token?: string;
  }
) {
  logger.debug({ args }, 'Listing issues');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const listOptions: IssueListOptions = {
    state: args.state || 'open',
    labels: args.labels,
    q: args.q,
    type: 'issues',
    page: args.page || 1,
    limit: args.limit || 30,
    milestones: args.milestones,
  };

  const issues = await ctx.client.get<GiteaIssue[]>(
    `/repos/${owner}/${repo}/issues`,
    listOptions as any,
    args.token
  );

  logger.debug({ count: issues.length }, 'Issues listed');

  return {
    success: true,
    issues: issues.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      user: {
        id: issue.user.id,
        login: issue.user.login,
      },
      labels: issue.labels.map((l) => ({ id: l.id, name: l.name })),
      assignees: issue.assignees?.map((a) => ({ id: a.id, login: a.login })),
      milestone: issue.milestone
        ? { id: issue.milestone.id, title: issue.milestone.title }
        : null,
      comments: issue.comments,
      html_url: issue.html_url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    })),
    pagination: {
      page: listOptions.page,
      limit: listOptions.limit,
      total: issues.length,
    },
  };
}

/**
 * 更新 Issue
 */
export async function updateIssue(
  ctx: IssueToolsContext,
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
    token?: string;
  }
) {
  logger.debug({ args }, 'Updating issue');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const updateOptions: UpdateIssueOptions = {
    title: args.title,
    body: args.body,
    assignee: args.assignee,
    assignees: args.assignees,
    milestone: args.milestone,
    state: args.state,
    due_date: args.due_date,
    unset_due_date: args.unset_due_date,
  };

  const issue = await ctx.client.patch<GiteaIssue>(
    `/repos/${owner}/${repo}/issues/${args.index}`,
    updateOptions,
    args.token
  );

  logger.info({ owner, repo, issue: issue.number }, 'Issue updated successfully');

  return {
    success: true,
    issue: {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels.map((l) => ({ id: l.id, name: l.name })),
      assignees: issue.assignees?.map((a) => ({ id: a.id, login: a.login })),
      html_url: issue.html_url,
      updated_at: issue.updated_at,
    },
  };
}

/**
 * 添加 Issue 评论
 */
export async function commentIssue(
  ctx: IssueToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    body: string;
    token?: string;
  }
) {
  logger.debug({ args }, 'Adding comment to issue');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const commentOptions: CreateCommentOptions = {
    body: args.body,
  };

  const comment = await ctx.client.post<GiteaComment>(
    `/repos/${owner}/${repo}/issues/${args.index}/comments`,
    commentOptions,
    args.token
  );

  logger.info({ owner, repo, issue: args.index }, 'Comment added successfully');

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

/**
 * 关闭 Issue
 */
export async function closeIssue(
  ctx: IssueToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Closing issue');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const issue = await ctx.client.patch<GiteaIssue>(
    `/repos/${owner}/${repo}/issues/${args.index}`,
    { state: 'closed' },
    args.token
  );

  logger.info({ owner, repo, issue: issue.number }, 'Issue closed successfully');

  return {
    success: true,
    message: `Issue #${issue.number} has been closed`,
    issue: {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      html_url: issue.html_url,
      closed_at: issue.closed_at,
    },
  };
}

/**
 * 获取 Issue 依赖列表
 */
export async function listIssueDependencies(
  ctx: IssueToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    page?: number;
    limit?: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Listing issue dependencies');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const params: Record<string, any> = {};
  if (args.page) params.page = args.page;
  if (args.limit) params.limit = args.limit;

  const dependencies = await ctx.client.get<GiteaIssue[]>(
    `/repos/${owner}/${repo}/issues/${args.index}/dependencies`,
    Object.keys(params).length > 0 ? params : undefined,
    args.token
  );

  logger.debug({ count: dependencies.length }, 'Issue dependencies listed');

  return {
    success: true,
    dependencies: dependencies.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      user: {
        id: issue.user.id,
        login: issue.user.login,
      },
      html_url: issue.html_url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: dependencies.length,
    },
  };
}

/**
 * 添加 Issue 依赖关系
 * 使当前 Issue 依赖于指定的 Issue
 */
export async function addIssueDependency(
  ctx: IssueToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    dependencyIndex: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Adding issue dependency');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 添加依赖关系
  // Gitea API 要求 IssueMeta 格式: { owner, repo, index } - 三个字段都是必需的
  // index 是 Issue Number (如 #33)，不是内部 ID
  // 即使是同仓库的依赖，也必须显式指定 owner 和 repo
  const result = await ctx.client.post<GiteaIssue>(
    `/repos/${owner}/${repo}/issues/${args.index}/dependencies`,
    { owner, repo, index: args.dependencyIndex },
    args.token
  );

  // 获取依赖 Issue 的详情用于返回
  const dependencyIssue = await ctx.client.get<GiteaIssue>(
    `/repos/${owner}/${repo}/issues/${args.dependencyIndex}`,
    undefined,
    args.token
  );

  logger.info(
    { owner, repo, issue: args.index, dependency: args.dependencyIndex },
    'Issue dependency added successfully'
  );

  return {
    success: true,
    message: `Issue #${args.index} now depends on #${args.dependencyIndex}`,
    issue: {
      id: result.id,
      number: result.number,
      title: result.title,
      state: result.state,
      html_url: result.html_url,
    },
    dependency: {
      id: dependencyIssue.id,
      number: dependencyIssue.number,
      title: dependencyIssue.title,
      state: dependencyIssue.state,
      html_url: dependencyIssue.html_url,
    },
  };
}

/**
 * 移除 Issue 依赖关系
 */
export async function removeIssueDependency(
  ctx: IssueToolsContext,
  args: {
    owner?: string;
    repo?: string;
    index: number;
    dependencyIndex: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Removing issue dependency');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 移除依赖关系
  // Gitea API 要求 IssueMeta 格式: { owner, repo, index } - 三个字段都是必需的
  // index 是 Issue Number (如 #33)，不是内部 ID
  // 即使是同仓库的依赖，也必须显式指定 owner 和 repo
  await ctx.client.delete(
    `/repos/${owner}/${repo}/issues/${args.index}/dependencies`,
    { owner, repo, index: args.dependencyIndex },
    args.token
  );

  logger.info(
    { owner, repo, issue: args.index, dependency: args.dependencyIndex },
    'Issue dependency removed successfully'
  );

  return {
    success: true,
    message: `Dependency on #${args.dependencyIndex} removed from Issue #${args.index}`,
  };
}
