# Branch 分支管理工具

## 概述

Branch 工具模块提供完整的 Gitea 分支管理功能，支持分支的创建、查询、更新、删除，以及分支保护规则的全面管理。

**新增工具数量**: 10 个
**总工具数量**: 95 → **105** 个
**基于**: Gitea API v1.25+ (最新版本)

---

## 功能列表

### 分支操作 (5 个工具)

1. **gitea_branch_list** - 列出仓库分支
2. **gitea_branch_create** - 创建新分支
3. **gitea_branch_get** - 获取分支详情
4. **gitea_branch_delete** - 删除分支
5. **gitea_branch_rename** - 重命名分支

### 分支保护 (5 个工具)

6. **gitea_branch_protection_list** - 列出分支保护规则
7. **gitea_branch_protection_create** - 创建分支保护规则
8. **gitea_branch_protection_get** - 获取分支保护详情
9. **gitea_branch_protection_update** - 更新分支保护规则
10. **gitea_branch_protection_delete** - 删除分支保护规则

---

## 工具详解

### 1. gitea_branch_list

列出仓库的所有分支。

**参数**:
- `owner` (可选): 仓库所有者，使用上下文默认值
- `repo` (可选): 仓库名称，使用上下文默认值
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 30，最大 100

**返回信息**:
- 分支列表
- 每个分支的提交信息
- 分支保护状态

**示例**:
```json
{
  "page": 1,
  "limit": 10
}
```

---

### 2. gitea_branch_create

从现有分支或提交创建新分支。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `new_branch_name` (必需): 新分支名称
- `old_branch_name` (可选): 源分支名称（与 old_ref_name 二选一）
- `old_ref_name` (可选): 源引用名称（分支/标签/提交 SHA）

**使用场景**:
- 创建功能分支进行开发
- 从特定提交创建修复分支
- 基于 tag 创建发布分支

**示例**:
```json
{
  "new_branch_name": "feature/new-api",
  "old_branch_name": "develop"
}
```

---

### 3. gitea_branch_get

获取特定分支的详细信息，包括其有效的分支保护规则。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `branch` (必需): 分支名称

**返回信息**:
- 分支详情
- 最新提交信息
- 有效的分支保护规则

---

### 4. gitea_branch_delete

删除指定的分支。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `branch` (必需): 要删除的分支名称

**注意事项**:
- 不能删除默认分支
- 如果分支有保护规则，可能无法删除
- 删除操作不可逆

---

### 5. gitea_branch_rename

重命名仓库中的分支。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `branch` (必需): 当前分支名称
- `new_name` (必需): 新分支名称

**使用场景**:
- 修正拼写错误
- 更新分支命名规范
- 重构分支结构

---

### 6. gitea_branch_protection_list

列出仓库的所有分支保护规则。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称

**返回信息**:
- 所有分支保护规则列表
- 每个规则的详细配置
- 规则优先级

---

### 7. gitea_branch_protection_create

为仓库创建分支保护规则。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `rule_name` (可选): 规则名称（支持模式匹配）
- `enable_push` (可选): 启用推送限制
- `enable_push_whitelist` (可选): 启用推送白名单
- `push_whitelist_usernames` (可选): 允许推送的用户名列表
- `push_whitelist_teams` (可选): 允许推送的团队列表
- `push_whitelist_deploy_keys` (可选): 允许部署密钥推送
- `enable_merge_whitelist` (可选): 启用合并白名单
- `merge_whitelist_usernames` (可选): 允许合并的用户名列表
- `merge_whitelist_teams` (可选): 允许合并的团队列表
- `enable_status_check` (可选): 启用状态检查
- `status_check_contexts` (可选): 必需的状态检查上下文列表
- `required_approvals` (可选): 必需的批准数量
- `enable_approvals_whitelist` (可选): 启用批准白名单
- `approvals_whitelist_usernames` (可选): 批准白名单用户
- `approvals_whitelist_teams` (可选): 批准白名单团队
- `block_on_rejected_reviews` (可选): 拒绝审查时阻止合并
- `block_on_outdated_branch` (可选): 分支过时时阻止合并
- `dismiss_stale_approvals` (可选): 推送时撤销过时批准
- `require_signed_commits` (可选): 要求签名提交
- `protected_file_patterns` (可选): 受保护的文件模式
- `unprotected_file_patterns` (可选): 不受保护的文件模式

**使用场景**:
- 保护主分支防止直接推送
- 要求 PR 审查才能合并
- 设置 CI/CD 状态检查
- 实施代码审查流程

**示例 - 保护 main 分支**:
```json
{
  "rule_name": "main",
  "enable_push": true,
  "enable_push_whitelist": true,
  "push_whitelist_usernames": ["admin"],
  "required_approvals": 2,
  "enable_status_check": true,
  "status_check_contexts": ["ci/build", "ci/test"],
  "block_on_outdated_branch": true,
  "require_signed_commits": true
}
```

**示例 - 保护所有 release 分支**:
```json
{
  "rule_name": "release/*",
  "enable_push": true,
  "enable_push_whitelist": true,
  "push_whitelist_teams": ["release-team"],
  "required_approvals": 1,
  "block_on_rejected_reviews": true
}
```

---

### 8. gitea_branch_protection_get

获取特定分支保护规则的详细信息。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `name` (必需): 分支保护规则名称

---

### 9. gitea_branch_protection_update

更新现有的分支保护规则。只有提供的字段会被更新。

**参数**: 与 `gitea_branch_protection_create` 相同，但添加了：
- `name` (必需): 要更新的规则名称

**使用场景**:
- 调整审查要求
- 修改白名单
- 更新状态检查配置

---

### 10. gitea_branch_protection_delete

删除特定的分支保护规则。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `name` (必需): 要删除的规则名称

---

## 实际使用场景

### 场景 1: Git Flow 工作流

```bash
# 1. 创建 develop 分支
gitea_branch_create {
  new_branch_name: "develop",
  old_branch_name: "main"
}

# 2. 保护 main 分支
gitea_branch_protection_create {
  rule_name: "main",
  enable_push: true,
  enable_push_whitelist: true,
  push_whitelist_usernames: ["maintainer"],
  required_approvals: 2
}

# 3. 创建功能分支
gitea_branch_create {
  new_branch_name: "feature/user-auth",
  old_branch_name: "develop"
}

# 4. 完成后删除功能分支
gitea_branch_delete {
  branch: "feature/user-auth"
}
```

### 场景 2: Release 分支管理

```bash
# 1. 列出所有分支
gitea_branch_list

# 2. 从 main 创建 release 分支
gitea_branch_create {
  new_branch_name: "release/v1.0",
  old_branch_name: "main"
}

# 3. 保护 release 分支
gitea_branch_protection_create {
  rule_name: "release/*",
  enable_push: true,
  enable_push_whitelist: true,
  push_whitelist_teams: ["release-managers"],
  required_approvals: 1,
  block_on_rejected_reviews: true
}
```

### 场景 3: 热修复流程

```bash
# 1. 从 tag 创建热修复分支
gitea_branch_create {
  new_branch_name: "hotfix/security-patch",
  old_ref_name: "v1.0.0"  # 从 tag 创建
}

# 2. 获取分支详情确认
gitea_branch_get {
  branch: "hotfix/security-patch"
}

# 3. 修复完成后删除
gitea_branch_delete {
  branch: "hotfix/security-patch"
}
```

### 场景 4: 团队协作权限管理

```bash
# 1. 列出所有保护规则
gitea_branch_protection_list

# 2. 为 develop 分支设置团队权限
gitea_branch_protection_create {
  rule_name: "develop",
  enable_push: true,
  enable_push_whitelist: true,
  push_whitelist_teams: ["developers"],
  enable_merge_whitelist: true,
  merge_whitelist_teams: ["senior-developers"],
  required_approvals: 1,
  enable_status_check: true,
  status_check_contexts: ["ci/test"]
}

# 3. 更新规则（增加必需批准数）
gitea_branch_protection_update {
  name: "develop",
  required_approvals: 2
}
```

### 场景 5: CI/CD 集成

```bash
# 1. 设置要求 CI 通过才能合并
gitea_branch_protection_create {
  rule_name: "main",
  enable_status_check: true,
  status_check_contexts: [
    "ci/build",
    "ci/test",
    "ci/lint",
    "security/scan"
  ],
  required_approvals: 1,
  block_on_outdated_branch: true
}

# 2. 获取保护规则详情
gitea_branch_protection_get {
  name: "main"
}
```

---

## 分支保护最佳实践

### 1. 主分支保护

**推荐配置**:
```json
{
  "rule_name": "main",
  "enable_push": true,
  "enable_push_whitelist": true,
  "push_whitelist_usernames": ["bot"],
  "required_approvals": 2,
  "enable_status_check": true,
  "status_check_contexts": ["ci/build", "ci/test"],
  "block_on_rejected_reviews": true,
  "block_on_outdated_branch": true,
  "dismiss_stale_approvals": true,
  "require_signed_commits": true
}
```

**特点**:
- 禁止直接推送（除了 CI bot）
- 要求 2 个批准
- 必须通过 CI 检查
- 拒绝审查时阻止合并
- 分支过时时阻止合并
- 推送时撤销旧批准
- 要求签名提交

### 2. 开发分支保护

**推荐配置**:
```json
{
  "rule_name": "develop",
  "enable_push": true,
  "enable_push_whitelist": true,
  "push_whitelist_teams": ["developers"],
  "required_approvals": 1,
  "enable_status_check": true,
  "status_check_contexts": ["ci/test"],
  "block_on_rejected_reviews": false,
  "block_on_outdated_branch": false
}
```

**特点**:
- 开发团队可以推送
- 至少 1 个批准
- 必须通过测试
- 较宽松的合并规则

### 3. Release 分支保护

**推荐配置**:
```json
{
  "rule_name": "release/*",
  "enable_push": true,
  "enable_push_whitelist": true,
  "push_whitelist_teams": ["release-managers"],
  "required_approvals": 2,
  "enable_status_check": true,
  "status_check_contexts": ["ci/build", "ci/test", "security/scan"],
  "block_on_rejected_reviews": true,
  "require_signed_commits": true
}
```

**特点**:
- 仅发布经理可推送
- 要求 2 个批准
- 严格的 CI 检查
- 必须签名提交

### 4. 模式匹配

分支保护支持模式匹配：
- `main` - 精确匹配
- `release/*` - 匹配所有 release 分支
- `feature/*` - 匹配所有 feature 分支
- `hotfix/*` - 匹配所有 hotfix 分支

---

## 与其他工具的集成

### 与 Issue/PR 工具配合

```bash
# 1. 创建功能分支
gitea_branch_create {
  new_branch_name: "feature/issue-123",
  old_branch_name: "develop"
}

# 2. 创建 Issue
gitea_issue_create {
  title: "Implement feature X",
  body: "Working on feature branch: feature/issue-123"
}

# 3. 创建 PR
gitea_pr_create {
  head: "feature/issue-123",
  base: "develop",
  title: "Fix #123: Implement feature X"
}
```

### 与 Release 工具配合

```bash
# 1. 创建 release 分支
gitea_branch_create {
  new_branch_name: "release/v1.0",
  old_branch_name: "develop"
}

# 2. 创建 Release
gitea_release_create {
  tag_name: "v1.0.0",
  target_commitish: "release/v1.0",
  name: "Version 1.0.0"
}

# 3. 合并回 main 后删除 release 分支
gitea_branch_delete {
  branch: "release/v1.0"
}
```

---

## API 参考

基于 Gitea API 官方文档实现（v1.25+）：

### 分支操作
- 列出分支: `GET /repos/:owner/:repo/branches`
- 创建分支: `POST /repos/:owner/:repo/branches`
- 获取分支: `GET /repos/:owner/:repo/branches/:branch`
- 删除分支: `DELETE /repos/:owner/:repo/branches/:branch`
- 重命名分支: `PATCH /repos/:owner/:repo/branches/:branch`

### 分支保护
- 列出保护规则: `GET /repos/:owner/:repo/branch_protections`
- 创建保护规则: `POST /repos/:owner/:repo/branch_protections`
- 获取保护规则: `GET /repos/:owner/:repo/branch_protections/:name`
- 更新保护规则: `PATCH /repos/:owner/:repo/branch_protections/:name`
- 删除保护规则: `DELETE /repos/:owner/:repo/branch_protections/:name`

---

## 常见问题

### Q: 如何防止直接推送到主分支？

A: 创建分支保护规则，启用推送限制：
```json
{
  "rule_name": "main",
  "enable_push": true,
  "enable_push_whitelist": true,
  "push_whitelist_usernames": []  // 空白名单 = 无人可推送
}
```

### Q: 如何设置 CI 通过才能合并？

A: 启用状态检查：
```json
{
  "rule_name": "main",
  "enable_status_check": true,
  "status_check_contexts": ["ci/build", "ci/test"]
}
```

### Q: 可以删除有保护规则的分支吗？

A: 如果分支被保护规则匹配，可能无法删除。需要先删除或修改保护规则。

### Q: 分支重命名会影响 PR 吗？

A: 是的，重命名分支可能会影响相关的 PR。建议在重命名前确保没有未合并的 PR。

### Q: 模式匹配规则的优先级如何？

A: Gitea 按照创建顺序应用规则。如果多个规则匹配同一分支，通常使用最严格的设置。

---

## 总结

Branch 工具模块为 Gitea MCP Service 添加了完整的分支管理和保护能力：

✅ **10 个新工具**: 覆盖分支的完整生命周期和保护规则管理
✅ **Git Flow 支持**: 完整支持 Git Flow 和其他分支策略
✅ **细粒度权限**: 支持用户、团队级别的权限控制
✅ **CI/CD 集成**: 状态检查和审查流程集成
✅ **上下文感知**: 自动使用项目上下文，简化操作

现在总工具数量达到 **105 个**，覆盖度提升到 **65%**！

---

## 参考资源

### Sources:
- [Gitea API Documentation](https://docs.gitea.com/api/)
- [Gitea Demo Swagger UI](https://demo.gitea.com/api/swagger)
- [Git Flow Workflow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Branch Protection Best Practices](https://docs.gitea.com/enterprise/features/branch-protection)
