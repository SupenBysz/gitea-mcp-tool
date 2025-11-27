import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as CommitTools from '../tools/commit.js';
import { ToolContext } from '../types.js';

export function registerCommitTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. List commits
  mcpServer.registerTool(
    'gitea_commit_list',
    {
      title: '列出提交历史',
      description: 'Get a list of all commits from a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        sha: z.string().optional().describe('SHA or branch to start listing commits from (e.g., "main", "develop")'),
        path: z.string().optional().describe('Filepath of a file/dir to filter commits'),
        since: z.string().optional().describe('Only commits after this date (ISO 8601 format: 2024-01-01T00:00:00Z)'),
        until: z.string().optional().describe('Only commits before this date (ISO 8601 format: 2024-12-31T23:59:59Z)'),
        stat: z.boolean().optional().describe('Include diff stats for every commit (default: true, disable for speedup)'),
        verification: z.boolean().optional().describe('Include verification for every commit (default: true, disable for speedup)'),
        files: z.boolean().optional().describe('Include affected files for every commit (default: true, disable for speedup)'),
        page: z.number().optional().describe('Page number of results (1-based)'),
        limit: z.number().optional().describe('Page size of results'),
        not: z.string().optional().describe('Commits matching this specifier will not be listed'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await CommitTools.listCommits(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Get single commit
  mcpServer.registerTool(
    'gitea_commit_get',
    {
      title: '获取提交详情',
      description: 'Get a single commit from a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        sha: z.string().min(1).describe('Commit SHA'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await CommitTools.getCommit(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Get commit diff
  mcpServer.registerTool(
    'gitea_commit_diff',
    {
      title: '获取提交差异',
      description: "Get a commit's diff or patch",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        sha: z.string().min(1).describe('Commit SHA'),
        diffType: z.enum(['diff', 'patch']).describe('Type of diff to get: "diff" or "patch"'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await CommitTools.getCommitDiff(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Get commit combined status
  mcpServer.registerTool(
    'gitea_commit_status_combined',
    {
      title: '获取提交合并状态',
      description: "Get a commit's combined status, by branch/tag/commit reference",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        ref: z.string().min(1).describe('Branch name, tag name, or commit SHA'),
        page: z.number().optional().describe('Page number of results (1-based)'),
        limit: z.number().optional().describe('Page size of results'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await CommitTools.getCommitCombinedStatus(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 5. List commit statuses
  mcpServer.registerTool(
    'gitea_commit_status_list',
    {
      title: '列出提交状态',
      description: "Get a commit's statuses, by branch/tag/commit reference",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        ref: z.string().min(1).describe('Branch name, tag name, or commit SHA'),
        page: z.number().optional().describe('Page number of results (1-based)'),
        limit: z.number().optional().describe('Page size of results'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await CommitTools.listCommitStatuses(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 6. Create commit status
  mcpServer.registerTool(
    'gitea_commit_status_create',
    {
      title: '创建提交状态',
      description: 'Create a commit status (e.g., CI/CD check result)',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        sha: z.string().min(1).describe('Commit SHA'),
        state: z.enum(['pending', 'success', 'error', 'failure', 'warning', 'skipped']).describe('Status state'),
        context: z.string().optional().describe('Unique context identifier (e.g., "ci/jenkins", "test/unit")'),
        description: z.string().optional().describe('Brief description of the status'),
        target_url: z.string().optional().describe('URL to link to for more details'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await CommitTools.createCommitStatus(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
