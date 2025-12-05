/**
 * Issue Tools Registry (MCP 2.0 精简版)
 *
 * 只保留智能内容生成工具: gitea_issue_create
 * CRUD 操作请使用 keactl CLI: keactl issue <command>
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as IssueTools from '../tools/issue.js';
import type { ToolContext } from '../types.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:issue');

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');

/**
 * 注册 Issue 智能工具 (MCP 2.0)
 *
 * 只注册 gitea_issue_create 用于 AI 智能创建 Issue
 * 其他 CRUD 操作请使用 keactl CLI:
 * - keactl issue list/get/update/close/comment
 * - keactl issue deps/dep-add/dep-remove
 */
export function registerIssueTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_issue_create - 创建 Issue (智能内容生成)
  mcpServer.registerTool(
    'gitea_issue_create',
    {
      title: '创建 Issue',
      description: 'Create a new issue. Use this tool for AI-assisted issue creation with smart content generation.',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        title: z.string().min(1).describe('Issue title'),
        body: z.string().optional().describe('Issue body/description'),
        assignees: z.array(z.string()).optional().describe('Usernames to assign'),
        labels: z.array(z.number()).optional().describe('Label IDs to attach'),
        milestone: z.number().optional().describe('Milestone ID'),
        token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await IssueTools.createIssue(toolsContext, args as any);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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

  logger.info('Registered 1 issue tool (MCP 2.0 smart tool)');
}
