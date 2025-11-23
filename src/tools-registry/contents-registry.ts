import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as ContentsTools from '../tools/contents.js';
import { ToolContext } from '../types.js';

// Identity schema for author/committer
const identitySchema = z.object({
  name: z.string().optional().describe('Name of the person'),
  email: z.string().email().optional().describe('Email of the person'),
});

export function registerContentsTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. Get contents
  mcpServer.registerTool(
    'gitea_contents_get',
    {
      title: '获取文件或目录内容',
      description: 'Get the metadata and contents (if a file) of an entry in a repository, or a list of entries if a directory',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        filepath: z.string().min(1).describe('Path of the file or directory'),
        ref: z.string().optional().describe('The name of the commit/branch/tag. Defaults to the default branch'),
      }),
    },
    async (args) => {
      try {
        const result = await ContentsTools.getContents(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Create file
  mcpServer.registerTool(
    'gitea_contents_create',
    {
      title: '创建文件',
      description: 'Create a new file in a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        filepath: z.string().min(1).describe('Path of the file to create'),
        content: z.string().min(1).describe('File content (must be base64 encoded)'),
        message: z.string().optional().describe('Commit message. A default message will be used if not provided'),
        branch: z.string().optional().describe('Base branch for the changes. Defaults to the default branch'),
        new_branch: z.string().optional().describe('Create a new branch from base branch for the changes'),
        author: identitySchema.optional().describe('Author identity'),
        committer: identitySchema.optional().describe('Committer identity'),
        signoff: z.boolean().optional().describe('Add Signed-off-by trailer'),
        force_push: z.boolean().optional().describe('Force-push if the new branch already exists'),
      }),
    },
    async (args) => {
      try {
        const result = await ContentsTools.createFile(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Update file
  mcpServer.registerTool(
    'gitea_contents_update',
    {
      title: '更新文件',
      description: 'Update an existing file or create it if SHA is not provided',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        filepath: z.string().min(1).describe('Path of the file to update'),
        content: z.string().min(1).describe('New file content (must be base64 encoded)'),
        sha: z.string().optional().describe('SHA of the file to update. If not provided, will create a new file'),
        message: z.string().optional().describe('Commit message. A default message will be used if not provided'),
        branch: z.string().optional().describe('Base branch for the changes. Defaults to the default branch'),
        new_branch: z.string().optional().describe('Create a new branch from base branch for the changes'),
        from_path: z.string().optional().describe('Path of the original file to move/rename'),
        author: identitySchema.optional().describe('Author identity'),
        committer: identitySchema.optional().describe('Committer identity'),
        signoff: z.boolean().optional().describe('Add Signed-off-by trailer'),
        force_push: z.boolean().optional().describe('Force-push if the new branch already exists'),
      }),
    },
    async (args) => {
      try {
        const result = await ContentsTools.updateFile(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Delete file
  mcpServer.registerTool(
    'gitea_contents_delete',
    {
      title: '删除文件',
      description: 'Delete a file from a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        filepath: z.string().min(1).describe('Path of the file to delete'),
        sha: z.string().min(1).describe('SHA of the file to delete (required)'),
        message: z.string().optional().describe('Commit message. A default message will be used if not provided'),
        branch: z.string().optional().describe('Base branch for the changes. Defaults to the default branch'),
        new_branch: z.string().optional().describe('Create a new branch from base branch for the changes'),
        author: identitySchema.optional().describe('Author identity'),
        committer: identitySchema.optional().describe('Committer identity'),
        signoff: z.boolean().optional().describe('Add Signed-off-by trailer'),
        force_push: z.boolean().optional().describe('Force-push if the new branch already exists'),
      }),
    },
    async (args) => {
      try {
        const result = await ContentsTools.deleteFile(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 5. Get raw file
  mcpServer.registerTool(
    'gitea_contents_raw',
    {
      title: '获取原始文件内容',
      description: 'Get the raw content of a file from a repository (not base64 encoded)',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        filepath: z.string().min(1).describe('Path of the file to get'),
        ref: z.string().optional().describe('The name of the commit/branch/tag. Defaults to the default branch'),
      }),
    },
    async (args) => {
      try {
        const result = await ContentsTools.getRawFile(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 6. Download archive
  mcpServer.registerTool(
    'gitea_repo_archive',
    {
      title: '下载仓库归档',
      description: 'Download an archive of a repository at a specific ref',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        archive: z.string().min(1).describe('Archive format: {ref}.{format} (e.g. "main.zip", "v1.0.0.tar.gz")'),
      }),
    },
    async (args) => {
      try {
        const result = await ContentsTools.downloadArchive(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
