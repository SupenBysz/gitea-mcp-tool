/**
 * Label CLI Commands
 * 标签操作命令实现
 */

import { createClient, createContextManager, resolveOwnerRepo } from '../utils/client.js';
import { success, error, outputList, info } from '../utils/output.js';
import {
  listRepoLabels,
  addIssueLabels,
  removeIssueLabel,
  replaceIssueLabels,
} from '../../tools/label.js';
import type { GiteaLabel } from '../../types/gitea.js';

interface LabelOptions {
  owner?: string;
  repo?: string;
  token?: string;
  server?: string;
}

/**
 * 列出仓库所有标签
 */
export async function labelList(options: LabelOptions): Promise<void> {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await listRepoLabels({ client, contextManager }, {
      owner,
      repo,
      limit: 100,
    });

    if (!result.labels || result.labels.length === 0) {
      info('仓库没有标签');
      return;
    }

    const labels = result.labels.map((label) => ({
      ID: label.id,
      name: label.name,
      color: `#${label.color}`,
      description: label.description || '-',
    }));

    outputList(labels, ['ID', 'name', 'color', 'description']);
    info(`共 ${result.labels.length} 个标签`);
  } catch (err) {
    error(`列出标签失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 列出 Issue 的标签
 */
export async function issueLabelList(index: number, options: LabelOptions): Promise<void> {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const issue = await client.get<{ labels: GiteaLabel[] }>(
      `/repos/${owner}/${repo}/issues/${index}`
    );

    if (!issue.labels || issue.labels.length === 0) {
      info(`Issue #${index} 没有标签`);
      return;
    }

    const labels = issue.labels.map((label) => ({
      ID: label.id,
      name: label.name,
      color: `#${label.color}`,
    }));

    outputList(labels, ['ID', 'name', 'color']);
    info(`Issue #${index} 共 ${issue.labels.length} 个标签`);
  } catch (err) {
    error(`列出 Issue 标签失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 根据名称查找标签 ID
 */
async function findLabelIdsByNames(
  client: any,
  owner: string,
  repo: string,
  labelNames: string[]
): Promise<{ found: number[]; notFound: string[] }> {
  const allLabels: GiteaLabel[] = await client.get(`/repos/${owner}/${repo}/labels`, {
    limit: 100,
  });

  const found: number[] = [];
  const notFound: string[] = [];

  for (const name of labelNames) {
    const label = allLabels.find((l: GiteaLabel) => l.name === name);
    if (label) {
      found.push(label.id);
    } else {
      notFound.push(name);
    }
  }

  return { found, notFound };
}

/**
 * 为 Issue 添加标签
 */
export async function issueLabelAdd(
  index: number,
  options: LabelOptions & { labels: string[] }
): Promise<void> {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const { found, notFound } = await findLabelIdsByNames(
      client,
      owner,
      repo,
      options.labels
    );

    if (notFound.length > 0) {
      error(`以下标签不存在: ${notFound.join(', ')}`);
      info('提示: 运行 `keactl label list` 查看可用标签');
      if (found.length === 0) return;
    }

    const result = await addIssueLabels({ client, contextManager }, {
      owner,
      repo,
      index,
      labels: found,
    });

    success(`已为 Issue #${index} 添加 ${found.length} 个标签`);
    
    if (result.labels) {
      const labelNames = result.labels.map((l) => l.name).join(', ');
      info(`当前标签: ${labelNames}`);
    }
  } catch (err) {
    error(`添加标签失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 从 Issue 移除标签
 */
export async function issueLabelRemove(
  index: number,
  options: LabelOptions & { labels: string[] }
): Promise<void> {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const { found, notFound } = await findLabelIdsByNames(
      client,
      owner,
      repo,
      options.labels
    );

    if (notFound.length > 0) {
      error(`以下标签不存在: ${notFound.join(', ')}`);
      if (found.length === 0) return;
    }

    let removedCount = 0;
    for (const labelId of found) {
      try {
        await removeIssueLabel({ client, contextManager }, {
          owner,
          repo,
          index,
          id: labelId,
        });
        removedCount++;
      } catch (err) {
        // 标签可能不在 Issue 上，忽略错误
      }
    }

    success(`已从 Issue #${index} 移除 ${removedCount} 个标签`);
  } catch (err) {
    error(`移除标签失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 替换 Issue 的所有标签
 */
export async function issueLabelSet(
  index: number,
  options: LabelOptions & { labels: string[] }
): Promise<void> {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const { found, notFound } = await findLabelIdsByNames(
      client,
      owner,
      repo,
      options.labels
    );

    if (notFound.length > 0) {
      error(`以下标签不存在: ${notFound.join(', ')}`);
      info('提示: 运行 `keactl label list` 查看可用标签');
      if (found.length === 0) return;
    }

    const result = await replaceIssueLabels({ client, contextManager }, {
      owner,
      repo,
      index,
      labels: found,
    });

    success(`已设置 Issue #${index} 的标签`);
    
    if (result.labels) {
      const labelNames = result.labels.map((l) => l.name).join(', ');
      info(`当前标签: ${labelNames}`);
    }
  } catch (err) {
    error(`设置标签失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}
