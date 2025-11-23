# 迁移前后架构对比分析

## 1. 代码架构对比

### 迁移前 (src/index.old.ts)
```typescript
// 低级 Server API
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: 'gitea-service',
  version: '0.8.1',
}, {
  capabilities: { tools: {} }
});

// 手动注册 ListTools handler - 返回所有工具定义
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      { name: 'gitea_init', description: '...', inputSchema: {...} },
      { name: 'gitea_repo_create', description: '...', inputSchema: {...} },
      // ... 86 个工具定义全部写在这里
    ]
  };
});

// 手动注册 CallTool handler - 处理所有工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // 巨型 switch 语句处理所有工具
  switch (name) {
    case 'gitea_init': {
      // 200+ 行处理逻辑
      break;
    }
    case 'gitea_repo_create': {
      // 30+ 行处理逻辑
      break;
    }
    // ... 86 个 case
  }
});
```

**特点：**
- ❌ 所有工具定义在一个数组中 (2400+ 行)
- ❌ 所有工具实现在一个 switch 中 (1000+ 行)
- ❌ 无法模块化拆分
- ❌ 手动处理请求和响应
- ❌ 不支持交互式功能 (Elicitation、Prompts)

### 迁移后 (src/index.ts + registry/*.ts)
```typescript
// 高级 McpServer API
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const mcpServer = new McpServer({
  name: 'gitea-service',
  version: '0.9.6',
}, {
  capabilities: {
    tools: {},
    prompts: {},  // ✅ 新增 Prompts 支持
  }
});

// 每个工具单独注册 - 自动处理 ListTools 和 CallTool
mcpServer.registerTool(
  'gitea_repo_create',
  {
    title: '创建仓库',
    description: 'Create a new repository',
    inputSchema: z.object({
      name: z.string().min(1),
      owner: z.string().optional(),
      // ... Zod 类型安全验证
    }),
  },
  async (args) => {
    // 直接编写处理逻辑，自动解析参数
    const result = await RepositoryTools.createRepository(context, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
);

// 支持交互式输入 (Elicitation)
const result = await server.elicitInput({
  message: '请提供仓库信息',
  requestedSchema: {
    type: 'object',
    properties: {
      owner: { type: 'string', title: '仓库所有者' },
      repo: { type: 'string', title: '仓库名称' },
    },
    required: ['owner', 'repo'],
  },
});

// 注册可复用的 Prompt 模板
mcpServer.registerPrompt(
  'create-issue',
  {
    title: '创建 Issue',
    description: '交互式创建 Issue',
  },
  async (args) => {
    return {
      messages: [{
        role: 'user',
        content: { type: 'text', text: '请帮我创建 Issue...' }
      }]
    };
  }
);
```

**特点：**
- ✅ 每个工具独立注册，逻辑清晰
- ✅ 自动处理 ListTools 和 CallTool 请求
- ✅ Zod 类型安全验证
- ✅ 可模块化拆分到独立文件
- ✅ 支持 Elicitation（交互式输入）
- ✅ 支持 Prompts（可复用模板）

## 2. 工具注册方式对比

### 旧架构：中心化定义 + 中心化处理

```
src/index.old.ts (3044 行)
├── ListToolsRequestSchema handler (2400 行)
│   └── 手动定义 86 个工具的 schema
└── CallToolRequestSchema handler (1000+ 行)
    └── switch 语句处理 86 个 case
```

**问题：**
1. 单文件臃肿，难以维护
2. 修改一个工具需要修改两个地方（定义 + 实现）
3. 无法并行开发（多人修改会冲突）
4. 测试困难（需要启动整个服务器）

### 新架构：模块化注册

```
src/index.ts (489 行)
├── registerInitTools()         → 初始化工具
├── registerContextTools()      → 上下文管理
├── registerUserTools()         → 用户管理
└── registerRepositoryTools()   → 调用 src/tools-registry/repository-registry.ts

src/tools-registry/
├── repository-registry.ts (239 行) → 5 个仓库工具
├── issue-registry.ts (209 行)      → 6 个 Issue 工具
└── pr-registry.ts (229 行)         → 6 个 PR 工具
```

**优势：**
1. ✅ 每个模块独立文件，职责单一
2. ✅ 修改工具只需修改对应注册模块
3. ✅ 可并行开发（不同模块不会冲突）
4. ✅ 易于测试（可单独导入测试）
5. ✅ 按需加载（不需要的模块可以注释掉）

## 3. 新功能对比

### 旧架构不支持的功能

❌ **Elicitation（交互式输入）**
- 问题：参数缺失时只能报错，用户体验差
- 旧代码：
```typescript
if (!owner || !repo) {
  throw new Error('Missing required parameters: owner and repo');
}
```

✅ **新架构支持 Elicitation**
- 优势：参数缺失时弹出表单让用户填写
- 新代码：
```typescript
if (!args.owner || !args.repo) {
  const result = await ctx.server.server.elicitInput({
    message: '无法自动检测仓库信息，请手动输入：',
    requestedSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', title: '仓库所有者' },
        repo: { type: 'string', title: '仓库名称' },
        set_as_default: { type: 'boolean', title: '设为默认上下文', default: true },
      },
      required: ['owner', 'repo'],
    },
  });

  if (result.action === 'accept') {
    // 使用用户输入的值继续执行
  }
}
```

❌ **Prompts（可复用模板）**
- 问题：常见操作需要用户每次手动描述

✅ **新架构支持 Prompts**
- 优势：预定义操作模板，通过斜杠命令快速触发
- 使用方式：
```bash
# 在 Claude CLI 中输入
/mcp__gitea-service__create-issue
/mcp__gitea-service__create-pr
/mcp__gitea-service__review-pr
```

## 4. 类型安全对比

### 旧架构：手动 JSON Schema
```typescript
{
  name: 'gitea_repo_create',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Repository name',
      },
      private: {
        type: 'boolean',
        description: 'Whether repository is private',
      },
    },
    required: ['name'],
  },
}

// 使用时需要手动类型断言
const typedArgs = args as {
  name: string;
  private?: boolean;
};
```
**问题：**
- ❌ Schema 和 TypeScript 类型分离
- ❌ 容易不一致
- ❌ 没有编译时检查

### 新架构：Zod 类型安全
```typescript
mcpServer.registerTool(
  'gitea_repo_create',
  {
    inputSchema: z.object({
      name: z.string().min(1),
      private: z.boolean().optional(),
    }),
  },
  async (args) => {
    // args 自动推导类型
    // args.name: string
    // args.private: boolean | undefined
  }
);
```
**优势：**
- ✅ Schema 即类型
- ✅ 运行时验证 + 编译时检查
- ✅ 自动类型推导
- ✅ 更好的 IDE 支持

## 5. 错误处理对比

### 旧架构：手动 try-catch 在中心 handler
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (name) {
      case 'gitea_repo_create':
        // 处理逻辑
        break;
      // ... 86 个 case
    }
  } catch (error) {
    // 统一错误处理，难以定制
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});
```

### 新架构：每个工具独立错误处理
```typescript
mcpServer.registerTool(
  'gitea_repo_create',
  {...},
  async (args) => {
    try {
      const result = await RepositoryTools.createRepository(context, args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, 'Failed to create repository');
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);
```
**优势：**
- ✅ 每个工具可定制错误信息
- ✅ 可添加特定工具的日志
- ✅ 易于调试

## 6. 代码量对比

| 项目 | 旧架构 | 新架构 | 变化 |
|------|--------|--------|------|
| 主文件行数 | 3,044 | 489 | -84% |
| 工具定义区域 | 2,400 行 (集中) | 分散到模块 | 更清晰 |
| 工具实现区域 | 1,000+ 行 (switch) | 每个工具独立 | 更模块化 |
| 导入依赖 | 所有模块都导入 | 按需导入 | 更高效 |

## 7. 维护性对比示例

### 场景：添加一个新的 Repository 工具 "gitea_repo_fork"

**旧架构：需要修改 2 处**
```typescript
// 1. 在 ListToolsRequestSchema handler 中添加工具定义（约第 500 行）
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... 前面的工具
      {
        name: 'gitea_repo_fork',
        description: 'Fork a repository',
        inputSchema: { ... },  // 30 行 schema
      },
      // ... 后面的工具
    ]
  };
});

// 2. 在 CallToolRequestSchema handler 中添加实现（约第 2800 行）
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (name) {
    // ... 前面的 case
    case 'gitea_repo_fork': {
      const typedArgs = args as {...};
      // 50 行实现代码
      break;
    }
    // ... 后面的 case
  }
});
```
**问题：**需要在 3000 行文件中跳来跳去

**新架构：只需修改 1 处**
```typescript
// 直接在 src/tools-registry/repository-registry.ts 中添加
export function registerRepositoryTools(mcpServer: McpServer, ctx: ToolContext) {
  // ... 其他工具

  // 添加新工具
  mcpServer.registerTool(
    'gitea_repo_fork',
    {
      title: 'Fork 仓库',
      description: 'Fork a repository',
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        // ...
      }),
    },
    async (args) => {
      const result = await RepositoryTools.forkRepository(context, args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
```
**优势：**定义和实现在一起，只需修改一个文件

## 总结对比表

| 特性 | 旧架构 (Server API) | 新架构 (McpServer API) |
|------|---------------------|----------------------|
| 代码行数 | 3,044 行 | 489 行 + 模块文件 |
| 架构模式 | 中心化 | 模块化 |
| 工具注册 | 手动两步骤 | 自动一步完成 |
| 类型安全 | JSON Schema (弱) | Zod (强) |
| 交互功能 | ❌ 不支持 | ✅ Elicitation + Prompts |
| 错误处理 | 统一处理 | 独立定制 |
| 并行开发 | 困难（冲突多） | 容易（模块隔离） |
| 测试难度 | 高 | 低 |
| 维护成本 | 高 | 低 |
| 扩展性 | 差 | 好 |
| 学习曲线 | 陡峭 | 平缓 |
