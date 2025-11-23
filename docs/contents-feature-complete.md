# Contents 文件操作功能实现报告

## 概述

**功能模块**: Contents (文件操作)
**实现日期**: 2025-11-23
**工具数量**: 6 个
**API 版本**: Gitea v1.25+
**代码行数**: 409 行（实现 238 行 + 注册 171 行）

---

## 实现背景

### 战略价值

Contents 模块是 Git 仓库操作的核心功能之一，与 Branch 模块配合，形成完整的文件版本控制能力。在 API 覆盖度分析中，Contents 被标记为 **🔴 Very High 优先级**。

### 需求来源

1. **API 覆盖度提升**: 从 65% 提升到 70%
2. **完整 Git 工作流**: 补充 Branch + Contents 核心操作
3. **自动化需求**: 配置文件管理、文档生成、代码迁移
4. **用户反馈**: 需要完整的文件 CRUD 能力

---

## API 研究

### Gitea v1.25+ API 端点

使用 Gitea swagger.json 研究了 Contents 相关的 API 端点：

```bash
curl -s https://demo.gitea.com/api/swagger | jq '.paths | to_entries | map(select(.key | contains("/contents") or contains("/raw") or contains("/archive"))) | .[].key'
```

#### 发现的端点

| 端点 | 方法 | 说明 | 实现状态 |
|------|------|------|----------|
| `/repos/{owner}/{repo}/contents/{filepath}` | GET | 获取文件/目录内容 | ✅ |
| `/repos/{owner}/{repo}/contents/{filepath}` | POST | 创建文件 | ✅ |
| `/repos/{owner}/{repo}/contents/{filepath}` | PUT | 更新文件 | ✅ |
| `/repos/{owner}/{repo}/contents/{filepath}` | DELETE | 删除文件 | ✅ |
| `/repos/{owner}/{repo}/raw/{filepath}` | GET | 获取原始文件内容 | ✅ |
| `/repos/{owner}/{repo}/archive/{archive}` | GET | 下载仓库归档 | ✅ |

**API 覆盖度**: 6/6 (100%)

---

## 实现详情

### 1. 核心实现文件

#### src/tools/contents.ts (238 行)

**关键接口定义**:

```typescript
export interface ContentsToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

export interface Identity {
  name?: string;
  email?: string;
}

export interface ContentsParams {
  owner?: string;
  repo?: string;
}
```

**6 个核心函数**:

1. **getContents** (24 行)
   - 获取文件或目录的元数据和内容
   - 支持指定 ref（分支/标签/提交）
   - 返回 base64 编码的文件内容

2. **createFile** (28 行)
   - 创建新文件
   - 支持 base64 编码的内容
   - 支持自定义提交信息、作者、分支

3. **updateFile** (29 行)
   - 更新现有文件
   - 支持 SHA 验证（乐观锁）
   - 支持文件重命名/移动（from_path）

4. **deleteFile** (26 行)
   - 删除文件
   - 必需 SHA 验证
   - 支持在新分支上删除

5. **getRawFile** (21 行)
   - 获取原始文件内容（非 base64）
   - 适用于快速读取文本文件
   - 支持指定 ref

6. **downloadArchive** (15 行)
   - 下载仓库归档
   - 支持多种格式（zip, tar.gz, tar）
   - 支持任意 ref

### 2. 工具注册文件

#### src/tools-registry/contents-registry.ts (171 行)

**Identity Schema 定义**:

```typescript
const identitySchema = z.object({
  name: z.string().optional().describe('Name of the person'),
  email: z.string().email().optional().describe('Email of the person'),
});
```

**注册函数示例**:

```typescript
export function registerContentsTools(mcpServer: McpServer, ctx: ToolContext) {
  const toolsContext = { client: ctx.client, contextManager: ctx.contextManager };

  // 1. Get contents
  mcpServer.registerTool(
    'gitea_contents_get',
    {
      title: '获取文件或目录内容',
      description: 'Get the metadata and contents (if a file) of an entry in a repository, or a list of entries if a directory',
      inputSchema: z.object({
        owner: z.string().optional().describe('Repository owner. Uses context if not provided'),
        repo: z.string().optional().describe('Repository name. Uses context if not provided'),
        filepath: z.string().min(1).describe('Path of the file or directory'),
        ref: z.string().optional().describe('The name of the commit/branch/tag. Defaults to the default branch'),
      }),
    },
    async (args) => {
      try {
        const result = await ContentsTools.getContents(toolsContext, args as any);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    }
  );

  // ... 其他 5 个工具注册
}
```

---

## 技术亮点

### 1. Base64 编码处理

**问题**: Gitea API 要求文件内容使用 base64 编码

**解决方案**:
- 在工具描述中明确说明编码要求
- 在文档中提供编码/解码示例
- 支持原始文件 API 作为替代方案

```typescript
// 创建文件时要求 base64 编码
export interface CreateFileParams extends ContentsParams {
  filepath: string;
  content: string;  // base64 encoded content
  // ...
}

// 原始文件 API 返回未编码内容
export async function getRawFile(
  ctx: ContentsToolsContext,
  params: GetRawFileParams
): Promise<unknown> {
  // 返回原始二进制数据
  return response.data;
}
```

### 2. Identity Schema 设计

**问题**: Git 提交需要作者和提交者信息

**解决方案**:
- 定义可复用的 Identity schema
- 支持可选的 name 和 email
- Email 使用 Zod 验证格式

```typescript
const identitySchema = z.object({
  name: z.string().optional().describe('Name of the person'),
  email: z.string().email().optional().describe('Email of the person'),
});

// 在多个工具中复用
inputSchema: z.object({
  // ...
  author: identitySchema.optional().describe('Author identity'),
  committer: identitySchema.optional().describe('Committer identity'),
})
```

### 3. URL 编码处理

**问题**: 文件路径可能包含特殊字符（空格、中文、符号）

**解决方案**:
- 使用 `encodeURIComponent()` 编码文件路径
- 在所有路径参数上应用

```typescript
const response = await ctx.client.request({
  method: 'GET',
  path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(params.filepath)}`,
  params: queryParams,
});
```

### 4. 动态字段构建

**问题**: 大量可选参数，只应发送提供的字段

**解决方案**:
- 使用条件语句动态构建请求体
- 避免发送 undefined 值

```typescript
const body: any = {
  content: params.content,
};

if (params.message) body.message = params.message;
if (params.branch) body.branch = params.branch;
if (params.new_branch) body.new_branch = params.new_branch;
if (params.author) body.author = params.author;
if (params.committer) body.committer = params.committer;
if (params.signoff !== undefined) body.signoff = params.signoff;
if (params.force_push !== undefined) body.force_push = params.force_push;
```

### 5. 文件移动/重命名支持

**问题**: Git 中的文件重命名实际是删除旧文件 + 创建新文件

**解决方案**:
- 在 `updateFile` 中支持 `from_path` 参数
- Gitea API 自动处理为 Git 重命名操作

```typescript
export interface UpdateFileParams extends ContentsParams {
  filepath: string;
  content: string;
  sha?: string;
  from_path?: string;  // For rename/move operations
  // ...
}
```

---

## 构建和测试

### 编译结果

```bash
$ npm run build

✅ ESM dist/index.js     234.59 KB (+12.60 KB)
✅ ESM dist/index.js.map 520.77 KB (+17.68 KB)
✅ DTS dist/index.d.ts   4.30 KB

⚡️ Build success in 157ms
```

**代码增量**:
- +12.60 KB (从 221.99 KB 增加到 234.59 KB)
- +5.68% 相对增长

### 质量保证

- ✅ **TypeScript 编译**: 0 错误，0 警告
- ✅ **类型安全**: 所有函数都有完整的类型定义
- ✅ **Schema 验证**: 使用 Zod 进行运行时验证
- ✅ **错误处理**: 统一的 try-catch 模式

---

## 功能对比

### 与 GitHub CLI 对比

| 功能 | GitHub CLI | Gitea MCP (当前) | 说明 |
|------|-----------|-----------------|------|
| 获取文件内容 | `gh api repos/{owner}/{repo}/contents/{path}` | ✅ `gitea_contents_get` | 完全一致 |
| 创建文件 | API only | ✅ `gitea_contents_create` | Gitea 提供更友好 |
| 更新文件 | API only | ✅ `gitea_contents_update` | 支持 SHA 验证 |
| 删除文件 | API only | ✅ `gitea_contents_delete` | 必需 SHA |
| 原始内容 | `gh api repos/{owner}/{repo}/contents/{path} --jq '.content' \| base64 -d` | ✅ `gitea_contents_raw` | 更简洁 |
| 下载归档 | `gh api repos/{owner}/{repo}/tarball/{ref}` | ✅ `gitea_repo_archive` | 支持多格式 |

### 与 GitLab CLI 对比

| 功能 | GitLab CLI | Gitea MCP (当前) | 说明 |
|------|-----------|-----------------|------|
| 获取文件 | `glab api projects/{id}/repository/files/{path}` | ✅ `gitea_contents_get` | 类似 |
| 创建文件 | `glab api projects/{id}/repository/files/{path}` | ✅ `gitea_contents_create` | 完全对等 |
| 更新文件 | `glab api projects/{id}/repository/files/{path}` | ✅ `gitea_contents_update` | 完全对等 |
| 删除文件 | `glab api projects/{id}/repository/files/{path}` | ✅ `gitea_contents_delete` | 完全对等 |
| 原始内容 | `glab api projects/{id}/repository/files/{path}/raw` | ✅ `gitea_contents_raw` | 完全对等 |
| 归档下载 | `glab api projects/{id}/repository/archive` | ✅ `gitea_repo_archive` | 完全对等 |

**结论**: Gitea MCP 在 Contents 模块达到与 GitHub/GitLab CLI 相同的功能水平。

---

## 实际应用场景

### 1. CI/CD 自动化

```typescript
// 在 CI 流程中自动更新版本号
const packageJson = await gitea_contents_get({
  filepath: "package.json"
});

const pkg = JSON.parse(atob(packageJson.content));
pkg.version = process.env.NEW_VERSION;

await gitea_contents_update({
  filepath: "package.json",
  content: btoa(JSON.stringify(pkg, null, 2)),
  sha: packageJson.sha,
  message: `ci: Bump version to ${process.env.NEW_VERSION}`,
  author: {
    name: "CI Bot",
    email: "ci@example.com"
  }
});
```

### 2. 文档自动生成

```typescript
// 从代码注释生成 API 文档
const apiDocs = await generateAPIDocumentation();

await gitea_contents_create({
  filepath: "docs/api.md",
  content: btoa(apiDocs),
  message: "docs: Auto-generate API documentation",
  branch: "main",
  new_branch: "docs/auto-update"
});
```

### 3. 配置管理

```typescript
// 批量部署配置文件到多个环境
const environments = ["dev", "staging", "production"];

for (const env of environments) {
  const config = generateConfig(env);

  await gitea_contents_create({
    filepath: `config/${env}.yaml`,
    content: btoa(config),
    message: `config: Add ${env} configuration`
  });
}
```

### 4. 代码迁移

```typescript
// 从旧仓库迁移文件到新仓库
const sourceFiles = await gitea_contents_get({
  owner: "old-org",
  repo: "old-repo",
  filepath: "src"
});

for (const file of sourceFiles) {
  if (file.type === 'file') {
    const content = await gitea_contents_get({
      owner: "old-org",
      repo: "old-repo",
      filepath: file.path
    });

    await gitea_contents_create({
      owner: "new-org",
      repo: "new-repo",
      filepath: file.path,
      content: content.content,
      message: `Migrate ${file.path}`
    });
  }
}
```

---

## 文档输出

### 1. 用户指南

**文件**: `docs/contents-tools.md` (580+ 行)

**章节**:
- 工具列表：6 个工具的详细说明
- 实际使用场景：5 个完整示例
- 高级用法：base64 编码、文件移动、分支策略、身份配置
- 最佳实践：检查、SHA 验证、批量操作、错误处理
- 工具集成：与 Branch、PR、Release 工具配合
- 常见问题：5 个 Q&A
- 性能优化：3 条建议

### 2. API 覆盖度更新

**文件**: `docs/api-coverage-summary.md`

**更新内容**:
- 总工具数：105 → 111 (+6)
- API 覆盖度：65% → 70% (+5%)
- 完全覆盖模块：11 → 12 个
- Repository 模块覆盖度：70% → 80%
- 从"未覆盖"移除 Contents

### 3. 迁移报告更新

**文件**: `docs/migration-complete.md`

**更新内容**:
- Contents (文件操作) | 6 | ✅ 新增 (2025-11-23)
- 总计：105 → 111 工具

---

## 项目影响

### 统计数据

| 指标 | 实施前 | 实施后 | 变化 |
|------|--------|--------|------|
| 工具总数 | 105 | 111 | +6 (+5.7%) |
| API 覆盖度 | 65% | 70% | +5% |
| 完全覆盖模块 | 11 | 12 | +1 |
| 代码库大小 | 221.99 KB | 234.59 KB | +12.60 KB |
| Registry 模块 | 14 | 15 | +1 |

### 战略意义

1. **核心功能完整性**: Branch + Contents = 完整 Git 文件版本控制
2. **Repository 模块提升**: 从 70% 提升到 80% 覆盖度
3. **API 覆盖里程碑**: 达到 70%，距离 85% 目标更近
4. **用户体验改善**: 支持完整的文件 CRUD 操作

---

## 经验总结

### 成功因素

1. **API 研究充分**: 通过 swagger.json 全面了解 API 能力
2. **架构一致性**: 遵循现有的 tools + registry 模式
3. **类型安全**: TypeScript + Zod 双重保障
4. **文档完整**: 提供详细的用户指南和示例

### 技术挑战

1. **Base64 编码**: 需要在文档中明确说明编码要求
2. **URL 编码**: 处理特殊字符的文件路径
3. **Identity Schema**: 设计可复用的 Git 身份验证结构
4. **文件移动**: 理解 Git 重命名的底层机制

### 改进建议

1. **批量操作**: 考虑添加批量文件操作工具
2. **文件大小限制**: 文档中说明 API 限制
3. **二进制文件**: 提供二进制文件处理示例
4. **冲突处理**: 添加更多冲突解决策略

---

## 后续计划

### 立即行动

根据 API 覆盖度分析，下一步优先级：

1. **Commit 管理** (5 工具) - 🟠 High Priority
   - List commits, get commit, compare commits
   - 与 Contents 配合，形成完整提交历史

2. **Tag 管理** (4 工具) - 🟠 High Priority
   - Create, list, get, delete tags
   - 与 Release 配合，完善版本管理

### 中期目标

3. **Notification** (5 工具)
4. **Collaborator** (4 工具)

**目标**: 在 2 周内达到 83% API 覆盖度（129 工具）

---

## 总结

Contents 模块的实现：

- ✅ **6 个工具**，100% API 覆盖
- ✅ **409 行代码**，模块化架构
- ✅ **0 错误**，编译通过
- ✅ **完整文档**，包含示例和最佳实践
- ✅ **实际应用场景**，覆盖 CI/CD、文档生成、配置管理、代码迁移

Contents 与 Branch 模块配合，形成了 Gitea MCP 的 **Git 核心操作能力**，为项目的 70% API 覆盖度做出了重要贡献。

---

## 附录

### 工具清单

1. `gitea_contents_get` - 获取文件或目录内容
2. `gitea_contents_create` - 创建文件
3. `gitea_contents_update` - 更新文件
4. `gitea_contents_delete` - 删除文件
5. `gitea_contents_raw` - 获取原始文件内容
6. `gitea_repo_archive` - 下载仓库归档

### 相关文件

- `src/tools/contents.ts` (238 行)
- `src/tools-registry/contents-registry.ts` (171 行)
- `docs/contents-tools.md` (用户指南)
- `docs/contents-feature-complete.md` (本文档)
- `docs/api-coverage-summary.md` (已更新)
- `docs/migration-complete.md` (已更新)

### 参考资料

- [Gitea API Documentation - Repository Contents](https://docs.gitea.com/api/1.25/#tag/repository)
- [GitHub REST API - Repository Contents](https://docs.github.com/en/rest/repos/contents)
- [GitLab API - Repository Files](https://docs.gitlab.com/ee/api/repository_files.html)
