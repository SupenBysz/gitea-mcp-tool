# keactl init 命令指南

`keactl init` 是一站式项目初始化入口，支持在项目配置完成后选择初始化更多可选项。

## 基本用法

```bash
# 交互式向导
keactl init

# 全局环境初始化
keactl init -g

# 项目级初始化
keactl init -p
```

## 可选初始化项

在项目配置完成后，可以选择初始化以下可选项：

| 选项 | 说明 | 命令行参数 |
|------|------|-----------|
| AI 规范文件 | 生成 AGENT.md 及大模型引用文件 | `--with-agent-md` |
| 工作流配置 | 创建 .gitea/issue-workflow.yaml | `--with-workflow` |
| 工单标签 | 在仓库创建标准化标签 | `--with-labels` |
| 项目看板 | 创建 Issue 看板 | `--with-board` |
| CI/CD 配置 | 创建工作流文件 | `--with-cicd` |
| 分支保护规则 | 为 main/dev 分支设置保护 | `--with-protection` |

## 命令行参数

### 基础参数

| 参数 | 说明 |
|------|------|
| `-g, --global` | 全局环境初始化 |
| `-p, --project` | 项目级初始化 |
| `-s, --server <url>` | Gitea 服务器地址 |
| `-t, --token <token>` | API Token |
| `-o, --owner <owner>` | 仓库所有者 |
| `-r, --repo <repo>` | 仓库名称 |
| `-f, --force` | 强制覆盖已有配置 |
| `--auto` | 完全自动模式 |

### 可选初始化参数

| 参数 | 说明 |
|------|------|
| `--with-agent-md` | 生成 AI 规范文件 |
| `--llm <list>` | 指定大模型引用文件（逗号分隔） |
| `--all-llm` | 生成所有大模型引用文件 |
| `--no-llm` | 不生成大模型引用文件 |
| `--with-workflow` | 初始化工作流配置 |
| `--with-labels` | 初始化工单标签 |
| `--with-board` | 初始化项目看板 |
| `--with-cicd` | 初始化 CI/CD 配置 |
| `--with-protection` | 初始化分支保护规则 |
| `--all` | 初始化所有可选项 |

## 使用示例

### 1. 交互式初始化（推荐）

```bash
keactl init -p
```

运行后将显示可选项多选菜单，按空格选择，回车确认。

### 2. 初始化 AI 规范文件

```bash
# 生成 AGENT.md + 默认大模型引用文件（Claude、Cursor）
keactl init -p --with-agent-md

# 指定大模型引用文件
keactl init -p --with-agent-md --llm claude,cursor,deepseek

# 生成所有大模型引用文件
keactl init -p --with-agent-md --all-llm
```

### 3. 初始化工单标签

```bash
keactl init -p --with-labels -o MyOrg -r my-repo
```

### 4. 初始化分支保护规则

```bash
keactl init -p --with-protection -o MyOrg -r my-repo
```

### 5. 全部初始化

```bash
keactl init -p --all -o MyOrg -r my-repo
```

## AI 规范文件

### AGENT.md

主规范文件，包含：
- 项目概述
- 目录结构
- 构建命令
- 工单规范
- 分支与 PR 规范
- 验收规范

根据项目类型（TypeScript/Go/Python/Rust）自动生成对应的构建命令。

### 大模型引用文件

支持 12 个大模型平台：

| 平台 | 文件名 | 说明 |
|------|--------|------|
| Claude | `CLAUDE.md` | Claude Code / Claude API |
| Cursor | `.cursorrules` | Cursor IDE |
| Copilot | `.github/copilot-instructions.md` | GitHub Copilot |
| Windsurf | `.windsurfrules` | Windsurf IDE |
| Gemini | `GEMINI.md` | Google Gemini |
| DeepSeek | `DEEPSEEK.md` | DeepSeek Coder |
| 通义千问 | `QWEN.md` | 通义千问 / 通义灵码 |
| GPT | `GPT.md` | ChatGPT / GPT API |
| Llama | `LLAMA.md` | Meta Llama |
| 文心一言 | `ERNIE.md` | 百度文心大模型 |
| 豆包 | `DOUBAO.md` | 字节豆包 / 云雀 |
| GLM | `GLM.md` | 智谱 ChatGLM |

所有引用文件内容为 `@AGENT.md`，实现单一维护点。

## 分支保护规则预设

| 分支 | 直接推送 | 审批要求 | 状态检查 | 说明 |
|------|----------|----------|----------|------|
| main | 禁止 | 1 人 | 是 | 生产分支，严格保护 |
| dev | 允许 | 0 人 | 是 | 开发分支，宽松规则 |

## 相关命令

- `keactl workflow init` - 单独初始化工作流配置
- `keactl workflow sync-labels` - 同步工单标签
- `keactl cicd init` - 单独初始化 CI/CD 配置
- `keactl branch protection create` - 单独创建分支保护规则
