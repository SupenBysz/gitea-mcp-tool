#!/usr/bin/env node

/**
 * Gitea MCP Server v2.0 - 智能工具精简版
 *
 * MCP 2.0 架构：精简工具 + CLI 混合模式
 * - MCP 工具: ~15 个智能分析/生成工具（优化 Context 消耗）
 * - keactl CLI: 完整 CRUD 操作（200+ 命令）
 *
 * 支持的 MCP 客户端:
 * - Claude Desktop / Claude CLI
 * - OpenCode / Codex CLI
 * - Cline / Continue
 * - 其他符合 MCP 规范的客户端
 *
 * CRUD 操作请使用 keactl CLI:
 * - keactl repo/issue/pr/branch/release/wiki/project/workflow/cicd
 * - 详见: https://github.com/SupenBysz/gitea-mcp-tool#keactl-cli
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createLogger } from './logger.js';
import { loadConfig, validateConfig } from './config.js';
import { GiteaClient } from './gitea-client.js';
import { ContextManager } from './context-manager.js';
import { getProjectConfig } from './config/project.js';
import { detectGitInfo } from './utils/git-detector.js';
// MCP 2.0: 只保留智能工具的 registry
// CRUD 操作请使用 keactl CLI
import { registerIssueTools } from './tools-registry/issue-registry.js';
import { registerPullRequestTools } from './tools-registry/pr-registry.js';
import { registerWorkflowTools } from './tools-registry/workflow-registry.js';
import { registerComplianceTools } from './tools-registry/compliance-registry.js';
import { registerAllPrompts } from './mcp-prompts/index.js';

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
    const config = loadConfig();
    validateConfig(config);

    // 2. 创建 Gitea Client
    logger.info({ baseUrl: config.baseUrl }, 'Connecting to Gitea...');
    const giteaClient = new GiteaClient(config);

    // 3. 异步测试连接（不阻塞启动）
    logger.info('Gitea client initialized, connection will be tested on first use');
    // 在后台测试连接，不等待结果
    giteaClient.testConnection().then((connected) => {
      if (connected) {
        giteaClient.getCurrentUser().then((user) => {
          logger.info({ user: user.login }, 'Connected to Gitea successfully');
        }).catch((err) => {
          logger.warn({ error: err.message }, 'Failed to get current user info');
        });
      } else {
        logger.warn('Failed to connect to Gitea server, tools will fail until connection is established');
      }
    }).catch((err) => {
      logger.warn({ error: err.message }, 'Failed to test Gitea connection');
    });

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

    // 6. 注册工具 (MCP 2.0: 精简为 ~15 个智能工具)
    // CRUD 操作请使用 keactl CLI: https://github.com/SupenBysz/gitea-mcp-tool#keactl-cli
    logger.info('Registering MCP 2.0 smart tools...');

    // 基础工具 (4个): gitea_init, gitea_mcp_upgrade, gitea_context_get/set, gitea_user_current
    registerInitTools(mcpServer, toolContext);
    registerContextTools(mcpServer, toolContext);
    registerUserTools(mcpServer, toolContext);

    // 智能内容生成 (2个): gitea_issue_create, gitea_pr_create
    // TODO: #74 将精简这些 registry，只保留 create 工具
    registerIssueTools(mcpServer, toolContext);
    registerPullRequestTools(mcpServer, toolContext);

    // 工作流智能分析 (5个): infer_labels, check_issues, check_blocked, escalate_priority, generate_report
    registerWorkflowTools(mcpServer, toolContext);

    // 规范检查 (5个): check_branch, check_commit, check_pr, check_all, init
    registerComplianceTools(mcpServer, toolContext);

    // 7. 注册 Prompts
    logger.info('Registering prompts...');
    registerPrompts(mcpServer, toolContext);

    // 8. 连接到 stdio transport
    logger.info('Connecting to stdio transport...');
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);

    logger.info('Gitea MCP Server v2.0 is running');
    logger.info({
      version: '2.0.0',
      architecture: 'MCP Lite + CLI Hybrid',
      mcpTools: '~15 smart tools',
      cliCommands: '200+ via keactl',
      capabilities: ['tools', 'prompts', 'elicitation'],
    });
  } catch (error) {
    logger.error({ error, stack: error instanceof Error ? error.stack : undefined, message: error instanceof Error ? error.message : String(error) }, 'Failed to start server');
    console.error('Detailed error:', error);
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

  // gitea_mcp_upgrade - MCP 工具升级
  mcpServer.registerTool(
    'gitea_mcp_upgrade',
    {
      title: '升级 MCP 工具',
      description:
        'Upgrade Gitea MCP tool to the latest version. Downloads and installs from the latest release.',
      inputSchema: z.object({
        auto_confirm: z
          .boolean()
          .optional()
          .describe('Auto confirm the upgrade without prompting (default: false)'),
      }),
    },
    async (args) => {
      logger.debug({ args }, 'gitea_mcp_upgrade called');

      try {
        const fs = await import('fs');
        const path = await import('path');
        const { execSync } = await import('child_process');

        // 读取当前版本
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        let currentVersion = '1.2.0'; // 默认版本

        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          currentVersion = packageJson.version;
        }

        // 如果没有自动确认，使用 elicitation 询问用户
        if (!args.auto_confirm) {
          const result = await ctx.server.server.elicitInput({
            message: `当前版本: v${currentVersion}\n\n是否要升级到最新版本？\n\n升级过程将：\n1. 下载最新版本的发布包\n2. 安装到 ~/.gitea-mcp 目录\n3. 自动安装依赖\n\n注意：升级过程中需要保证网络连接稳定。`,
            requestedSchema: {
              type: 'object',
              properties: {
                confirm: {
                  type: 'boolean',
                  title: '确认升级',
                  description: '是否继续升级？',
                  default: false,
                },
              },
              required: ['confirm'],
            },
          });

          if (result.action !== 'accept' || !result.content?.confirm) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Upgrade cancelled by user',
                },
              ],
            };
          }
        }

        // 执行升级
        const installScriptUrl =
          'https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh';

        logger.info('Downloading and executing upgrade script...');

        // 下载并执行安装脚本
        const command = `bash -c "$(curl -fsSL ${installScriptUrl})"`;

        const output = execSync(command, {
          encoding: 'utf-8',
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Upgrade completed successfully',
                  currentVersion: `v${currentVersion}`,
                  output: output.substring(0, 1000), // 限制输出长度
                  note: 'Please restart your MCP client to use the new version',
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, 'Failed to upgrade MCP tool');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: errorMessage,
                  message: 'Upgrade failed',
                  fallback: 'You can manually upgrade by running: bash <(curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh)',
                },
                null,
                2
              ),
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
  // Register core prompts from prompt modules
  logger.info('Registering prompts...');
  registerAllPrompts({ server: mcpServer });
  logger.info('Prompts registered successfully');

  // Legacy prompts have been moved to src/prompts/ modules
  // Only 3 core prompts are now registered:
  // - gitea-mcp-tool:配置连接 (from init-prompts.ts)
  // - gitea-mcp-tool:创建Issue (from issue-prompts.ts)
  // - gitea-mcp-tool:创建PR (from pr-prompts.ts)
}

// 全局错误兜底，防止未捕获异常导致 MCP 连接被关闭（Transport closed）
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
});
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

// 启动服务器
main();
