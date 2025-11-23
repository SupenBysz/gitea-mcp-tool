/**
 * 上下文管理命令
 */

import { createClient, createContextManager, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails } from '../utils/output.js';

/**
 * 获取当前上下文
 */
export async function contextGet(options: ClientOptions) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const context = contextManager.getContext();

    outputDetails({
      owner: context.owner || '(未设置)',
      repo: context.repo || '(未设置)',
      org: context.org || '(未设置)',
      project: context.project || '(未设置)',
    }, options);
  } catch (err: any) {
    error(`获取上下文失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 设置默认上下文
 */
export async function contextSet(options: ClientOptions & {
  owner?: string;
  repo?: string;
  org?: string;
  project?: number;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);

    const newContext: any = {};
    if (options.owner) newContext.owner = options.owner;
    if (options.repo) newContext.repo = options.repo;
    if (options.org) newContext.org = options.org;
    if (options.project) newContext.project = options.project;

    contextManager.setContext(newContext);
    success('上下文已更新', options);

    // 显示当前上下文
    const context = contextManager.getContext();
    outputDetails({
      owner: context.owner || '(未设置)',
      repo: context.repo || '(未设置)',
      org: context.org || '(未设置)',
      project: context.project || '(未设置)',
    }, options);
  } catch (err: any) {
    error(`设置上下文失败: ${err.message}`);
    process.exit(1);
  }
}
