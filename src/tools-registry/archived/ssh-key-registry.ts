import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as SSHKeyTools from '../tools/ssh-key.js';
import { ToolContext } from '../types.js';

export function registerSSHKeyTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. List SSH keys
  mcpServer.registerTool(
    'gitea_ssh_key_list',
    {
      title: '列出 SSH 密钥',
      description: "List the authenticated user's public SSH keys",
      inputSchema: z.object({}),
    },
    async (args) => {
      try {
        const result = await SSHKeyTools.listSSHKeys(toolsContext);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Get SSH key
  mcpServer.registerTool(
    'gitea_ssh_key_get',
    {
      title: '获取 SSH 密钥详情',
      description: 'Get a public SSH key by ID',
      inputSchema: z.object({
        id: z.number().int().positive().describe('SSH key ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await SSHKeyTools.getSSHKey(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Create SSH key
  mcpServer.registerTool(
    'gitea_ssh_key_create',
    {
      title: '创建 SSH 密钥',
      description: 'Create a public SSH key',
      inputSchema: z.object({
        title: z.string().min(1).describe('Title/name for this key'),
        key: z.string().min(1).describe('SSH public key content (e.g., "ssh-rsa AAAA...")'),
        read_only: z.boolean().optional().describe('Whether this key has only read access (default: false)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await SSHKeyTools.createSSHKey(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Delete SSH key
  mcpServer.registerTool(
    'gitea_ssh_key_delete',
    {
      title: '删除 SSH 密钥',
      description: 'Delete a public SSH key',
      inputSchema: z.object({
        id: z.number().int().positive().describe('SSH key ID to delete'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await SSHKeyTools.deleteSSHKey(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
