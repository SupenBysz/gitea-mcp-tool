# AI Claude 开发规范

本文档为 AI 助手（Claude）提供项目开发和发布的标准操作流程。

## 项目概述

- **项目名称**: gitea-mcp-tool
- **npm 包名**: gitea-mcp-tool
- **主仓库**: Gitea (gitea.ktyun.cc:Kysion/entai-gitea-mcp)
- **镜像仓库**: GitHub (github.com:SupenBysz/gitea-mcp-tool)
- **npm 发布**: 通过 GitHub Actions 自动化

## 发布工作流

```
本地开发 → Gitea (主仓库) → GitHub (镜像) → npmjs (自动发布)
```

## 标准发布流程

### 1. 版本更新

根据更新类型选择版本号：

```bash
# 修复 bug (1.5.3 → 1.5.4)
npm version patch

# 新功能 (1.5.3 → 1.6.0)
npm version minor

# 重大变更 (1.5.3 → 2.0.0)
npm version major
```

### 2. 构建项目

```bash
npm run build
```

### 3. 提交更改

```bash
git add .
git commit -m "chore: release vX.X.X"
```

### 4. 同步到两个仓库

**推荐方式**：使用同步脚本
```bash
./sync-to-github.sh
```

**手动方式**：
```bash
# 推送到 Gitea
git push origin main --tags

# 推送到 GitHub
git push github main --tags
```

### 5. 创建 Gitea Release（可选）

如果需要在 Gitea 上创建 Release：

```bash
# 使用 keactl 创建
keactl release create --tag vX.X.X --name "vX.X.X" --body "发布说明"

# 或使用 API
curl -X POST \
  -H "Authorization: token ${GITEA_API_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://gitea.ktyun.cc/api/v1/repos/Kysion/entai-gitea-mcp/releases" \
  -d '{
    "tag_name": "vX.X.X",
    "name": "vX.X.X",
    "body": "发布说明"
  }'
```

### 6. 验证自动发布

推送 tag 到 GitHub 后，自动触发：

1. ✅ GitHub Actions 构建
2. ✅ 发布到 npmjs
3. ✅ 创建 GitHub Release

查看状态：https://github.com/SupenBysz/gitea-mcp-tool/actions

## 完整发布清单

在发布新版本前，请确认：

- [ ] 代码已经过测试
- [ ] 更新 `package.json` 版本号（`npm version` 会自动完成）
- [ ] 更新 `README.md` 版本说明（如有必要）
- [ ] 运行 `npm run build` 构建成功
- [ ] 提交所有更改
- [ ] 创建版本标签
- [ ] 推送到 Gitea：`git push origin main --tags`
- [ ] 推送到 GitHub：`git push github main --tags`
- [ ] 验证 GitHub Actions 发布成功
- [ ] 验证 npm 包已更新：`npm view gitea-mcp-tool`

## GitHub Actions 配置

### 必需的 Secret

在 GitHub 仓库设置中配置：

- **NPM_TOKEN**: npm 访问令牌
  - 位置：https://github.com/SupenBysz/gitea-mcp-tool/settings/secrets/actions
  - 值：你的 npm access token（从 npmjs.com 获取）
  - 获取方式：`npm login && npm token create --read-only=false`

### 工作流文件

`.github/workflows/npm-publish.yml`

- 触发：推送 `v*` 格式的 tag
- 步骤：checkout → setup Node.js → install → build → publish
- 自动创建 GitHub Release

## 故障排查

### 发布失败

1. **检查 GitHub Actions 日志**
   - https://github.com/SupenBysz/gitea-mcp-tool/actions
   - 查看失败的步骤和错误信息

2. **常见问题**
   - NPM_TOKEN 过期或未配置
   - 版本号已存在（需要增加版本）
   - 构建失败（检查本地是否能成功构建）

3. **回滚操作**
   ```bash
   # 删除本地标签
   git tag -d vX.X.X

   # 删除远程标签
   git push origin :refs/tags/vX.X.X
   git push github :refs/tags/vX.X.X
   ```

### 同步问题

如果两个仓库不同步：

```bash
# 查看远程仓库状态
git remote -v

# 强制同步到 GitHub
git push github main --tags --force

# 查看所有标签
git tag

# 单独推送某个标签
git push github vX.X.X
```

## 远程仓库配置

项目配置了两个远程仓库：

```bash
# Gitea (origin) - 主仓库
origin    gitea.ktyun.cc:Kysion/entai-gitea-mcp.git (fetch)
origin    gitea.ktyun.cc:Kysion/entai-gitea-mcp.git (push)

# GitHub (github) - 镜像仓库
github    git@github.com:SupenBysz/gitea-mcp-tool.git (fetch)
github    git@github.com:SupenBysz/gitea-mcp-tool.git (push)
```

## 维护命令

```bash
# 查看当前版本
npm view gitea-mcp-tool version

# 查看包信息
npm view gitea-mcp-tool

# 查看所有标签
git tag

# 查看最近的提交
git log --oneline -10

# 查看远程仓库
git remote -v

# 测试本地安装
npm link
gitea-mcp --help
```

## 开发提示

### 本地测试

```bash
# 监听模式开发
npm run dev

# 构建
npm run build

# 本地全局安装测试
npm link
```

### 代码规范

```bash
# 检查代码风格
npm run lint

# 自动修复
npm run lint:fix

# 类型检查
npm run typecheck
```

## 相关链接

- **Gitea 仓库**: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp
- **GitHub 仓库**: https://github.com/SupenBysz/gitea-mcp-tool
- **npm 包**: https://www.npmjs.com/package/gitea-mcp-tool
- **GitHub Actions**: https://github.com/SupenBysz/gitea-mcp-tool/actions

## 注意事项

1. **不要手动发布到 npm**
   - 所有 npm 发布都应通过 GitHub Actions 自动完成
   - 避免因手动操作导致的版本不一致

2. **标签命名规范**
   - 必须使用 `v` 前缀：`v1.5.3`
   - 遵循语义化版本：`vMAJOR.MINOR.PATCH`

3. **同步顺序**
   - 始终先推送到 Gitea（主仓库）
   - 再推送到 GitHub（触发自动发布）

4. **版本一致性**
   - package.json 版本号
   - git tag 版本号
   - README.md 版本说明
   - 三者必须保持一致

5. **构建验证**
   - 推送前必须确保本地构建成功
   - 检查 `dist/` 目录是否正确生成

## 快速参考

```bash
# 完整发布流程（一键）
npm version patch && \
npm run build && \
git add . && \
git commit -m "chore: release v$(node -p 'require("./package.json").version')" && \
./sync-to-github.sh

# 查看发布状态
open https://github.com/SupenBysz/gitea-mcp-tool/actions

# 验证 npm 发布
npm view gitea-mcp-tool version
```
