# 动态 Token 使用示例

## 基础示例

### 示例 1：使用默认 Token

```typescript
// 场景：个人开发，使用配置文件中的 token

// .env 文件
GITEA_BASE_URL=https://gitea.ktyun.cc
GITEA_API_TOKEN=your_personal_token

// 调用时不需要传 token
gitea_issue_list()  // 自动使用配置中的 token

gitea_repo_list()  // 自动使用配置中的 token

gitea_issue_create({
  title: "新功能开发",
  body: "需要实现用户管理功能"
})  // 自动使用配置中的 token
```

### 示例 2：使用临时 Token

```typescript
// 场景：需要使用不同用户的权限执行操作

// 用户 A 的 token
const userA_token = "glpat-aaaaaaaaaaaaaaaa";

// 用户 B 的 token
const userB_token = "glpat-bbbbbbbbbbbbbbbb";

// 使用用户 A 的身份创建 issue
gitea_issue_create({
  title: "Bug 报告",
  body: "发现一个严重 bug",
  api_token: userA_token  // 使用用户 A 的 token
})

// 使用用户 B 的身份创建 issue
gitea_issue_create({
  title: "功能请求",
  body: "希望增加导出功能",
  api_token: userB_token  // 使用用户 B 的 token
})
```

## 高级示例

### 示例 3：多用户系统

```typescript
// 场景：构建一个多用户的 Gitea 管理平台

class GiteaService {
  // 根据用户 ID 获取 token
  async getUserToken(userId: string): Promise<string> {
    // 从数据库或 secret 管理器获取
    return await db.getUserToken(userId);
  }

  // 为用户创建 issue
  async createIssueForUser(
    userId: string,
    issueData: { title: string; body: string }
  ) {
    const userToken = await this.getUserToken(userId);

    return gitea_issue_create({
      title: issueData.title,
      body: issueData.body,
      api_token: userToken  // 使用用户的 token
    });
  }

  // 为用户列出 issues
  async listIssuesForUser(userId: string) {
    const userToken = await this.getUserToken(userId);

    return gitea_issue_list({
      api_token: userToken  // 使用用户的 token
    });
  }
}

// 使用示例
const service = new GiteaService();

// 用户 1 创建 issue
await service.createIssueForUser("user-1", {
  title: "我的 issue",
  body: "这是用户 1 创建的"
});

// 用户 2 创建 issue
await service.createIssueForUser("user-2", {
  title: "另一个 issue",
  body: "这是用户 2 创建的"
});
```

### 示例 4：权限分离

```typescript
// 场景：不同操作使用不同权限的 token

const tokens = {
  // 只读 token（read scope）
  readonly: "glpat-readonly-token",

  // 写入 token（read + write scope）
  write: "glpat-write-token",

  // 管理员 token（admin scope）
  admin: "glpat-admin-token"
};

// 查询操作：使用只读 token
const issues = await gitea_issue_list({
  api_token: tokens.readonly
});

const repos = await gitea_repo_list({
  api_token: tokens.readonly
});

// 创建/修改操作：使用写入 token
await gitea_issue_create({
  title: "新 issue",
  body: "描述",
  api_token: tokens.write
});

await gitea_pr_create({
  title: "新 PR",
  head: "feature",
  base: "main",
  api_token: tokens.write
});

// 危险操作：使用管理员 token
await gitea_repo_delete({
  owner: "test",
  repo: "old-project",
  api_token: tokens.admin  // 需要管理员权限
});

await gitea_team_delete({
  id: 5,
  api_token: tokens.admin  // 需要管理员权限
});
```

### 示例 5：租户隔离（SaaS 场景）

```typescript
// 场景：SaaS 平台，每个租户有自己的 Gitea 实例和 token

interface Tenant {
  id: string;
  name: string;
  giteaToken: string;
}

class MultiTenantGiteaService {
  private tenants: Map<string, Tenant>;

  constructor() {
    this.tenants = new Map();
  }

  // 注册租户
  registerTenant(tenant: Tenant) {
    this.tenants.set(tenant.id, tenant);
  }

  // 为租户创建仓库
  async createRepoForTenant(tenantId: string, repoName: string) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    return gitea_repo_create({
      name: repoName,
      private: true,
      api_token: tenant.giteaToken  // 使用租户的 token
    });
  }

  // 为租户列出 issues
  async listIssuesForTenant(tenantId: string) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    return gitea_issue_list({
      api_token: tenant.giteaToken  // 使用租户的 token
    });
  }
}

// 使用示例
const service = new MultiTenantGiteaService();

// 注册租户
service.registerTenant({
  id: "tenant-a",
  name: "公司 A",
  giteaToken: "glpat-tenant-a-token"
});

service.registerTenant({
  id: "tenant-b",
  name: "公司 B",
  giteaToken: "glpat-tenant-b-token"
});

// 租户 A 创建仓库
await service.createRepoForTenant("tenant-a", "project-alpha");

// 租户 B 创建仓库
await service.createRepoForTenant("tenant-b", "project-beta");

// 租户之间完全隔离
```

### 示例 6：临时授权（短期 Token）

```typescript
// 场景：为外部用户提供短期访问权限

class TemporaryAccessService {
  // 创建短期 token（1 小时有效）
  async createTemporaryToken(username: string, password: string): Promise<string> {
    const result = await gitea_token_create({
      username: username,
      password: password,
      token_name: `temp-token-${Date.now()}`,
      scopes: ["read:repository", "write:issue"]
    });

    // 1 小时后自动删除 token（需要后台任务支持）
    setTimeout(async () => {
      await gitea_token_delete({
        username: username,
        token_id: result.token.id,
        password: password
      });
    }, 3600000);  // 1 小时

    return result.token.token;
  }

  // 使用临时 token 执行操作
  async performTemporaryOperation(tempToken: string) {
    // 临时用户可以查看 issues
    const issues = await gitea_issue_list({
      api_token: tempToken
    });

    // 临时用户可以创建 issues
    await gitea_issue_create({
      title: "临时用户创建的 issue",
      body: "这个 token 1 小时后会失效",
      api_token: tempToken
    });

    // 但不能执行危险操作（token 没有 admin scope）
    // await gitea_repo_delete({ ... api_token: tempToken });  // 会失败
  }
}

// 使用示例
const service = new TemporaryAccessService();

// 为外部用户创建临时 token
const tempToken = await service.createTemporaryToken(
  "external-user",
  "their-password"
);

// 外部用户使用临时 token 操作
await service.performTemporaryOperation(tempToken);
```

### 示例 7：测试环境隔离

```typescript
// 场景：同时操作开发、测试、生产环境

const environments = {
  dev: {
    baseUrl: "http://dev.gitea.local:3000",
    token: "glpat-dev-token"
  },
  test: {
    baseUrl: "http://test.gitea.local:3000",
    token: "glpat-test-token"
  },
  prod: {
    baseUrl: "http://gitea.example.com",
    token: "glpat-prod-token"
  }
};

// 在开发环境创建测试仓库
await gitea_repo_create({
  name: "test-repo",
  description: "开发环境测试",
  api_token: environments.dev.token
});

// 在测试环境创建相同仓库
await gitea_repo_create({
  name: "test-repo",
  description: "测试环境验证",
  api_token: environments.test.token
});

// 在生产环境创建（需要更谨慎）
if (confirm("确定要在生产环境创建？")) {
  await gitea_repo_create({
    name: "test-repo",
    description: "生产环境",
    api_token: environments.prod.token
  });
}
```

### 示例 8：CI/CD 管道

```typescript
// 场景：在 CI/CD 中使用不同的 token

class CIPipeline {
  private ciToken: string;

  constructor(ciToken: string) {
    this.ciToken = ciToken;
  }

  // 构建完成后创建 Release
  async createRelease(version: string) {
    return gitea_release_create({
      tag_name: version,
      name: `Release ${version}`,
      body: "自动发布",
      api_token: this.ciToken  // CI 专用 token
    });
  }

  // 部署完成后创建 issue 通知
  async notifyDeployment(env: string) {
    return gitea_issue_create({
      title: `部署完成：${env}`,
      body: `环境 ${env} 已成功部署`,
      labels: [1, 5],  // deployment, success
      api_token: this.ciToken
    });
  }

  // 测试失败时创建 issue
  async reportTestFailure(testName: string, error: string) {
    return gitea_issue_create({
      title: `测试失败：${testName}`,
      body: `错误信息：${error}`,
      labels: [2, 7],  // test, failure
      api_token: this.ciToken
    });
  }
}

// GitHub Actions / GitLab CI 中使用
const pipeline = new CIPipeline(process.env.CI_GITEA_TOKEN);

// 在构建流程中调用
await pipeline.createRelease("v1.2.3");
await pipeline.notifyDeployment("production");
```

## 完整应用示例

### 示例 9：Gitea 管理 Dashboard

```typescript
// 场景：构建一个 Web Dashboard，管理多个 Gitea 账户

import express from 'express';

const app = express();

// 用户登录后，将他们的 Gitea token 存储在 session 中
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 验证并创建 token
    const tokenResult = await gitea_token_create({
      username: username,
      password: password,
      token_name: `dashboard-${Date.now()}`
    });

    // 存储到 session
    req.session.giteaToken = tokenResult.token.token;
    req.session.username = username;

    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ error: "登录失败" });
  }
});

// 获取用户的仓库列表
app.get('/api/repos', async (req, res) => {
  const userToken = req.session.giteaToken;

  if (!userToken) {
    return res.status(401).json({ error: "未登录" });
  }

  try {
    const repos = await gitea_repo_list({
      api_token: userToken  // 使用用户自己的 token
    });

    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: "获取失败" });
  }
});

// 创建 issue
app.post('/api/issues', async (req, res) => {
  const userToken = req.session.giteaToken;
  const { title, body } = req.body;

  if (!userToken) {
    return res.status(401).json({ error: "未登录" });
  }

  try {
    const issue = await gitea_issue_create({
      title,
      body,
      api_token: userToken  // 使用用户自己的 token
    });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: "创建失败" });
  }
});

app.listen(3000);
```

## 注意事项

### ✅ 推荐做法

1. **Token 安全存储**
   ```typescript
   // 使用环境变量或 secret 管理器
   const token = process.env.GITEA_TOKEN;

   // 不要硬编码
   // const token = "glpat-xxxx";  // ❌ 不要这样
   ```

2. **Token 作用域最小化**
   ```typescript
   // 只读操作用只读 token
   await gitea_issue_list({ api_token: readonlyToken });

   // 写操作用写 token
   await gitea_issue_create({ ..., api_token: writeToken });

   // 危险操作用管理员 token
   await gitea_repo_delete({ ..., api_token: adminToken });
   ```

3. **错误处理**
   ```typescript
   try {
     await gitea_issue_create({
       title: "Test",
       api_token: userToken
     });
   } catch (error) {
     if (error.status === 401) {
       console.error("Token 无效或已过期");
     } else if (error.status === 403) {
       console.error("Token 权限不足");
     } else {
       console.error("操作失败", error);
     }
   }
   ```

### ❌ 避免的做法

1. **不要在日志中输出 token**
   ```typescript
   // ❌ 不要这样
   console.log(`Using token: ${userToken}`);

   // ✅ 应该这样
   console.log("Using user token");
   ```

2. **不要在 URL 中传递 token**
   ```typescript
   // ❌ 不要这样
   fetch(`/api/repos?token=${userToken}`);

   // ✅ 应该这样
   fetch('/api/repos', {
     headers: { Authorization: `token ${userToken}` }
   });
   ```

3. **不要长期存储 token**
   ```typescript
   // ❌ 不要这样
   localStorage.setItem('gitea_token', token);

   // ✅ 应该这样（使用 session 或短期存储）
   sessionStorage.setItem('gitea_token', token);
   ```

## 总结

动态 Token 功能让 Gitea MCP 更加灵活和强大：

- ✅ 支持多用户场景
- ✅ 支持权限隔离
- ✅ 支持租户隔离
- ✅ 支持临时授权
- ✅ 支持环境隔离
- ✅ 所有 86 个工具自动支持

只需在调用时添加 `api_token` 参数即可！
