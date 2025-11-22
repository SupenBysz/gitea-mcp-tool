# 发布流程

本文档描述新版本的创建和发布流程。

## 前置条件

- 仓库维护者访问权限
- 本地仓库与 `main` 分支同步
- 所有更改已提交并推送

## 发布步骤

### 1. 更新版本号

更新 `package.json` 中的版本：

```bash
# 修订版本（0.8.1 -> 0.8.2）
npm version patch

# 次版本（0.8.1 -> 0.9.0）
npm version minor

# 主版本（0.8.1 -> 1.0.0）
npm version major
```

此命令将自动：
- 更新 package.json 中的版本号
- 创建 git 标签
- 提交更改

### 2. 更新 CHANGELOG

编辑 `CHANGELOG.md` 并添加发布说明：

```markdown
## [0.8.2] - 2025-11-23

### 新增
- 新功能描述

### 修复
- Bug 修复描述

### 变更
- 更改描述
```

提交更改：

```bash
git add CHANGELOG.md
git commit -m "docs: 更新 v0.8.2 版本的 CHANGELOG"
```

### 3. 构建和打包

构建项目并创建发布包：

```bash
# 构建项目
pnpm build

# 创建发布包
./pack.sh
```

生成文件：`gitea-mcp-v0.8.2.tar.gz`

**记录 SHA256 校验和**，pack.sh 将显示该值用于发布说明。

### 4. 推送更改和标签

```bash
git push
git push --tags
```

### 5. 创建 GitHub/Gitea 发布

1. 访问：https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/releases/new

2. 选择标签（例如 `v0.8.2`）

3. 填写发布信息：
   - **标题**：`v0.8.2 - 发布名称`
   - **描述**：从 CHANGELOG.md 复制内容

4. 添加发布说明模板：

````markdown
## 更新内容

[主要变更的简要概述]

## 新增功能
- 功能 1
- 功能 2

## Bug 修复
- 修复 1
- 修复 2

## 安装

### 快速安装（推荐）
```bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

### 下载安装包
下载下方的 `gitea-mcp-v0.8.2.tar.gz` 并解压：
```bash
tar -xzf gitea-mcp-v0.8.2.tar.gz
cd gitea-mcp-v0.8.2
# 查看 INSTALL.txt 了解配置方法
```

## 安全校验

**SHA256 校验和：**
```
[粘贴 pack.sh 输出的 SHA256 值]
```

验证下载文件：
```bash
shasum -a 256 gitea-mcp-v0.8.2.tar.gz
```

## 文档
- [README](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [初始化指南](./docs/initialization.md)
- [API 文档](./docs/)

## 从 v0.8.1 升级

[添加任何破坏性变更或升级注意事项]

---

**完整变更日志**：https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/compare/v0.8.1...v0.8.2
````

5. **附加文件**：上传 `gitea-mcp-v0.8.2.tar.gz`

6. 点击**发布**

### 6. 验证安装

测试快速安装脚本：

```bash
# 在新目录中测试
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

验证：
- 脚本下载新版本
- 包正确解压
- 配置路径正确

## 发布检查清单

发布前确认：

- [ ] package.json 中版本已更新
- [ ] CHANGELOG.md 已添加发布说明
- [ ] 所有测试通过（`pnpm test`）
- [ ] 项目构建成功（`pnpm build`）
- [ ] 发布包已创建（`./pack.sh`）
- [ ] SHA256 校验和已记录
- [ ] 更改已推送到 main 分支
- [ ] 标签已推送到仓库
- [ ] Gitea 发布已创建
- [ ] 发布包已附加
- [ ] 发布说明包含 SHA256
- [ ] 快速安装脚本已测试

## 回滚程序

如需回滚发布：

1. 删除标签：
   ```bash
   git tag -d v0.8.2
   git push origin :refs/tags/v0.8.2
   ```

2. 在 Gitea 上删除发布

3. 如有必要，恢复 package.json 中的版本

4. 修复问题后创建新发布

## 自动化发布（未来）

考虑使用 GitHub Actions / Gitea Actions 实现自动化发布：

```yaml
# .gitea/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build
      - run: ./pack.sh
      - name: Create Release
        uses: actions/create-release@v1
        with:
          files: gitea-mcp-*.tar.gz
```

## 版本号规则

遵循[语义化版本](https://semver.org/)：

- **主版本号（MAJOR）**（1.0.0）：不兼容的 API 修改
- **次版本号（MINOR）**（0.9.0）：向下兼容的功能新增
- **修订号（PATCH）**（0.8.2）：向下兼容的问题修正

## 支持

关于发布流程的问题，请联系维护者或创建 issue。
