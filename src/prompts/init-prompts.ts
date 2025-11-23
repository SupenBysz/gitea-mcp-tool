/**
 * Initialization Prompts
 *
 * This module provides MCP prompts for Gitea MCP initialization and configuration.
 * These prompts guide users through the initial setup process.
 */

import { PromptContext } from './index.js';

/**
 * Register initialization-related prompts
 *
 * Registers three prompts:
 * 1. gitea-mcp-tool:配置连接 - Main initialization wizard
 * 2. gitea-mcp-tool:检查配置 - Check configuration status
 * 3. gitea-mcp-tool:重新配置 - Reconfigure (force mode)
 *
 * @param context - The prompt context containing the MCP server
 */
export function registerInitPrompts(context: PromptContext): void {
  const { server } = context;

  // Prompt 1: Main initialization wizard
  server.prompt(
    {
      name: 'gitea-mcp-tool:配置连接',
      description: '交互式配置 Gitea MCP 服务器连接信息（首次使用必需）',
      arguments: [],
    },
    async () => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我配置 Gitea MCP 连接。

这是首次使用 Gitea MCP 工具，需要配置以下信息：

**自动检测**
首先，我会尝试从当前 Git 仓库自动检测配置信息。

**配置步骤**
1. **Gitea 服务器地址**
   - 自动检测 Git remote URL
   - 或手动输入服务器地址

2. **项目信息**
   - owner（仓库所有者）
   - repo（仓库名称）

3. **API Token 配置**
   支持 4 种配置方式：
   - 使用用户名密码自动创建
   - 手动输入已有 token
   - 引用已保存的 token
   - 使用环境变量

4. **Token 保存方式**
   - 本地保存（.gitea-mcp.local.json）
   - 引用保存（指向其他配置）
   - 环境变量（不保存到文件）

5. **设置默认上下文**
   - 设置此项目为默认操作上下文

请调用 \`gitea_init\` 工具开始配置向导。

**提示**：
- 如果在 Git 仓库目录中，大部分信息会自动检测
- 首次配置建议使用用户名密码方式自动创建 token
- Token 会安全保存在本地配置文件中

配置完成后，你就可以使用其他 Gitea 功能了！`,
            },
          },
        ],
      };
    }
  );

  // Prompt 2: Check configuration status
  server.prompt(
    {
      name: 'gitea-mcp-tool:检查配置',
      description: '检查当前 Gitea MCP 配置状态',
      arguments: [],
    },
    async () => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我检查 Gitea MCP 的配置状态。

请按以下步骤检查：

1. **查看默认上下文**
   使用 \`gitea_context_get\` 工具查看当前默认上下文

2. **检查配置文件**
   查看以下配置文件是否存在：
   - 全局配置：~/.gitea-mcp/config.json
   - 项目配置：.gitea-mcp.json
   - 本地配置：.gitea-mcp.local.json（包含敏感信息）

3. **验证连接**
   尝试调用 \`gitea_user_current\` 获取当前用户信息，验证 token 是否有效

**如果未配置或配置无效**：
请提示我使用 "gitea-mcp-tool:配置连接" Prompt 进行初始化。`,
            },
          },
        ],
      };
    }
  );

  // Prompt 3: Reconfigure (force mode)
  server.prompt(
    {
      name: 'gitea-mcp-tool:重新配置',
      description: '重新配置 Gitea MCP 连接（覆盖现有配置）',
      arguments: [],
    },
    async () => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `我想重新配置 Gitea MCP 连接。

请使用 \`gitea_init\` 工具，并设置 \`force=true\` 来覆盖现有配置。

**注意**：
⚠️  这将覆盖现有的配置文件：
- .gitea-mcp.json（项目配置）
- .gitea-mcp.local.json（本地配置，包含 token）

**使用场景**：
- 切换到不同的 Gitea 服务器
- 更换 API Token
- 修改项目信息（owner/repo）
- 配置文件损坏需要重新创建

**备份建议**：
在重新配置前，建议备份现有配置文件，以便需要时恢复。

确认要重新配置吗？如果确认，我将开始配置向导。`,
            },
          },
        ],
      };
    }
  );
}
