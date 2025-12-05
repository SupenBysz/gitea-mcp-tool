import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as ActionTools from '../tools/action.js';
import { ToolContext } from '../types.js';

export function registerActionTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // ==================== Workflows ====================

  // 1. List workflows
  mcpServer.registerTool(
    'gitea_workflow_list',
    {
      title: '列出工作流',
      description: 'List repository workflows',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.listWorkflows(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 2. Get workflow
  mcpServer.registerTool(
    'gitea_workflow_get',
    {
      title: '获取工作流详情',
      description: 'Get a workflow',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        workflow_id: z.string().min(1).describe('Workflow ID or filename (e.g., "ci.yml" or workflow ID)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.getWorkflow(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 3. Enable workflow
  mcpServer.registerTool(
    'gitea_workflow_enable',
    {
      title: '启用工作流',
      description: 'Enable a workflow',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        workflow_id: z.string().min(1).describe('Workflow ID or filename'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.enableWorkflow(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 4. Disable workflow
  mcpServer.registerTool(
    'gitea_workflow_disable',
    {
      title: '禁用工作流',
      description: 'Disable a workflow',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        workflow_id: z.string().min(1).describe('Workflow ID or filename'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.disableWorkflow(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 5. Dispatch workflow
  mcpServer.registerTool(
    'gitea_workflow_dispatch',
    {
      title: '触发工作流',
      description: 'Create a workflow dispatch event',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        workflow_id: z.string().min(1).describe('Workflow ID or filename'),
        ref: z.string().min(1).describe('Git reference (branch or tag) to run workflow on'),
        inputs: z.record(z.string()).optional().describe('Input parameters for the workflow'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.dispatchWorkflow(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // ==================== Runs ====================

  // 6. List runs
  mcpServer.registerTool(
    'gitea_run_list',
    {
      title: '列出工作流运行',
      description: 'List all runs for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        workflow_id: z.string().optional().describe('Filter by workflow ID or filename'),
        actor: z.string().optional().describe('Filter by user who triggered the run'),
        branch: z.string().optional().describe('Filter by branch name'),
        status: z.string().optional().describe('Filter by status (e.g., "success", "failure", "cancelled")'),
        event: z.string().optional().describe('Filter by event type (e.g., "push", "pull_request")'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.listRuns(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 7. Get run
  mcpServer.registerTool(
    'gitea_run_get',
    {
      title: '获取运行详情',
      description: 'Get a specific workflow run',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        run: z.string().min(1).describe('Run ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.getRun(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 8. Delete run
  mcpServer.registerTool(
    'gitea_run_delete',
    {
      title: '删除工作流运行',
      description: 'Delete a workflow run',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        run: z.string().min(1).describe('Run ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.deleteRun(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 9. List run artifacts
  mcpServer.registerTool(
    'gitea_run_artifacts',
    {
      title: '列出运行产物',
      description: 'List all artifacts for a workflow run',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        run: z.string().min(1).describe('Run ID'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.listRunArtifacts(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 10. List run jobs
  mcpServer.registerTool(
    'gitea_run_jobs',
    {
      title: '列出运行任务',
      description: 'List all jobs for a workflow run',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        run: z.string().min(1).describe('Run ID'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.listRunJobs(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // ==================== Jobs ====================

  // 11. List jobs
  mcpServer.registerTool(
    'gitea_job_list',
    {
      title: '列出所有任务',
      description: 'List all jobs for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.listJobs(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 12. Get job
  mcpServer.registerTool(
    'gitea_job_get',
    {
      title: '获取任务详情',
      description: 'Get a specific workflow job',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        job_id: z.string().min(1).describe('Job ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.getJob(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 13. Download job logs
  mcpServer.registerTool(
    'gitea_job_logs',
    {
      title: '下载任务日志',
      description: 'Download the job logs for a workflow run',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        job_id: z.string().min(1).describe('Job ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.downloadJobLogs(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // ==================== Artifacts ====================

  // 14. List artifacts
  mcpServer.registerTool(
    'gitea_artifact_list',
    {
      title: '列出产物',
      description: 'List all artifacts for a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.listArtifacts(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 15. Get artifact
  mcpServer.registerTool(
    'gitea_artifact_get',
    {
      title: '获取产物详情',
      description: 'Get a specific artifact for a workflow run',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        artifact_id: z.string().min(1).describe('Artifact ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.getArtifact(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 16. Download artifact
  mcpServer.registerTool(
    'gitea_artifact_download',
    {
      title: '下载产物',
      description: 'Download a specific artifact for a workflow run (redirects to blob URL)',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        artifact_id: z.string().min(1).describe('Artifact ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.downloadArtifact(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 17. Delete artifact
  mcpServer.registerTool(
    'gitea_artifact_delete',
    {
      title: '删除产物',
      description: 'Delete a specific artifact for a workflow run',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        artifact_id: z.string().min(1).describe('Artifact ID'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.deleteArtifact(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // ==================== Secrets ====================

  // 18. List secrets
  mcpServer.registerTool(
    'gitea_secret_list',
    {
      title: '列出密钥',
      description: "List a repository's actions secrets",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.listSecrets(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 19. Update secret
  mcpServer.registerTool(
    'gitea_secret_update',
    {
      title: '创建或更新密钥',
      description: 'Create or update a secret value in a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        secretname: z.string().min(1).describe('Secret name'),
        data: z.string().min(1).describe('Secret value (will be encrypted)'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.updateSecret(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 20. Delete secret
  mcpServer.registerTool(
    'gitea_secret_delete',
    {
      title: '删除密钥',
      description: 'Delete a secret in a repository',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        secretname: z.string().min(1).describe('Secret name'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.deleteSecret(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // ==================== Variables ====================

  // 21. List variables
  mcpServer.registerTool(
    'gitea_variable_list',
    {
      title: '列出变量',
      description: "Get a repository's variables list",
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.listVariables(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 22. Get variable
  mcpServer.registerTool(
    'gitea_variable_get',
    {
      title: '获取变量',
      description: 'Get a repo-level variable',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        variablename: z.string().min(1).describe('Variable name'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.getVariable(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 23. Create variable
  mcpServer.registerTool(
    'gitea_variable_create',
    {
      title: '创建变量',
      description: 'Create a repo-level variable',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        variablename: z.string().min(1).describe('Variable name'),
        value: z.string().min(1).describe('Variable value'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.createVariable(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 24. Update variable
  mcpServer.registerTool(
    'gitea_variable_update',
    {
      title: '更新变量',
      description: 'Update a repo-level variable',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        variablename: z.string().min(1).describe('Variable name'),
        value: z.string().min(1).describe('Variable value'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.updateVariable(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // 25. Delete variable
  mcpServer.registerTool(
    'gitea_variable_delete',
    {
      title: '删除变量',
      description: 'Delete a repo-level variable',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        variablename: z.string().min(1).describe('Variable name'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await ActionTools.deleteVariable(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );
}
