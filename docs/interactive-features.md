# MCP 交互式功能实现指南

本文档说明如何在 Gitea MCP Server 中实现 MCP SDK 的交互式功能。

## SDK 版本

- `@modelcontextprotocol/sdk`: v1.22.0
- 支持的交互式功能：Elicitation、Prompts、Resources

## 1. Elicitation（请求用户输入）

### 概述

Elicitation 允许 MCP 服务器在工具执行过程中主动请求用户提供额外信息，实现多轮交互。

### API 使用

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// 在 tool handler 中使用
const result = await server.elicitInput({
  message: '请提供仓库信息',
  requestedSchema: {
    type: 'object',
    properties: {
      owner: {
        type: 'string',
        title: '仓库所有者',
        description: '用户名或组织名',
      },
      repo: {
        type: 'string',
        title: '仓库名称',
        description: '仓库的名称',
      },
      makeDefault: {
        type: 'boolean',
        title: '设为默认',
        description: '是否将此仓库设为默认上下文',
        default: true,
      },
      visibility: {
        type: 'string',
        title: '仓库可见性',
        enum: ['public', 'private', 'internal'],
        enumNames: ['公开', '私有', '内部'],
        default: 'public',
      }
    },
    required: ['owner', 'repo'],
  },
});

// 处理用户响应
if (result.action === 'accept') {
  const { owner, repo, makeDefault, visibility } = result.content;
  // 使用用户输入的数据继续执行
} else if (result.action === 'decline') {
  // 用户明确拒绝
  throw new Error('User declined the operation');
} else {
  // 用户取消（关闭对话框等）
  throw new Error('Operation cancelled by user');
}
```

### 支持的字段类型

#### 1. 字符串（String）

```typescript
{
  type: 'string',
  title: '字段标题',
  description: '字段描述',
  default: '默认值',
}
```

#### 2. 数字（Number）

```typescript
{
  type: 'number',
  title: '数量',
  description: '请输入数量',
  default: 10,
}
```

#### 3. 布尔值（Boolean）

```typescript
{
  type: 'boolean',
  title: '是否启用',
  description: '是否启用此功能',
  default: true,
}
```

#### 4. 单选枚举（Enum）

```typescript
{
  type: 'string',
  title: '优先级',
  enum: ['low', 'medium', 'high'],
  enumNames: ['低', '中', '高'],  // 可选：显示名称
  default: 'medium',
}
```

#### 5. 多选枚举（Multi-select）

```typescript
{
  type: 'array',
  title: '标签',
  items: {
    type: 'string',
  },
  enum: ['bug', 'feature', 'documentation'],
  enumNames: ['错误', '功能', '文档'],
  default: [],
}
```

### ElicitResult 类型

```typescript
type ElicitResult = {
  action: 'accept' | 'decline' | 'cancel';
  content?: Record<string, string | number | boolean | string[]>;
  _meta?: Record<string, unknown>;
};
```

### 限制和注意事项

1. **不支持嵌套对象**：requestedSchema 只支持顶级属性，不能嵌套对象
2. **客户端能力检查**：在使用前需确保客户端支持 elicitation（SDK 会自动检查）
3. **超时处理**：客户端可能设置超时，长时间无响应会导致请求失败

## 2. Prompts（提示模板）

### 概述

Prompts 是可重用的提示模板，在 Claude CLI 中自动转换为斜杠命令：`/mcp__servername__promptname`

### API 使用（使用 McpServer）

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const mcpServer = new McpServer({
  name: 'gitea-service',
  version: '1.0.0',
});

// 注册无参数 prompt
mcpServer.registerPrompt(
  'create-issue',
  {
    title: '创建 Issue',
    description: '交互式创建 Gitea Issue',
  },
  async (extra) => {
    return {
      description: '请按照以下模板创建 Issue：',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请帮我创建一个新的 Issue，包含以下信息：
- 标题：[Issue 标题]
- 内容：[详细描述]
- 标签：[可选标签]
- 优先级：[低/中/高]

请根据项目情况填写具体内容。`,
          },
        },
      ],
    };
  }
);

// 注册带参数 prompt
mcpServer.registerPrompt(
  'create-pr',
  {
    title: '创建 Pull Request',
    description: '交互式创建 Gitea Pull Request',
    argsSchema: {
      from_branch: z.string().describe('源分支名称'),
      to_branch: z.string().optional().describe('目标分支名称（默认：main）'),
    },
  },
  async (args, extra) => {
    const { from_branch, to_branch = 'main' } = args;
    return {
      description: `从 ${from_branch} 到 ${to_branch} 的 PR 模板`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请帮我创建一个 Pull Request：
- 源分支：${from_branch}
- 目标分支：${to_branch}
- 标题：[PR 标题]
- 描述：[详细描述变更内容]

请审查代码差异并生成合适的 PR 描述。`,
          },
        },
      ],
    };
  }
);
```

### API 使用（使用低级 Server API）

如果使用低级 `Server` API（当前 Gitea MCP Server 的做法），需要手动注册处理器：

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: 'gitea-service',
  version: '1.0.0',
}, {
  capabilities: {
    prompts: {},  // 声明支持 prompts
  },
});

// 存储已注册的 prompts
const registeredPrompts = new Map();

registeredPrompts.set('create-issue', {
  name: 'create-issue',
  title: '创建 Issue',
  description: '交互式创建 Gitea Issue',
  arguments: [],  // 无参数
});

registeredPrompts.set('create-pr', {
  name: 'create-pr',
  title: '创建 Pull Request',
  description: '交互式创建 Gitea Pull Request',
  arguments: [
    {
      name: 'from_branch',
      description: '源分支名称',
      required: true,
    },
    {
      name: 'to_branch',
      description: '目标分支名称（默认：main）',
      required: false,
    },
  ],
});

// 处理 prompts/list 请求
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: Array.from(registeredPrompts.values()),
  };
});

// 处理 prompts/get 请求
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'create-issue') {
    return {
      description: '请按照以下模板创建 Issue：',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请帮我创建一个新的 Issue，包含以下信息：
- 标题：[Issue 标题]
- 内容：[详细描述]
- 标签：[可选标签]
- 优先级：[低/中/高]

请根据项目情况填写具体内容。`,
          },
        },
      ],
    };
  }

  if (name === 'create-pr') {
    const fromBranch = args?.from_branch || '';
    const toBranch = args?.to_branch || 'main';

    return {
      description: `从 ${fromBranch} 到 ${toBranch} 的 PR 模板`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请帮我创建一个 Pull Request：
- 源分支：${fromBranch}
- 目标分支：${toBranch}
- 标题：[PR 标题]
- 描述：[详细描述变更内容]

请审查代码差异并生成合适的 PR 描述。`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```

### Prompt 消息类型

```typescript
type PromptMessage = {
  role: 'user' | 'assistant';
  content: TextContent | ImageContent | EmbeddedResource;
};

type TextContent = {
  type: 'text';
  text: string;
  _meta?: Record<string, unknown>;
};

type ImageContent = {
  type: 'image';
  data: string;  // Base64 编码
  mimeType: string;
  _meta?: Record<string, unknown>;
};

type EmbeddedResource = {
  type: 'resource';
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
  };
  _meta?: Record<string, unknown>;
};
```

## 3. 在 Gitea MCP Server 中的应用场景

### 场景 1：改进 `gitea_init` 工具

使用 Elicitation 实现真正的交互式初始化：

```typescript
case 'gitea_init': {
  // 尝试自动检测
  const gitInfo = detectGitInfo(workingDir);

  // 如果检测失败，使用 elicitation 请求用户输入
  if (!gitInfo.owner || !gitInfo.repo) {
    const result = await server.elicitInput({
      message: '无法自动检测仓库信息，请手动输入：',
      requestedSchema: {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            title: '仓库所有者',
            description: '用户名或组织名',
          },
          repo: {
            type: 'string',
            title: '仓库名称',
          },
          gitea_url: {
            type: 'string',
            title: 'Gitea 服务器 URL',
            default: config.baseUrl,
          },
          set_as_default: {
            type: 'boolean',
            title: '设为默认上下文',
            default: true,
          },
        },
        required: ['owner', 'repo'],
      },
    });

    if (result.action === 'accept') {
      // 使用用户输入创建配置
      const { owner, repo, gitea_url, set_as_default } = result.content;
      // ... 创建配置逻辑
    } else {
      throw new Error('Configuration initialization cancelled');
    }
  }

  break;
}
```

### 场景 2：添加常用工作流 Prompts

```typescript
// /mcp__gitea-service__create-issue
registerPrompt('create-issue', {
  title: '创建 Issue',
  description: '交互式创建 Issue 的提示模板',
});

// /mcp__gitea-service__create-pr
registerPrompt('create-pr', {
  title: '创建 Pull Request',
  description: '交互式创建 PR 的提示模板',
  argsSchema: {
    from_branch: z.string(),
    to_branch: z.string().optional(),
  },
});

// /mcp__gitea-service__review-pr
registerPrompt('review-pr', {
  title: '审查 Pull Request',
  description: '审查 PR 的提示模板',
  argsSchema: {
    pr_number: z.string(),
  },
});
```

### 场景 3：交互式创建 Issue

```typescript
case 'gitea_create_issue': {
  // 如果缺少必需参数，使用 elicitation
  if (!args.title) {
    const result = await server.elicitInput({
      message: '请提供 Issue 信息：',
      requestedSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '标题',
            description: 'Issue 的标题',
          },
          body: {
            type: 'string',
            title: '内容',
            description: 'Issue 的详细描述',
          },
          labels: {
            type: 'array',
            title: '标签',
            items: { type: 'string' },
            enum: ['bug', 'feature', 'documentation', 'help-wanted'],
            enumNames: ['错误', '功能', '文档', '需要帮助'],
          },
          priority: {
            type: 'string',
            title: '优先级',
            enum: ['low', 'medium', 'high'],
            enumNames: ['低', '中', '高'],
            default: 'medium',
          },
        },
        required: ['title', 'body'],
      },
    });

    if (result.action === 'accept') {
      // 使用收集的数据创建 Issue
      // ... 调用 Gitea API
    }
  }

  break;
}
```

## 4. 迁移建议

### 从当前实现到交互式实现的迁移路径

1. **保持向后兼容**：
   - 保留现有的非交互式工具
   - 添加新的交互式版本作为补充

2. **逐步添加功能**：
   - 第一步：添加 Prompts（最简单，用户体验提升明显）
   - 第二步：为关键工具添加 Elicitation（如 gitea_init）
   - 第三步：为复杂工作流添加组合使用

3. **架构选择**：
   - **方案 A**：保持使用低级 `Server` API（当前做法）
     - 优点：完全控制，灵活性高
     - 缺点：需要手动实现更多代码
   - **方案 B**：迁移到 `McpServer` 高级 API
     - 优点：代码简洁，自动处理很多细节
     - 缺点：需要重构现有代码

## 5. 实现优先级建议

### 高优先级

1. **添加 Prompts**：
   - `create-issue`：创建 Issue 的提示模板
   - `create-pr`：创建 PR 的提示模板
   - `review-pr`：审查 PR 的提示模板

2. **改进 `gitea_init`**：
   - 使用 Elicitation 在自动检测失败时请求输入

### 中优先级

3. **为复杂工具添加 Elicitation**：
   - `gitea_create_release`：交互式创建发布
   - `gitea_create_repository`：交互式创建仓库

### 低优先级

4. **进阶功能**：
   - 多步骤工作流（连续多次 elicitation）
   - 动态表单（根据前一步的输入调整后续字段）

## 6. 测试和验证

### 客户端兼容性

- ✅ Claude CLI（支持 Prompts 和 Elicitation）
- ⚠️ Claude Desktop（需要验证支持程度）
- ⚠️ 其他 MCP 客户端（视具体实现而定）

### 测试方法

1. **Prompts 测试**：
   ```bash
   # 在 Claude CLI 中
   /mcp__gitea-service__create-issue
   ```

2. **Elicitation 测试**：
   - 调用配置为使用 elicitation 的工具
   - 验证用户输入界面是否正确显示
   - 验证输入数据是否正确传递

## 7. 参考资料

- [MCP SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://modelcontextprotocol.io)
- [MCP Apps Announcement](https://www.anthropic.com/news/mcp-apps)
- SDK Version: @modelcontextprotocol/sdk@1.22.0

---

**文档创建日期**：2025-11-23
**SDK 版本**：1.22.0
**作者**：Claude (Assisted by Claude Code)
