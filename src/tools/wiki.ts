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
  GiteaWikiCommitList,
  CreateWikiPageOptions,
  UpdateWikiPageOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';
import { GiteaAPIError } from '../gitea-client.js';

const logger = createLogger('tools:wiki');

export interface WikiToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 清理 Wiki URL 中的异常后缀(如 ".-")
 */
function cleanWikiUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  // 移除 URL 末尾的 ".-" 后缀
  return url.replace(/\.-$/, '');
}

/**
 * 清理页面名称，移除 ".-" 后缀
 * 用于返回给用户的页面名秲
 */
function cleanPageName(name: string | undefined): string | undefined {
  if (!name) return name;
  return name.replace(/\.-$/, '');
}

/**
 * 获取所有页面名称的可能变体
 * Gitea 的 Wiki 页面可能有 ".-" 后缀(用于 .md 文件)
 */
function getPageNameVariants(pageName: string): string[] {
  const variants = [
    pageName,                        // 原始名称
    `${pageName}.-`,                 // 添加 .- 后缀(Gitea .md 文件格式)
    pageName.replace(/\.-$/, ''),    // 移除 .- 后缀(如果用户传入了带后缀的名称)
  ];
  // 去重并返回
  return [...new Set(variants)];
}

/**
 * 解码 base64 内容为 UTF-8 字符串
 */
function decodeBase64Content(base64: string | undefined): string | undefined {
  if (!base64) return undefined;
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (error) {
    logger.error({ error }, 'Failed to decode base64 content');
    return undefined;
  }
}

/**
 * 尝试使用不同页面名称变体执行 API 调用
 * 处理 Gitea Wiki 页面的 ".-" 后缀问题
 */
async function tryWithPageNameVariants<T>(
  ctx: WikiToolsContext,
  pageName: string,
  apiCall: (encodedPageName: string) => Promise<T>
): Promise<T> {
  const variants = getPageNameVariants(pageName);

  let lastError: Error | null = null;

  for (const variant of variants) {
    try {
      const encodedPageName = encodeURIComponent(variant);
      const result = await apiCall(encodedPageName);
      logger.debug({ pageName, variant }, 'Wiki API call succeeded with variant');
      return result;
    } catch (error) {
      if (error instanceof GiteaAPIError && error.status === 404) {
        logger.debug({ pageName, variant }, 'Wiki page not found, trying next variant');
        lastError = error;
        continue;
      }
      // 非 404 错误直接抛出
      throw error;
    }
  }

  // 所有变体都失败了
  throw lastError || new Error(`Wiki page "${pageName}" not found`);
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
      name: cleanPageName(p.name),
      html_url: cleanWikiUrl(p.html_url),
      sub_url: cleanWikiUrl(p.sub_url),
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

  const page = await tryWithPageNameVariants(ctx, args.pageName, (encodedPageName) =>
    ctx.client.get<GiteaWikiPageContent>(`/repos/${owner}/${repo}/wiki/page/${encodedPageName}`)
  );

  logger.info({ owner, repo, pageName: args.pageName }, 'Wiki page retrieved');

  // Gitea API 返回的 content 可能是 content_base64 编码��，需要解�
  // 优先使用已解码�� content，如果没有则从 content_base64 解�
  const content = page.content || decodeBase64Content(page.content_base64);

  return {
    success: true,
    page: {
      title: page.title,
      name: cleanPageName(page.name),
      content: content,
      html_url: cleanWikiUrl(page.html_url),
      sub_url: cleanWikiUrl(page.sub_url),
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
      name: cleanPageName(page.name),
      html_url: cleanWikiUrl(page.html_url),
      sub_url: cleanWikiUrl(page.sub_url),
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

  // Only include fields that are actually provided
  const updateOptions: UpdateWikiPageOptions = {
    ...(args.title !== undefined && { title: args.title }),
    ...(contentBase64 !== undefined && { content_base64: contentBase64 }),
    message: args.message || `Update wiki page: ${args.pageName}`,
  };

  const page = await tryWithPageNameVariants(ctx, args.pageName, (encodedPageName) =>
    ctx.client.patch<GiteaWikiPageContent>(
      `/repos/${owner}/${repo}/wiki/page/${encodedPageName}`,
      updateOptions
    )
  );

  logger.info({ owner, repo, pageName: args.pageName }, 'Wiki page updated');

  return {
    success: true,
    message: `Wiki page "${page.title || page.name}" has been updated`,
    page: {
      title: page.title,
      name: cleanPageName(page.name),
      html_url: cleanWikiUrl(page.html_url),
      sub_url: cleanWikiUrl(page.sub_url),
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

  await tryWithPageNameVariants(ctx, args.pageName, (encodedPageName) =>
    ctx.client.delete(`/repos/${owner}/${repo}/wiki/page/${encodedPageName}`)
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

  // Gitea API 返回 WikiCommitList 对象，包含 commits 数组和 count
  const response = await tryWithPageNameVariants(ctx, args.pageName, (encodedPageName) =>
    ctx.client.get<GiteaWikiCommitList>(
      `/repos/${owner}/${repo}/wiki/revisions/${encodedPageName}`,
      query
    )
  );

  // 处理可能的响应格式：丌接数组或 WikiCommitList 对象
  const commits = Array.isArray(response)
    ? response as unknown as GiteaWikiRevision[]
    : (response.commits || []);

  logger.info(
    { owner, repo, pageName: args.pageName, count: commits.length },
    'Wiki revisions retrieved'
  );

  return {
    success: true,
    revisions: commits.map(r => ({
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
    count: commits.length,
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

  const page = await tryWithPageNameVariants(ctx, args.pageName, (encodedPageName) =>
    ctx.client.get<GiteaWikiPageContent>(
      `/repos/${owner}/${repo}/wiki/page/${encodedPageName}`,
      { revision: args.revision }
    )
  );

  logger.info(
    { owner, repo, pageName: args.pageName, revision: args.revision },
    'Wiki page revision retrieved'
  );

  // 优先使用已解码的 content，如果没有刘从 content_base64 解码
  const content = page.content || decodeBase64Content(page.content_base64);

  return {
    success: true,
    page: {
      title: page.title,
      name: cleanPageName(page.name),
      content: content,
      revision: args.revision,
      html_url: cleanWikiUrl(page.html_url),
    },
  };
}

/**
 * 搜索 Wiki 页面(客户端过滤实现)
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
      name: cleanPageName(p.name),
      html_url: cleanWikiUrl(p.html_url),
      sub_url: cleanWikiUrl(p.sub_url),
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
