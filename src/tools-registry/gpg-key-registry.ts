/**
 * GPG Key Tools Registry
 * GPG 密钥管理工具注册模块
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as GPGKeyTools from '../tools/gpg-key.js';
import type { ToolContext } from '../index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('registry:gpg-key');

/**
 * 注册所有 GPG Key 管理工具
 */
export function registerGPGKeyTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = {
    client: ctx.client,
    contextManager: ctx.contextManager,
  };

  // gitea_gpg_key_list - 列出 GPG 密钥
  mcpServer.registerTool(
    'gitea_gpg_key_list',
    {
      title: '列出 GPG 密钥',
      description: "List the authenticated user's GPG keys",
      inputSchema: z.object({}),
    },
    async (args) => {
      try {
        const result = await GPGKeyTools.listGPGKeys(toolsContext);
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

  // gitea_gpg_key_get - 获取 GPG 密钥详情
  mcpServer.registerTool(
    'gitea_gpg_key_get',
    {
      title: '获取 GPG 密钥详情',
      description: 'Get a GPG key by ID',
      inputSchema: z.object({
        id: z.number().int().positive().describe('GPG key ID'),
      }),
    },
    async (args) => {
      try {
        const result = await GPGKeyTools.getGPGKey(toolsContext, args as any);
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

  // gitea_gpg_key_create - 创建 GPG 密钥
  mcpServer.registerTool(
    'gitea_gpg_key_create',
    {
      title: '创建 GPG 密钥',
      description: 'Create a GPG key',
      inputSchema: z.object({
        armored_public_key: z.string().min(1).describe('GPG armored public key block (e.g., "-----BEGIN PGP PUBLIC KEY BLOCK-----...")'),
        armored_signature: z.string().optional().describe('GPG armored signature (optional)'),
      }),
    },
    async (args) => {
      try {
        const result = await GPGKeyTools.createGPGKey(toolsContext, args as any);
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

  // gitea_gpg_key_delete - 删除 GPG 密钥
  mcpServer.registerTool(
    'gitea_gpg_key_delete',
    {
      title: '删除 GPG 密钥',
      description: 'Delete a GPG key',
      inputSchema: z.object({
        id: z.number().int().positive().describe('GPG key ID to delete'),
      }),
    },
    async (args) => {
      try {
        const result = await GPGKeyTools.deleteGPGKey(toolsContext, args as any);
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

  logger.info('Registered 4 GPG key tools');
}
