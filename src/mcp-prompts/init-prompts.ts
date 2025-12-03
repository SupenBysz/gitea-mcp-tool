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
 * Registers one core prompt:
 * 1. gitea-mcp-tool:配置连接 - Main initialization wizard
 *
 * @param context - The prompt context containing the MCP server
 */
export function registerInitPrompts(context: PromptContext): void {
  const { server } = context;

  // Prompt: Main initialization wizard
  server.registerPrompt(
    '配置连接',
    {
      description: '交互式配置 Gitea MCP 服务器连接信息（首次使用必需）',
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
}
