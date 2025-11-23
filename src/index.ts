#!/usr/bin/env node

/**
 * Gitea Service MCP Server (McpServer API版本)
 *
 * 通用 MCP 服务器，支持所有符合 MCP 规范的客户端
 * - Claude Desktop
 * - Claude CLI (支持 Prompts 和 Elicitation)
 * - Cline (VSCode)
 * - Continue (VSCode/JetBrains)
 * - 其他 MCP 客户端
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createLogger } from './logger.js';
import { loadConfigFromEnv, validateConfig } from './config.js';
import { GiteaClient } from './gitea-client.js';
import { ContextManager } from './context-manager.js';
import { getProjectConfig } from './config/project.js';
import { detectGitInfo } from './utils/git-detector.js';
import { registerRepositoryTools } from './tools-registry/repository-registry.js';
import { registerIssueTools } from './tools-registry/issue-registry.js';
import { registerPullRequestTools } from './tools-registry/pr-registry.js';
import { registerMilestoneTools } from './tools-registry/milestone-registry.js';
import { registerOrganizationTools } from './tools-registry/org-registry.js';
import { registerUserTools as registerUserExtendedTools } from './tools-registry/user-registry.js';
import { registerTokenTools } from './tools-registry/token-registry.js';
import { registerProjectTools } from './tools-registry/project-registry.js';
import { registerWikiTools } from './tools-registry/wiki-registry.js';
import { registerTeamTools } from './tools-registry/team-registry.js';
import { registerLabelTools } from './tools-registry/label-registry.js';
import { registerWebhookTools } from './tools-registry/webhook-registry.js';
import { registerReleaseTools } from './tools-registry/release-registry.js';
import { registerBranchTools } from './tools-registry/branch-registry.js';
import { registerContentsTools } from './tools-registry/contents-registry.js';
import { registerCommitTools } from './tools-registry/commit-registry.js';
import { registerTagTools } from './tools-registry/tag-registry.js';
import { registerNotificationTools } from './tools-registry/notification-registry.js';
import { registerCollaboratorTools } from './tools-registry/collaborator-registry.js';
import { registerActionTools } from './tools-registry/action-registry.js';
import { registerSSHKeyTools } from './tools-registry/ssh-key-registry.js';
import { registerDeployKeyTools } from './tools-registry/deploy-key-registry.js';
import { registerGPGKeyTools } from './tools-registry/gpg-key-registry.js';
import { registerStarredTools } from './tools-registry/starred-registry.js';
import { registerFollowingTools } from './tools-registry/following-registry.js';
import { registerTopicsTools } from './tools-registry/topics-registry.js';
import { registerPackageTools } from './tools-registry/package-registry.js';
import { registerAdminTools } from './tools-registry/admin-registry.js';

const logger = createLogger('mcp-server');

/**
 * 工具上下文接口
 */
export interface ToolContext {
  client: GiteaClient;
  contextManager: ContextManager;
  server: McpServer;
}

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('Starting Gitea Service MCP Server (McpServer API)...');

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

    // 5. 创建 McpServer
    logger.info('Creating MCP Server with McpServer API...');
    const mcpServer = new McpServer(
      {
        name: 'gitea-mcp-tool',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          // elicitation 会在客户端支持时自动启用
        },
      }
    );

    // 创建工具上下文
    const toolContext: ToolContext = {
      client: giteaClient,
      contextManager,
      server: mcpServer,
    };

    // 6. 注册工具
    logger.info('Registering tools...');
    registerInitTools(mcpServer, toolContext);
    registerContextTools(mcpServer, toolContext);
    registerUserTools(mcpServer, toolContext);
    registerRepositoryTools(mcpServer, toolContext);
    registerIssueTools(mcpServer, toolContext);
    registerPullRequestTools(mcpServer, toolContext);
    registerMilestoneTools(mcpServer, toolContext);
    registerUserExtendedTools(mcpServer, toolContext);
    registerOrganizationTools(mcpServer, toolContext);
    registerTokenTools(mcpServer, toolContext);
    registerProjectTools(mcpServer, toolContext);
    registerWikiTools(mcpServer, toolContext);
    registerTeamTools(mcpServer, toolContext);
    registerLabelTools(mcpServer, toolContext);
    registerWebhookTools(mcpServer, toolContext);
    registerReleaseTools(mcpServer, toolContext);
    registerBranchTools(mcpServer, toolContext);
    registerContentsTools(mcpServer, toolContext);
    registerCommitTools(mcpServer, toolContext);
    registerTagTools(mcpServer, toolContext);
    registerNotificationTools(mcpServer, toolContext);
    registerCollaboratorTools(mcpServer, toolContext);
    registerActionTools(mcpServer, toolContext);
    registerSSHKeyTools(mcpServer, toolContext);
    registerDeployKeyTools(mcpServer, toolContext);
    registerGPGKeyTools(mcpServer, toolContext);
    registerStarredTools(mcpServer, toolContext);
    registerFollowingTools(mcpServer, toolContext);
    registerTopicsTools(mcpServer, toolContext);
    registerPackageTools(mcpServer, toolContext);
    registerAdminTools(mcpServer, toolContext);

    // 7. 注册 Prompts
    logger.info('Registering prompts...');
    registerPrompts(mcpServer, toolContext);

    // 8. 连接到 stdio transport
    logger.info('Connecting to stdio transport...');
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);

    logger.info('Gitea Service MCP Server is running');
    logger.info({
      version: '1.0.0',
      api: 'McpServer',
      capabilities: ['tools', 'prompts', 'elicitation'],
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * 注册初始化和配置工具
 */
function registerInitTools(mcpServer: McpServer, ctx: ToolContext) {
  // gitea_init - 项目配置初始化
  mcpServer.registerTool(
    'gitea_init',
    {
      title: '初始化项目配置',
      description:
        'Initialize project configuration files (.gitea-mcp.json). Auto-detects Git repository info if available.',
      inputSchema: z.object({
        owner: z
          .string()
          .optional()
          .describe(
            'Repository owner (username or organization). Auto-detected from Git if not provided.'
          ),
        repo: z
          .string()
          .optional()
          .describe('Repository name. Auto-detected from Git if not provided.'),
        gitea_url: z
          .string()
          .optional()
          .describe('Gitea server URL. Auto-detected from Git remote if not provided.'),
        set_as_default: z
          .boolean()
          .optional()
          .describe('Set this repository as default context (default: true)'),
        force: z
          .boolean()
          .optional()
          .describe('Force overwrite existing configuration (default: false)'),
      }),
    },
    async (args) => {
      logger.debug({ args }, 'gitea_init called');

      try {
        // 获取工作目录
        const workingDir = process.cwd();

        // 自动检测 Git 信息
        const gitInfo = detectGitInfo(workingDir);

        // 如果自动检测失败且没有提供参数，使用 elicitation
        if (
          (!args.owner || !args.repo) &&
          (!gitInfo.owner || !gitInfo.repo)
        ) {
          // 使用 elicitation 请求用户输入
          const result = await ctx.server.server.elicitInput({
            message: '无法自动检测仓库信息，请手动输入：',
            requestedSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  title: '仓库所有者',
                  description: '用户名或组织名',
                },
                repo: {
                  type: 'string',
                  title: '仓库名称',
                  description: '仓库的名称',
                },
                gitea_url: {
                  type: 'string',
                  title: 'Gitea 服务器 URL',
                  description: 'Gitea 服务器地址',
                  default: ctx.client['config'].baseUrl,
                },
                set_as_default: {
                  type: 'boolean',
                  title: '设为默认上下文',
                  description: '是否将此仓库设为默认上下文',
                  default: true,
                },
              },
              required: ['owner', 'repo'],
            },
          });

          if (result.action !== 'accept') {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Configuration initialization cancelled by user',
                },
              ],
            };
          }

          // 使用用户输入的数据
          args = {
            ...args,
            owner: (result.content?.owner as string) || args.owner,
            repo: (result.content?.repo as string) || args.repo,
            gitea_url: (result.content?.gitea_url as string) || args.gitea_url,
            set_as_default:
              (result.content?.set_as_default as boolean) ?? args.set_as_default,
          };
        }

        // 确定配置参数（优先使用参数，其次使用 Git 检测）
        const owner = args.owner || gitInfo.owner;
        const repo = args.repo || gitInfo.repo;
        const giteaUrl = args.gitea_url || gitInfo.serverUrl || ctx.client['config'].baseUrl;
        const setAsDefault = args.set_as_default !== false; // 默认为 true
        const force = args.force || false;

        // 验证必需参数
        if (!owner || !repo) {
          return {
            content: [
              {
                type: 'text',
                text: `Missing required parameters: owner and repo. Auto-detection result: owner=${gitInfo.owner || 'N/A'}, repo=${gitInfo.repo || 'N/A'}`,
              },
            ],
            isError: true,
          };
        }

        // 获取项目配置管理器
        const projectConfig = getProjectConfig(workingDir);

        // 检查是否已存在配置
        if (!force && projectConfig.hasProjectConfig()) {
          return {
            content: [
              {
                type: 'text',
                text: `Project configuration already exists at ${projectConfig.getProjectConfigPath()}. Use force=true to overwrite.`,
              },
            ],
            isError: true,
          };
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
          ctx.contextManager.setContext({
            owner,
            repo,
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
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
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, 'Failed to initialize configuration');
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * 注册上下文管理工具
 */
function registerContextTools(mcpServer: McpServer, ctx: ToolContext) {
  // gitea_context_get - 获取当前上下文
  mcpServer.registerTool(
    'gitea_context_get',
    {
      title: '获取当前上下文',
      description: 'Get current default context (owner, repo, org, project)',
    },
    async (_args: any, _extra: any) => {
      const context = ctx.contextManager.getContext();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(context, null, 2),
          },
        ],
      };
    }
  );

  // gitea_context_set - 设置上下文
  mcpServer.registerTool(
    'gitea_context_set',
    {
      title: '设置默认上下文',
      description: 'Set default context for subsequent operations. All parameters are optional.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Default owner (username or organization)'),
        repo: z.string().optional().describe('Default repository name'),
        org: z.string().optional().describe('Default organization name'),
        project: z.number().optional().describe('Default project ID'),
      }),
    },
    async (args) => {
      const oldContext = ctx.contextManager.getContext();
      ctx.contextManager.setContext(args);
      const newContext = ctx.contextManager.getContext();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: 'Context updated successfully',
                oldContext,
                newContext,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

/**
 * 注册用户工具
 */
function registerUserTools(mcpServer: McpServer, ctx: ToolContext) {
  // gitea_user_current - 获取当前用户
  mcpServer.registerTool(
    'gitea_user_current',
    {
      title: '获取当前用户',
      description: 'Get information about the currently authenticated user',
    },
    async (_args: any, _extra: any) => {
      try {
        const user = await ctx.client.getCurrentUser();
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  id: user.id,
                  login: user.login,
                  full_name: user.full_name,
                  email: user.email,
                  avatar_url: user.avatar_url,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * 注册 Prompts（提示模板）
 */
function registerPrompts(mcpServer: McpServer, ctx: ToolContext) {
  // create-issue - 创建 Issue 的提示模板
  mcpServer.registerPrompt(
    'create-issue',
    {
      title: '创建 Issue',
      description: '交互式创建 Gitea Issue 的提示模板',
      argsSchema: {
        owner: z.string().optional().describe('仓库所有者（使用上下文默认值如果未提供）'),
        repo: z.string().optional().describe('仓库名称（使用上下文默认值如果未提供）'),
      },
    },
    async (args) => {
      const owner = ctx.contextManager.resolveOwner(args?.owner);
      const repo = ctx.contextManager.resolveRepo(args?.repo);

      return {
        description: `为 ${owner}/${repo} 创建 Issue`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我在 ${owner}/${repo} 仓库中创建一个新的 Issue。

请按照以下格式提供信息：

**标题**：[简洁明确的标题]

**描述**：
[详细描述问题或需求，包括：
- 当前行为
- 期望行为
- 重现步骤（如果是 Bug）
- 相关截图或日志（如果有）]

**标签**：[可选，如 bug, enhancement, documentation 等]

**优先级**：[可选，如 低/中/高]

**指派给**：[可选，用户名]

请根据实际情况填写上述信息，我会使用 gitea_issue_create 工具创建 Issue。`,
            },
          },
        ],
      };
    }
  );

  // create-pr - 创建 Pull Request 的提示模板
  mcpServer.registerPrompt(
    'create-pr',
    {
      title: '创建 Pull Request',
      description: '交互式创建 Gitea Pull Request 的提示模板',
      argsSchema: {
        owner: z.string().optional().describe('仓库所有者'),
        repo: z.string().optional().describe('仓库名称'),
        from_branch: z.string().describe('源分支名称'),
        to_branch: z.string().optional().describe('目标分支名称（默认：main）'),
      },
    },
    async (args) => {
      const owner = ctx.contextManager.resolveOwner(args?.owner);
      const repo = ctx.contextManager.resolveRepo(args?.repo);
      const fromBranch = args?.from_branch || '<源分支>';
      const toBranch = args?.to_branch || 'main';

      return {
        description: `从 ${fromBranch} 到 ${toBranch} 的 Pull Request`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我在 ${owner}/${repo} 仓库中创建一个 Pull Request。

**仓库**：${owner}/${repo}
**源分支**：${fromBranch}
**目标分支**：${toBranch}

请提供以下信息：

**标题**：[简洁明确的 PR 标题]

**描述**：
[详细描述本次变更，包括：
- 变更内容概述
- 解决的问题或实现的功能
- 技术方案说明
- 测试情况
- 相关 Issue（如果有）]

**审查者**：[可选，指定审查者的用户名]

我会先使用 gitea_repo_compare 查看代码差异，然后使用 gitea_pr_create 创建 PR。`,
            },
          },
        ],
      };
    }
  );

  // review-pr - 审查 Pull Request 的提示模板
  mcpServer.registerPrompt(
    'review-pr',
    {
      title: '审查 Pull Request',
      description: '交互式审查 Gitea Pull Request 的提示模板',
      argsSchema: {
        owner: z.string().optional().describe('仓库所有者'),
        repo: z.string().optional().describe('仓库名称'),
        pr_number: z.string().describe('Pull Request 编号'),
      },
    },
    async (args) => {
      const owner = ctx.contextManager.resolveOwner(args?.owner);
      const repo = ctx.contextManager.resolveRepo(args?.repo);
      const prNumber = args?.pr_number || '<PR编号>';

      return {
        description: `审查 PR #${prNumber}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我审查 ${owner}/${repo} 仓库中的 Pull Request #${prNumber}。

我需要你：

1. 使用 gitea_pr_get 获取 PR 详情
2. 分析代码变更内容
3. 检查以下方面：
   - 代码质量和规范
   - 潜在的问题或 Bug
   - 性能影响
   - 安全性考虑
   - 测试覆盖
   - 文档完整性

4. 提供审查意见：
   - ✅ 批准（approve）- 代码质量好，可以合并
   - 💬 评论（comment）- 提出建议但不阻止合并
   - ❌ 请求修改（request_changes）- 必须修改后才能合并

请使用 gitea_pr_review 工具提交你的审查意见。`,
            },
          },
        ],
      };
    }
  );

  logger.info('Registered 3 prompts: create-issue, create-pr, review-pr');
}

// 启动服务器
main();
