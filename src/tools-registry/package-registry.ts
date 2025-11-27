/**
 * Package Tools Registry
 * 软件包管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Token 参数 Schema - 用于所有需要鉴权的工具 */
const tokenSchema = z.string().optional().describe('Optional API token to override default authentication');
import * as PackageTools from '../tools/package.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:package');

/**
 * 注册所有 Package 管理工具
 */
export function registerPackageTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_package_list - 列出软件包
  mcpServer.registerTool(
    'gitea_package_list',
    {
      title: '列出软件包',
      description: 'List packages for an owner (user or organization)',
      inputSchema: z.object({
        owner: z.string().optional().describe('Package owner (user or org). Uses context if not provided'),
        page: z.number().optional().describe('Page number (1-based)'),
        limit: z.number().optional().describe('Page size'),
        type: z.string().optional().describe('Package type filter (e.g., npm, maven, docker, composer, nuget, pypi, rubygems, generic)'),
        q: z.string().optional().describe('Search query'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PackageTools.listPackages(toolsContext, args as any);
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

  // gitea_package_get - 获取软件包详情
  mcpServer.registerTool(
    'gitea_package_get',
    {
      title: '获取软件包详情',
      description: 'Get package details',
      inputSchema: z.object({
        owner: z.string().optional().describe('Package owner. Uses context if not provided'),
        type: z.string().min(1).describe('Package type (e.g., npm, maven, docker, composer, nuget, pypi, rubygems, generic)'),
        name: z.string().min(1).describe('Package name'),
        version: z.string().min(1).describe('Package version'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PackageTools.getPackage(toolsContext, args as any);
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

  // gitea_package_delete - 删除软件包
  mcpServer.registerTool(
    'gitea_package_delete',
    {
      title: '删除软件包',
      description: 'Delete a package',
      inputSchema: z.object({
        owner: z.string().optional().describe('Package owner. Uses context if not provided'),
        type: z.string().min(1).describe('Package type (e.g., npm, maven, docker, composer, nuget, pypi, rubygems, generic)'),
        name: z.string().min(1).describe('Package name'),
        version: z.string().min(1).describe('Package version'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PackageTools.deletePackage(toolsContext, args as any);
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

  // gitea_package_files - 列出软件包文件
  mcpServer.registerTool(
    'gitea_package_files',
    {
      title: '列出软件包文件',
      description: 'List package files',
      inputSchema: z.object({
        owner: z.string().optional().describe('Package owner. Uses context if not provided'),
        type: z.string().min(1).describe('Package type (e.g., npm, maven, docker, composer, nuget, pypi, rubygems, generic)'),
        name: z.string().min(1).describe('Package name'),
        version: z.string().min(1).describe('Package version'),
              token: tokenSchema,
      }),
    },
    async (args) => {
      try {
        const result = await PackageTools.listPackageFiles(toolsContext, args as any);
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

  logger.info('Registered 4 package tools');
}
