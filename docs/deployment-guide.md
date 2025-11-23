# 本地部署指南

## 概述

`deploy-local.sh` 是一个交互式部署脚本，用于快速将 Gitea MCP 工具部署到本地 `~/.gitea-mcp/` 目录。该脚本提供了友好的菜单界面，支持选择性部署 MCP Server、CLI 工具或全部组件。

## 快速开始

在项目根目录下运行：

```bash
./deploy-local.sh
```

## 主要特性

### 1. 交互式菜单系统

脚本提供清晰的菜单导航：

- **主菜单** - 选择部署模式
- **确认菜单** - 确认部署信息
- **部署后菜单** - 再次部署或查看文档
- **文档菜单** - 查看各类文档

### 2. 灵活的部署选项

#### 选项 1: 仅部署 MCP Server

适用场景：
- 只使用 AI 工具（Claude Desktop、Cline等）集成
- 不需要命令行工具
- 最小化部署

部署内容：
- `dist/index.js` - MCP Server 主文件
- `dist/index.js.map` - Source map
- `package.json` - 包信息
- `docs/` - 文档目录

#### 选项 2: 仅部署 CLI 工具

适用场景：
- 只使用命令行管理 Gitea
- 脚本自动化
- CI/CD 集成

部署内容：
- `dist/cli/index.js` - CLI 主文件
- `dist/cli/` - CLI 相关文件
- `package.json` - 包信息
- `docs/` - 文档目录

#### 选项 3: 部署全部

适用场景：
- 同时使用 MCP 和 CLI
- 完整功能支持
- 推荐选择

部署内容：
- 所有 MCP Server 文件
- 所有 CLI 工具文件
- 完整文档

### 3. 返回功能

每个菜单都支持返回上一步：

```
主菜单 ← 确认菜单 ← 部署后菜单
             ↑           ↓
             └─── 文档菜单
```

### 4. 自动依赖检查

脚本启动时自动检查：
- Node.js 是否安装（要求 18+）
- npm 是否可用
- 是否在项目根目录

## 使用流程

### 步骤 1: 选择部署模式

```
==========================================
  Gitea MCP Server - 本地部署工具
==========================================

请选择部署模式：

1) 仅部署 MCP Server
2) 仅部署 CLI 工具 (keactl)
3) 部署全部 (MCP + CLI)
4) 退出

请输入选项编号 (1-4):
```

### 步骤 2: 确认部署信息

```
----------------------------------------
📦 部署模式: 部署全部 (MCP + CLI)
📂 目标目录: /Users/username/.gitea-mcp
📄 部署文件: dist/index.js, dist/cli/index.js
----------------------------------------

1) 确认部署
2) 返回上一步
3) 退出

请选择操作 (1-3):
```

### 步骤 3: 自动构建和部署

```
==========================================
  开始部署
==========================================

[STEP] 构建项目...
✓ 构建完成

[STEP] 部署 MCP Server 到 /Users/username/.gitea-mcp...
✓ MCP Server 部署完成

[STEP] 部署 CLI 工具到 /Users/username/.gitea-mcp...
✓ CLI 工具部署完成

[STEP] 部署公共文件...
✓ 公共文件部署完成
```

### 步骤 4: 查看部署结果

```
==========================================
  部署成功完成！
==========================================

📦 版本: v1.3.0
📂 路径: /Users/username/.gitea-mcp/

✅ MCP Server: /Users/username/.gitea-mcp/dist/index.js (375KB)
✅ CLI 工具: /Users/username/.gitea-mcp/dist/cli/index.js (97KB)

[INFO] MCP Server 配置:
  1. 编辑 ~/.claude.json
  2. 确认: "args": ["/Users/username/.gitea-mcp/dist/index.js"]
  3. 重启 Claude Code

[INFO] CLI 工具使用:
  keactl config init    # 初始化配置
  keactl --help         # 查看帮助
```

### 步骤 5: 部署后操作

```
1) 再次部署
2) 查看文档
3) 退出

请选择操作 (1-3):
```

## 文档查看功能

部署后可以直接查看内置文档：

```
==========================================
  文档和资源
==========================================

1) CLI 使用指南
2) 初始化文档
3) 上下文管理文档
4) 返回

请选择要查看的文档 (1-4):
```

文档会使用 `less` 命令打开，支持：
- 空格键/PgDn - 向下翻页
- b/PgUp - 向上翻页
- q - 退出查看
- / - 搜索
- h - 帮助

## 常见使用场景

### 场景 1: 首次部署

```bash
# 1. 运行脚本
./deploy-local.sh

# 2. 选择 "3) 部署全部"
# 3. 选择 "1) 确认部署"
# 4. 等待部署完成
# 5. 选择 "3) 退出"
```

### 场景 2: 仅更新 MCP Server

```bash
# 1. 运行脚本
./deploy-local.sh

# 2. 选择 "1) 仅部署 MCP Server"
# 3. 确认部署
# 4. 完成后重启 Claude Code
```

### 场景 3: 仅更新 CLI 工具

```bash
# 1. 运行脚本
./deploy-local.sh

# 2. 选择 "2) 仅部署 CLI 工具"
# 3. 确认部署
# 4. 立即可用，无需重启
```

### 场景 4: 连续多次部署

```bash
# 1. 运行脚本一次
./deploy-local.sh

# 2. 完成第一次部署后
# 3. 选择 "1) 再次部署"
# 4. 选择新的部署模式
# 5. 重复流程
```

### 场景 5: 部署并查看文档

```bash
# 1. 运行脚本并完成部署
./deploy-local.sh

# 2. 部署完成后选择 "2) 查看文档"
# 3. 选择要查看的文档
# 4. 使用 less 浏览文档
# 5. 按 q 退出文档查看
# 6. 选择其他文档或返回
```

## 部署目标结构

部署完成后，`~/.gitea-mcp/` 目录结构：

### 完整部署（选项 3）
```
~/.gitea-mcp/
├── dist/
│   ├── index.js              # MCP Server (375KB)
│   ├── index.js.map          # Source map
│   └── cli/
│       ├── index.js          # CLI 主文件 (97KB)
│       └── ...               # CLI 其他文件
├── docs/
│   ├── cli-guide.md
│   ├── initialization.md
│   ├── context-management.md
│   └── ...
├── package.json
└── README.md
```

### 仅 MCP（选项 1）
```
~/.gitea-mcp/
├── dist/
│   ├── index.js
│   └── index.js.map
├── docs/
├── package.json
└── README.md
```

### 仅 CLI（选项 2）
```
~/.gitea-mcp/
├── dist/
│   └── cli/
│       ├── index.js
│       └── ...
├── docs/
├── package.json
└── README.md
```

## 配置说明

### MCP Server 配置

部署完成后，需要配置 MCP 客户端：

**Claude Code 配置 (~/.claude.json):**
```json
{
  "mcpServers": {
    "gitea-mcp-tool": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/username/.gitea-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://gitea.ktyun.cc",
        "GITEA_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

**重启 Claude Code** 以加载新版本。

### CLI 工具配置

CLI 工具部署后可立即使用：

**方式 1: 直接调用**
```bash
node ~/.gitea-mcp/dist/cli/index.js --help
```

**方式 2: 创建别名**
```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
alias keactl='node ~/.gitea-mcp/dist/cli/index.js'

# 使用
keactl config init
keactl repo list
```

**方式 3: 全局安装**
```bash
cd ~/.gitea-mcp
npm link
# 然后可以直接使用
keactl --help
```

## 故障排除

### 问题 1: 构建失败

**症状：**
```
[ERROR] 构建失败！
```

**解决方法：**
```bash
# 1. 确保依赖已安装
npm install

# 2. 清理并重新构建
rm -rf dist node_modules
npm install
npm run build

# 3. 再次运行部署脚本
./deploy-local.sh
```

### 问题 2: 权限错误

**症状：**
```
Permission denied: ./deploy-local.sh
```

**解决方法：**
```bash
chmod +x deploy-local.sh
./deploy-local.sh
```

### 问题 3: Node.js 版本过低

**症状：**
```
[ERROR] Node.js 未安装，请先安装 Node.js 18+
```

**解决方法：**
```bash
# 使用 nvm 安装最新版本
nvm install 20
nvm use 20

# 验证版本
node --version
```

### 问题 4: 文档查看失败

**症状：**
```
[WARN] 文档文件不存在: ~/.gitea-mcp/docs/cli-guide.md
```

**原因：** 部署时 docs 目录未成功复制

**解决方法：**
```bash
# 手动复制文档
cp -r docs ~/.gitea-mcp/
```

### 问题 5: MCP Server 未生效

**症状：** 部署成功但 Claude Code 仍使用旧版本

**解决方法：**
1. 确认配置文件路径正确
2. 完全退出 Claude Code（不是关闭窗口）
3. 重新启动 Claude Code
4. 检查 MCP 日志确认加载成功

## 高级技巧

### 技巧 1: 快速重新部署

```bash
# 使用默认选项（全部部署）并自动确认
echo -e "3\n1\n3" | ./deploy-local.sh
```

### 技巧 2: 部署到自定义目录

修改脚本中的 `TARGET_DIR` 变量：

```bash
# 编辑 deploy-local.sh
TARGET_DIR="$HOME/my-custom-path"
```

### 技巧 3: 部署后自动重启服务

在脚本末尾添加：

```bash
# 重启 Claude Code (macOS)
killall "Claude Code"
open -a "Claude Code"
```

### 技巧 4: 部署前自动测试

在部署前运行测试：

```bash
# 在 perform_build() 函数中添加
npm test
npm run lint
```

## 最佳实践

1. **开发迭代** - 每次修改代码后立即部署测试
2. **版本验证** - 部署后检查版本号确认更新成功
3. **配置备份** - 部署前备份重要配置文件
4. **日志检查** - 部署后检查 MCP 日志确认正常运行
5. **文档查阅** - 遇到问题先查看内置文档

## 相关资源

- [CLI 使用指南](./cli-guide.md)
- [初始化文档](./initialization.md)
- [上下文管理文档](./context-management.md)
- [主 README](../README.md)

## 总结

`deploy-local.sh` 提供了：

✅ 交互式菜单，易于使用
✅ 灵活的部署选项
✅ 返回功能，支持修改选择
✅ 详细的部署信息展示
✅ 内置文档查看
✅ 完整的错误处理

适合各种开发和部署场景，是开发者的得力助手。
