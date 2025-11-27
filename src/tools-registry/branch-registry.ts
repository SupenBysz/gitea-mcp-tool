import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as BranchTools from '../tools/branch.js';
import { ToolContext } from '../types.js';

export function registerBranchTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. List branches
  mcpServer.registerTool(
    'gitea_branch_list',
    {
      title: '列出分支',
      description: 'List all branches for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().int().min(1).optional().describe('Page number (default: 1)'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size (default: 30)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.listBranches(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Create branch
  mcpServer.registerTool(
    'gitea_branch_create',
    {
      title: '创建分支',
      description: 'Create a new branch from an existing branch or commit',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        new_branch_name: z.string().min(1).describe('Name of the new branch'),
        old_branch_name: z.string().optional().describe('Name of the old branch to branch from'),
        old_ref_name: z.string().optional().describe('Name of the old ref (branch/tag/commit SHA) to branch from'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.createBranch(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Get branch
  mcpServer.registerTool(
    'gitea_branch_get',
    {
      title: '获取分支详情',
      description: 'Get details of a specific branch, including its effective branch protection',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        branch: z.string().min(1).describe('Branch name'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.getBranch(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Delete branch
  mcpServer.registerTool(
    'gitea_branch_delete',
    {
      title: '删除分支',
      description: 'Delete a specific branch from a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        branch: z.string().min(1).describe('Branch name to delete'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.deleteBranch(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 5. Rename branch
  mcpServer.registerTool(
    'gitea_branch_rename',
    {
      title: '重命名分支',
      description: 'Rename a branch in the repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        branch: z.string().min(1).describe('Current branch name'),
        new_name: z.string().min(1).describe('New branch name'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.renameBranch(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 6. List branch protections
  mcpServer.registerTool(
    'gitea_branch_protection_list',
    {
      title: '列出分支保护规则',
      description: 'List all branch protection rules for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.listBranchProtections(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 7. Create branch protection
  mcpServer.registerTool(
    'gitea_branch_protection_create',
    {
      title: '创建分支保护规则',
      description: 'Create a branch protection rule for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        branch_name: z.string().optional().describe('Branch name (deprecated, use rule_name)'),
        rule_name: z.string().optional().describe('Rule name (pattern or specific branch)'),
        enable_push: z.boolean().optional().describe('Enable push restrictions'),
        enable_push_whitelist: z.boolean().optional().describe('Enable push whitelist'),
        push_whitelist_usernames: z.array(z.string()).optional().describe('Usernames allowed to push'),
        push_whitelist_teams: z.array(z.string()).optional().describe('Teams allowed to push'),
        push_whitelist_deploy_keys: z.boolean().optional().describe('Allow deploy keys to push'),
        enable_merge_whitelist: z.boolean().optional().describe('Enable merge whitelist'),
        merge_whitelist_usernames: z.array(z.string()).optional().describe('Usernames allowed to merge'),
        merge_whitelist_teams: z.array(z.string()).optional().describe('Teams allowed to merge'),
        enable_status_check: z.boolean().optional().describe('Enable status checks'),
        status_check_contexts: z.array(z.string()).optional().describe('Required status check contexts'),
        required_approvals: z.number().int().min(0).optional().describe('Number of required approvals'),
        enable_approvals_whitelist: z.boolean().optional().describe('Enable approvals whitelist'),
        approvals_whitelist_usernames: z.array(z.string()).optional().describe('Usernames for approvals'),
        approvals_whitelist_teams: z.array(z.string()).optional().describe('Teams for approvals'),
        block_on_rejected_reviews: z.boolean().optional().describe('Block merge on rejected reviews'),
        block_on_outdated_branch: z.boolean().optional().describe('Block merge on outdated branch'),
        dismiss_stale_approvals: z.boolean().optional().describe('Dismiss stale approvals on push'),
        require_signed_commits: z.boolean().optional().describe('Require signed commits'),
        protected_file_patterns: z.string().optional().describe('Protected file patterns'),
        unprotected_file_patterns: z.string().optional().describe('Unprotected file patterns'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.createBranchProtection(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 8. Get branch protection
  mcpServer.registerTool(
    'gitea_branch_protection_get',
    {
      title: '获取分支保护规则详情',
      description: 'Get details of a specific branch protection rule',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        name: z.string().min(1).describe('Name of the branch protection rule'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.getBranchProtection(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 9. Update branch protection
  mcpServer.registerTool(
    'gitea_branch_protection_update',
    {
      title: '更新分支保护规则',
      description: 'Update a branch protection rule. Only fields that are set will be changed',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        name: z.string().min(1).describe('Name of the branch protection rule to update'),
        branch_name: z.string().optional().describe('Branch name (deprecated, use rule_name)'),
        rule_name: z.string().optional().describe('New rule name'),
        enable_push: z.boolean().optional().describe('Enable push restrictions'),
        enable_push_whitelist: z.boolean().optional().describe('Enable push whitelist'),
        push_whitelist_usernames: z.array(z.string()).optional().describe('Usernames allowed to push'),
        push_whitelist_teams: z.array(z.string()).optional().describe('Teams allowed to push'),
        push_whitelist_deploy_keys: z.boolean().optional().describe('Allow deploy keys to push'),
        enable_merge_whitelist: z.boolean().optional().describe('Enable merge whitelist'),
        merge_whitelist_usernames: z.array(z.string()).optional().describe('Usernames allowed to merge'),
        merge_whitelist_teams: z.array(z.string()).optional().describe('Teams allowed to merge'),
        enable_status_check: z.boolean().optional().describe('Enable status checks'),
        status_check_contexts: z.array(z.string()).optional().describe('Required status check contexts'),
        required_approvals: z.number().int().min(0).optional().describe('Number of required approvals'),
        enable_approvals_whitelist: z.boolean().optional().describe('Enable approvals whitelist'),
        approvals_whitelist_usernames: z.array(z.string()).optional().describe('Usernames for approvals'),
        approvals_whitelist_teams: z.array(z.string()).optional().describe('Teams for approvals'),
        block_on_rejected_reviews: z.boolean().optional().describe('Block merge on rejected reviews'),
        block_on_outdated_branch: z.boolean().optional().describe('Block merge on outdated branch'),
        dismiss_stale_approvals: z.boolean().optional().describe('Dismiss stale approvals on push'),
        require_signed_commits: z.boolean().optional().describe('Require signed commits'),
        protected_file_patterns: z.string().optional().describe('Protected file patterns'),
        unprotected_file_patterns: z.string().optional().describe('Unprotected file patterns'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.updateBranchProtection(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 10. Delete branch protection
  mcpServer.registerTool(
    'gitea_branch_protection_delete',
    {
      title: '删除分支保护规则',
      description: 'Delete a specific branch protection rule',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        name: z.string().min(1).describe('Name of the branch protection rule to delete'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await BranchTools.deleteBranchProtection(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
