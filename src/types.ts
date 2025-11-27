/**
 * Shared type definitions
 * Re-exports common types used across the codebase
 */

import type { GiteaClient } from './gitea-client.js';
import type { ContextManager } from './context-manager.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Tool context interface for all tool registries
 */
export interface ToolContext {
  client: GiteaClient;
  contextManager: ContextManager;
  server: McpServer;
}
