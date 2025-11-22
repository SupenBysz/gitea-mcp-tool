#!/usr/bin/env node

/**
 * Gitea Service MCP Server
 *
 * 通用 MCP 服务器，支持所有符合 MCP 规范的客户端
 * - Claude Desktop
 * - Cline (VSCode)
 * - Continue (VSCode/JetBrains)
 * - 其他 MCP 客户端
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from './logger.js';
import { loadConfigFromEnv, validateConfig } from './config.js';
import { GiteaClient } from './gitea-client.js';
import { ContextManager } from './context-manager.js';
import { getProjectConfig } from './config/project.js';
import { detectGitInfo } from './utils/git-detector.js';
import * as RepositoryTools from './tools/repository.js';
import * as IssueTools from './tools/issue.js';
import * as PullRequestTools from './tools/pull-request.js';
import * as ProjectTools from './tools/project.js';
import * as MilestoneTools from './tools/milestone.js';
import * as UserTools from './tools/user.js';
import * as WikiTools from './tools/wiki.js';
import * as TeamTools from './tools/team.js';
import * as TokenTools from './tools/token.js';
import * as LabelTools from './tools/label.js';
import * as WebhookTools from './tools/webhook.js';

const logger = createLogger('mcp-server');

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('Starting Gitea Service MCP Server...');

    // 1. 加载并验证配置
    logger.info('Loading configuration...');
    const config = loadConfigFromEnv();
    validateConfig(config);

    // 2. 创建 Gitea Client
    logger.info({ baseUrl: config.baseUrl }, 'Connecting to Gitea...');
    const giteaClient = new GiteaClient(config);

    // 3. 测试连接
    logger.info('Testing Gitea connection...');
    const connected = await giteaClient.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Gitea server');
    }

    // 获取当前用户信息
    const currentUser = await giteaClient.getCurrentUser();
    logger.info({ user: currentUser.login }, 'Connected to Gitea successfully');

    // 4. 初始化上下文管理器
    logger.info('Initializing context manager...');
    const contextManager = new ContextManager(config);
    logger.info({ context: contextManager.getSummary() }, 'Context initialized');

    // 5. 创建 MCP Server
    logger.info('Creating MCP Server...');
    const server = new Server(
      {
        name: 'gitea-service',
        version: '0.8.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 6. 注册 tools/list handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Received tools/list request');

      return {
        tools: [
          // ========== 初始化和配置工具 ==========
          {
            name: 'gitea_init',
            description: 'Initialize project configuration files (.gitea-mcp.json). Auto-detects Git repository info if available.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (username or organization). Auto-detected from Git if not provided.',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Auto-detected from Git if not provided.',
                },
                gitea_url: {
                  type: 'string',
                  description: 'Gitea server URL. Auto-detected from Git remote if not provided.',
                },
                set_as_default: {
                  type: 'boolean',
                  description: 'Set this repository as default context (default: true)',
                },
                force: {
                  type: 'boolean',
                  description: 'Force overwrite existing configuration (default: false)',
                },
              },
            },
          },

          // ========== 上下文管理工具 ==========
          {
            name: 'gitea_context_get',
            description: 'Get current default context (owner, repo, org, project)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'gitea_context_set',
            description:
              'Set default context for subsequent operations. All parameters are optional.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Default owner (username or organization)',
                },
                repo: {
                  type: 'string',
                  description: 'Default repository name',
                },
                org: {
                  type: 'string',
                  description: 'Default organization name',
                },
                project: {
                  type: 'number',
                  description: 'Default project ID',
                },
              },
            },
          },
          {
            name: 'gitea_user_current',
            description: 'Get information about the currently authenticated user',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },

          // ========== 仓库管理工具 ==========
          {
            name: 'gitea_repo_create',
            description: 'Create a new repository',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Repository name',
                },
                owner: {
                  type: 'string',
                  description: 'Owner (username or organization). Uses context if not provided',
                },
                description: {
                  type: 'string',
                  description: 'Repository description',
                },
                private: {
                  type: 'boolean',
                  description: 'Whether repository is private',
                },
                auto_init: {
                  type: 'boolean',
                  description: 'Auto-initialize with README',
                },
                gitignores: {
                  type: 'string',
                  description: 'Gitignore template name',
                },
                license: {
                  type: 'string',
                  description: 'License template name',
                },
                readme: {
                  type: 'string',
                  description: 'README template name',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'gitea_repo_get',
            description: 'Get repository details',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
              },
            },
          },
          {
            name: 'gitea_repo_list',
            description: 'List repositories',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Owner to list repos for. Lists current user repos if not provided',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_repo_delete',
            description: 'Delete a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
              },
            },
          },
          {
            name: 'gitea_repo_search',
            description: 'Search repositories',
            inputSchema: {
              type: 'object',
              properties: {
                q: {
                  type: 'string',
                  description: 'Search query',
                },
                sort: {
                  type: 'string',
                  enum: ['alpha', 'created', 'updated', 'size', 'id'],
                  description: 'Sort by (default: updated)',
                },
                order: {
                  type: 'string',
                  enum: ['asc', 'desc'],
                  description: 'Sort order (default: desc)',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
              required: ['q'],
            },
          },

          // ========== Issue 管理工具 ==========
          {
            name: 'gitea_issue_create',
            description: 'Create a new issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                title: {
                  type: 'string',
                  description: 'Issue title',
                },
                body: {
                  type: 'string',
                  description: 'Issue body/description',
                },
                assignees: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Assignee usernames',
                },
                labels: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Label IDs',
                },
                milestone: {
                  type: 'number',
                  description: 'Milestone ID',
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'gitea_issue_get',
            description: 'Get issue details',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Issue number',
                },
              },
              required: ['index'],
            },
          },
          {
            name: 'gitea_issue_list',
            description: 'List issues',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  description: 'Issue state filter (default: open)',
                },
                labels: {
                  type: 'string',
                  description: 'Comma-separated label names',
                },
                q: {
                  type: 'string',
                  description: 'Search query',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_issue_update',
            description: 'Update an issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Issue number',
                },
                title: {
                  type: 'string',
                  description: 'New issue title',
                },
                body: {
                  type: 'string',
                  description: 'New issue body',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed'],
                  description: 'New state',
                },
                assignees: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Assignee usernames',
                },
                labels: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Label IDs',
                },
                milestone: {
                  type: 'number',
                  description: 'Milestone ID',
                },
              },
              required: ['index'],
            },
          },
          {
            name: 'gitea_issue_comment',
            description: 'Add a comment to an issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Issue number',
                },
                body: {
                  type: 'string',
                  description: 'Comment content',
                },
              },
              required: ['index', 'body'],
            },
          },
          {
            name: 'gitea_issue_close',
            description: 'Close an issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Issue number',
                },
              },
              required: ['index'],
            },
          },

          // ========== Pull Request 管理工具 ==========
          {
            name: 'gitea_pr_create',
            description: 'Create a new pull request',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                title: {
                  type: 'string',
                  description: 'Pull request title',
                },
                head: {
                  type: 'string',
                  description: 'Branch name to merge from',
                },
                base: {
                  type: 'string',
                  description: 'Branch name to merge into',
                },
                body: {
                  type: 'string',
                  description: 'Pull request body/description',
                },
                assignees: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Assignee usernames',
                },
                labels: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Label IDs',
                },
                milestone: {
                  type: 'number',
                  description: 'Milestone ID',
                },
              },
              required: ['title', 'head', 'base'],
            },
          },
          {
            name: 'gitea_pr_get',
            description: 'Get pull request details',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Pull request number',
                },
              },
              required: ['index'],
            },
          },
          {
            name: 'gitea_pr_list',
            description: 'List pull requests',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  description: 'PR state filter (default: open)',
                },
                sort: {
                  type: 'string',
                  enum: ['oldest', 'recentupdate', 'leastupdate', 'mostcomment', 'leastcomment', 'priority'],
                  description: 'Sort by',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_pr_update',
            description: 'Update a pull request',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Pull request number',
                },
                title: {
                  type: 'string',
                  description: 'New PR title',
                },
                body: {
                  type: 'string',
                  description: 'New PR body',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed'],
                  description: 'New state',
                },
                assignees: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Assignee usernames',
                },
                milestone: {
                  type: 'number',
                  description: 'Milestone ID',
                },
              },
              required: ['index'],
            },
          },
          {
            name: 'gitea_pr_merge',
            description: 'Merge a pull request',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Pull request number',
                },
                merge_method: {
                  type: 'string',
                  enum: ['merge', 'rebase', 'rebase-merge', 'squash'],
                  description: 'Merge method (default: merge)',
                },
                merge_title: {
                  type: 'string',
                  description: 'Merge commit title',
                },
                merge_message: {
                  type: 'string',
                  description: 'Merge commit message',
                },
                delete_branch_after_merge: {
                  type: 'boolean',
                  description: 'Delete source branch after merge',
                },
              },
              required: ['index'],
            },
          },
          {
            name: 'gitea_pr_review',
            description: 'Add a review comment to a pull request',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Pull request number',
                },
                body: {
                  type: 'string',
                  description: 'Review comment content',
                },
              },
              required: ['index', 'body'],
            },
          },

          // ========== Project 管理工具 ==========
          {
            name: 'gitea_project_create',
            description: 'Create a new project board',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                title: {
                  type: 'string',
                  description: 'Project title',
                },
                description: {
                  type: 'string',
                  description: 'Project description',
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'gitea_project_get',
            description: 'Get project details',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Project ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_project_list',
            description: 'List projects',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  description: 'Project state filter (default: open)',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_project_update',
            description: 'Update a project',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Project ID',
                },
                title: {
                  type: 'string',
                  description: 'New project title',
                },
                description: {
                  type: 'string',
                  description: 'New project description',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed'],
                  description: 'New state',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_project_delete',
            description: 'Delete a project',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Project ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_project_columns',
            description: 'List project columns',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Project ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_project_column_create',
            description: 'Create a project column',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Project ID',
                },
                title: {
                  type: 'string',
                  description: 'Column title',
                },
              },
              required: ['id', 'title'],
            },
          },
          {
            name: 'gitea_project_add_issue',
            description: 'Add an issue to a project column',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                column_id: {
                  type: 'number',
                  description: 'Project column ID',
                },
                issue_id: {
                  type: 'number',
                  description: 'Issue ID (not issue number, the internal ID)',
                },
              },
              required: ['column_id', 'issue_id'],
            },
          },

          // ========== Milestone 管理工具 ==========
          {
            name: 'gitea_milestone_create',
            description: 'Create a new milestone',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                title: {
                  type: 'string',
                  description: 'Milestone title',
                },
                description: {
                  type: 'string',
                  description: 'Milestone description',
                },
                due_on: {
                  type: 'string',
                  description: 'Due date (ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ)',
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'gitea_milestone_list',
            description: 'List milestones',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  description: 'Milestone state filter (default: open)',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_milestone_get',
            description: 'Get milestone details',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Milestone ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_milestone_update',
            description: 'Update a milestone',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Milestone ID',
                },
                title: {
                  type: 'string',
                  description: 'New milestone title',
                },
                description: {
                  type: 'string',
                  description: 'New milestone description',
                },
                due_on: {
                  type: 'string',
                  description: 'New due date (ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ)',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed'],
                  description: 'New state',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_milestone_delete',
            description: 'Delete a milestone',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Milestone ID',
                },
              },
              required: ['id'],
            },
          },

          // ========== 用户/组织管理工具 ==========
          {
            name: 'gitea_user_get',
            description: 'Get user information',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Username to lookup',
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'gitea_user_orgs',
            description: 'List user organizations',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Username (current user if not provided)',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_org_get',
            description: 'Get organization information',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
              },
              required: ['org'],
            },
          },
          {
            name: 'gitea_org_members',
            description: 'List organization members',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
              required: ['org'],
            },
          },

          // ========== Wiki 管理工具 ==========
          {
            name: 'gitea_wiki_list',
            description: 'List all wiki pages in a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (uses context if not provided)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name (uses context if not provided)',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_wiki_get',
            description: 'Get wiki page content by name',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (uses context if not provided)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name (uses context if not provided)',
                },
                pageName: {
                  type: 'string',
                  description: 'Wiki page name (e.g., "Home", "API-Guide")',
                },
              },
              required: ['pageName'],
            },
          },
          {
            name: 'gitea_wiki_create',
            description: 'Create a new wiki page',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (uses context if not provided)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name (uses context if not provided)',
                },
                title: {
                  type: 'string',
                  description: 'Page title',
                },
                content: {
                  type: 'string',
                  description: 'Page content in Markdown format',
                },
                message: {
                  type: 'string',
                  description: 'Commit message (optional)',
                },
              },
              required: ['title', 'content'],
            },
          },
          {
            name: 'gitea_wiki_update',
            description: 'Update an existing wiki page',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (uses context if not provided)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name (uses context if not provided)',
                },
                pageName: {
                  type: 'string',
                  description: 'Wiki page name to update',
                },
                title: {
                  type: 'string',
                  description: 'New page title (optional)',
                },
                content: {
                  type: 'string',
                  description: 'New page content (optional)',
                },
                message: {
                  type: 'string',
                  description: 'Commit message (optional)',
                },
              },
              required: ['pageName'],
            },
          },
          {
            name: 'gitea_wiki_delete',
            description: 'Delete a wiki page',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (uses context if not provided)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name (uses context if not provided)',
                },
                pageName: {
                  type: 'string',
                  description: 'Wiki page name to delete',
                },
              },
              required: ['pageName'],
            },
          },
          {
            name: 'gitea_wiki_revisions',
            description: 'Get revision history of a wiki page',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (uses context if not provided)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name (uses context if not provided)',
                },
                pageName: {
                  type: 'string',
                  description: 'Wiki page name',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
              required: ['pageName'],
            },
          },
          {
            name: 'gitea_wiki_get_revision',
            description: 'Get specific revision content of a wiki page',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (uses context if not provided)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name (uses context if not provided)',
                },
                pageName: {
                  type: 'string',
                  description: 'Wiki page name',
                },
                revision: {
                  type: 'string',
                  description: 'Git commit SHA',
                },
              },
              required: ['pageName', 'revision'],
            },
          },
          {
            name: 'gitea_wiki_search',
            description: 'Search wiki pages by title or name',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (uses context if not provided)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name (uses context if not provided)',
                },
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                limit: {
                  type: 'number',
                  description: 'Max results (default: 10)',
                },
              },
              required: ['query'],
            },
          },

          // ========== 团队管理工具 ==========
          {
            name: 'gitea_team_create',
            description: 'Create a new team in an organization',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                name: {
                  type: 'string',
                  description: 'Team name',
                },
                description: {
                  type: 'string',
                  description: 'Team description (optional)',
                },
                permission: {
                  type: 'string',
                  enum: ['read', 'write', 'admin'],
                  description: 'Team permission level (default: read)',
                },
                can_create_org_repo: {
                  type: 'boolean',
                  description: 'Whether team members can create repos (default: false)',
                },
                includes_all_repositories: {
                  type: 'boolean',
                  description: 'Whether team has access to all repos (default: false)',
                },
              },
              required: ['org', 'name'],
            },
          },
          {
            name: 'gitea_team_list',
            description: 'List all teams in an organization',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
              required: ['org'],
            },
          },
          {
            name: 'gitea_team_get',
            description: 'Get team details',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_team_update',
            description: 'Update team information',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
                name: {
                  type: 'string',
                  description: 'New team name (optional)',
                },
                description: {
                  type: 'string',
                  description: 'New team description (optional)',
                },
                permission: {
                  type: 'string',
                  enum: ['read', 'write', 'admin'],
                  description: 'New permission level (optional)',
                },
                can_create_org_repo: {
                  type: 'boolean',
                  description: 'Whether team members can create repos (optional)',
                },
                includes_all_repositories: {
                  type: 'boolean',
                  description: 'Whether team has access to all repos (optional)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_team_delete',
            description: 'Delete a team',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_team_members',
            description: 'List team members',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_team_add_member',
            description: 'Add a member to team',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
                username: {
                  type: 'string',
                  description: 'Username to add',
                },
              },
              required: ['id', 'username'],
            },
          },
          {
            name: 'gitea_team_remove_member',
            description: 'Remove a member from team',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
                username: {
                  type: 'string',
                  description: 'Username to remove',
                },
              },
              required: ['id', 'username'],
            },
          },
          {
            name: 'gitea_team_repos',
            description: 'List repositories accessible by team',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_team_add_repo',
            description: 'Add repository access to team',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
              },
              required: ['id', 'org', 'repo'],
            },
          },
          {
            name: 'gitea_team_remove_repo',
            description: 'Remove repository access from team',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Team ID',
                },
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
              },
              required: ['id', 'org', 'repo'],
            },
          },
          // Access Token Tools
          {
            name: 'gitea_token_create',
            description: 'Create an access token using username and password. The token can be used for API authentication. Note: The full token value is only returned once upon creation.',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Gitea username',
                },
                password: {
                  type: 'string',
                  description: 'Gitea password',
                },
                token_name: {
                  type: 'string',
                  description: 'Name for the new token (e.g., "MCP Client Token")',
                },
                scopes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional: Token scopes/permissions (e.g., ["read:user", "write:repository"])',
                },
              },
              required: ['username', 'password', 'token_name'],
            },
          },
          {
            name: 'gitea_token_list',
            description: 'List access tokens for a user. Note: Only shows token metadata, not the actual token values.',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Gitea username',
                },
                password: {
                  type: 'string',
                  description: 'Optional: User password for Basic Auth. If not provided, uses configured authentication.',
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'gitea_token_delete',
            description: 'Delete an access token',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Gitea username',
                },
                token_id: {
                  type: 'number',
                  description: 'Token ID to delete',
                },
                password: {
                  type: 'string',
                  description: 'Optional: User password for Basic Auth. If not provided, uses configured authentication.',
                },
              },
              required: ['username', 'token_id'],
            },
          },

          // ========== Label 管理工具 ==========
          // Repository Labels
          {
            name: 'gitea_label_repo_create',
            description: 'Create a new label in a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                name: {
                  type: 'string',
                  description: 'Label name',
                },
                color: {
                  type: 'string',
                  description: 'Label color (hex code without #, e.g., "ff0000" for red)',
                },
                description: {
                  type: 'string',
                  description: 'Label description (optional)',
                },
                exclusive: {
                  type: 'boolean',
                  description: 'Whether this label is exclusive (optional)',
                },
                is_archived: {
                  type: 'boolean',
                  description: 'Whether this label is archived (optional)',
                },
              },
              required: ['name', 'color'],
            },
          },
          {
            name: 'gitea_label_repo_list',
            description: 'List all labels in a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_label_repo_get',
            description: 'Get details of a specific repository label',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Label ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_label_repo_update',
            description: 'Update a repository label',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Label ID',
                },
                name: {
                  type: 'string',
                  description: 'New label name (optional)',
                },
                color: {
                  type: 'string',
                  description: 'New label color (optional)',
                },
                description: {
                  type: 'string',
                  description: 'New label description (optional)',
                },
                exclusive: {
                  type: 'boolean',
                  description: 'Whether this label is exclusive (optional)',
                },
                is_archived: {
                  type: 'boolean',
                  description: 'Whether this label is archived (optional)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_label_repo_delete',
            description: 'Delete a repository label',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Label ID',
                },
              },
              required: ['id'],
            },
          },

          // Organization Labels
          {
            name: 'gitea_label_org_create',
            description: 'Create a new label in an organization',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                name: {
                  type: 'string',
                  description: 'Label name',
                },
                color: {
                  type: 'string',
                  description: 'Label color (hex code without #, e.g., "ff0000" for red)',
                },
                description: {
                  type: 'string',
                  description: 'Label description (optional)',
                },
                exclusive: {
                  type: 'boolean',
                  description: 'Whether this label is exclusive (optional)',
                },
                is_archived: {
                  type: 'boolean',
                  description: 'Whether this label is archived (optional)',
                },
              },
              required: ['org', 'name', 'color'],
            },
          },
          {
            name: 'gitea_label_org_list',
            description: 'List all labels in an organization',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
              required: ['org'],
            },
          },
          {
            name: 'gitea_label_org_get',
            description: 'Get details of a specific organization label',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                id: {
                  type: 'number',
                  description: 'Label ID',
                },
              },
              required: ['org', 'id'],
            },
          },
          {
            name: 'gitea_label_org_update',
            description: 'Update an organization label',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                id: {
                  type: 'number',
                  description: 'Label ID',
                },
                name: {
                  type: 'string',
                  description: 'New label name (optional)',
                },
                color: {
                  type: 'string',
                  description: 'New label color (optional)',
                },
                description: {
                  type: 'string',
                  description: 'New label description (optional)',
                },
                exclusive: {
                  type: 'boolean',
                  description: 'Whether this label is exclusive (optional)',
                },
                is_archived: {
                  type: 'boolean',
                  description: 'Whether this label is archived (optional)',
                },
              },
              required: ['org', 'id'],
            },
          },
          {
            name: 'gitea_label_org_delete',
            description: 'Delete an organization label',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                id: {
                  type: 'number',
                  description: 'Label ID',
                },
              },
              required: ['org', 'id'],
            },
          },

          // Issue Label Operations
          {
            name: 'gitea_label_issue_add',
            description: 'Add labels to an issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Issue number',
                },
                labels: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of label IDs to add',
                },
              },
              required: ['index', 'labels'],
            },
          },
          {
            name: 'gitea_label_issue_replace',
            description: 'Replace all labels on an issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Issue number',
                },
                labels: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of label IDs to set (replaces all existing labels)',
                },
              },
              required: ['index', 'labels'],
            },
          },
          {
            name: 'gitea_label_issue_remove',
            description: 'Remove a specific label from an issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Issue number',
                },
                id: {
                  type: 'number',
                  description: 'Label ID to remove',
                },
              },
              required: ['index', 'id'],
            },
          },
          {
            name: 'gitea_label_issue_clear',
            description: 'Clear all labels from an issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                index: {
                  type: 'number',
                  description: 'Issue number',
                },
              },
              required: ['index'],
            },
          },

          // ========== Webhook 管理工具 ==========
          // Repository Webhooks
          {
            name: 'gitea_webhook_repo_create',
            description: 'Create a webhook for a repository. Supports multiple webhook types including Gitea, Discord, Slack, DingTalk, Feishu, WeChatWork, etc.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                type: {
                  type: 'string',
                  enum: ['dingtalk', 'discord', 'gitea', 'gogs', 'msteams', 'slack', 'telegram', 'feishu', 'wechatwork', 'packagist'],
                  description: 'Webhook type',
                },
                config: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      description: 'Webhook URL',
                    },
                    content_type: {
                      type: 'string',
                      description: 'Content type (json or form)',
                    },
                    secret: {
                      type: 'string',
                      description: 'Secret for payload signature (optional)',
                    },
                  },
                  required: ['url', 'content_type'],
                  description: 'Webhook configuration',
                },
                events: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Events to trigger webhook (default: ["push"]). Examples: push, create, delete, pull_request, issues, etc.',
                },
                active: {
                  type: 'boolean',
                  description: 'Whether webhook is active (default: true)',
                },
                branch_filter: {
                  type: 'string',
                  description: 'Branch filter pattern (optional)',
                },
                authorization_header: {
                  type: 'string',
                  description: 'Authorization header value (optional)',
                },
              },
              required: ['type', 'config'],
            },
          },
          {
            name: 'gitea_webhook_repo_list',
            description: 'List all webhooks for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
            },
          },
          {
            name: 'gitea_webhook_repo_get',
            description: 'Get details of a specific repository webhook',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Webhook ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_webhook_repo_update',
            description: 'Update a repository webhook',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Webhook ID',
                },
                config: {
                  type: 'object',
                  description: 'New webhook configuration (optional)',
                },
                events: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'New events list (optional)',
                },
                active: {
                  type: 'boolean',
                  description: 'Whether webhook is active (optional)',
                },
                branch_filter: {
                  type: 'string',
                  description: 'New branch filter (optional)',
                },
                authorization_header: {
                  type: 'string',
                  description: 'New authorization header (optional)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_webhook_repo_delete',
            description: 'Delete a repository webhook',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Webhook ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'gitea_webhook_repo_test',
            description: 'Send a test event to a repository webhook',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner. Uses context if not provided',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name. Uses context if not provided',
                },
                id: {
                  type: 'number',
                  description: 'Webhook ID',
                },
              },
              required: ['id'],
            },
          },

          // Organization Webhooks
          {
            name: 'gitea_webhook_org_create',
            description: 'Create a webhook for an organization',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                type: {
                  type: 'string',
                  enum: ['dingtalk', 'discord', 'gitea', 'gogs', 'msteams', 'slack', 'telegram', 'feishu', 'wechatwork', 'packagist'],
                  description: 'Webhook type',
                },
                config: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      description: 'Webhook URL',
                    },
                    content_type: {
                      type: 'string',
                      description: 'Content type (json or form)',
                    },
                    secret: {
                      type: 'string',
                      description: 'Secret for payload signature (optional)',
                    },
                  },
                  required: ['url', 'content_type'],
                  description: 'Webhook configuration',
                },
                events: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Events to trigger webhook (default: ["push"])',
                },
                active: {
                  type: 'boolean',
                  description: 'Whether webhook is active (default: true)',
                },
                branch_filter: {
                  type: 'string',
                  description: 'Branch filter pattern (optional)',
                },
                authorization_header: {
                  type: 'string',
                  description: 'Authorization header value (optional)',
                },
              },
              required: ['org', 'type', 'config'],
            },
          },
          {
            name: 'gitea_webhook_org_list',
            description: 'List all webhooks for an organization',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 30)',
                },
              },
              required: ['org'],
            },
          },
          {
            name: 'gitea_webhook_org_get',
            description: 'Get details of a specific organization webhook',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                id: {
                  type: 'number',
                  description: 'Webhook ID',
                },
              },
              required: ['org', 'id'],
            },
          },
          {
            name: 'gitea_webhook_org_update',
            description: 'Update an organization webhook',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                id: {
                  type: 'number',
                  description: 'Webhook ID',
                },
                config: {
                  type: 'object',
                  description: 'New webhook configuration (optional)',
                },
                events: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'New events list (optional)',
                },
                active: {
                  type: 'boolean',
                  description: 'Whether webhook is active (optional)',
                },
                branch_filter: {
                  type: 'string',
                  description: 'New branch filter (optional)',
                },
                authorization_header: {
                  type: 'string',
                  description: 'New authorization header (optional)',
                },
              },
              required: ['org', 'id'],
            },
          },
          {
            name: 'gitea_webhook_org_delete',
            description: 'Delete an organization webhook',
            inputSchema: {
              type: 'object',
              properties: {
                org: {
                  type: 'string',
                  description: 'Organization name',
                },
                id: {
                  type: 'number',
                  description: 'Webhook ID',
                },
              },
              required: ['org', 'id'],
            },
          },
        ],
      };
    });

    // 7. 注册 tools/call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.debug({ name, args }, 'Tool call received');

      // 检查是否提供了临时 API token
      const temporaryToken = (args as any)?.api_token as string | undefined;
      let activeClient = giteaClient;
      let activeConfig = config;

      if (temporaryToken) {
        logger.info({ tool: name }, 'Using temporary API token for this request');

        // 创建临时配置，使用提供的 token
        activeConfig = {
          ...config,
          apiToken: temporaryToken,
        };

        // 创建临时 client
        activeClient = new GiteaClient(activeConfig);

        // 从 args 中移除 api_token，避免传递给工具函数
        delete (args as any).api_token;
      }

      // 创建工具上下文（使用 active client）
      const toolsContext = {
        client: activeClient,
        contextManager,
      };

      const tokenToolsContext = {
        config: activeConfig,
      };

      try {
        let result: unknown;

        switch (name) {
          // ========== 初始化和配置工具 ==========
          case 'gitea_init': {
            const typedArgs = args as {
              owner?: string;
              repo?: string;
              gitea_url?: string;
              set_as_default?: boolean;
              force?: boolean;
            };

            // 获取工作目录
            const workingDir = process.cwd();

            // 自动检测 Git 信息
            const gitInfo = detectGitInfo(workingDir);

            // 确定配置参数（优先使用参数，其次使用 Git 检测）
            const owner = typedArgs.owner || gitInfo.owner;
            const repo = typedArgs.repo || gitInfo.repo;
            const giteaUrl = typedArgs.gitea_url || gitInfo.serverUrl || config.baseUrl;
            const setAsDefault = typedArgs.set_as_default !== false; // 默认为 true
            const force = typedArgs.force || false;

            // 验证必需参数
            if (!owner || !repo) {
              throw new Error(
                'Missing required parameters: owner and repo. ' +
                'These can be provided explicitly or auto-detected from Git repository. ' +
                `Auto-detection result: owner=${gitInfo.owner || 'N/A'}, repo=${gitInfo.repo || 'N/A'}`
              );
            }

            // 获取项目配置管理器
            const projectConfig = getProjectConfig(workingDir);

            // 检查是否已存在配置
            if (!force && projectConfig.hasProjectConfig()) {
              result = {
                success: false,
                error: 'Project configuration already exists. Use force=true to overwrite.',
                configPath: projectConfig.getProjectConfigPath(),
              };
              break;
            }

            // 创建项目配置
            const createdConfig = projectConfig.createProjectConfig(
              {
                url: giteaUrl,
                name: giteaUrl.replace(/https?:\/\//, ''),
              },
              {
                owner,
                repo,
              },
              {
                setAsDefaultContext: setAsDefault,
              }
            );

            // 如果设置为默认上下文，更新上下文管理器
            if (setAsDefault) {
              contextManager.setContext({
                owner,
                repo,
              });
            }

            result = {
              success: true,
              message: 'Project configuration initialized successfully',
              filesCreated: [projectConfig.getProjectConfigPath()],
              config: createdConfig,
              detectedInfo: {
                isGitRepo: gitInfo.isGitRepo,
                detectedOwner: gitInfo.owner,
                detectedRepo: gitInfo.repo,
                detectedUrl: gitInfo.serverUrl,
              },
              defaultContext: setAsDefault ? { owner, repo } : null,
            };
            break;
          }

          // ========== 上下文管理工具 ==========
          case 'gitea_context_get': {
            const context = contextManager.getContext();
            result = {
              success: true,
              context: {
                owner: context.owner || null,
                repo: context.repo || null,
                org: context.org || null,
                project: context.project || null,
                summary: contextManager.getSummary(),
              },
            };
            break;
          }

          case 'gitea_context_set': {
            const typedArgs = args as {
              owner?: string;
              repo?: string;
              org?: string;
              project?: number;
            };

            // 验证至少有一个参数
            if (!typedArgs.owner && !typedArgs.repo && !typedArgs.org && !typedArgs.project) {
              throw new Error('At least one parameter (owner, repo, org, project) must be provided');
            }

            contextManager.setContext({
              owner: typedArgs.owner,
              repo: typedArgs.repo,
              org: typedArgs.org,
              project: typedArgs.project,
            });

            const context = contextManager.getContext();
            result = {
              success: true,
              message: 'Context updated successfully',
              context: {
                owner: context.owner || null,
                repo: context.repo || null,
                org: context.org || null,
                project: context.project || null,
                summary: contextManager.getSummary(),
              },
            };
            break;
          }

          case 'gitea_user_current': {
            const user = await giteaClient.getCurrentUser();
            result = {
              success: true,
              user: {
                id: user.id,
                login: user.login,
                full_name: user.full_name,
                email: user.email,
                avatar_url: user.avatar_url,
              },
            };
            break;
          }

          // ========== 仓库管理工具 ==========
          case 'gitea_repo_create':
            result = await RepositoryTools.createRepository(toolsContext, args as any);
            break;

          case 'gitea_repo_get':
            result = await RepositoryTools.getRepository(toolsContext, args as any);
            break;

          case 'gitea_repo_list':
            result = await RepositoryTools.listRepositories(toolsContext, args as any);
            break;

          case 'gitea_repo_delete':
            result = await RepositoryTools.deleteRepository(toolsContext, args as any);
            break;

          case 'gitea_repo_search':
            result = await RepositoryTools.searchRepositories(toolsContext, args as any);
            break;

          // ========== Issue 管理工具 ==========
          case 'gitea_issue_create':
            result = await IssueTools.createIssue(toolsContext, args as any);
            break;

          case 'gitea_issue_get':
            result = await IssueTools.getIssue(toolsContext, args as any);
            break;

          case 'gitea_issue_list':
            result = await IssueTools.listIssues(toolsContext, args as any);
            break;

          case 'gitea_issue_update':
            result = await IssueTools.updateIssue(toolsContext, args as any);
            break;

          case 'gitea_issue_comment':
            result = await IssueTools.commentIssue(toolsContext, args as any);
            break;

          case 'gitea_issue_close':
            result = await IssueTools.closeIssue(toolsContext, args as any);
            break;

          // ========== Pull Request 管理工具 ==========
          case 'gitea_pr_create':
            result = await PullRequestTools.createPullRequest(toolsContext, args as any);
            break;

          case 'gitea_pr_get':
            result = await PullRequestTools.getPullRequest(toolsContext, args as any);
            break;

          case 'gitea_pr_list':
            result = await PullRequestTools.listPullRequests(toolsContext, args as any);
            break;

          case 'gitea_pr_update':
            result = await PullRequestTools.updatePullRequest(toolsContext, args as any);
            break;

          case 'gitea_pr_merge':
            result = await PullRequestTools.mergePullRequest(toolsContext, args as any);
            break;

          case 'gitea_pr_review':
            result = await PullRequestTools.reviewPullRequest(toolsContext, args as any);
            break;

          // ========== Project 管理工具 ==========
          case 'gitea_project_create':
            result = await ProjectTools.createProject(toolsContext, args as any);
            break;

          case 'gitea_project_get':
            result = await ProjectTools.getProject(toolsContext, args as any);
            break;

          case 'gitea_project_list':
            result = await ProjectTools.listProjects(toolsContext, args as any);
            break;

          case 'gitea_project_update':
            result = await ProjectTools.updateProject(toolsContext, args as any);
            break;

          case 'gitea_project_delete':
            result = await ProjectTools.deleteProject(toolsContext, args as any);
            break;

          case 'gitea_project_columns':
            result = await ProjectTools.listProjectColumns(toolsContext, args as any);
            break;

          case 'gitea_project_column_create':
            result = await ProjectTools.createProjectColumn(toolsContext, args as any);
            break;

          case 'gitea_project_add_issue':
            result = await ProjectTools.addIssueToProjectColumn(toolsContext, args as any);
            break;

          // ========== Milestone 管理工具 ==========
          case 'gitea_milestone_create':
            result = await MilestoneTools.createMilestone(args as any, giteaClient, contextManager);
            break;

          case 'gitea_milestone_list':
            result = await MilestoneTools.listMilestones(args as any, giteaClient, contextManager);
            break;

          case 'gitea_milestone_get':
            result = await MilestoneTools.getMilestone(args as any, giteaClient, contextManager);
            break;

          case 'gitea_milestone_update':
            result = await MilestoneTools.updateMilestone(args as any, giteaClient, contextManager);
            break;

          case 'gitea_milestone_delete':
            result = await MilestoneTools.deleteMilestone(args as any, giteaClient, contextManager);
            break;

          // ========== 用户/组织管理工具 ==========
          case 'gitea_user_get':
            result = await UserTools.getUser(toolsContext, args as any);
            break;

          case 'gitea_user_orgs':
            result = await UserTools.listUserOrganizations(toolsContext, args as any);
            break;

          case 'gitea_org_get':
            result = await UserTools.getOrganization(toolsContext, args as any);
            break;

          case 'gitea_org_members':
            result = await UserTools.listOrganizationMembers(toolsContext, args as any);
            break;

          // ========== Wiki 管理工具 ==========
          case 'gitea_wiki_list':
            result = await WikiTools.listWikiPages(toolsContext, args as any);
            break;

          case 'gitea_wiki_get':
            result = await WikiTools.getWikiPage(toolsContext, args as any);
            break;

          case 'gitea_wiki_create':
            result = await WikiTools.createWikiPage(toolsContext, args as any);
            break;

          case 'gitea_wiki_update':
            result = await WikiTools.updateWikiPage(toolsContext, args as any);
            break;

          case 'gitea_wiki_delete':
            result = await WikiTools.deleteWikiPage(toolsContext, args as any);
            break;

          case 'gitea_wiki_revisions':
            result = await WikiTools.getWikiRevisions(toolsContext, args as any);
            break;

          case 'gitea_wiki_get_revision':
            result = await WikiTools.getWikiPageRevision(toolsContext, args as any);
            break;

          case 'gitea_wiki_search':
            result = await WikiTools.searchWikiPages(toolsContext, args as any);
            break;

          // ========== 团队管理工具 ==========
          case 'gitea_team_create':
            result = await TeamTools.createTeam(toolsContext, args as any);
            break;

          case 'gitea_team_list':
            result = await TeamTools.listTeams(toolsContext, args as any);
            break;

          case 'gitea_team_get':
            result = await TeamTools.getTeam(toolsContext, args as any);
            break;

          case 'gitea_team_update':
            result = await TeamTools.updateTeam(toolsContext, args as any);
            break;

          case 'gitea_team_delete':
            result = await TeamTools.deleteTeam(toolsContext, args as any);
            break;

          case 'gitea_team_members':
            result = await TeamTools.listTeamMembers(toolsContext, args as any);
            break;

          case 'gitea_team_add_member':
            result = await TeamTools.addTeamMember(toolsContext, args as any);
            break;

          case 'gitea_team_remove_member':
            result = await TeamTools.removeTeamMember(toolsContext, args as any);
            break;

          case 'gitea_team_repos':
            result = await TeamTools.listTeamRepos(toolsContext, args as any);
            break;

          case 'gitea_team_add_repo':
            result = await TeamTools.addTeamRepo(toolsContext, args as any);
            break;

          case 'gitea_team_remove_repo':
            result = await TeamTools.removeTeamRepo(toolsContext, args as any);
            break;

          // Access Token Tools
          case 'gitea_token_create':
            result = await TokenTools.createTokenWithPassword(tokenToolsContext, args as any);
            break;

          case 'gitea_token_list':
            result = await TokenTools.listTokens(tokenToolsContext, args as any);
            break;

          case 'gitea_token_delete':
            result = await TokenTools.deleteToken(tokenToolsContext, args as any);
            break;

          // Label Management Tools
          // Repository Labels
          case 'gitea_label_repo_create':
            result = await LabelTools.createRepoLabel(toolsContext, args as any);
            break;

          case 'gitea_label_repo_list':
            result = await LabelTools.listRepoLabels(toolsContext, args as any);
            break;

          case 'gitea_label_repo_get':
            result = await LabelTools.getRepoLabel(toolsContext, args as any);
            break;

          case 'gitea_label_repo_update':
            result = await LabelTools.updateRepoLabel(toolsContext, args as any);
            break;

          case 'gitea_label_repo_delete':
            result = await LabelTools.deleteRepoLabel(toolsContext, args as any);
            break;

          // Organization Labels
          case 'gitea_label_org_create':
            result = await LabelTools.createOrgLabel(toolsContext, args as any);
            break;

          case 'gitea_label_org_list':
            result = await LabelTools.listOrgLabels(toolsContext, args as any);
            break;

          case 'gitea_label_org_get':
            result = await LabelTools.getOrgLabel(toolsContext, args as any);
            break;

          case 'gitea_label_org_update':
            result = await LabelTools.updateOrgLabel(toolsContext, args as any);
            break;

          case 'gitea_label_org_delete':
            result = await LabelTools.deleteOrgLabel(toolsContext, args as any);
            break;

          // Issue Label Operations
          case 'gitea_label_issue_add':
            result = await LabelTools.addIssueLabels(toolsContext, args as any);
            break;

          case 'gitea_label_issue_replace':
            result = await LabelTools.replaceIssueLabels(toolsContext, args as any);
            break;

          case 'gitea_label_issue_remove':
            result = await LabelTools.removeIssueLabel(toolsContext, args as any);
            break;

          case 'gitea_label_issue_clear':
            result = await LabelTools.clearIssueLabels(toolsContext, args as any);
            break;

          // Webhook Management Tools
          // Repository Webhooks
          case 'gitea_webhook_repo_create':
            result = await WebhookTools.createRepoWebhook(toolsContext, args as any);
            break;

          case 'gitea_webhook_repo_list':
            result = await WebhookTools.listRepoWebhooks(toolsContext, args as any);
            break;

          case 'gitea_webhook_repo_get':
            result = await WebhookTools.getRepoWebhook(toolsContext, args as any);
            break;

          case 'gitea_webhook_repo_update':
            result = await WebhookTools.updateRepoWebhook(toolsContext, args as any);
            break;

          case 'gitea_webhook_repo_delete':
            result = await WebhookTools.deleteRepoWebhook(toolsContext, args as any);
            break;

          case 'gitea_webhook_repo_test':
            result = await WebhookTools.testRepoWebhook(toolsContext, args as any);
            break;

          // Organization Webhooks
          case 'gitea_webhook_org_create':
            result = await WebhookTools.createOrgWebhook(toolsContext, args as any);
            break;

          case 'gitea_webhook_org_list':
            result = await WebhookTools.listOrgWebhooks(toolsContext, args as any);
            break;

          case 'gitea_webhook_org_get':
            result = await WebhookTools.getOrgWebhook(toolsContext, args as any);
            break;

          case 'gitea_webhook_org_update':
            result = await WebhookTools.updateOrgWebhook(toolsContext, args as any);
            break;

          case 'gitea_webhook_org_delete':
            result = await WebhookTools.deleteOrgWebhook(toolsContext, args as any);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error({ error, name, args }, 'Tool call failed');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: error instanceof Error ? error.message : String(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });

    // 8. 启动 MCP Server（使用 stdio transport）
    logger.info('Starting MCP Server with stdio transport...');
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info(
      {
        user: currentUser.login,
        baseUrl: config.baseUrl,
        context: contextManager.getSummary(),
      },
      'MCP Server started successfully'
    );

    // 输出启动信息到 stderr（stdout 用于 MCP 通信）
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║                                                            ║');
    console.error('║  ✅  Gitea Service MCP Server                              ║');
    console.error('║                                                            ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error(`👤 User:       ${currentUser.login} (${currentUser.full_name})`);
    console.error(`🌐 Gitea:      ${config.baseUrl}`);
    console.error(`📂 Context:    ${contextManager.getSummary()}`);
    console.error('');
    console.error('📌 Registered capabilities:');
    console.error('');
    console.error('🔧 Tools (44):');
    console.error('  ✓ Context Management (3):');
    console.error('    - gitea_context_get/set, gitea_user_current');
    console.error('  ✓ Repository Management (5):');
    console.error('    - gitea_repo_create/get/list/delete/search');
    console.error('  ✓ Issue Management (6):');
    console.error('    - gitea_issue_create/get/list/update/comment/close');
    console.error('  ✓ Pull Request Management (6):');
    console.error('    - gitea_pr_create/get/list/update/merge/review');
    console.error('  ✓ Project Management (8):');
    console.error('    - gitea_project_create/get/list/update/delete');
    console.error('    - gitea_project_columns, gitea_project_column_create');
    console.error('    - gitea_project_add_issue');
    console.error('  ✓ Milestone Management (5):');
    console.error('    - gitea_milestone_create/get/list/update/delete');
    console.error('  ✓ User/Organization Management (4):');
    console.error('    - gitea_user_get, gitea_user_orgs');
    console.error('    - gitea_org_get, gitea_org_members');
    console.error('  ✓ Wiki Management (8): 🆕');
    console.error('    - gitea_wiki_list/get/create/update/delete');
    console.error('    - gitea_wiki_revisions/get_revision/search');
    console.error('');
    console.error('💡 Phase 4 Wiki 功能已就绪 - 共 44 个工具');
    console.error('');
  } catch (error) {
    logger.error({ error }, 'Failed to start MCP Server');
    console.error('');
    console.error('❌ Failed to start Gitea Service MCP Server');
    console.error('');
    if (error instanceof Error) {
      console.error(error.message);
    }
    console.error('');
    process.exit(1);
  }
}

// 启动服务
main();
