# 上下文管理（Context Management）

## 概述

Gitea MCP 从 v0.8.1 开始支持**项目级默认配置**，可以设置默认的：
- ✅ **Owner** - 仓库所有者
- ✅ **Repo** - 仓库名称
- ✅ **Org** - 组织名称
- ✅ **Project** - 项目 ID

这些配置可以通过环境变量或运行时动态设置，所有参数都是**可选的**。

## 核心优势

### 1. 简化高频操作

**不使用默认配置：**
```typescript
// 每次都要指定 owner 和 repo
gitea_issue_create({ owner: "kysion", repo: "test", title: "Bug 1" })
gitea_issue_create({ owner: "kysion", repo: "test", title: "Bug 2" })
gitea_issue_create({ owner: "kysion", repo: "test", title: "Bug 3" })
```

**使用默认配置：**
```typescript
// 设置一次
gitea_context_set({ owner: "kysion", repo: "test" })

// 后续调用无需指定
gitea_issue_create({ title: "Bug 1" })
gitea_issue_create({ title: "Bug 2" })
gitea_issue_create({ title: "Bug 3" })
```

### 2. 多层级上下文

支持同时管理多个层级的上下文：

```typescript
gitea_context_set({
  owner: "kysion",      // 仓库所有者
  repo: "test",         // 仓库名称
  org: "kysion-team",   // 组织名称
  project: 5            // 项目 ID
})

// 仓库级操作自动使用 owner/repo
gitea_issue_create({ title: "Issue 1" })

// 组织级操作自动使用 org
gitea_team_list()

// 项目级操作自动使用 project
gitea_project_get()
```

## 配置方式

### 方式 1：环境变量（推荐）

在 `.env` 文件或 MCP 客户端配置中设置：

```bash
# 基础配置（必填）
GITEA_BASE_URL=http://10.16.72.101:3008
GITEA_API_TOKEN=your_token_here

# 默认上下文（可选）
GITEA_DEFAULT_OWNER=kysion
GITEA_DEFAULT_REPO=test
GITEA_DEFAULT_ORG=kysion-team
GITEA_DEFAULT_PROJECT=5
```

**Claude Desktop 配置示例：**
```json
{
  "mcpServers": {
    "gitea": {
      "command": "npx",
      "args": ["-y", "@kysion/gitea-service-mcp"],
      "env": {
        "GITEA_BASE_URL": "http://10.16.72.101:3008",
        "GITEA_API_TOKEN": "your_token",
        "GITEA_DEFAULT_OWNER": "kysion",
        "GITEA_DEFAULT_REPO": "test",
        "GITEA_DEFAULT_ORG": "kysion-team",
        "GITEA_DEFAULT_PROJECT": "5"
      }
    }
  }
}
```

**优点：**
- ✅ 启动时自动加载
- ✅ 适合固定项目
- ✅ 无需每次设置

### 方式 2：运行时动态设置

在使用过程中随时修改：

```typescript
// 切换到项目 A
gitea_context_set({
  owner: "team-a",
  repo: "project-a"
})

// 操作项目 A
gitea_issue_list()
gitea_pr_list()

// 切换到项目 B
gitea_context_set({
  owner: "team-b",
  repo: "project-b"
})

// 操作项目 B
gitea_issue_list()
gitea_pr_list()
```

**优点：**
- ✅ 灵活切换项目
- ✅ 适合多项目操作
- ✅ 不需要重启服务

## 工具使用

### gitea_context_get

获取当前上下文配置：

```typescript
gitea_context_get()

// 返回：
{
  "success": true,
  "context": {
    "owner": "kysion",
    "repo": "test",
    "org": "kysion-team",
    "project": 5,
    "summary": "kysion/test, org:kysion-team, project:5"
  }
}
```

### gitea_context_set

设置上下文配置（所有参数可选）：

```typescript
// 只设置 owner
gitea_context_set({ owner: "kysion" })

// 只设置 org
gitea_context_set({ org: "kysion-team" })

// 设置多个参数
gitea_context_set({
  owner: "kysion",
  repo: "test",
  org: "kysion-team"
})

// 设置所有参数
gitea_context_set({
  owner: "kysion",
  repo: "test",
  org: "kysion-team",
  project: 5
})
```

## 优先级规则

### 参数覆盖规则

```
显式参数 > 默认上下文 > 配置文件
```

### 示例

```typescript
// 1. 配置文件设置
// GITEA_DEFAULT_OWNER=kysion
// GITEA_DEFAULT_REPO=test

// 2. 运行时设置
gitea_context_set({ owner: "alice", repo: "myrepo" })

// 3. 调用工具
gitea_issue_create({
  title: "Bug",
  owner: "bob"  // 显式指定，优先级最高
})

// 实际使用：owner=bob, repo=myrepo
```

**优先级说明：**
- `owner: "bob"` (显式参数) ✅ **使用**
- `repo: "myrepo"` (运行时设置) ✅ **使用**
- `owner: "kysion"` (配置文件) ❌ 被覆盖
- `repo: "test"` (配置文件) ❌ 被覆盖

## 使用场景

### 场景 1：单项目开发

```bash
# .env
GITEA_DEFAULT_OWNER=kysion
GITEA_DEFAULT_REPO=my-project
```

```typescript
// 所有操作都针对 kysion/my-project
gitea_issue_list()
gitea_pr_list()
gitea_label_repo_list()
gitea_webhook_repo_list()
```

### 场景 2：团队协作（组织）

```bash
# .env
GITEA_DEFAULT_ORG=kysion-team
```

```typescript
// 组织级操作无需指定 org
gitea_team_list()
gitea_org_members()
gitea_webhook_org_list()
```

### 场景 3：多项目切换

```typescript
// 早上：工作项目 A
gitea_context_set({ owner: "company", repo: "product-a" })
gitea_issue_create({ title: "New feature" })
gitea_pr_create({ title: "Fix bug", head: "fix", base: "main" })

// 下午：工作项目 B
gitea_context_set({ owner: "company", repo: "product-b" })
gitea_issue_create({ title: "Optimization" })
gitea_pr_create({ title: "Refactor", head: "refactor", base: "main" })

// 晚上：个人项目
gitea_context_set({ owner: "myname", repo: "hobby-project" })
gitea_issue_list()
```

### 场景 4：项目看板管理

```bash
# .env
GITEA_DEFAULT_OWNER=kysion
GITEA_DEFAULT_REPO=test
GITEA_DEFAULT_PROJECT=5  # 指定默认项目看板
```

```typescript
// 项目级操作无需指定 project
gitea_project_get()
gitea_project_columns()
gitea_project_add_issue({ issue_id: 123 })
```

### 场景 5：CI/CD 管道

```yaml
# .github/workflows/ci.yml
env:
  GITEA_BASE_URL: ${{ secrets.GITEA_URL }}
  GITEA_API_TOKEN: ${{ secrets.GITEA_TOKEN }}
  GITEA_DEFAULT_OWNER: ${{ github.repository_owner }}
  GITEA_DEFAULT_REPO: ${{ github.event.repository.name }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Create deployment issue
        run: |
          # 自动使用当前仓库的 owner/repo
          gitea_issue_create \
            --title "Deployment to production" \
            --body "Deploying version ${{ github.ref }}"

      - name: Trigger webhook
        run: |
          # 自动使用当前仓库的 owner/repo
          gitea_webhook_repo_test --id 1
```

### 场景 6：批量操作

```typescript
// 设置默认上下文
gitea_context_set({ owner: "kysion", repo: "test" })

// 批量创建 issues
for (let i = 1; i <= 10; i++) {
  await gitea_issue_create({
    title: `Task ${i}`,
    body: `Description for task ${i}`
    // 无需指定 owner 和 repo
  })
}

// 批量添加 labels
const issues = await gitea_issue_list()
for (const issue of issues) {
  await gitea_label_issue_add({
    index: issue.number,
    labels: [1, 2, 3]
    // 无需指定 owner 和 repo
  })
}
```

## 常见问题

### Q1: 如何清除上下文？

```typescript
// 设置为空字符串或 undefined
gitea_context_set({ owner: "", repo: "" })

// 或者重新设置新的值
gitea_context_set({ owner: "new-owner", repo: "new-repo" })
```

### Q2: 可以只设置部分参数吗？

可以！所有参数都是可选的：

```typescript
// 只设置 owner
gitea_context_set({ owner: "kysion" })

// 只设置 org
gitea_context_set({ org: "team" })

// 只设置 project
gitea_context_set({ project: 5 })

// 任意组合
gitea_context_set({ owner: "kysion", org: "team" })
```

### Q3: 如何查看当前上下文？

```typescript
gitea_context_get()

// 返回完整的上下文信息，包括 summary
```

### Q4: 临时操作是否会修改上下文？

不会！显式传递的参数不会修改上下文：

```typescript
// 设置上下文
gitea_context_set({ owner: "alice", repo: "repo-a" })

// 临时使用其他仓库
gitea_issue_list({ owner: "bob", repo: "repo-b" })

// 上下文没有改变，仍然是 alice/repo-a
gitea_issue_create({ title: "Bug" })  // 创建在 alice/repo-a
```

### Q5: owner 和 org 有什么区别？

- **owner**: 用于仓库级操作（issue、PR、webhook 等）
- **org**: 用于组织级操作（team、org webhook 等）

```typescript
gitea_context_set({
  owner: "alice",      // 个人仓库所有者
  org: "acme-corp"     // 组织
})

// 仓库操作使用 owner
gitea_issue_list()  // 列出 alice 的 issues

// 组织操作使用 org
gitea_team_list()   // 列出 acme-corp 的 teams
```

### Q6: 环境变量和运行时设置哪个优先？

**运行时设置优先级更高：**

```bash
# 环境变量
GITEA_DEFAULT_OWNER=alice
```

```typescript
// 运行时设置（会覆盖环境变量）
gitea_context_set({ owner: "bob" })

// 使用 bob（运行时设置）
gitea_issue_list()
```

### Q7: 如何在多个团队之间快速切换？

```typescript
// 定义团队配置
const teams = {
  frontend: { owner: "company", repo: "frontend" },
  backend: { owner: "company", repo: "backend" },
  devops: { owner: "company", repo: "infra" }
}

// 快速切换
function switchToTeam(teamName) {
  gitea_context_set(teams[teamName])
}

// 使用
switchToTeam("frontend")
gitea_issue_list()  // frontend 的 issues

switchToTeam("backend")
gitea_issue_list()  // backend 的 issues
```

## 最佳实践

### ✅ 推荐做法

1. **为固定项目设置环境变量**
   ```bash
   # 日常开发的主项目
   GITEA_DEFAULT_OWNER=kysion
   GITEA_DEFAULT_REPO=main-project
   ```

2. **动态切换使用运行时设置**
   ```typescript
   // 需要操作多个项目时
   gitea_context_set({ owner: "team", repo: "project-a" })
   // ... 操作 project-a
   gitea_context_set({ owner: "team", repo: "project-b" })
   // ... 操作 project-b
   ```

3. **重要操作显式指定参数**
   ```typescript
   // 删除操作最好明确指定
   gitea_repo_delete({
     owner: "kysion",
     repo: "old-project"  // 显式指定，避免误删
   })
   ```

4. **使用 summary 确认上下文**
   ```typescript
   const { context } = gitea_context_get()
   console.log(`Current context: ${context.summary}`)
   ```

### ❌ 避免的做法

1. **不要混淆 owner 和 org**
   ```typescript
   // ❌ 错误
   gitea_context_set({ org: "alice" })  // org 应该是组织，不是个人
   gitea_issue_list()  // 会失败

   // ✅ 正确
   gitea_context_set({ owner: "alice" })
   gitea_issue_list()
   ```

2. **不要忘记切换上下文**
   ```typescript
   // ❌ 错误
   gitea_context_set({ owner: "team-a", repo: "repo-a" })
   // ... 操作 repo-a
   // ... 忘记切换
   gitea_issue_create({ title: "Bug" })  // 会创建在 repo-a！

   // ✅ 正确
   gitea_context_set({ owner: "team-b", repo: "repo-b" })
   gitea_issue_create({ title: "Bug" })  // 创建在 repo-b
   ```

3. **不要依赖隐式上下文执行危险操作**
   ```typescript
   // ❌ 不推荐
   gitea_repo_delete()  // 依赖上下文，可能删错

   // ✅ 推荐
   gitea_repo_delete({
     owner: "test",
     repo: "to-delete"  // 明确指定要删除的仓库
   })
   ```

## 版本历史

- **v0.8.1** - 新增 org 和 project 上下文支持 ✨
- **v0.8.0** - 新增动态 token 支持
- **v0.6.0** - 初始 owner/repo 上下文支持

## 相关文档

- [动态 Token 支持](./dynamic-token.md)
- [配置说明](../README.md#配置)
