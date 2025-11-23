import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as CollaboratorTools from '../tools/collaborator.js';
import { ToolContext } from '../types.js';

export function registerCollaboratorTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. List collaborators
  mcpServer.registerTool(
    'gitea_collaborator_list',
    {
      title: '列出协作者',
      description: "List a repository's collaborators",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
      }),
    },
    async (args) => {
      try {
        const result = await CollaboratorTools.listCollaborators(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Check collaborator
  mcpServer.registerTool(
    'gitea_collaborator_check',
    {
      title: '检查协作者',
      description: 'Check if a user is a collaborator of a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        collaborator: z.string().min(1).describe('Username to check'),
      }),
    },
    async (args) => {
      try {
        const result = await CollaboratorTools.checkCollaborator(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Add collaborator
  mcpServer.registerTool(
    'gitea_collaborator_add',
    {
      title: '添加协作者',
      description: 'Add or update a collaborator to a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        collaborator: z.string().min(1).describe('Username to add as collaborator'),
        permission: z.enum(['read', 'write', 'admin']).optional().describe('Permission level (default: write)'),
      }),
    },
    async (args) => {
      try {
        const result = await CollaboratorTools.addCollaborator(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Delete collaborator
  mcpServer.registerTool(
    'gitea_collaborator_delete',
    {
      title: '删除协作者',
      description: 'Delete a collaborator from a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        collaborator: z.string().min(1).describe('Username to remove as collaborator'),
      }),
    },
    async (args) => {
      try {
        const result = await CollaboratorTools.deleteCollaborator(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 5. Get collaborator permission
  mcpServer.registerTool(
    'gitea_collaborator_permission',
    {
      title: '获取协作者权限',
      description: 'Get repository permissions for a user',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        collaborator: z.string().min(1).describe('Username to check permissions for'),
      }),
    },
    async (args) => {
      try {
        const result = await CollaboratorTools.getCollaboratorPermission(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
