/**
 * Compliance 规范检查工具注册
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as ComplianceTools from '../tools/compliance.js';
import { ToolContext } from '../types.js';

/** Token 参数 Schema */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');

export function registerComplianceTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. 检查分支命名
  mcpServer.registerTool(
    'gitea_compliance_check_branch',
    {
      title: '检查分支命名规范',
      description: 'Check if branch name complies with naming conventions. Returns compliance status and suggestions.',
      inputSchema: z.object({
        branch: z.string().min(1).describe('Branch name to check'),
        config_path: z.string().optional().describe('Path to compliance config file (.gitea/compliance.yaml)'),
      }),
    },
    async (args) => {
      try {
        const result = await ComplianceTools.checkBranch(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. 检查提交信息
  mcpServer.registerTool(
    'gitea_compliance_check_commit',
    {
      title: '检查提交信息规范',
      description: 'Check if commit message complies with Conventional Commit format. Can check by SHA or message directly.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        sha: z.string().optional().describe('Commit SHA to check (will fetch message from API)'),
        message: z.string().optional().describe('Commit message to check directly'),
        config_path: z.string().optional().describe('Path to compliance config file'),
        token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ComplianceTools.checkCommit(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. 检查 PR 格式
  mcpServer.registerTool(
    'gitea_compliance_check_pr',
    {
      title: '检查 PR 格式规范',
      description: 'Check if PR description complies with format requirements (sections, issue links, etc.).',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        pr_number: z.number().int().positive().describe('Pull request number to check'),
        config_path: z.string().optional().describe('Path to compliance config file'),
        token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ComplianceTools.checkPR(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. 综合检查
  mcpServer.registerTool(
    'gitea_compliance_check_all',
    {
      title: '综合规范检查',
      description: 'Run comprehensive compliance check on branch, commits, and/or PR. Returns detailed report.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        branch: z.string().optional().describe('Branch name to check'),
        pr_number: z.number().int().positive().optional().describe('PR number to check (also checks its commits)'),
        commit_count: z.number().int().positive().optional().describe('Max number of commits to check (default: 10)'),
        config_path: z.string().optional().describe('Path to compliance config file'),
        token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ComplianceTools.checkAll(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 5. 初始化配置
  mcpServer.registerTool(
    'gitea_compliance_init',
    {
      title: '初始化规范检查配置',
      description: 'Initialize compliance configuration file (.gitea/compliance.yaml) with default rules.',
      inputSchema: z.object({
        force: z.boolean().optional().describe('Force overwrite existing configuration (default: false)'),
        config_path: z.string().optional().describe('Custom path for config file'),
      }),
    },
    async (args) => {
      try {
        const result = await ComplianceTools.initConfig(args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
