/**
 * CI/CD Tools Registry
 * CI/CD 配置管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as CICDTools from '../tools/cicd.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:cicd');

/**
 * 注册所有 CI/CD 管理工具
 */
export function registerCICDTools(mcpServer: McpServer, ctx: ToolContext) {
  // gitea_cicd_init - 初始化 CI/CD 配置
  mcpServer.registerTool(
    'gitea_cicd_init',
    {
      title: '初始化 CI/CD 配置',
      description:
        'Initialize CI/CD configuration for a project. Supports Gitea Actions and GitHub Actions. Creates workflow files for CI checks, beta publishing, and release publishing.',
      inputSchema: z.object({
        platform: z
          .enum(['gitea', 'github'])
          .optional()
          .describe('CI platform (gitea/github). Auto-detected from Git remote if not provided.'),
        template: z
          .enum(['nodejs', 'go', 'python', 'rust', 'docker'])
          .optional()
          .describe('Project template type. Auto-detected if not provided.'),
        main_branch: z.string().optional().describe('Main branch name for releases (default: main)'),
        dev_branch: z.string().optional().describe('Development branch name for beta releases (default: dev)'),
        force: z.boolean().optional().describe('Force overwrite existing configuration (default: false)'),
      }),
    },
    async (args) => {
      try {
        const workingDir = process.cwd();

        // 检测平台和项目类型
        let platform = args.platform;
        let template = args.template;

        if (!platform) {
          const status = CICDTools.getCICDStatus(workingDir);
          platform = status.remoteInfo?.platform || 'gitea';
        }

        if (!template) {
          template = CICDTools.detectProjectType(workingDir) || 'nodejs';
        }

        const result = await CICDTools.initCICD(
          {
            platform,
            template,
            mainBranch: args.main_branch || 'main',
            devBranch: args.dev_branch || 'dev',
            force: args.force || false,
          },
          workingDir
        );

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.success,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // gitea_cicd_templates - 列出可用模板
  mcpServer.registerTool(
    'gitea_cicd_templates',
    {
      title: '列出 CI/CD 模板',
      description:
        'List available CI/CD templates. Includes templates for Node.js, Go, Python, Rust, and Docker projects.',
      inputSchema: z.object({
        platform: z.enum(['gitea', 'github']).optional().describe('Filter by CI platform'),
      }),
    },
    async (args) => {
      try {
        const templates = CICDTools.listTemplates(args.platform);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  templates: templates.map((t) => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    platforms: t.platforms,
                    files: t.files,
                  })),
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
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // gitea_cicd_status - 查看 CI/CD 状态
  mcpServer.registerTool(
    'gitea_cicd_status',
    {
      title: '查看 CI/CD 状态',
      description:
        'Get the current CI/CD configuration status for a project. Shows workflow files, branches, and remote info.',
    },
    async () => {
      try {
        const workingDir = process.cwd();
        const status = CICDTools.getCICDStatus(workingDir);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  status,
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
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // gitea_cicd_validate - 验证 CI/CD 配置
  mcpServer.registerTool(
    'gitea_cicd_validate',
    {
      title: '验证 CI/CD 配置',
      description:
        'Validate the CI/CD configuration for a project. Checks workflow files, branches, and required files.',
    },
    async () => {
      try {
        const workingDir = process.cwd();
        const result = CICDTools.validateCICDConfig(workingDir);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: result.valid,
                  validation: result,
                },
                null,
                2
              ),
            },
          ],
          isError: !result.valid,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  logger.info('Registered 4 CI/CD tools');
}
