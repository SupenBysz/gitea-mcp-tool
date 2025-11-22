/**
 * Project Management Tools
 *
 * Project 看板管理相关的 MCP 工具实现
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import type {
  GiteaProject,
  GiteaProjectColumn,
  CreateProjectOptions,
  UpdateProjectOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:project');

export interface ProjectToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

/**
 * 创建项目看板
 */
export async function createProject(
  ctx: ProjectToolsContext,
  args: {
    owner?: string;
    repo?: string;
    title: string;
    description?: string;
  }
) {
  logger.debug({ args }, 'Creating project');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const createOptions: CreateProjectOptions = {
    title: args.title,
    description: args.description,
  };

  logger.debug({ owner, repo, createOptions }, 'Sending create project request');

  const project = await ctx.client.post<GiteaProject>(
    `/repos/${owner}/${repo}/projects`,
    createOptions
  );

  logger.debug({ project }, 'Received project response');

  if (!project) {
    throw new Error('Gitea API returned empty response');
  }

  // 检查是否是错误响应（Gitea 有时返回 200 状态码但包含错误信息）
  if ('message' in (project as any) && 'errors' in (project as any)) {
    const errorResponse = project as any;
    logger.error({ errorResponse }, 'Gitea returned error in 200 response');
    throw new Error(`Gitea API Error: ${errorResponse.message || 'Unknown error'}`);
  }

  if (!project.id) {
    logger.error({ project }, 'Project response missing id field');
    throw new Error('Gitea API response missing project id');
  }

  logger.info({ owner, repo, project: project.id }, 'Project created successfully');

  return {
    success: true,
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      state: project.state,
      repository_id: project.repository_id,
      creator: project.creator ? {
        id: project.creator.id,
        login: project.creator.login,
      } : undefined,
      created_at: project.created_at,
      updated_at: project.updated_at,
    },
  };
}

/**
 * 获取项目详情
 */
export async function getProject(
  ctx: ProjectToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
  }
) {
  logger.debug({ args }, 'Getting project');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const project = await ctx.client.get<GiteaProject>(
    `/repos/${owner}/${repo}/projects/${args.id}`
  );

  logger.debug({ owner, repo, project: project.id }, 'Project retrieved');

  return {
    success: true,
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      state: project.state,
      repository_id: project.repository_id,
      creator: project.creator ? {
        id: project.creator.id,
        login: project.creator.login,
        full_name: project.creator.full_name,
      } : undefined,
      created_at: project.created_at,
      updated_at: project.updated_at,
      closed_at: project.closed_at,
    },
  };
}

/**
 * 列出项目
 */
export async function listProjects(
  ctx: ProjectToolsContext,
  args: {
    owner?: string;
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    page?: number;
    limit?: number;
  }
) {
  logger.debug({ args }, 'Listing projects');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const projects = await ctx.client.get<GiteaProject[]>(
    `/repos/${owner}/${repo}/projects`,
    {
      state: args.state || 'open',
      page: args.page || 1,
      limit: args.limit || 30,
    }
  );

  logger.debug({ count: projects.length }, 'Projects listed');

  return {
    success: true,
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      state: project.state,
      created_at: project.created_at,
      updated_at: project.updated_at,
    })),
    pagination: {
      page: args.page || 1,
      limit: args.limit || 30,
      total: projects.length,
    },
  };
}

/**
 * 更新项目
 */
export async function updateProject(
  ctx: ProjectToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    title?: string;
    description?: string;
    state?: 'open' | 'closed';
  }
) {
  logger.debug({ args }, 'Updating project');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const updateOptions: UpdateProjectOptions = {
    title: args.title,
    description: args.description,
    state: args.state,
  };

  const project = await ctx.client.patch<GiteaProject>(
    `/repos/${owner}/${repo}/projects/${args.id}`,
    updateOptions
  );

  logger.info({ owner, repo, project: project.id }, 'Project updated successfully');

  return {
    success: true,
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      state: project.state,
      updated_at: project.updated_at,
    },
  };
}

/**
 * 删除项目
 */
export async function deleteProject(
  ctx: ProjectToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
  }
) {
  logger.debug({ args }, 'Deleting project');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  await ctx.client.delete(`/repos/${owner}/${repo}/projects/${args.id}`);

  logger.info({ owner, repo, project: args.id }, 'Project deleted successfully');

  return {
    success: true,
    message: `Project #${args.id} has been deleted`,
  };
}

/**
 * 列出项目的列
 */
export async function listProjectColumns(
  ctx: ProjectToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
  }
) {
  logger.debug({ args }, 'Listing project columns');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const columns = await ctx.client.get<GiteaProjectColumn[]>(
    `/repos/${owner}/${repo}/projects/${args.id}/columns`
  );

  logger.debug({ count: columns.length }, 'Project columns listed');

  return {
    success: true,
    columns: columns.map((column) => ({
      id: column.id,
      title: column.title,
      project_id: column.project_id,
      sorting: column.sorting,
      created_at: column.created_at,
      updated_at: column.updated_at,
    })),
    total: columns.length,
  };
}

/**
 * 创建项目列
 */
export async function createProjectColumn(
  ctx: ProjectToolsContext,
  args: {
    owner?: string;
    repo?: string;
    id: number;
    title: string;
  }
) {
  logger.debug({ args }, 'Creating project column');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const column = await ctx.client.post<GiteaProjectColumn>(
    `/repos/${owner}/${repo}/projects/${args.id}/columns`,
    { title: args.title }
  );

  logger.info(
    { owner, repo, project: args.id, column: column.id },
    'Project column created successfully'
  );

  return {
    success: true,
    column: {
      id: column.id,
      title: column.title,
      project_id: column.project_id,
      sorting: column.sorting,
      created_at: column.created_at,
      updated_at: column.updated_at,
    },
  };
}

/**
 * 添加 Issue 到项目看板列
 */
export async function addIssueToProjectColumn(
  ctx: ProjectToolsContext,
  args: {
    owner?: string;
    repo?: string;
    column_id: number;
    issue_id: number;
  }
) {
  logger.debug({ args }, 'Adding issue to project column');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  try {
    // 尝试使用 API 添加 Issue 到项目列
    const result = await ctx.client.post<any>(
      `/repos/${owner}/${repo}/projects/columns/${args.column_id}/issues`,
      { issue_id: args.issue_id }
    );

    logger.info(
      { owner, repo, column: args.column_id, issue: args.issue_id },
      'Issue added to project column successfully'
    );

    return {
      success: true,
      message: `Issue #${args.issue_id} added to column ${args.column_id}`,
      result,
    };
  } catch (error: any) {
    logger.error(
      { owner, repo, column: args.column_id, issue: args.issue_id, error: error.message },
      'Failed to add issue to project column'
    );

    // 返回详细错误信息，帮助判断是否需要二次开发 Gitea
    return {
      success: false,
      error: error.message,
      message: `Failed to add issue to project column. This API may not be supported in current Gitea version.`,
      requires_gitea_development: error.message.includes('404') || error.message.includes('not found'),
    };
  }
}
