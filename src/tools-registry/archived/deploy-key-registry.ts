import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as DeployKeyTools from '../tools/deploy-key.js';
import { ToolContext } from '../types.js';

export function registerDeployKeyTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. List deploy keys
  mcpServer.registerTool(
    'gitea_deploy_key_list',
    {
      title: '列出部署密钥',
      description: "List a repository's deploy keys",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await DeployKeyTools.listDeployKeys(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Get deploy key
  mcpServer.registerTool(
    'gitea_deploy_key_get',
    {
      title: '获取部署密钥详情',
      description: "Get a repository's deploy key by ID",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Deploy key ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await DeployKeyTools.getDeployKey(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Create deploy key
  mcpServer.registerTool(
    'gitea_deploy_key_create',
    {
      title: '创建部署密钥',
      description: 'Add a deploy key to a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        title: z.string().min(1).describe('Title/name for this deploy key'),
        key: z.string().min(1).describe('SSH public key content (e.g., "ssh-rsa AAAA...")'),
        read_only: z.boolean().optional().describe('Whether this key has only read access (default: true for deploy keys)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await DeployKeyTools.createDeployKey(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Delete deploy key
  mcpServer.registerTool(
    'gitea_deploy_key_delete',
    {
      title: '删除部署密钥',
      description: 'Delete a deploy key from a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().int().positive().describe('Deploy key ID to delete'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await DeployKeyTools.deleteDeployKey(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
