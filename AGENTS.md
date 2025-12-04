# gitea-mcp-tool 项目规范

## 项目概述

**项目名称**: gitea-mcp-tool
**描述**: Universal MCP Server for Gitea - 通用 MCP 服务器，支持 Claude Desktop、Cline、Continue 等所有符合 MCP 规范的客户端访问 Gitea API
**技术栈**: TypeScript, Node.js 20+, tsup, vitest, eslint, pino
**包管理**: npm

---

## 上下文恢复协议

### 触发条件
以下情况必须重新阅读本规范文档：
1. **会话开始时** - 首次进入项目工作
2. **上下文压缩后** - 检测到历史对话被截断或压缩
3. **长时间中断后** - 会话恢复时
4. **不确定规范时** - 对任何规范有疑问

### 恢复流程
1. 读取 `AGENTS.md` 完整内容
2. 确认理解核心约定（特别是授权铁律）
3. 向用户简要确认："已重新加载项目规范，继续工作"

### 强制阅读 Wiki 完整规范

> **重要**: 本文档为 Wiki 规范的**概要版本**，完整规范请参阅 Wiki。

**Wiki 位置**: `Kysion/ai-work-guidelines-wiki`

**强制阅读场景**:
- 对规范细节有疑问或理解不清时
- 执行复杂任务（涉及多个模块/大规模重构）前
- 处理边界情况，本文档未明确覆盖时
- 用户明确要求按规范执行时
- 首次接触本项目时（建议完整阅读一次）

**必读页面清单**:
| 页面 | 阅读时机 |
|------|---------|
| Agent工作规范 | 每次会话开始 |
| Agent工作启动流程 | 开始新任务前 |
| 代码规范 | 编写/修改代码前 |
| PR提交规范 | 创建 PR 前 |
| Gitea协作规范 | 操作 Issue/PR 前 |

**阅读方法**:
```
使用 gitea_wiki_get 或 gitea_wiki_list 工具访问 Kysion/ai-work-guidelines-wiki
```

### 强制检查点
每次执行以下操作前，必须确认已理解相关规范：
- 修改任何文件前 → 确认已获得授权
- 提交 PR/commit 前 → 确认符合提交规范（如有疑问，读 Wiki）
- 创建 Issue 前 → 确认符合 Issue 规范（如有疑问，读 Wiki）

---

## 核心铁律

### 1. 授权铁律（最高优先级）
- **所有文件操作必须获得用户明确授权**
- 用户提问 ≠ 授权修改，分析报告 ≠ 授权执行
- 未经授权的任何代码修改都是违规行为
- 违规时立即停止并道歉

### 2. 透明铁律
- 所有操作意图必须提前说明
- 不确定时必须询问，禁止假设用户意图
- 每个决策都需要解释理由

### 3. 最小化铁律
- 只做被要求的事情，不做额外"优化"
- 遵循 KISS 原则：保持简单
- 遵循 YAGNI 原则：不需要就不做

### 4. 可逆铁律
- 优先选择可撤销的操作
- 危险操作前必须确认并说明回退方案
- 批量操作需要分步确认

### 5. 诚实铁律
- 不确定时说"不确定"
- 不会时说"不会"
- 禁止编造信息或虚假承诺

---

## Agent 工作启动流程

每次开始工作时，按以下流程执行：

### 第一步：环境确认
```
□ 确认当前工作目录
□ 确认 Git 分支状态
□ 确认是否有未提交的更改
```

### 第二步：任务理解
```
□ 复述用户需求，确认理解正确
□ 识别任务类型（分析/开发/修复/咨询）
□ 明确交付物是什么
```

### 第三步：方案确认
```
□ 提出实现方案
□ 说明影响范围
□ 等待用户确认后再执行
```

### 第四步：执行与反馈
```
□ 按确认的方案执行
□ 遇到问题立即反馈
□ 完成后汇报结果
```

---

## 开发工作流

### 分支规范
| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 功能开发 | `feat/issue-{id}-{描述}` | `feat/issue-42-add-wiki-search` |
| 问题修复 | `fix/issue-{id}-{描述}` | `fix/issue-55-beta-version` |
| 文档更新 | `docs/{描述}` | `docs/update-readme` |
| 重构 | `refactor/{描述}` | `refactor/client-structure` |

### 提交规范
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具变更

**示例**:
```
feat(wiki): add search functionality for wiki pages

- Implement client-side filtering for wiki search
- Add support for Chinese page names
- Handle URL encoding edge cases

Closes #42
```

### PR 提交规范
```markdown
## Summary
- 简要描述变更内容（1-3 个要点）

## Changes
- 具体修改列表

## Test Plan
- [ ] 测试项 1
- [ ] 测试项 2

## Related Issues
Closes #issue_number
```

---

## 项目特定规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 配置（运行 `npm run lint` 检查）
- 类型定义放在 `src/types/` 目录
- 工具函数放在对应模块的文件中

### 测试要求
- 新功能必须有对应测试
- 运行 `npm run test` 确保测试通过
- 运行 `npm run typecheck` 确保类型正确

### 构建验证
提交前必须验证：
```bash
npm run build      # 构建成功
npm run test       # 测试通过
npm run typecheck  # 类型检查通过
npm run lint       # 代码风格检查
```

### 本地测试
```bash
npm run local:publish  # 本地打包并全局安装测试
```

---

## 禁止事项

### 绝对禁止
- ❌ 未经授权修改任何文件
- ❌ 直接推送到 main 分支
- ❌ 跳过测试提交代码
- ❌ 删除或覆盖用户数据
- ❌ 执行破坏性操作（如 `rm -rf`、`git push --force`）

### 应当避免
- ⚠️ 添加未经讨论的新依赖
- ⚠️ 大规模重构未经确认
- ⚠️ 修改项目配置文件（tsconfig、eslint 等）
- ⚠️ 改变公共 API 接口

---

## Gitea 协作规范

### Issue 管理
- 开始工作前确认 Issue 存在
- 工作中更新 Issue 状态
- 完成后通过 PR 关联 Issue

### 标签使用
| 标签前缀 | 用途 |
|---------|------|
| `status/*` | 工作状态（backlog, in-progress, review, done） |
| `priority/*` | 优先级（P0-P3） |
| `type/*` | 类型（feature, bug, docs, refactor） |

### PR 流程
1. 从 `dev` 分支创建功能分支
2. 完成开发后创建 PR 到 `dev`
3. 通过 Review 后合并
4. `dev` 定期合并到 `main` 发布

---

## 规范优先级

当规范冲突时，按以下优先级处理：

1. **用户明确指示** - 最高优先级
2. **本文档（AGENTS.md）** - 项目级规范
3. **Wiki 完整规范** - 通用规范补充
4. **行业最佳实践** - 兜底参考

---

## 快速参考

### 常用命令
```bash
npm run dev        # 开发模式
npm run build      # 构建
npm run test       # 运行测试
npm run lint:fix   # 自动修复代码风格
```

### 目录结构
```
src/
├── cli/           # CLI 命令实现
├── tools/         # MCP 工具实现
├── types/         # TypeScript 类型定义
├── gitea-client.ts    # Gitea API 客户端
├── context-manager.ts # 上下文管理
└── index.ts       # 入口文件
```

### 关键文件
- `src/tools/` - 各功能模块的工具实现
- `src/types/gitea.ts` - Gitea API 类型定义
- `src/cli/commands/` - CLI 命令实现
