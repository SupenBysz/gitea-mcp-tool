/**
 * Issue 管理命令
 */

import { createClient, createContextManager, resolveOwnerRepo, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, outputList, info } from '../utils/output.js';
import {
  createIssue,
  getIssue,
  listIssues,
  updateIssue,
  closeIssue,
  commentIssue,
} from '../../tools/issue.js';

/**
 * 列出 Issues
 */
export async function issueList(options: ClientOptions & {
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

    const result = await listIssues({ client, contextManager }, {
      owner,
      repo,
      state: options.state as 'open' | 'closed' | 'all',
      limit: parseInt(options.limit || '20'),
      page: parseInt(options.page || '1'),
    });

    if (result.length === 0) {
      info('没有找到 Issues', options);
      return;
    }

    const issues = result.map((issue: any) => ({
      '#': issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user?.login || '-',
      comments: issue.comments,
      updated: issue.updated_at?.split('T')[0] || '-',
    }));

    outputList(issues, options);
  } catch (err: any) {
    error(`列出 Issues 失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取 Issue 详情
 */
export async function issueGet(index: number, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await getIssue({ client, contextManager }, { owner, repo, index });

    outputDetails({
      number: result.number,
      title: result.title,
      state: result.state,
      author: result.user?.login || '-',
      assignees: result.assignees?.map((a: any) => a.login).join(', ') || '-',
      labels: result.labels?.map((l: any) => l.name).join(', ') || '-',
      milestone: result.milestone?.title || '-',
      comments: result.comments,
      created: result.created_at?.split('T')[0],
      updated: result.updated_at?.split('T')[0],
      body: result.body || '(无内容)',
      url: result.html_url,
    }, options);
  } catch (err: any) {
    error(`获取 Issue 详情失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建 Issue
 */
export async function issueCreate(options: ClientOptions & {
  owner?: string;
  repo?: string;
  title: string;
  body?: string;
  assignees?: string[];
  labels?: string[];
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await createIssue({ client, contextManager }, {
      owner,
      repo,
      title: options.title,
      body: options.body,
      assignees: options.assignees,
      labels: options.labels?.map(id => parseInt(id)),
    });

    success(`Issue 创建成功: #${result.number}`, options);
    outputDetails({
      number: result.number,
      title: result.title,
      url: result.html_url,
    }, options);
  } catch (err: any) {
    error(`创建 Issue 失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 更新 Issue
 */
export async function issueUpdate(index: number, options: ClientOptions & {
  owner?: string;
  repo?: string;
  title?: string;
  body?: string;
  state?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await updateIssue({ client, contextManager }, {
      owner,
      repo,
      index,
      title: options.title,
      body: options.body,
      state: options.state as 'open' | 'closed',
    });

    success(`Issue 更新成功: #${result.number}`, options);
    outputDetails({
      number: result.number,
      title: result.title,
      state: result.state,
    }, options);
  } catch (err: any) {
    error(`更新 Issue 失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 关闭 Issue
 */
export async function issueClose(index: number, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await closeIssue({ client, contextManager }, { owner, repo, index });
    success(`Issue #${result.number} 已关闭`, options);
  } catch (err: any) {
    error(`关闭 Issue 失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 添加 Issue 评论
 */
export async function issueComment(index: number, options: ClientOptions & {
  owner?: string;
  repo?: string;
  body: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await commentIssue({ client, contextManager }, {
      owner,
      repo,
      index,
      body: options.body,
    });

    success(`评论添加成功`, options);
    outputDetails({
      id: result.id,
      author: result.user?.login || '-',
      body: result.body,
      created: result.created_at?.split('T')[0],
    }, options);
  } catch (err: any) {
    error(`添加评论失败: ${err.message}`);
    process.exit(1);
  }
}
