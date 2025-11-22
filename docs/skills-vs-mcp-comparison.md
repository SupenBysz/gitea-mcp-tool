# Skills 直接调用 API vs 调用 MCP Tools 对比

## 场景：创建一个 Issue 并添加标签

### 方案 A：Skill 调用 MCP Tools

```markdown
# .claude/skills/create-issue-with-labels.md

当用户要求创建带标签的 issue 时：

1. 调用 gitea_issue_create 创建 issue
2. 从返回结果中获取 issue number
3. 调用 gitea_label_issue_add 添加标签

优点：
- 认证自动处理（从 .env 读取）
- 上下文自动使用（owner/repo 来自 context）
- 参数类型自动验证
- 错误统一处理和日志记录
- 跨客户端兼容
```

**使用示例：**
```
用户：创建一个 Bug 修复的 issue，添加 bug 和 urgent 标签
Claude：
1. gitea_issue_create({ title: "Bug修复", body: "..." })
   ✓ Token 自动附加
   ✓ owner/repo 从上下文获取
   ✓ 返回 issue #123

2. gitea_label_repo_list()
   ✓ 获取所有标签，找到 "bug"=1, "urgent"=5

3. gitea_label_issue_add({ index: 123, labels: [1, 5] })
   ✓ 成功添加标签
```

---

### 方案 B：Skill 直接调用 API

```markdown
# .claude/skills/create-issue-with-labels-direct.md

当用户要求创建带标签的 issue 时：

1. 使用 WebFetch 调用 POST /api/v1/repos/{owner}/{repo}/issues
   - URL: https://gitea.ktyun.cc/api/v1/repos/kysion/test/issues
   - Headers: Authorization: token 0e0e61b4f6927e54e55f2edc08d8db4b77256db3
   - Body: { "title": "...", "body": "..." }

2. 使用 WebFetch 调用 POST /api/v1/repos/{owner}/{repo}/issues/{index}/labels
   - URL: https://gitea.ktyun.cc/api/v1/repos/kysion/test/issues/123/labels
   - Headers: Authorization: token 0e0e61b4f6927e54e55f2edc08d8db4b77256db3
   - Body: { "labels": [1, 5] }

问题：
- ❌ Token 硬编码在 skill 文件中
- ❌ BaseURL 硬编码，换环境需要修改
- ❌ owner/repo 硬编码，换仓库需要修改
- ❌ 没有参数验证，可能传错类型
- ❌ 没有统一日志，调试困难
- ❌ 只能在 Claude Code 使用
```

**使用示例：**
```
用户：创建一个 Bug 修复的 issue，添加 bug 和 urgent 标签
Claude：
1. WebFetch POST https://gitea.ktyun.cc/api/v1/repos/kysion/test/issues
   Headers: { Authorization: "token 0e0e61b4..." }
   Body: { title: "Bug修复", body: "..." }

   问题：
   - Token 从哪里来？硬编码？
   - kysion/test 从哪里来？每次都要问用户？

2. WebFetch GET https://gitea.ktyun.cc/api/v1/repos/kysion/test/labels
   找到 "bug"=1, "urgent"=5

3. WebFetch POST https://gitea.ktyun.cc/api/v1/repos/kysion/test/issues/123/labels
   Headers: { Authorization: "token 0e0e61b4..." }
   Body: { labels: [1, 5] }
```

---

## 关键区别总结

| 维度 | MCP Tools | 直接调用 API |
|-----|-----------|-------------|
| **认证管理** | ✅ 集中配置 (.env) | ❌ 硬编码在 skill 中 |
| **上下文管理** | ✅ 自动记忆 owner/repo | ❌ 每次都需要完整路径 |
| **参数验证** | ✅ JSON Schema 验证 | ❌ 完全依赖 Claude |
| **错误处理** | ✅ 统一处理和日志 | ❌ 分散处理 |
| **超时控制** | ✅ 30s 超时配置 | ❌ WebFetch 默认超时 |
| **跨客户端** | ✅ 所有 MCP 客户端 | ❌ 仅 Claude Code |
| **日志记录** | ✅ 结构化日志 (pino) | ❌ 无日志 |
| **环境切换** | ✅ 修改 .env 即可 | ❌ 修改所有 skill |
| **安全性** | ✅ Token 不在代码中 | ❌ Token 暴露在 skill |

---

## 实际问题演示

### 问题 1：Token 管理

**MCP Tools:**
```bash
# .env 文件
GITEA_API_TOKEN=0e0e61b4f6927e54e55f2edc08d8db4b77256db3

# Token 过期后，只需修改一处
GITEA_API_TOKEN=new_token_here
```

**直接调用 API:**
```markdown
# skill-1.md
Authorization: token 0e0e61b4f6927e54e55f2edc08d8db4b77256db3

# skill-2.md
Authorization: token 0e0e61b4f6927e54e55f2edc08d8db4b77256db3

# skill-3.md
Authorization: token 0e0e61b4f6927e54e55f2edc08d8db4b77256db3

# Token 过期后，需要修改 N 个 skill 文件！
```

### 问题 2：环境切换

**场景：** 本地开发用 localhost:3000，生产用 gitea.ktyun.cc

**MCP Tools:**
```bash
# 开发环境 .env.dev
GITEA_BASE_URL=http://localhost:3000
GITEA_API_TOKEN=dev_token

# 生产环境 .env.prod
GITEA_BASE_URL=https://gitea.ktyun.cc
GITEA_API_TOKEN=prod_token

# 切换环境只需换配置文件
```

**直接调用 API:**
```markdown
# 每个 skill 都硬编码了 URL
POST https://gitea.ktyun.cc/api/v1/...

# 切换环境需要：
# 1. 全局搜索替换所有 URL
# 2. 全局替换所有 Token
# 3. 容易遗漏或替换错误
```

### 问题 3：调试和错误追踪

**MCP Tools:**
```json
// 结构化日志
{
  "level": "error",
  "time": "2025-01-30T10:30:00.123Z",
  "name": "tools:issue",
  "msg": "Failed to create issue",
  "error": "401 Unauthorized",
  "endpoint": "/repos/kysion/test/issues",
  "args": {
    "title": "Bug修复",
    "labels": [1, 5]
  }
}
// 可以清楚知道：哪个工具、什么参数、为什么失败
```

**直接调用 API:**
```
// 只有 Claude 的输出
Failed to create issue: 401 Unauthorized

// 不知道：
// - 是认证问题还是权限问题？
// - 传了什么参数？
// - 哪个 API 调用失败的？
```

---

## 结论

**Skills 直接调用 API ≠ 调用 MCP Tools**

虽然最终都是调用 Gitea API，但 MCP Tools 提供了：
1. **认证抽象层** - 安全、集中的 Token 管理
2. **上下文管理** - 自动记忆工作仓库
3. **类型安全** - 参数验证和类型检查
4. **统一错误处理** - 标准化的错误响应
5. **可观测性** - 结构化日志和追踪
6. **跨平台兼容** - 不限于 Claude Code
7. **配置化** - 环境切换简单

**推荐架构：**
```
Skills (工作流编排)
    ↓ 调用
MCP Tools (认证、验证、日志)
    ↓ 调用
Gitea API
```

而不是：
```
Skills (工作流 + 认证 + 验证 + 日志...)
    ↓ 直接调用
Gitea API
```
