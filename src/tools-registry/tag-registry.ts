import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as TagTools from '../tools/tag.js';
import { ToolContext } from '../types.js';

export function registerTagTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. List tags
  mcpServer.registerTool(
    'gitea_tag_list',
    {
      title: '列出标签',
      description: "List a repository's tags",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number of results (1-based)'),
        limit: z.number().optional().describe('Page size of results'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.listTags(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Create tag
  mcpServer.registerTool(
    'gitea_tag_create',
    {
      title: '创建标签',
      description: 'Create a new git tag in a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        tag_name: z.string().min(1).describe('Name of the tag (e.g., "v1.0.0")'),
        target: z.string().optional().describe('Target commit SHA or branch name (defaults to default branch)'),
        message: z.string().optional().describe('Message for annotated tag (leave empty for lightweight tag)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.createTag(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Get tag
  mcpServer.registerTool(
    'gitea_tag_get',
    {
      title: '获取标签详情',
      description: 'Get the tag of a repository by tag name',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        tag: z.string().min(1).describe('Tag name (e.g., "v1.0.0")'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.getTag(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Delete tag
  mcpServer.registerTool(
    'gitea_tag_delete',
    {
      title: '删除标签',
      description: "Delete a repository's tag by name",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        tag: z.string().min(1).describe('Tag name to delete (e.g., "v1.0.0")'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.deleteTag(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 5. Get annotated tag
  mcpServer.registerTool(
    'gitea_tag_annotated_get',
    {
      title: '获取注释标签对象',
      description: 'Gets the tag object of an annotated tag (not lightweight tags)',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        sha: z.string().min(1).describe('Git object SHA of the annotated tag'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.getAnnotatedTag(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 6. List tag protections
  mcpServer.registerTool(
    'gitea_tag_protection_list',
    {
      title: '列出标签保护规则',
      description: 'List tag protections for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number of results (1-based)'),
        limit: z.number().optional().describe('Page size of results'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.listTagProtections(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 7. Create tag protection
  mcpServer.registerTool(
    'gitea_tag_protection_create',
    {
      title: '创建标签保护规则',
      description: 'Create a tag protection for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        name_pattern: z.string().optional().describe('Pattern to match tag names (e.g., "v*", "release/*")'),
        whitelist_usernames: z.array(z.string()).optional().describe('Usernames allowed to create/delete protected tags'),
        whitelist_teams: z.array(z.string()).optional().describe('Team names allowed to create/delete protected tags'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.createTagProtection(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 8. Get tag protection
  mcpServer.registerTool(
    'gitea_tag_protection_get',
    {
      title: '获取标签保护规则',
      description: 'Get a specific tag protection for the repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().describe('ID of the tag protection rule'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.getTagProtection(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 9. Update tag protection
  mcpServer.registerTool(
    'gitea_tag_protection_update',
    {
      title: '更新标签保护规则',
      description: 'Edit a tag protection for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().describe('ID of the tag protection rule'),
        name_pattern: z.string().optional().describe('Pattern to match tag names (e.g., "v*", "release/*")'),
        whitelist_usernames: z.array(z.string()).optional().describe('Usernames allowed to create/delete protected tags'),
        whitelist_teams: z.array(z.string()).optional().describe('Team names allowed to create/delete protected tags'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.updateTagProtection(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 10. Delete tag protection
  mcpServer.registerTool(
    'gitea_tag_protection_delete',
    {
      title: '删除标签保护规则',
      description: 'Delete a specific tag protection for the repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        id: z.number().describe('ID of the tag protection rule to delete'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await TagTools.deleteTagProtection(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
