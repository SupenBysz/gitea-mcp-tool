# 贡献指南

## 分支策略

```
feature/*  ──┐
bugfix/*   ──┼──→ dev ──────→ main
fix/*      ──┤      │           │
feat/*     ──┘      ↓           ↓
                 beta版      正式版

hotfix/*   ─────────────────→ main (紧急修复)
```

### 分支说明

| 分支 | 用途 | 合并来源 |
|------|------|----------|
| `main` | 稳定版本，发布正式版 | `dev`, `hotfix/*` |
| `dev` | 开发分支，发布 beta 版 | `feature/*`, `bugfix/*`, `fix/*`, `feat/*` |
| `feature/*` | 新功能开发 | - |
| `bugfix/*` / `fix/*` | Bug 修复 | - |
| `hotfix/*` | 紧急修复 | - |

## 开发流程

### 1. 创建功能分支

```bash
# 新功能
git checkout dev
git pull origin dev
git checkout -b feature/your-feature

# Bug 修复
git checkout -b fix/issue-description
```

### 2. 开发和提交

```bash
# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/your-feature
```

### 3. 创建 Pull Request

- **目标分支**: `dev`
- **标题格式**: `feat: xxx` 或 `fix: xxx`
- 等待 CI 检查通过
- 请求 review（如需要）

### 4. 合并后自动发布

- 合并到 `dev` → 自动发布 beta 版本
- 合并到 `main` → 自动发布正式版本

## Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 | 版本影响 |
|------|------|----------|
| `feat` | 新功能 | minor (1.0.0 → 1.1.0) |
| `fix` | Bug 修复 | patch (1.0.0 → 1.0.1) |
| `docs` | 文档更新 | - |
| `style` | 代码格式 | - |
| `refactor` | 重构 | - |
| `test` | 测试 | - |
| `chore` | 构建/工具 | - |
| `breaking` | 破坏性变更 | major (1.0.0 → 2.0.0) |

### 示例

```bash
# 新功能
git commit -m "feat(cli): add init command"

# Bug 修复
git commit -m "fix(api): handle null response"

# 破坏性变更
git commit -m "feat!: change API response format

BREAKING CHANGE: response format changed from array to object"
```

## 版本号规则

- **正式版**: `x.y.z` (如 `1.7.0`)
- **Beta 版**: `x.y.z-beta.n` (如 `1.8.0-beta.1`)

### 版本递增规则

| Commit 类型 | 版本变化 |
|-------------|----------|
| `feat:` | minor: 1.7.0 → 1.8.0 |
| `fix:` | patch: 1.7.0 → 1.7.1 |
| `breaking` | major: 1.7.0 → 2.0.0 |

## CI/CD 流程

### Pull Request 检查

- TypeScript 类型检查
- ESLint 代码检查
- 构建测试
- 分支来源验证

### 自动发布

| 触发条件 | 发布类型 | npm tag |
|----------|----------|---------|
| 合并到 `dev` | Beta | `beta` |
| 合并到 `main` | 正式版 | `latest` |

## 本地开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 类型检查
npm run typecheck

# 构建
npm run build

# 测试
npm test
```

## 发布流程（自动）

1. **开发阶段**
   - 创建 `feature/*` 分支
   - 提交代码
   - PR 到 `dev`
   - CI 检查通过后合并
   - 自动发布 beta 版本

2. **发布阶段**
   - 从 `dev` 创建 PR 到 `main`
   - CI 检查通过后合并
   - 自动发布正式版本
   - 自动创建 Git tag 和 Release

## 紧急修复

```bash
# 创建 hotfix 分支
git checkout main
git checkout -b hotfix/critical-fix

# 修复并提交
git commit -m "fix: critical bug fix"

# 直接 PR 到 main
git push origin hotfix/critical-fix
# 创建 PR: hotfix/critical-fix → main
```
