/**
 * 项目看板管理命令
 */

import { createClient, createContextManager, resolveOwnerRepo, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, outputList, info } from '../utils/output.js';
import {
  createProject,
  getProject,
  listProjects,
} from '../../tools/project.js';

/**
 * 列出项目看板
 */
export async function projectList(options: ClientOptions & {
  owner?: string;
  repo?: string;
  state?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await listProjects({ client, contextManager }, {
      owner,
      repo,
      state: options.state as 'open' | 'closed' | 'all',
    });

    if (result.projects.length === 0) {
      info('没有找到项目看板', options);
      return;
    }

    const projects = result.projects.map((project: any) => ({
      id: project.id,
      title: project.title,
      state: project.state,
      created: project.created_at?.split('T')[0] || '-',
      updated: project.updated_at?.split('T')[0] || '-',
    }));

    outputList(projects, options);
  } catch (err: any) {
    error(`列出项目看板失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取项目详情
 */
export async function projectGet(id: number, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await getProject({ client, contextManager }, { owner, repo, id });
    const project = result.project;

    outputDetails({
      id: project.id,
      title: project.title,
      description: project.description || '(无描述)',
      state: project.state,
      created: project.created_at?.split('T')[0],
      updated: project.updated_at?.split('T')[0],
      closedAt: project.closed_at?.split('T')[0] || '-',
    }, options);
  } catch (err: any) {
    error(`获取项目详情失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建项目看板
 */
export async function projectCreate(options: ClientOptions & {
  owner?: string;
  repo?: string;
  title: string;
  description?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await createProject({ client, contextManager }, {
      owner,
      repo,
      title: options.title,
      description: options.description,
    });

    success(`项目看板创建成功: ${result.project.title}`, options);
    outputDetails({
      id: result.project.id,
      title: result.project.title,
      description: result.project.description || '(无描述)',
    }, options);
  } catch (err: any) {
    error(`创建项目看板失败: ${err.message}`);
    process.exit(1);
  }
}
