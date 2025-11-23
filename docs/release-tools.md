# Release 发布版本管理工具

## 概述

Release 工具模块提供完整的 Gitea 发布版本管理功能，支持创建、查询、更新、删除发布版本，以及管理附件。

**新增工具数量**: 9 个
**总工具数量**: 86 → **95** 个

---

## 功能列表

### 核心操作 (6 个工具)

1. **gitea_release_create** - 创建发布版本
2. **gitea_release_get** - 获取发布版本详情
3. **gitea_release_get_by_tag** - 通过 Tag 获取发布版本
4. **gitea_release_list** - 列出发布版本
5. **gitea_release_update** - 更新发布版本
6. **gitea_release_delete** - 删除发布版本

### 附件管理 (3 个工具)

7. **gitea_release_attachments** - 列出发布版本附件
8. **gitea_release_attachment_get** - 获取附件详情
9. **gitea_release_attachment_delete** - 删除附件

---

## 工具详解

### 1. gitea_release_create

创建新的发布版本。

**参数**:
- `owner` (可选): 仓库所有者，使用上下文默认值
- `repo` (可选): 仓库名称，使用上下文默认值
- `tag_name` (必需): Tag 名称，如 `v1.0.0`
- `name` (可选): 发布名称，默认为 tag_name
- `body` (可选): 发布说明（支持 Markdown）
- `draft` (可选): 是否创建为草稿，默认 false
- `prerelease` (可选): 是否标记为预发布版本，默认 false
- `target_commitish` (可选): 目标分支或提交 SHA，默认为默认分支

**示例**:
```json
{
  "tag_name": "v1.0.0",
  "name": "Version 1.0.0 - Stable Release",
  "body": "## What's New\n\n- Feature A\n- Feature B\n\n## Bug Fixes\n\n- Fixed issue #123",
  "draft": false,
  "prerelease": false
}
```

**使用场景**:
- 发布软件新版本
- 创建里程碑版本
- 标记重要的提交点

---

### 2. gitea_release_get

通过 ID 获取发布版本详情。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `id` (必需): Release ID

**返回信息**:
- Release 基本信息（名称、Tag、创建时间）
- 发布说明
- 附件列表
- 下载统计

---

### 3. gitea_release_get_by_tag

通过 Tag 名称获取发布版本（比用 ID 更方便）。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `tag` (必需): Tag 名称，如 `v1.0.0`

**使用场景**:
- 检查某个版本是否已发布
- 获取最新稳定版信息
- 下载特定版本的附件

---

### 4. gitea_release_list

列出仓库的所有发布版本。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 30
- `draft` (可选): 筛选草稿状态
- `prerelease` (可选): 筛选预发布状态

**示例**:
```json
{
  "page": 1,
  "limit": 10,
  "draft": false,
  "prerelease": false
}
```

**使用场景**:
- 查看所有已发布版本
- 获取版本发布历史
- 生成变更日志

---

### 5. gitea_release_update

更新已存在的发布版本。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `id` (必需): Release ID
- `tag_name` (可选): 新的 Tag 名称
- `name` (可选): 新的发布名称
- `body` (可选): 新的发布说明
- `draft` (可选): 更新草稿状态
- `prerelease` (可选): 更新预发布状态
- `target_commitish` (可选): 新的目标分支或提交

**使用场景**:
- 修正发布说明中的错误
- 将草稿发布为正式版本
- 更新发布标记（如从 prerelease 变为 stable）

---

### 6. gitea_release_delete

删除发布版本。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `id` (必需): Release ID

**注意**:
- 删除 Release 不会删除对应的 Git Tag
- 附件会一并被删除

---

### 7. gitea_release_attachments

列出发布版本的所有附件。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `id` (必需): Release ID

**返回信息**:
- 附件列表
- 文件名、大小、下载次数
- 下载链接

---

### 8. gitea_release_attachment_get

获取特定附件的详细信息。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `id` (必需): Release ID
- `attachment_id` (必需): 附件 ID

---

### 9. gitea_release_attachment_delete

删除发布版本的附件。

**参数**:
- `owner` (可选): 仓库所有者
- `repo` (可选): 仓库名称
- `id` (必需): Release ID
- `attachment_id` (必需): 附件 ID

---

## 实际使用场景

### 场景 1: 自动化发布流程

在 CI/CD 中自动创建 Release：

1. 使用 `gitea_release_create` 创建新版本
2. 构建完成后上传编译产物作为附件
3. 使用 `gitea_release_update` 将草稿变为正式发布

### 场景 2: 版本管理

```bash
# 1. 列出所有稳定版本
gitea_release_list (draft=false, prerelease=false)

# 2. 获取最新版本信息
gitea_release_get_by_tag (tag="v1.0.0")

# 3. 更新发布说明
gitea_release_update (id=123, body="更新的说明")
```

### 场景 3: 下载管理

```bash
# 1. 列出某个版本的所有附件
gitea_release_attachments (id=123)

# 2. 获取附件下载链接
gitea_release_attachment_get (id=123, attachment_id=456)
```

### 场景 4: 清理旧版本

```bash
# 1. 列出所有预发布版本
gitea_release_list (prerelease=true)

# 2. 删除不需要的预发布版本
gitea_release_delete (id=100)
```

---

## 版本发布最佳实践

### 1. 语义化版本

使用语义化版本号命名：
- `v1.0.0` - 主版本.次版本.修订号
- `v1.0.0-alpha.1` - 预发布版本
- `v1.0.0-rc.1` - 候选发布版本

### 2. 完整的发布说明

包含以下内容：
```markdown
## 新增功能
- Feature A
- Feature B

## 改进
- Improvement X

## Bug 修复
- Fixed #123: Description

## 破坏性变更
- Breaking change description

## 升级说明
- Migration steps if needed
```

### 3. 使用草稿功能

1. 先创建为草稿 (`draft: true`)
2. 上传所有附件
3. 完善发布说明
4. 测试验证
5. 更新为正式版本 (`draft: false`)

### 4. 预发布版本管理

- Alpha: 内部测试版本 (`v1.0.0-alpha.1`)
- Beta: 公开测试版本 (`v1.0.0-beta.1`)
- RC: 候选发布版本 (`v1.0.0-rc.1`)
- Stable: 正式版本 (`v1.0.0`)

---

## 与其他工具的集成

### 与 Repository 工具配合

```bash
# 1. 创建 Tag
gitea_repo_tag_create (tag_name="v1.0.0", target="main")

# 2. 创建 Release
gitea_release_create (tag_name="v1.0.0", name="Version 1.0.0")
```

### 与 Issue/PR 工具配合

发布说明中引用 Issue 和 PR：
```markdown
## Fixed Issues
- Fixed #123
- Resolved #456

## Merged PRs
- Merged #789
- Merged #101
```

---

## API 参考

基于 Gitea API 官方文档实现：
- 列出 Releases: `GET /repos/:owner/:repo/releases`
- 获取 Release: `GET /repos/:owner/:repo/releases/:id`
- 通过 Tag 获取: `GET /repos/:owner/:repo/releases/tags/:tag`
- 创建 Release: `POST /repos/:owner/:repo/releases`
- 更新 Release: `PATCH /repos/:owner/:repo/releases/:id`
- 删除 Release: `DELETE /repos/:owner/:repo/releases/:id`
- 列出附件: `GET /repos/:owner/:repo/releases/:id/assets`
- 获取附件: `GET /repos/:owner/:repo/releases/:id/assets/:attachment_id`
- 删除附件: `DELETE /repos/:owner/:repo/releases/:id/assets/:attachment_id`

---

## 常见问题

### Q: Release 和 Tag 有什么区别？

A: Tag 是 Git 的概念，用于标记特定提交。Release 是 Gitea 的功能，在 Tag 基础上添加：
- 发布说明
- 附件（二进制文件）
- 发布状态（草稿、预发布）
- 下载统计

### Q: 如何上传附件？

A: 目前需要通过 Gitea Web UI 上传，或使用第三方工具。未来版本可能会添加上传功能。

### Q: 删除 Release 会删除 Tag 吗？

A: 不会。删除 Release 只删除 Gitea 的发布记录和附件，不影响 Git Tag。

### Q: 可以修改已发布版本的 Tag 吗？

A: 可以使用 `gitea_release_update` 修改 `tag_name`，但不推荐修改已发布的版本标签。

---

## 总结

Release 工具模块为 Gitea MCP Service 添加了完整的版本发布管理能力：

✅ **9 个新工具**: 从创建到删除的完整生命周期管理
✅ **附件支持**: 管理发布附件和下载链接
✅ **灵活筛选**: 支持草稿、预发布等状态筛选
✅ **上下文感知**: 自动使用项目上下文，简化操作

现在总工具数量达到 **95 个**，提供更完整的 DevOps 自动化支持！

---

## 参考资源

- [Gitea Release API 文档](https://docs.gitea.com/api/1.22/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [GitHub Release 最佳实践](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
