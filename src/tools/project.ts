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
    token?: string;
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
    createOptions,
    args.token
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
    token?: string;
  }
) {
  logger.debug({ args }, 'Getting project');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const project = await ctx.client.get<GiteaProject>(
    `/repos/${owner}/${repo}/projects/${args.id}`,
    undefined,
    args.token
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
    token?: string;
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
    },
    args.token
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
    token?: string;
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
    updateOptions,
    args.token
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
    token?: string;
  }
) {
  logger.debug({ args }, 'Deleting project');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  await ctx.client.delete(`/repos/${owner}/${repo}/projects/${args.id}`, args.token);

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
    token?: string;
  }
) {
  logger.debug({ args }, 'Listing project columns');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const columns = await ctx.client.get<GiteaProjectColumn[]>(
    `/repos/${owner}/${repo}/projects/${args.id}/columns`,
    undefined,
    args.token
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
    token?: string;
  }
) {
  logger.debug({ args }, 'Creating project column');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  const column = await ctx.client.post<GiteaProjectColumn>(
    `/repos/${owner}/${repo}/projects/${args.id}/columns`,
    { title: args.title },
    args.token
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
    projectId: number;
    columnId: number;
    issueIndex: number;
    token?: string;
  }
) {
  logger.debug({ args }, 'Adding issue to project column');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  try {
    // 首先获取 Issue 的实际 ID（API 需要 issue_id 而不是 issue index）
    const issue = await ctx.client.get<{ id: number }>(
      `/repos/${owner}/${repo}/issues/${args.issueIndex}`,
      undefined,
      args.token
    );

    if (!issue || !issue.id) {
      throw new Error(`Issue #${args.issueIndex} not found`);
    }

    logger.debug({ issueIndex: args.issueIndex, issueId: issue.id }, 'Got issue ID');

    // Gitea API: POST /repos/{owner}/{repo}/projects/columns/{column_id}/issues
    // 注意：路径中不包含 project_id，只需要 column_id
    // 参数：issue_id（Issue 的实际 ID，不是 index）
    const result = await ctx.client.post<any>(
      `/repos/${owner}/${repo}/projects/columns/${args.columnId}/issues`,
      { issue_id: issue.id },
      args.token
    );

    logger.info(
      { owner, repo, project: args.projectId, column: args.columnId, issue: args.issueIndex, issueId: issue.id },
      'Issue added to project column successfully'
    );

    return {
      success: true,
      message: `Issue #${args.issueIndex} (ID: ${issue.id}) added to column ${args.columnId}`,
      result,
    };
  } catch (error: any) {
    logger.error(
      { owner, repo, project: args.projectId, column: args.columnId, issue: args.issueIndex, error: error.message },
      'Failed to add issue to project column'
    );

    return {
      success: false,
      error: error.message,
      message: `Failed to add issue to project column: ${error.message}`,
    };
  }
}
