# 部署工作流

本文档说明如何自动同步到 GitHub 并发布到 npmjs。

## 工作流程

```
本地开发 → Gitea → GitHub → npmjs
```

## 配置步骤

### 1. GitHub 仓库设置

仓库已创建：https://github.com/SupenBysz/gitea-mcp-tool

### 2. 配置 npm Token

在 GitHub 仓库设置中添加 Secret：

1. 访问：https://github.com/SupenBysz/gitea-mcp-tool/settings/secrets/actions
2. 点击 "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: 你的 npm access token

获取 npm token：
```bash
npm login
npm token create --read-only=false
```

### 3. 远程仓库配置

项目已配置两个远程仓库：

```bash
# Gitea (origin)
git remote add origin gitea.ktyun.cc:Kysion/entai-gitea-mcp.git

# GitHub (github)
git remote add github git@github.com:SupenBysz/gitea-mcp-tool.git
```

查看远程仓库：
```bash
git remote -v
```

## 发布新版本

### 方式 1：使用同步脚本（推荐）

```bash
# 1. 更新版本号
npm version patch  # 或 minor/major

# 2. 构建项目
npm run build

# 3. 提交更改
git add .
git commit -m "chore: release vX.X.X"

# 4. 创建标签并同步
./sync-to-github.sh
```

### 方式 2：手动同步

```bash
# 1. 推送到 Gitea
git push origin main --tags

# 2. 推送到 GitHub
git push github main --tags
```

## 自动发布流程

当推送新 tag 到 GitHub 时，GitHub Actions 会自动：

1. ✅ 检出代码
2. ✅ 安装依赖
3. ✅ 构建项目
4. ✅ 发布到 npmjs
5. ✅ 创建 GitHub Release

查看发布状态：https://github.com/SupenBysz/gitea-mcp-tool/actions

## 版本发布清单

- [ ] 更新 `package.json` 版本号
- [ ] 更新 `README.md` 中的版本说明
- [ ] 运行 `npm run build` 构建项目
- [ ] 运行 `npm test` 确保测试通过（如有）
- [ ] 提交代码：`git commit -am "chore: release vX.X.X"`
- [ ] 创建标签：`git tag -a vX.X.X -m "vX.X.X"`
- [ ] 推送到 Gitea：`git push origin main --tags`
- [ ] 推送到 GitHub：`git push github main --tags`
- [ ] 在 Gitea 创建 Release 并上传资源包
- [ ] 验证 GitHub Actions 发布成功
- [ ] 验证 npm 包已发布

## Gitea Release 资源包

GitHub Actions 只负责发布 npm 包。Gitea Release 需要手动上传资源包：

```bash
# 创建资源包
tar -czf gitea-mcp-vX.X.X.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  dist/ config/ package.json README.md install-quick.sh

# 上传到 Gitea Release
curl -X POST \
  -H "Authorization: token ${GITEA_API_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "attachment=@gitea-mcp-vX.X.X.tar.gz" \
  "https://gitea.ktyun.cc/api/v1/repos/Kysion/entai-gitea-mcp/releases/{release_id}/assets"
```

## 问题排查

### GitHub Actions 失败

1. 检查 npm token 是否配置正确
2. 查看 Actions 日志：https://github.com/SupenBysz/gitea-mcp-tool/actions
3. 确保 package.json 版本号正确

### npm 发布失败

常见问题：
- Token 过期或权限不足
- 版本号已存在（需要更新版本）
- 包名冲突

### 同步失败

检查：
- SSH 密钥是否配置正确
- 远程仓库权限是否足够
- 网络连接是否正常

## 维护命令

```bash
# 查看远程仓库
git remote -v

# 查看所有标签
git tag

# 删除本地标签
git tag -d vX.X.X

# 删除远程标签
git push origin :refs/tags/vX.X.X
git push github :refs/tags/vX.X.X

# 查看最新发布
npm view gitea-mcp-tool
```

## 相关链接

- **Gitea 仓库**: https://github.com/SupenBysz/gitea-mcp-tool
- **GitHub 仓库**: https://github.com/SupenBysz/gitea-mcp-tool
- **npm 包**: https://www.npmjs.com/package/gitea-mcp-tool
- **GitHub Actions**: https://github.com/SupenBysz/gitea-mcp-tool/actions
