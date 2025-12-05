/**
 * Wiki 管理命令
 */

import { createClient, createContextManager, resolveOwnerRepo, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, outputList, info } from '../utils/output.js';
import {
  listWikiPages,
  getWikiPage,
  createWikiPage,
  updateWikiPage,
  deleteWikiPage,
  getWikiRevisions,
  getWikiPageRevision,
  searchWikiPages,
} from '../../tools/wiki.js';

/**
 * 列出 Wiki 页面
 */
export async function wikiList(options: ClientOptions & {
  owner?: string;
  repo?: string;
  limit?: string;
  page?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await listWikiPages({ client, contextManager }, {
      owner,
      repo,
      limit: parseInt(options.limit || '30'),
      page: parseInt(options.page || '1'),
    });

    if (result.pages.length === 0) {
      info('没有找到 Wiki 页面', options);
      return;
    }

    const pages = result.pages.map((page: any) => ({
      name: page.name,
      title: page.title,
      author: page.last_commit?.author || '-',
      updated: page.last_commit?.date?.split('T')[0] || '-',
    }));

    outputList(pages, options);
  } catch (err: any) {
    error(`列出 Wiki 页面失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取 Wiki 页面内容
 */
export async function wikiGet(pageName: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await getWikiPage({ client, contextManager }, {
      owner,
      repo,
      pageName,
    });

    const page = result.page;

    outputDetails({
      title: page.title,
      name: page.name,
      author: page.last_commit?.author || '-',
      updated: page.last_commit?.date?.split('T')[0] || '-',
      url: page.html_url,
      content: page.content || '(无内容)',
    }, options);
  } catch (err: any) {
    error(`获取 Wiki 页面失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建 Wiki 页面
 */
export async function wikiCreate(options: ClientOptions & {
  owner?: string;
  repo?: string;
  title: string;
  content: string;
  message?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await createWikiPage({ client, contextManager }, {
      owner,
      repo,
      title: options.title,
      content: options.content,
      message: options.message,
    });

    success(`Wiki 页面创建成功: ${result.page.title}`, options);
    outputDetails({
      title: result.page.title,
      name: result.page.name,
      url: result.page.html_url,
    }, options);
  } catch (err: any) {
    error(`创建 Wiki 页面失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 更新 Wiki 页面
 */
export async function wikiUpdate(pageName: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  title?: string;
  content?: string;
  message?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await updateWikiPage({ client, contextManager }, {
      owner,
      repo,
      pageName,
      title: options.title,
      content: options.content,
      message: options.message,
    });

    success(`Wiki 页面更新成功: ${result.page.title || result.page.name}`, options);
    outputDetails({
      title: result.page.title,
      name: result.page.name,
      url: result.page.html_url,
    }, options);
  } catch (err: any) {
    error(`更新 Wiki 页面失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 删除 Wiki 页面
 */
export async function wikiDelete(pageName: string, options: ClientOptions & {
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
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(`确认删除 Wiki 页面 "${pageName}"? (y/N) `, resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        info('已取消删除', options);
        return;
      }
    }

    await deleteWikiPage({ client, contextManager }, {
      owner,
      repo,
      pageName,
    });

    success(`Wiki 页面 "${pageName}" 已删除`, options);
  } catch (err: any) {
    error(`删除 Wiki 页面失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 搜索 Wiki 页面
 */
export async function wikiSearch(query: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  limit?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await searchWikiPages({ client, contextManager }, {
      owner,
      repo,
      query,
      limit: parseInt(options.limit || '20'),
    });

    if (result.pages.length === 0) {
      info(`没有找到匹配 "${query}" 的 Wiki 页面`, options);
      return;
    }

    const pages = result.pages.map((page: any) => ({
      name: page.name,
      title: page.title,
      updated: page.last_commit?.date?.split('T')[0] || '-',
    }));

    outputList(pages, options);
    info(`共找到 ${result.count} 个结果 (总计 ${result.total} 个匹配)`, options);
  } catch (err: any) {
    error(`搜索 Wiki 页面失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 查看 Wiki 页面修订历史
 */
export async function wikiRevisions(pageName: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  limit?: string;
  page?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await getWikiRevisions({ client, contextManager }, {
      owner,
      repo,
      pageName,
      limit: parseInt(options.limit || '20'),
      page: parseInt(options.page || '1'),
    });

    if (result.revisions.length === 0) {
      info(`页面 "${pageName}" 没有修订历史`, options);
      return;
    }

    const revisions = result.revisions.map((rev: any) => ({
      sha: rev.sha?.substring(0, 7) || '-',
      message: rev.message?.length > 50 ? rev.message.substring(0, 50) + '...' : rev.message,
      author: rev.author?.name || '-',
      date: rev.author?.date?.split('T')[0] || '-',
    }));

    outputList(revisions, options);
  } catch (err: any) {
    error(`获取修订历史失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取 Wiki 页面特定版本
 */
export async function wikiRevisionGet(pageName: string, revision: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await getWikiPageRevision({ client, contextManager }, {
      owner,
      repo,
      pageName,
      revision,
    });

    const page = result.page;

    outputDetails({
      title: page.title,
      name: page.name,
      revision: page.revision,
      url: page.html_url,
      content: page.content || '(无内容)',
    }, options);
  } catch (err: any) {
    error(`获取页面版本失败: ${err.message}`);
    process.exit(1);
  }
}
