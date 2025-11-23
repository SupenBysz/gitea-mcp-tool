# keactl 命令行工具使用指南

`keactl` 是 Gitea MCP 工具的命令行版本，提供完整的 Gitea API 操作能力，无需 MCP 客户端即可独立使用。

## 目录

- [安装](#安装)
- [配置](#配置)
- [快速开始](#快速开始)
- [命令参考](#命令参考)
  - [全局选项](#全局选项)
  - [context - 上下文管理](#context---上下文管理)
  - [user - 用户管理](#user---用户管理)
  - [repo - 仓库管理](#repo---仓库管理)
  - [issue - Issue 管理](#issue---issue-管理)
  - [pr - Pull Request 管理](#pr---pull-request-管理)
  - [project - 项目看板管理](#project---项目看板管理)
  - [config - 配置管理](#config---配置管理)
- [配置系统](#配置系统)
- [使用场景示例](#使用场景示例)

## 安装

### 通过 npm 安装

```bash
# 全局安装
npm install -g @kysion/gitea-mcp-tool

# 或使用 pnpm
pnpm add -g @kysion/gitea-mcp-tool

# 验证安装
keactl --version
```

### 从源码构建

```bash
# 克隆仓库
git clone https://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git
cd entai-gitea-mcp

# 安装依赖
pnpm install

# 构建
pnpm build

# 使用本地构建版本
node dist/cli/index.js --help

# 或链接到全局
npm link
keactl --help
```

## 配置

### 配置方式

keactl 支持多种配置方式，按优先级从高到低：

1. **命令行参数** - 直接在命令中指定
2. **项目配置** - `.gitea-mcp.json` 和 `.gitea-mcp.local.json`
3. **全局配置** - `~/.gitea-mcp/config.json`
4. **环境变量** - `GITEA_API_TOKEN`, `GITEA_SERVER_URL`

### 初始化项目配置

在项目目录中运行：

```bash
# 交互式配置向导
keactl config init

# 或指定参数
keactl config init \
  --server https://gitea.example.com \
  --owner your-username \
  --repo your-repo
```

这将创建 `.gitea-mcp.json` 配置文件：

```json
{
  "giteaUrl": "https://gitea.example.com",
  "owner": "your-username",
  "repo": "your-repo",
  "defaultBranch": "main"
}
```

### 配置 Token

**推荐方式**：在项目目录创建 `.gitea-mcp.local.json`（会被 Git 忽略）：

```json
{
  "token": "your-gitea-api-token"
}
```

**或使用环境变量**：

```bash
export GITEA_API_TOKEN=your-gitea-api-token
export GITEA_SERVER_URL=https://gitea.example.com
```

### 查看当前配置

```bash
keactl config show
```

## 快速开始

### 基本工作流

```bash
# 1. 初始化配置
keactl config init

# 2. 设置默认上下文（可选）
keactl context set --owner kysion --repo my-project

# 3. 查看仓库列表
keactl repo list

# 4. 创建 Issue
keactl issue create --title "修复登录问题" --body "详细描述..."

# 5. 查看 Issue 列表
keactl issue list --state open

# 6. 创建 Pull Request
keactl pr create \
  --title "feat: 添加新功能" \
  --head feature-branch \
  --base main \
  --body "这个 PR 实现了..."
```

## 命令参考

### 全局选项

所有命令都支持以下全局选项：

```bash
-t, --token <token>   # Gitea API Token
-s, --server <url>    # Gitea 服务器地址
-o, --owner <owner>   # 仓库所有者
-r, --repo <repo>     # 仓库名称
--json                # 以 JSON 格式输出
--no-color            # 禁用彩色输出
-h, --help            # 显示帮助信息
```

### context - 上下文管理

管理默认的 owner 和 repo 上下文，避免重复输入。

#### context get

获取当前上下文：

```bash
keactl context get
```

输出：
```
owner:   kysion
repo:    my-project
org:     (未设置)
project: (未设置)
```

#### context set

设置默认上下文：

```bash
# 设置 owner 和 repo
keactl context set --owner kysion --repo my-project

# 设置组织
keactl context set --org my-organization

# 设置项目看板
keactl context set --project 123
```

### user - 用户管理

#### user current

获取当前用户信息：

```bash
keactl user current
```

输出：
```
id:       123
username: kysion
fullName: Kysion AI Team
email:    dev@kysion.cn
avatar:   https://...
isAdmin:  false
created:  2024-01-01
```

#### user get

获取指定用户信息：

```bash
keactl user get <username>

# 示例
keactl user get alice
```

### repo - 仓库管理

#### repo list

列出仓库：

```bash
# 列出当前用户的仓库
keactl repo list

# 列出指定用户的仓库
keactl repo list --owner alice

# 分页
keactl repo list --limit 50 --page 2

# JSON 输出
keactl repo list --json
```

#### repo get

获取仓库详情：

```bash
keactl repo get --owner kysion --repo my-project

# 使用默认上下文
keactl repo get
```

输出：
```
fullName:       kysion/my-project
description:    项目描述
private:        false
fork:           false
defaultBranch:  main
language:       TypeScript
stars:          42
watchers:       10
forks:          5
openIssues:     3
openPRs:        1
size:           2.50 MB
created:        2024-01-01
updated:        2024-12-31
cloneUrl:       https://gitea.example.com/kysion/my-project.git
sshUrl:         git@gitea.example.com:kysion/my-project.git
website:        https://example.com
```

#### repo create

创建新仓库：

```bash
keactl repo create \
  --name my-new-repo \
  --description "项目描述" \
  --private \
  --auto-init

# 在组织下创建
keactl repo create \
  --name my-org-repo \
  --owner my-organization \
  --description "组织项目"
```

选项：
- `--name <name>` - 仓库名称（必需）
- `--description <desc>` - 仓库描述
- `--private` - 创建私有仓库
- `--auto-init` - 自动初始化（README）
- `--owner <owner>` - 仓库所有者（默认为当前用户）

#### repo delete

删除仓库：

```bash
# 交互式确认
keactl repo delete --owner kysion --repo my-old-repo

# 跳过确认
keactl repo delete --owner kysion --repo my-old-repo --yes
```

#### repo search

搜索仓库：

```bash
keactl repo search "keyword"

# 分页
keactl repo search "gitea" --limit 20 --page 1
```

### issue - Issue 管理

#### issue list

列出 Issues：

```bash
# 列出所有打开的 Issues
keactl issue list

# 指定状态
keactl issue list --state open    # open, closed, all
keactl issue list --state closed

# 分页
keactl issue list --limit 50 --page 2

# 指定仓库
keactl issue list --owner kysion --repo my-project
```

#### issue get

获取 Issue 详情：

```bash
keactl issue get <index>

# 示例
keactl issue get 123
```

输出：
```
number:     123
title:      修复登录问题
state:      open
author:     alice
assignees:  bob, charlie
labels:     bug, high-priority
milestone:  v1.0.0
comments:   5
created:    2024-01-01
updated:    2024-01-15
body:       详细的 Issue 描述...
url:        https://gitea.example.com/kysion/my-project/issues/123
```

#### issue create

创建新 Issue：

```bash
keactl issue create \
  --title "标题" \
  --body "详细描述" \
  --assignees alice,bob \
  --labels 1,2,3

# 使用默认上下文
keactl issue create --title "Bug: 登录失败"
```

选项：
- `--title <title>` - Issue 标题（必需）
- `--body <body>` - Issue 内容
- `--assignees <users>` - 指派人（逗号分隔）
- `--labels <ids>` - 标签 ID（逗号分隔）

#### issue update

更新 Issue：

```bash
keactl issue update <index> \
  --title "新标题" \
  --body "新内容" \
  --state closed

# 示例
keactl issue update 123 --title "Bug已修复"
```

#### issue close

关闭 Issue：

```bash
keactl issue close <index>

# 示例
keactl issue close 123
```

#### issue comment

添加 Issue 评论：

```bash
keactl issue comment <index> --body "评论内容"

# 示例
keactl issue comment 123 --body "问题已经修复"
```

### pr - Pull Request 管理

#### pr list

列出 Pull Requests：

```bash
# 列出所有打开的 PRs
keactl pr list

# 指定状态
keactl pr list --state open    # open, closed, all
keactl pr list --state closed

# 分页
keactl pr list --limit 50 --page 2
```

输出：
```
#    title                  state   author   head          base   mergeable   updated
1    feat: 添加新功能       open    alice    feature/new   main   Yes         2024-01-15
2    fix: 修复登录问题      open    bob      fix/login     main   Yes         2024-01-14
```

#### pr get

获取 PR 详情：

```bash
keactl pr get <index>

# 示例
keactl pr get 1
```

输出：
```
number:       1
title:        feat: 添加新功能
state:        open
author:       alice
assignees:    bob
labels:       enhancement
milestone:    v1.1.0
headBranch:   feature/new
baseBranch:   main
mergeable:    true
merged:       false
draft:        false
comments:     3
additions:    150
deletions:    20
changedFiles: 5
created:      2024-01-10
updated:      2024-01-15
body:         这个 PR 实现了...
url:          https://gitea.example.com/kysion/my-project/pulls/1
```

#### pr create

创建新 Pull Request：

```bash
keactl pr create \
  --title "标题" \
  --head feature-branch \
  --base main \
  --body "PR 描述"

# 示例
keactl pr create \
  --title "feat: 添加用户认证" \
  --head feature/auth \
  --base develop \
  --body "实现了基于 JWT 的用户认证系统"
```

选项：
- `--title <title>` - PR 标题（必需）
- `--head <branch>` - 源分支（必需）
- `--base <branch>` - 目标分支（必需）
- `--body <body>` - PR 描述

#### pr merge

合并 Pull Request：

```bash
# 使用默认合并方式（merge）
keactl pr merge <index>

# 指定合并方式
keactl pr merge <index> --method merge      # 普通合并
keactl pr merge <index> --method rebase     # Rebase 合并
keactl pr merge <index> --method squash     # Squash 合并

# 示例
keactl pr merge 1 --method squash
```

### project - 项目看板管理

#### project list

列出项目看板：

```bash
# 列出所有看板
keactl project list

# 指定状态
keactl project list --state open    # open, closed, all
```

#### project get

获取项目看板详情：

```bash
keactl project get <id>

# 示例
keactl project get 1
```

#### project create

创建项目看板：

```bash
keactl project create \
  --title "Sprint 1" \
  --description "第一个冲刺"

# 示例
keactl project create --title "2024 Q1 计划"
```

### config - 配置管理

#### config init

初始化项目配置：

```bash
# 交互式向导
keactl config init

# 指定参数
keactl config init \
  --server https://gitea.example.com \
  --owner kysion \
  --repo my-project

# 强制覆盖现有配置
keactl config init --force
```

自动检测功能：
- 自动从 Git 远程仓库检测服务器地址
- 自动检测 owner 和 repo 名称
- 缺失信息会交互式询问

#### config show

显示当前配置：

```bash
keactl config show
```

输出：
```
=== 项目配置 ===
giteaUrl: https://gitea.example.com
owner:    kysion
repo:     my-project
token:    ***已配置***

=== 全局配置 ===
servers:  2
language: zh-CN
```

## 配置系统

### 配置文件位置

#### 项目配置

- `.gitea-mcp.json` - 项目配置（提交到 Git）
- `.gitea-mcp.local.json` - 本地配置（不提交，包含 Token）

#### 全局配置

- `~/.gitea-mcp/config.json` - 全局配置

### 配置优先级

配置加载优先级从高到低：

1. **命令行参数**
   ```bash
   keactl --token xxx --server https://... repo list
   ```

2. **项目配置**
   ```json
   // .gitea-mcp.json
   {
     "giteaUrl": "https://gitea.example.com",
     "owner": "kysion",
     "repo": "my-project"
   }

   // .gitea-mcp.local.json
   {
     "token": "your-api-token"
   }
   ```

3. **全局配置**
   ```json
   // ~/.gitea-mcp/config.json
   {
     "servers": [
       {
         "url": "https://gitea.example.com",
         "token": "your-api-token",
         "isDefault": true
       }
     ]
   }
   ```

4. **环境变量**
   ```bash
   export GITEA_API_TOKEN=your-api-token
   export GITEA_SERVER_URL=https://gitea.example.com
   ```

### Token 安全建议

1. **推荐**：使用 `.gitea-mcp.local.json`（会被 `.gitignore` 忽略）
2. **可选**：使用环境变量
3. **不推荐**：不要将 Token 提交到 Git 仓库

## 使用场景示例

### 场景 1: 日常开发工作流

```bash
# 早上查看待办事项
keactl issue list --state open

# 创建新的功能分支后提交 PR
keactl pr create \
  --title "feat: 添加用户导出功能" \
  --head feature/export-users \
  --base develop \
  --body "实现用户数据导出为 CSV 格式"

# 查看 PR 状态
keactl pr get 10

# PR 通过审查后合并
keactl pr merge 10 --method squash
```

### 场景 2: Issue 管理

```bash
# 查看所有打开的 Bug
keactl issue list --state open | grep -i bug

# 创建新 Bug
keactl issue create \
  --title "Bug: 导出功能崩溃" \
  --body "在导出超过1000条记录时应用崩溃" \
  --labels 1,2  # bug, high-priority

# 添加调查结果
keactl issue comment 45 --body "已定位问题，是内存溢出导致"

# 更新 Issue 状态
keactl issue update 45 --title "Bug: 导出大数据集时内存溢出"

# 关闭已修复的 Issue
keactl issue close 45
```

### 场景 3: 团队协作

```bash
# 查看团队成员信息
keactl user get alice
keactl user get bob

# 创建项目看板
keactl project create --title "Sprint 5"

# 为 Sprint 创建 Issues
keactl issue create --title "实现用户认证" --assignees alice
keactl issue create --title "设计数据库架构" --assignees bob

# 查看所有 PR 等待审查
keactl pr list --state open

# 审查并合并团队成员的 PR
keactl pr get 15
keactl pr merge 15 --method rebase
```

### 场景 4: CI/CD 集成

```bash
#!/bin/bash
# 在 CI/CD 脚本中使用

# 设置环境变量
export GITEA_API_TOKEN=$CI_GITEA_TOKEN
export GITEA_SERVER_URL=$CI_GITEA_URL

# 构建成功后自动创建 PR
if [ "$CI_COMMIT_BRANCH" = "develop" ]; then
  keactl pr create \
    --title "release: v$(cat VERSION)" \
    --head develop \
    --base main \
    --body "Release version $(cat VERSION)" \
    --json > pr-info.json

  PR_NUMBER=$(jq -r '.number' pr-info.json)
  echo "Created PR #$PR_NUMBER"
fi

# 自动关闭已修复的 Issues
FIXED_ISSUES=$(git log --oneline -1 | grep -oP 'fixes #\K\d+')
for issue in $FIXED_ISSUES; do
  keactl issue close $issue
done
```

### 场景 5: 批量操作

```bash
# 批量关闭旧 Issues（结合 jq 处理 JSON）
keactl issue list --state open --json | \
  jq -r '.[] | select(.updated_at < "2023-01-01") | .number' | \
  while read issue; do
    keactl issue close $issue
  done

# 批量导出所有仓库信息
keactl repo list --json > repos.json

# 统计 PR 合并情况
keactl pr list --state closed --json | \
  jq '[.[] | {title, merged, author: .user.login}]' > pr-stats.json
```

### 场景 6: 多项目管理

```bash
# 项目 A
cd /path/to/project-a
keactl config init --force
keactl issue list

# 项目 B
cd /path/to/project-b
keactl config init --force
keactl issue list

# 或使用命令行参数切换项目
keactl issue list --owner teamA --repo projectA
keactl issue list --owner teamB --repo projectB
```

## 输出格式

### 默认表格输出

```bash
keactl repo list
```

```
name              description           private   stars   forks   updated
kysion/project1   Web应用框架           No        45      12      2024-01-15
kysion/project2   移动端SDK             Yes       23      5       2024-01-10
```

### JSON 输出

```bash
keactl repo list --json
```

```json
[
  {
    "name": "kysion/project1",
    "description": "Web应用框架",
    "private": false,
    "stars": 45,
    "forks": 12,
    "updated": "2024-01-15"
  },
  {
    "name": "kysion/project2",
    "description": "移动端SDK",
    "private": true,
    "stars": 23,
    "forks": 5,
    "updated": "2024-01-10"
  }
]
```

### 无彩色输出

```bash
keactl repo list --no-color
```

适用于日志文件或不支持彩色的环境。

## 错误处理

### 常见错误及解决方法

#### 1. 未找到 Token

```
错误: 未找到 Gitea API Token
请通过以下方式之一提供 Token:
  1. 命令行参数: --token <token>
  2. 项目配置: .gitea-mcp.local.json
  3. 全局配置: ~/.gitea-mcp/config.json
  4. 环境变量: GITEA_API_TOKEN 或 GITEA_TOKEN
```

**解决**：按提示配置 Token

#### 2. 未指定仓库

```
错误: 未指定仓库所有者
请通过以下方式之一提供:
  1. 命令行参数: --owner <owner>
  2. 项目配置: .gitea-mcp.json
  3. 上下文设置: keactl context set --owner <owner>
```

**解决**：
- 使用 `keactl config init` 初始化项目配置
- 或使用 `keactl context set --owner <owner> --repo <repo>`
- 或在命令中指定 `--owner` 和 `--repo`

#### 3. API 调用失败

```
错误: 创建仓库失败: 401 Unauthorized
```

**解决**：
- 检查 Token 是否正确
- 检查 Token 是否有足够权限
- 检查服务器地址是否正确

## 高级技巧

### 1. 命令别名

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
# keactl 别名
alias kea='keactl'
alias kea-issue='keactl issue'
alias kea-pr='keactl pr'
alias kea-repo='keactl repo'

# 快捷命令
alias issues='keactl issue list'
alias prs='keactl pr list'
```

### 2. 结合 jq 处理 JSON

```bash
# 提取特定字段
keactl issue list --json | jq '.[] | {number, title, author: .user.login}'

# 过滤数据
keactl pr list --json | jq '.[] | select(.mergeable == true)'

# 统计
keactl issue list --json | jq 'length'
```

### 3. 脚本化

创建自动化脚本：

```bash
#!/bin/bash
# daily-report.sh - 生成每日报告

echo "=== 今日 Issues ==="
keactl issue list --state open | head -10

echo -e "\n=== 待审查 PRs ==="
keactl pr list --state open

echo -e "\n=== 最近更新 ==="
keactl repo get | grep -E "(updated|openIssues|openPRs)"
```

### 4. 与其他工具集成

```bash
# 与 fzf 交互式选择
issue_num=$(keactl issue list --json | \
  jq -r '.[] | "\(.number) \(.title)"' | \
  fzf | awk '{print $1}')
keactl issue get $issue_num

# 通知集成
keactl issue create \
  --title "部署失败" \
  --body "$(cat deploy-error.log)" && \
  notify-send "Issue 已创建"
```

## 贡献与反馈

遇到问题或有功能建议？欢迎：

- 提交 Issue: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/issues
- 贡献代码: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/pulls
- 查看文档: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/wiki

## 许可证

MIT License
