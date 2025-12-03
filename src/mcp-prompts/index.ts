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
import { registerWorkflowPrompts } from './workflow-prompts.js';

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
  // Register core prompts (9 total)
  registerInitPrompts(context);     // 1 prompt: 配置连接
  registerIssuePrompts(context);    // 1 prompt: 创建Issue
  registerPRPrompts(context);       // 1 prompt: 创建PR
  registerProjectPrompts(context);  // 1 prompt: 初始化项目看板
  registerWorkflowPrompts(context); // 5 prompts: 工作流管理
}
