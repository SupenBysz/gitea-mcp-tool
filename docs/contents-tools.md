# Contents 文件操作工具完整指南

## 概述

Contents 模块提供了完整的仓库文件管理功能，支持文件的创建、读取、更新、删除以及归档下载。所有操作都支持 Git 提交信息配置，包括作者、提交者、分支管理等。

**工具数量**: 6 个
**API 覆盖度**: 100%
**版本要求**: Gitea v1.14+

---

## 工具列表

### 1. gitea_contents_get - 获取文件或目录内容

获取仓库中文件或目录的元数据和内容。

#### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| owner | string | 否 | 仓库所有者（使用上下文时可选）|
| repo | string | 否 | 仓库名称（使用上下文时可选）|
| filepath | string | 是 | 文件或目录路径 |
| ref | string | 否 | 分支/标签/提交名称（默认为默认分支）|

#### 示例

```typescript
// 获取文件内容
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "README.md"
}

// 获取特定分支的文件
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "src/config.json",
  "ref": "develop"
}

// 列出目录内容
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "src"
}
```

#### 返回内容

文件元数据包括：
- name: 文件名
- path: 文件路径
- sha: 文件的 Git SHA
- size: 文件大小
- content: 文件内容（base64 编码）
- encoding: 编码方式（base64）
- type: 类型（file/dir）

---

### 2. gitea_contents_create - 创建文件

在仓库中创建新文件。

#### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| owner | string | 否 | 仓库所有者（使用上下文时可选）|
| repo | string | 否 | 仓库名称（使用上下文时可选）|
| filepath | string | 是 | 要创建的文件路径 |
| content | string | 是 | 文件内容（必须 base64 编码）|
| message | string | 否 | 提交消息 |
| branch | string | 否 | 基础分支（默认为默认分支）|
| new_branch | string | 否 | 从基础分支创建新分支 |
| author | object | 否 | 作者信息 {name, email} |
| committer | object | 否 | 提交者信息 {name, email} |
| signoff | boolean | 否 | 添加 Signed-off-by 签名 |
| force_push | boolean | 否 | 如果新分支已存在，强制推送 |

#### 示例

```typescript
// 创建简单文件
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "docs/guide.md",
  "content": "SGVsbG8gV29ybGQ=",  // "Hello World" in base64
  "message": "Add guide document"
}

// 在新分支上创建文件
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "config/production.json",
  "content": "eyJlbnYiOiAicHJvZHVjdGlvbiJ9",  // base64 encoded JSON
  "message": "Add production config",
  "branch": "main",
  "new_branch": "feature/production-config",
  "author": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### 3. gitea_contents_update - 更新文件

更新现有文件，如果不提供 SHA 则创建新文件。

#### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| owner | string | 否 | 仓库所有者（使用上下文时可选）|
| repo | string | 否 | 仓库名称（使用上下文时可选）|
| filepath | string | 是 | 要更新的文件路径 |
| content | string | 是 | 新文件内容（必须 base64 编码）|
| sha | string | 否 | 要更新文件的 SHA（不提供则创建新文件）|
| message | string | 否 | 提交消息 |
| branch | string | 否 | 基础分支（默认为默认分支）|
| new_branch | string | 否 | 从基础分支创建新分支 |
| from_path | string | 否 | 原始文件路径（用于移动/重命名）|
| author | object | 否 | 作者信息 {name, email} |
| committer | object | 否 | 提交者信息 {name, email} |
| signoff | boolean | 否 | 添加 Signed-off-by 签名 |
| force_push | boolean | 否 | 如果新分支已存在，强制推送 |

#### 示例

```typescript
// 更新文件内容
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "README.md",
  "content": "VXBkYXRlZCBjb250ZW50",  // base64 encoded
  "sha": "a1b2c3d4e5f6",
  "message": "Update README with new information"
}

// 重命名/移动文件
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "docs/new-location.md",
  "content": "U2FtZSBjb250ZW50",  // same content
  "sha": "a1b2c3d4e5f6",
  "from_path": "docs/old-location.md",
  "message": "Move documentation file"
}
```

---

### 4. gitea_contents_delete - 删除文件

从仓库中删除文件。

#### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| owner | string | 否 | 仓库所有者（使用上下文时可选）|
| repo | string | 否 | 仓库名称（使用上下文时可选）|
| filepath | string | 是 | 要删除的文件路径 |
| sha | string | 是 | 要删除文件的 SHA（必需）|
| message | string | 否 | 提交消息 |
| branch | string | 否 | 基础分支（默认为默认分支）|
| new_branch | string | 否 | 从基础分支创建新分支 |
| author | object | 否 | 作者信息 {name, email} |
| committer | object | 否 | 提交者信息 {name, email} |
| signoff | boolean | 否 | 添加 Signed-off-by 签名 |
| force_push | boolean | 否 | 如果新分支已存在，强制推送 |

#### 示例

```typescript
// 删除文件
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "deprecated/old-file.txt",
  "sha": "a1b2c3d4e5f6",
  "message": "Remove deprecated file"
}

// 在新分支上删除文件
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "config/test.json",
  "sha": "a1b2c3d4e5f6",
  "message": "Remove test config",
  "branch": "main",
  "new_branch": "cleanup/remove-test-config"
}
```

---

### 5. gitea_contents_raw - 获取原始文件内容

获取文件的原始内容（非 base64 编码）。

#### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| owner | string | 否 | 仓库所有者（使用上下文时可选）|
| repo | string | 否 | 仓库名称（使用上下文时可选）|
| filepath | string | 是 | 文件路径 |
| ref | string | 否 | 分支/标签/提交名称（默认为默认分支）|

#### 示例

```typescript
// 获取原始文件内容
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "package.json"
}

// 获取特定版本的文件
{
  "owner": "myorg",
  "repo": "myrepo",
  "filepath": "config.yaml",
  "ref": "v1.0.0"
}
```

---

### 6. gitea_repo_archive - 下载仓库归档

下载仓库在特定 ref 的归档文件。

#### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| owner | string | 否 | 仓库所有者（使用上下文时可选）|
| repo | string | 否 | 仓库名称（使用上下文时可选）|
| archive | string | 是 | 归档格式: {ref}.{format}（如 "main.zip"、"v1.0.0.tar.gz"）|

#### 支持的格式

- `.zip` - ZIP 压缩包
- `.tar.gz` - GZIP 压缩的 TAR 包
- `.tar` - 未压缩的 TAR 包

#### 示例

```typescript
// 下载主分支的 ZIP 归档
{
  "owner": "myorg",
  "repo": "myrepo",
  "archive": "main.zip"
}

// 下载特定标签的 tar.gz 归档
{
  "owner": "myorg",
  "repo": "myrepo",
  "archive": "v1.0.0.tar.gz"
}

// 下载特定提交的归档
{
  "owner": "myorg",
  "repo": "myrepo",
  "archive": "a1b2c3d.tar"
}
```

---

## 实际使用场景

### 场景 1: 批量文件管理

**需求**: 自动化创建和更新配置文件

```typescript
// 1. 创建配置目录结构
const files = [
  { path: "config/production.json", content: btoa('{"env":"production"}') },
  { path: "config/staging.json", content: btoa('{"env":"staging"}') },
  { path: "config/development.json", content: btoa('{"env":"development"}') }
];

for (const file of files) {
  await gitea_contents_create({
    owner: "myorg",
    repo: "myapp",
    filepath: file.path,
    content: file.content,
    message: `Add ${file.path}`,
    branch: "main",
    new_branch: "feature/add-configs"
  });
}

// 2. 批量更新文件
for (const file of files) {
  const current = await gitea_contents_get({
    owner: "myorg",
    repo: "myapp",
    filepath: file.path,
    ref: "feature/add-configs"
  });

  await gitea_contents_update({
    owner: "myorg",
    repo: "myapp",
    filepath: file.path,
    content: btoa('{"env":"' + file.env + '","version":"2.0"}'),
    sha: current.sha,
    message: `Update ${file.path} to v2.0`
  });
}
```

---

### 场景 2: 文档自动生成

**需求**: 根据代码自动生成文档并提交

```typescript
// 1. 生成文档内容
const apiDocs = generateAPIDocumentation();
const userGuide = generateUserGuide();

// 2. 创建文档文件
await gitea_contents_create({
  owner: "myorg",
  repo: "myproject",
  filepath: "docs/api.md",
  content: btoa(apiDocs),
  message: "docs: Auto-generate API documentation",
  branch: "main",
  new_branch: "docs/auto-update",
  author: {
    name: "Documentation Bot",
    email: "bot@example.com"
  }
});

await gitea_contents_create({
  owner: "myorg",
  repo: "myproject",
  filepath: "docs/user-guide.md",
  content: btoa(userGuide),
  message: "docs: Auto-generate user guide",
  branch: "main",
  new_branch: "docs/auto-update"
});
```

---

### 场景 3: 代码仓库迁移

**需求**: 从一个仓库复制文件到另一个仓库

```typescript
// 1. 获取源仓库文件列表
const sourceFiles = await gitea_contents_get({
  owner: "sourceorg",
  repo: "sourcerepo",
  filepath: "src"
});

// 2. 逐个文件复制到目标仓库
for (const file of sourceFiles) {
  if (file.type === 'file') {
    // 获取原始文件内容
    const content = await gitea_contents_get({
      owner: "sourceorg",
      repo: "sourcerepo",
      filepath: file.path
    });

    // 创建到目标仓库
    await gitea_contents_create({
      owner: "targetorg",
      repo: "targetrepo",
      filepath: file.path,
      content: content.content,
      message: `Migrate ${file.path} from sourcerepo`
    });
  }
}
```

---

### 场景 4: 配置文件版本管理

**需求**: 根据环境更新配置文件

```typescript
// 1. 获取当前配置
const config = await gitea_contents_get({
  owner: "myorg",
  repo: "myapp",
  filepath: "config/app.yaml"
});

// 2. 解析并修改配置
const currentConfig = yaml.parse(atob(config.content));
currentConfig.database.host = "prod-db.example.com";
currentConfig.cache.enabled = true;

// 3. 更新配置文件
await gitea_contents_update({
  owner: "myorg",
  repo: "myapp",
  filepath: "config/app.yaml",
  content: btoa(yaml.stringify(currentConfig)),
  sha: config.sha,
  message: "config: Update database host for production",
  branch: "main",
  new_branch: "config/production-update",
  author: {
    name: "DevOps Bot",
    email: "devops@example.com"
  },
  signoff: true
});
```

---

### 场景 5: 文件归档和备份

**需求**: 定期备份仓库特定版本

```typescript
// 1. 下载主分支最新归档
const mainArchive = await gitea_repo_archive({
  owner: "myorg",
  repo: "critical-app",
  archive: "main.tar.gz"
});

// 2. 下载所有发布版本归档
const releases = ["v1.0.0", "v1.1.0", "v2.0.0"];

for (const version of releases) {
  const archive = await gitea_repo_archive({
    owner: "myorg",
    repo: "critical-app",
    archive: `${version}.zip`
  });

  // 保存到备份存储
  saveToBackupStorage(`backup-${version}.zip`, archive);
}

// 3. 下载特定提交归档
const commitArchive = await gitea_repo_archive({
  owner: "myorg",
  repo: "critical-app",
  archive: "a1b2c3d4e5f6789.tar.gz"
});
```

---

## 高级用法

### 1. Base64 编码处理

所有文件内容在创建和更新时必须使用 base64 编码：

```typescript
// JavaScript/Node.js
const content = Buffer.from("Hello World").toString('base64');

// 浏览器
const content = btoa("Hello World");

// 解码
const decoded = Buffer.from(content, 'base64').toString('utf8');
// 或浏览器中: atob(content)
```

### 2. 文件移动和重命名

使用 `update` 工具的 `from_path` 参数：

```typescript
// 重命名文件
await gitea_contents_update({
  owner: "myorg",
  repo: "myrepo",
  filepath: "src/new-name.ts",
  content: originalContent,  // 保持相同内容
  sha: originalSha,
  from_path: "src/old-name.ts",
  message: "Rename old-name.ts to new-name.ts"
});

// 移动文件到新目录
await gitea_contents_update({
  owner: "myorg",
  repo: "myrepo",
  filepath: "lib/utils.ts",
  content: originalContent,
  sha: originalSha,
  from_path: "src/utils.ts",
  message: "Move utils.ts to lib directory"
});
```

### 3. 分支策略

使用 `branch` 和 `new_branch` 实现不同的分支策略：

```typescript
// 直接在主分支上提交
await gitea_contents_create({
  filepath: "hotfix.txt",
  content: btoa("urgent fix"),
  message: "hotfix: Critical bug fix",
  branch: "main"
});

// 在新功能分支上工作
await gitea_contents_create({
  filepath: "feature.txt",
  content: btoa("new feature"),
  message: "feat: Add new feature",
  branch: "main",
  new_branch: "feature/new-feature"
});

// 在现有分支上继续工作
await gitea_contents_update({
  filepath: "feature.txt",
  content: btoa("updated feature"),
  sha: previousSha,
  message: "feat: Update feature",
  branch: "feature/new-feature"
});
```

### 4. Git 身份配置

为自动化操作配置专用的 Git 身份：

```typescript
const botIdentity = {
  name: "CI Bot",
  email: "ci-bot@example.com"
};

await gitea_contents_create({
  filepath: "generated/report.md",
  content: btoa(report),
  message: "ci: Generate automated report",
  author: botIdentity,
  committer: botIdentity,
  signoff: true  // 添加 Signed-off-by: CI Bot <ci-bot@example.com>
});
```

---

## 最佳实践

### 1. 获取文件前的检查

```typescript
// 获取文件并检查类型
const entry = await gitea_contents_get({
  owner: "myorg",
  repo: "myrepo",
  filepath: "path/to/entry"
});

if (entry.type === 'file') {
  // 处理文件
  const content = atob(entry.content);
} else if (entry.type === 'dir') {
  // 处理目录
  for (const item of entry) {
    console.log(item.name, item.type);
  }
}
```

### 2. 更新文件前获取最新 SHA

```typescript
// 总是获取最新的 SHA 以避免冲突
const latest = await gitea_contents_get({
  owner: "myorg",
  repo: "myrepo",
  filepath: "config.json"
});

await gitea_contents_update({
  owner: "myorg",
  repo: "myrepo",
  filepath: "config.json",
  content: newContent,
  sha: latest.sha,  // 使用最新的 SHA
  message: "Update config"
});
```

### 3. 批量操作使用事务分支

```typescript
// 在单独的分支上进行批量更改
const transactionBranch = `batch-update-${Date.now()}`;

for (const file of files) {
  await gitea_contents_create({
    filepath: file.path,
    content: file.content,
    message: `Add ${file.path}`,
    branch: "main",
    new_branch: transactionBranch
  });
}

// 创建 PR 合并更改
await gitea_pr_create({
  owner: "myorg",
  repo: "myrepo",
  title: "Batch file updates",
  head: transactionBranch,
  base: "main"
});
```

### 4. 错误处理

```typescript
try {
  await gitea_contents_update({
    filepath: "important.txt",
    content: newContent,
    sha: oldSha,
    message: "Update important file"
  });
} catch (error) {
  if (error.message.includes('sha does not match')) {
    // 文件已被其他人修改，重新获取最新版本
    const latest = await gitea_contents_get({
      filepath: "important.txt"
    });

    // 合并更改或提示用户
    await handleConflict(latest.content, newContent);
  } else if (error.message.includes('404')) {
    // 文件不存在，创建新文件
    await gitea_contents_create({
      filepath: "important.txt",
      content: newContent,
      message: "Create important file"
    });
  } else {
    throw error;
  }
}
```

---

## 与其他工具集成

### 与 Branch 工具配合

```typescript
// 1. 创建功能分支
await gitea_branch_create({
  owner: "myorg",
  repo: "myrepo",
  new_branch_name: "feature/add-docs",
  old_branch_name: "main"
});

// 2. 在功能分支上添加文件
await gitea_contents_create({
  owner: "myorg",
  repo: "myrepo",
  filepath: "docs/README.md",
  content: btoa("Documentation"),
  message: "Add documentation",
  branch: "feature/add-docs"
});

// 3. 保护功能完成后的分支
await gitea_branch_protection_create({
  owner: "myorg",
  repo: "myrepo",
  rule_name: "feature/add-docs",
  enable_push: false
});
```

### 与 PR 工具配合

```typescript
// 1. 在新分支上进行更改
await gitea_contents_update({
  filepath: "src/app.ts",
  content: btoa(newCode),
  sha: currentSha,
  message: "refactor: Improve code structure",
  branch: "main",
  new_branch: "refactor/improve-structure"
});

// 2. 创建 Pull Request
await gitea_pr_create({
  owner: "myorg",
  repo: "myrepo",
  title: "Refactor: Improve code structure",
  head: "refactor/improve-structure",
  base: "main",
  body: "This PR improves the code structure by..."
});
```

### 与 Release 工具配合

```typescript
// 1. 更新版本文件
const packageJson = await gitea_contents_get({
  filepath: "package.json"
});

const pkg = JSON.parse(atob(packageJson.content));
pkg.version = "1.2.0";

await gitea_contents_update({
  filepath: "package.json",
  content: btoa(JSON.stringify(pkg, null, 2)),
  sha: packageJson.sha,
  message: "chore: Bump version to 1.2.0",
  branch: "main",
  new_branch: "release/v1.2.0"
});

// 2. 创建 Release
await gitea_release_create({
  owner: "myorg",
  repo: "myrepo",
  tag_name: "v1.2.0",
  name: "Version 1.2.0",
  body: "Release notes...",
  target_commitish: "release/v1.2.0"
});

// 3. 下载 Release 归档
await gitea_repo_archive({
  owner: "myorg",
  repo: "myrepo",
  archive: "v1.2.0.tar.gz"
});
```

---

## 常见问题

### Q1: 如何处理大文件？

Gitea API 对文件大小有限制（通常 100MB），对于大文件：

1. 使用 Git LFS
2. 分块上传
3. 使用归档下载工具

### Q2: 如何处理二进制文件？

二进制文件同样需要 base64 编码：

```typescript
// Node.js
const binaryContent = fs.readFileSync('image.png');
const base64Content = binaryContent.toString('base64');

await gitea_contents_create({
  filepath: "assets/image.png",
  content: base64Content,
  message: "Add image"
});
```

### Q3: 如何批量删除文件？

Contents API 不支持批量操作，需要逐个删除：

```typescript
const filesToDelete = ["file1.txt", "file2.txt", "file3.txt"];

for (const file of filesToDelete) {
  const fileInfo = await gitea_contents_get({ filepath: file });
  await gitea_contents_delete({
    filepath: file,
    sha: fileInfo.sha,
    message: `Remove ${file}`
  });
}
```

### Q4: 获取整个目录的所有文件？

递归遍历目录结构：

```typescript
async function getAllFiles(owner, repo, dirPath = "") {
  const entries = await gitea_contents_get({
    owner,
    repo,
    filepath: dirPath || "."
  });

  const files = [];
  for (const entry of Array.isArray(entries) ? entries : [entries]) {
    if (entry.type === 'file') {
      files.push(entry);
    } else if (entry.type === 'dir') {
      const subFiles = await getAllFiles(owner, repo, entry.path);
      files.push(...subFiles);
    }
  }

  return files;
}
```

### Q5: 如何处理文件冲突？

在更新文件前检查 SHA 是否匹配：

```typescript
// 乐观锁机制
const maxRetries = 3;
let retries = 0;

while (retries < maxRetries) {
  try {
    const current = await gitea_contents_get({ filepath: "data.json" });

    await gitea_contents_update({
      filepath: "data.json",
      content: newContent,
      sha: current.sha,
      message: "Update data"
    });

    break;  // 成功，退出循环
  } catch (error) {
    if (error.message.includes('sha does not match') && retries < maxRetries - 1) {
      retries++;
      continue;  // 重试
    } else {
      throw error;  // 其他错误或重试次数用尽
    }
  }
}
```

---

## 性能优化建议

### 1. 使用原始文件 API

当只需要文件内容时，使用 `gitea_contents_raw` 而不是 `gitea_contents_get`：

```typescript
// 更快，返回原始内容
const rawContent = await gitea_contents_raw({
  filepath: "large-file.json"
});

// 较慢，返回包含元数据的完整对象
const fullContent = await gitea_contents_get({
  filepath: "large-file.json"
});
```

### 2. 批量操作使用单次提交

将多个文件更改合并到一个分支：

```typescript
const batchBranch = "batch-update";

// 所有更改在同一分支上
for (const file of files) {
  await gitea_contents_create({
    filepath: file.path,
    content: file.content,
    message: file.message,
    branch: "main",
    new_branch: batchBranch  // 所有更改使用同一个新分支
  });
}
```

### 3. 并行处理独立操作

对于独立的文件操作，使用 Promise.all：

```typescript
const operations = files.map(file =>
  gitea_contents_get({
    filepath: file.path
  })
);

const results = await Promise.all(operations);
```

---

## 总结

Contents 模块提供了完整的文件管理能力，是 Gitea 自动化的核心工具之一。合理使用这些工具，可以实现：

- 自动化配置管理
- 文档自动生成
- 代码仓库迁移
- 批量文件处理
- 版本控制自动化

配合 Branch、PR、Release 等其他模块，可以构建完整的 DevOps 自动化流程。
