/**
 * MCP Prompts Registry
 *
 * This module provides the central registry for all MCP prompts.
 * Prompts are user-facing templates that guide AI assistants in interacting with Gitea tools.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerInitPrompts } from './init-prompts.js';
import { registerProjectPrompts } from './project-prompts.js';
import { registerIssuePrompts } from './issue-prompts.js';
import { registerPRPrompts } from './pr-prompts.js';

/**
 * Context passed to all prompt registration functions
 */
export interface PromptContext {
  /** The MCP server instance for registering prompts */
  server: McpServer;
}

/**
 * Register all prompts with the MCP server
 *
 * This is the main entry point for prompt registration.
 * It calls all individual prompt registration functions.
 *
 * @param context - The prompt context containing the MCP server
 */
export function registerAllPrompts(context: PromptContext): void {
  // Register initialization prompts (Sprint 1 - Core Prompts)
  registerInitPrompts(context);

  // Register additional prompts (Sprint 2 - Enhanced Prompts)
  registerProjectPrompts(context);
  registerIssuePrompts(context);
  registerPRPrompts(context);
}
