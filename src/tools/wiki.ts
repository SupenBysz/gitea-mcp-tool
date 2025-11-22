/**
 * Wiki Management Tools
 *
 * Wiki 管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type {
  GiteaWikiPage,
  GiteaWikiPageContent,
  GiteaWikiRevision,
  CreateWikiPageOptions,
  UpdateWikiPageOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:wiki');

export interface WikiToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 列出仓库的所有 Wiki 页面
 */
export async function listWikiPages(
  ctx: WikiToolsContext,
  args: {
    owner?: string;
    repo?: string;
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing wiki pages');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const query: Record<string, number | undefined> = {
    page: args.page,
    limit: args.limit,
  };

  const pages = await ctx.client.get<GiteaWikiPage[]>(
    `/repos/${owner}/${repo}/wiki/pages`,
    query
  );

  logger.info({ owner, repo, count: pages.length }, 'Wiki pages listed');

  return {
    success: true,
    pages: pages.map(p => ({
      title: p.title,
      name: p.name,
      html_url: p.html_url,
      sub_url: p.sub_url,
      last_commit: {
        sha: p.last_commit.sha,
        message: p.last_commit.message,
        author: p.last_commit.author.name,
        date: p.last_commit.author.date,
      },
    })),
    count: pages.length,
  };
}

/**
 * 获取 Wiki 页面的完整内容
 */
export async function getWikiPage(
  ctx: WikiToolsContext,
  args: {
    owner?: string;
    repo?: string;
    pageName: string;
  }
) {
  logger.debug({ args }, 'Getting wiki page');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const page = await ctx.client.get<GiteaWikiPageContent>(
    `/repos/${owner}/${repo}/wiki/page/${encodeURIComponent(args.pageName)}`
  );

  logger.info({ owner, repo, pageName: args.pageName }, 'Wiki page retrieved');

  return {
    success: true,
    page: {
      title: page.title,
      name: page.name,
      content: page.content,
      html_url: page.html_url,
      sub_url: page.sub_url,
      last_commit: {
        sha: page.last_commit.sha,
        message: page.last_commit.message,
        author: page.last_commit.author.name,
        date: page.last_commit.author.date,
      },
    },
  };
}

/**
 * 创建新的 Wiki 页面
 */
export async function createWikiPage(
  ctx: WikiToolsContext,
  args: {
    owner?: string;
    repo?: string;
    title: string;
    content: string;
    message?: string;
  }
) {
  logger.debug(
    { args: { ...args, content: `${args.content.substring(0, 100)}...` } },
    'Creating wiki page'
  );

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // Convert content to base64
  const contentBase64 = Buffer.from(args.content, 'utf-8').toString('base64');

  const createOptions: CreateWikiPageOptions = {
    title: args.title,
    content_base64: contentBase64,
    message: args.message || `Create wiki page: ${args.title}`,
  };

  const page = await ctx.client.post<GiteaWikiPageContent>(
    `/repos/${owner}/${repo}/wiki/new`,
    createOptions
  );

  logger.info({ owner, repo, title: args.title }, 'Wiki page created');

  return {
    success: true,
    message: `Wiki page "${args.title}" has been created`,
    page: {
      title: page.title,
      name: page.name,
      html_url: page.html_url,
      sub_url: page.sub_url,
    },
  };
}

/**
 * 更新现有的 Wiki 页面
 */
export async function updateWikiPage(
  ctx: WikiToolsContext,
  args: {
    owner?: string;
    repo?: string;
    pageName: string;
    title?: string;
    content?: string;
    message?: string;
  }
) {
  const contentPreview = args.content
    ? `${args.content.substring(0, 100)}...`
    : undefined;

  logger.debug(
    { args: { ...args, content: contentPreview } },
    'Updating wiki page'
  );

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // Convert content to base64 if provided
  const contentBase64 = args.content
    ? Buffer.from(args.content, 'utf-8').toString('base64')
    : undefined;

  const updateOptions: UpdateWikiPageOptions = {
    title: args.title,
    content_base64: contentBase64,
    message: args.message || `Update wiki page: ${args.pageName}`,
  };

  const page = await ctx.client.patch<GiteaWikiPageContent>(
    `/repos/${owner}/${repo}/wiki/page/${encodeURIComponent(args.pageName)}`,
    updateOptions
  );

  logger.info({ owner, repo, pageName: args.pageName }, 'Wiki page updated');

  return {
    success: true,
    message: `Wiki page "${args.pageName}" has been updated`,
    page: {
      title: page.title,
      name: page.name,
      html_url: page.html_url,
      sub_url: page.sub_url,
    },
  };
}

/**
 * 删除 Wiki 页面
 */
export async function deleteWikiPage(
  ctx: WikiToolsContext,
  args: {
    owner?: string;
    repo?: string;
    pageName: string;
  }
) {
  logger.debug({ args }, 'Deleting wiki page');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  await ctx.client.delete(
    `/repos/${owner}/${repo}/wiki/page/${encodeURIComponent(args.pageName)}`
  );

  logger.info({ owner, repo, pageName: args.pageName }, 'Wiki page deleted');

  return {
    success: true,
    message: `Wiki page "${args.pageName}" has been deleted`,
  };
}

/**
 * 获取 Wiki 页面的修订历史
 */
export async function getWikiRevisions(
  ctx: WikiToolsContext,
  args: {
    owner?: string;
    repo?: string;
    pageName: string;
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Getting wiki revisions');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const query: Record<string, number | undefined> = {
    page: args.page,
    limit: args.limit,
  };

  const revisions = await ctx.client.get<GiteaWikiRevision[]>(
    `/repos/${owner}/${repo}/wiki/revisions/${encodeURIComponent(args.pageName)}`,
    query
  );

  logger.info(
    { owner, repo, pageName: args.pageName, count: revisions.length },
    'Wiki revisions retrieved'
  );

  return {
    success: true,
    revisions: revisions.map(r => ({
      sha: r.sha,
      message: r.message,
      author: {
        name: r.author.name,
        email: r.author.email,
        date: r.author.date,
      },
      committer: {
        name: r.committer.name,
        email: r.committer.email,
        date: r.committer.date,
      },
    })),
    count: revisions.length,
  };
}

/**
 * 获取 Wiki 页面特定版本的内容
 */
export async function getWikiPageRevision(
  ctx: WikiToolsContext,
  args: {
    owner?: string;
    repo?: string;
    pageName: string;
    revision: string;
  }
) {
  logger.debug({ args }, 'Getting wiki page revision');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const page = await ctx.client.get<GiteaWikiPageContent>(
    `/repos/${owner}/${repo}/wiki/page/${encodeURIComponent(args.pageName)}`,
    { revision: args.revision }
  );

  logger.info(
    { owner, repo, pageName: args.pageName, revision: args.revision },
    'Wiki page revision retrieved'
  );

  return {
    success: true,
    page: {
      title: page.title,
      name: page.name,
      content: page.content,
      revision: args.revision,
      html_url: page.html_url,
    },
  };
}

/**
 * 搜索 Wiki 页面（客户端过滤实现）
 */
export async function searchWikiPages(
  ctx: WikiToolsContext,
  args: {
    owner?: string;
    repo?: string;
    query: string;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Searching wiki pages');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 获取所有页面
  const pages = await ctx.client.get<GiteaWikiPage[]>(
    `/repos/${owner}/${repo}/wiki/pages`
  );

  // 客户端过滤
  const searchQuery = args.query.toLowerCase();
  const filteredPages = pages.filter(
    p =>
      p.title.toLowerCase().includes(searchQuery) ||
      p.name.toLowerCase().includes(searchQuery)
  );

  // 限制结果数量
  const results = args.limit ? filteredPages.slice(0, args.limit) : filteredPages;

  logger.info(
    { owner, repo, query: args.query, count: results.length },
    'Wiki pages searched'
  );

  return {
    success: true,
    pages: results.map(p => ({
      title: p.title,
      name: p.name,
      html_url: p.html_url,
      sub_url: p.sub_url,
      last_commit: {
        sha: p.last_commit.sha,
        message: p.last_commit.message,
        date: p.last_commit.author.date,
      },
    })),
    count: results.length,
    total: filteredPages.length,
  };
}
