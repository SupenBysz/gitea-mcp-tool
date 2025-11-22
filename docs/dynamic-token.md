# 动态 Token 支持

## 概述

Gitea MCP 从 v0.8.0 开始支持**动态指定 API Token**，这意味着：

1. ✅ **默认使用配置文件中的 token** - 无需每次都传递 token
2. ✅ **支持临时覆盖 token** - 可以为单次调用指定不同的 token
3. ✅ **多用户场景支持** - 同一个 MCP 服务可以服务多个用户
4. ✅ **权限隔离** - 不同操作可以使用不同权限的 token

## 使用方式

### 方式 1：使用默认 Token（推荐）

在 `.env` 配置文件中设置：

```bash
GITEA_BASE_URL=https://gitea.ktyun.cc
GITEA_API_TOKEN=your_default_token_here
```

所有工具调用会自动使用这个 token：

```typescript
// 使用默认 token
gitea_issue_create({
  title: "Bug 修复",
  body: "详细描述..."
})
```

### 方式 2：动态指定 Token

在调用任何工具时，添加 `api_token` 参数：

```typescript
// 使用临时 token（会覆盖默认 token）
gitea_issue_create({
  title: "Bug 修复",
  body: "详细描述...",
  api_token: "temporary_token_for_this_call"  // 临时 token
})
```

## 应用场景

### 场景 1：多用户系统

```typescript
// 用户 A 创建 issue（使用用户 A 的 token）
gitea_issue_create({
  title: "功能请求",
  body: "需要添加导出功能",
  api_token: userA_token
})

// 用户 B 创建 issue（使用用户 B 的 token）
gitea_issue_create({
  title: "Bug 报告",
  body: "发现一个 bug",
  api_token: userB_token
})
```

### 场景 2：权限分离

```typescript
// 使用只读 token 查询信息
gitea_issue_list({
  api_token: readonly_token
})

// 使用管理员 token 删除仓库
gitea_repo_delete({
  owner: "test",
  repo: "old-project",
  api_token: admin_token  // 需要管理员权限
})
```

### 场景 3：测试不同环境

```typescript
// 开发环境
gitea_repo_create({
  name: "test-repo",
  api_token: dev_token
})

// 生产环境
gitea_repo_create({
  name: "prod-repo",
  api_token: prod_token
})
```

### 场景 4：临时授权

```typescript
// 使用短期 token 执行操作
gitea_pr_merge({
  index: 123,
  api_token: temp_token_expires_in_1hour
})
```

## 工作原理

### 内部实现

```typescript
// 1. 检测是否提供了 api_token 参数
if (args.api_token) {
  // 2. 创建临时配置
  const tempConfig = {
    ...defaultConfig,
    apiToken: args.api_token
  };

  // 3. 创建临时 GiteaClient
  const tempClient = new GiteaClient(tempConfig);

  // 4. 使用临时 client 执行操作
  await tempClient.request(...);
}
```

### 优先级

```
临时 token（api_token 参数）> 默认 token（配置文件）
```

### 安全考虑

1. **Token 不会被记录** - 日志中只记录"使用临时 token"，不记录 token 值
2. **Token 不会传递给工具** - 在调用工具函数前会从参数中移除
3. **临时 client 即用即销** - 每次调用完成后临时 client 会被销毁

## 所有工具都支持

**重要：所有 86 个 Gitea MCP 工具都自动支持 `api_token` 参数！**

无需修改任何工具定义，只需在调用时添加 `api_token` 参数即可。

### 示例

```typescript
// ✅ 仓库管理
gitea_repo_create({ name: "test", api_token: "..." })
gitea_repo_delete({ owner: "...", repo: "...", api_token: "..." })

// ✅ Issue 管理
gitea_issue_create({ title: "...", api_token: "..." })
gitea_issue_update({ index: 1, state: "closed", api_token: "..." })

// ✅ PR 管理
gitea_pr_create({ title: "...", head: "...", base: "...", api_token: "..." })
gitea_pr_merge({ index: 1, api_token: "..." })

// ✅ Label 管理
gitea_label_repo_create({ name: "bug", color: "ff0000", api_token: "..." })

// ✅ Webhook 管理
gitea_webhook_repo_create({ type: "discord", config: {...}, api_token: "..." })

// ✅ Team 管理
gitea_team_create({ org: "...", name: "...", api_token: "..." })

// ✅ Wiki 管理
gitea_wiki_create({ pageName: "...", contentBase64: "...", api_token: "..." })

// ... 等等，所有工具都支持！
```

## 对比其他方案

### ❌ 方案 A：每次都传 token（繁琐）
```typescript
// 每次调用都要传，很麻烦
gitea_issue_create({ title: "...", token: "..." })
gitea_issue_list({ token: "..." })
gitea_issue_update({ index: 1, token: "..." })
```

### ❌ 方案 B：全局只有一个 token（不灵活）
```typescript
// 无法支持多用户或不同权限
```

### ✅ 方案 C：默认 + 可覆盖（最佳）
```typescript
// 默认情况：简单
gitea_issue_create({ title: "..." })

// 需要时：灵活
gitea_issue_create({ title: "...", api_token: "..." })
```

## 最佳实践

### 1. 日常开发：使用默认 token

```bash
# .env
GITEA_API_TOKEN=your_personal_token
```

```typescript
// 代码中不需要传 token
gitea_issue_list()
gitea_repo_list()
```

### 2. 多用户系统：动态传递 token

```typescript
async function createIssueForUser(userId: string, issueData: any) {
  // 从数据库获取用户的 token
  const userToken = await getUserToken(userId);

  // 使用用户的 token 创建 issue
  return gitea_issue_create({
    ...issueData,
    api_token: userToken
  });
}
```

### 3. 权限控制：根据操作选择 token

```typescript
const tokens = {
  readonly: "token_with_read_permission",
  write: "token_with_write_permission",
  admin: "token_with_admin_permission"
};

// 查询操作：只读 token
await gitea_issue_list({ api_token: tokens.readonly });

// 修改操作：写 token
await gitea_issue_create({ title: "...", api_token: tokens.write });

// 危险操作：管理员 token
await gitea_repo_delete({
  owner: "test",
  repo: "old",
  api_token: tokens.admin
});
```

### 4. 测试：临时 token

```typescript
// 创建临时 token 用于测试
const testToken = await gitea_token_create({
  username: "test-user",
  password: "test-password",
  token_name: "test-token"
});

// 使用临时 token 执行测试
await gitea_issue_create({
  title: "Test Issue",
  api_token: testToken.token
});

// 测试完成后删除 token
await gitea_token_delete({
  username: "test-user",
  token_id: testToken.id,
  api_token: admin_token
});
```

## 性能影响

### 开销分析

- ✅ **无 api_token 参数**：零开销，直接使用默认 client
- ⚠️ **有 api_token 参数**：创建临时 GiteaClient 实例（~1ms）

### 优化建议

如果频繁使用同一个临时 token，考虑：

```typescript
// ❌ 不推荐：每次都创建临时 client
for (let i = 0; i < 100; i++) {
  await gitea_issue_create({
    title: `Issue ${i}`,
    api_token: sameToken  // 每次都创建新 client
  });
}

// ✅ 推荐：修改默认配置或批量操作
// 方案 1：临时修改环境变量（如果可能）
// 方案 2：在应用层做批处理
```

## 安全建议

### ✅ 推荐做法

1. **使用环境变量存储默认 token**
   ```bash
   GITEA_API_TOKEN=xxx
   ```

2. **动态 token 从安全存储获取**
   ```typescript
   const userToken = await secretManager.getToken(userId);
   ```

3. **不要在代码中硬编码 token**
   ```typescript
   // ❌ 不要这样
   const token = "glpat-xxxxxxxxxxxx";

   // ✅ 应该这样
   const token = process.env.USER_TOKEN;
   ```

4. **使用短期 token**
   ```typescript
   // 创建 1 小时有效的 token
   const token = await createTemporaryToken({ expiresIn: '1h' });
   ```

### ❌ 避免的做法

1. **不要在日志中输出 token**
2. **不要在前端直接暴露 token**
3. **不要在 URL 参数中传递 token**
4. **不要在 Git 仓库中提交 token**

## 故障排查

### 问题：Token 无效

```typescript
// 错误信息：401 Unauthorized

// 检查：
1. token 是否正确
2. token 是否过期
3. token 权限是否足够
```

### 问题：Token 冲突

```typescript
// 同时设置了配置文件和 api_token 参数

// 解决：api_token 参数优先级更高，会覆盖配置文件
```

### 问题：性能下降

```typescript
// 大量使用 api_token 参数导致频繁创建 client

// 解决：
// 1. 尽量使用默认 token
// 2. 在应用层缓存相同 token 的请求
// 3. 使用批量操作 API
```

## 版本历史

- **v0.8.0** - 新增动态 token 支持 ✨

## 相关文档

- [初始化系统](./initialization.md) - 🆕 推荐使用初始化向导快速配置和管理 Token
- [配置说明](../README.md#配置)
- [Token 管理工具](../README.md#token-管理)
- [安全最佳实践](../README.md#安全)
