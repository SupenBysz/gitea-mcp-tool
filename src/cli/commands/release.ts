/**
 * Release 管理命令
 */

import { createClient, createContextManager, resolveOwnerRepo, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, outputList, info } from '../utils/output.js';
import {
  listReleases,
  getRelease,
  getReleaseByTag,
  createRelease,
  updateRelease,
  deleteRelease,
  listReleaseAttachments,
  getReleaseAttachment,
  deleteReleaseAttachment,
} from '../../tools/release.js';

/**
 * 列出发布版本
 */
export async function releaseList(options: ClientOptions & {
  owner?: string;
  repo?: string;
  limit?: string;
  page?: string;
  draft?: boolean;
  prerelease?: boolean;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await listReleases({ client, contextManager }, {
      owner,
      repo,
      limit: parseInt(options.limit || '30'),
      page: parseInt(options.page || '1'),
      draft: options.draft,
      prerelease: options.prerelease,
    }) as any[];

    if (result.length === 0) {
      info('没有找到发布版本', options);
      return;
    }

    const releases = result.map((release: any) => ({
      id: release.id,
      tag: release.tag_name,
      name: release.name || '-',
      draft: release.draft ? 'Yes' : 'No',
      prerelease: release.prerelease ? 'Yes' : 'No',
      author: release.author?.login || '-',
      published: release.published_at?.split('T')[0] || release.created_at?.split('T')[0] || '-',
    }));

    outputList(releases, options);
  } catch (err: any) {
    error(`列出发布版本失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取发布版本详情（按 ID）
 */
export async function releaseGet(id: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const releaseId = parseInt(id);
    if (isNaN(releaseId)) {
      error('发布 ID 必须是数字');
      process.exit(1);
    }

    const release = await getRelease({ client, contextManager }, {
      owner,
      repo,
      id: releaseId,
    }) as any;

    outputDetails({
      ID: release.id,
      Tag: release.tag_name,
      Name: release.name || '-',
      Draft: release.draft ? 'Yes' : 'No',
      Prerelease: release.prerelease ? 'Yes' : 'No',
      Author: release.author?.login || '-',
      Target: release.target_commitish || '-',
      Published: release.published_at || release.created_at || '-',
      URL: release.html_url || '-',
      Body: release.body || '(无描述)',
    }, options);
  } catch (err: any) {
    error(`获取发布版本失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取发布版本详情（按 Tag）
 */
export async function releaseGetByTag(tag: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const release = await getReleaseByTag({ client, contextManager }, {
      owner,
      repo,
      tag,
    }) as any;

    outputDetails({
      ID: release.id,
      Tag: release.tag_name,
      Name: release.name || '-',
      Draft: release.draft ? 'Yes' : 'No',
      Prerelease: release.prerelease ? 'Yes' : 'No',
      Author: release.author?.login || '-',
      Target: release.target_commitish || '-',
      Published: release.published_at || release.created_at || '-',
      URL: release.html_url || '-',
      Body: release.body || '(无描述)',
    }, options);
  } catch (err: any) {
    error(`获取发布版本失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建发布版本
 */
export async function releaseCreate(options: ClientOptions & {
  owner?: string;
  repo?: string;
  tag: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  target?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const release = await createRelease({ client, contextManager }, {
      owner,
      repo,
      tag_name: options.tag,
      name: options.name,
      body: options.body,
      draft: options.draft,
      prerelease: options.prerelease,
      target_commitish: options.target,
    }) as any;

    success(`发布版本创建成功: ${release.tag_name}`, options);
    outputDetails({
      ID: release.id,
      Tag: release.tag_name,
      Name: release.name || '-',
      Draft: release.draft ? 'Yes' : 'No',
      Prerelease: release.prerelease ? 'Yes' : 'No',
      URL: release.html_url || '-',
    }, options);
  } catch (err: any) {
    error(`创建发布版本失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 更新发布版本
 */
export async function releaseUpdate(id: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  tag?: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  target?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const releaseId = parseInt(id);
    if (isNaN(releaseId)) {
      error('发布 ID 必须是数字');
      process.exit(1);
    }

    const release = await updateRelease({ client, contextManager }, {
      owner,
      repo,
      id: releaseId,
      tag_name: options.tag,
      name: options.name,
      body: options.body,
      draft: options.draft,
      prerelease: options.prerelease,
      target_commitish: options.target,
    }) as any;

    success(`发布版本更新成功: ${release.tag_name}`, options);
    outputDetails({
      ID: release.id,
      Tag: release.tag_name,
      Name: release.name || '-',
      Draft: release.draft ? 'Yes' : 'No',
      Prerelease: release.prerelease ? 'Yes' : 'No',
      URL: release.html_url || '-',
    }, options);
  } catch (err: any) {
    error(`更新发布版本失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 删除发布版本
 */
export async function releaseDelete(id: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  yes?: boolean;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const releaseId = parseInt(id);
    if (isNaN(releaseId)) {
      error('发布 ID 必须是数字');
      process.exit(1);
    }

    // 确认删除
    if (!options.yes) {
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(`确认删除发布版本 #${releaseId}? (y/N) `, resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        info('已取消删除', options);
        return;
      }
    }

    await deleteRelease({ client, contextManager }, {
      owner,
      repo,
      id: releaseId,
    });

    success(`发布版本 #${releaseId} 已删除`, options);
  } catch (err: any) {
    error(`删除发布版本失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 列出发布版本附件
 */
export async function releaseAttachments(id: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const releaseId = parseInt(id);
    if (isNaN(releaseId)) {
      error('发布 ID 必须是数字');
      process.exit(1);
    }

    const result = await listReleaseAttachments({ client, contextManager }, {
      owner,
      repo,
      id: releaseId,
    }) as any[];

    if (result.length === 0) {
      info(`发布版本 #${releaseId} 没有附件`, options);
      return;
    }

    const attachments = result.map((attachment: any) => ({
      id: attachment.id,
      name: attachment.name,
      size: formatFileSize(attachment.size || 0),
      downloads: attachment.download_count || 0,
      created: attachment.created_at?.split('T')[0] || '-',
    }));

    outputList(attachments, options);
  } catch (err: any) {
    error(`列出发布附件失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取发布附件详情
 */
export async function releaseAttachmentGet(releaseId: string, attachmentId: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const relId = parseInt(releaseId);
    const attId = parseInt(attachmentId);
    if (isNaN(relId) || isNaN(attId)) {
      error('发布 ID 和附件 ID 必须是数字');
      process.exit(1);
    }

    const attachment = await getReleaseAttachment({ client, contextManager }, {
      owner,
      repo,
      id: relId,
      attachment_id: attId,
    }) as any;

    outputDetails({
      ID: attachment.id,
      Name: attachment.name,
      Size: formatFileSize(attachment.size || 0),
      Downloads: attachment.download_count || 0,
      Created: attachment.created_at || '-',
      URL: attachment.browser_download_url || '-',
    }, options);
  } catch (err: any) {
    error(`获取发布附件失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 删除发布附件
 */
export async function releaseAttachmentDelete(releaseId: string, attachmentId: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  yes?: boolean;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const relId = parseInt(releaseId);
    const attId = parseInt(attachmentId);
    if (isNaN(relId) || isNaN(attId)) {
      error('发布 ID 和附件 ID 必须是数字');
      process.exit(1);
    }

    // 确认删除
    if (!options.yes) {
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(`确认删除发布 #${relId} 的附件 #${attId}? (y/N) `, resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        info('已取消删除', options);
        return;
      }
    }

    await deleteReleaseAttachment({ client, contextManager }, {
      owner,
      repo,
      id: relId,
      attachment_id: attId,
    });

    success(`附件 #${attId} 已删除`, options);
  } catch (err: any) {
    error(`删除发布附件失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
