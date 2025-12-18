/**
 * Extra Initialization Options
 *
 * 处理项目初始化后的可选配置项：
 * - AI 规范文件 (AGENT.md + 大模型引用文件)
 * - 工作流配置
 * - 工单标签
 * - 项目看板
 * - CI/CD 配置
 * - 分支保护规则
 */

import prompts from 'prompts';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { cwd } from 'process';
import { initWorkflow } from '../workflow/init.js';
import { syncLabels } from '../workflow/sync-labels.js';
import { initCICD } from '../cicd/init.js';
import { createClient as createClientAsync, getContextFromConfig } from '../../utils/client.js';
import { createBranchProtection } from '../../../tools/branch.js';

/**
 * 可选初始化项
 */
export interface ExtraInitOptions {
  withAgentMd?: boolean;
  withWorkflow?: boolean;
  withLabels?: boolean;
  withBoard?: boolean;
  withCicd?: boolean;
  withProtection?: boolean;
  llm?: string[];
  allLlm?: boolean;
  noLlm?: boolean;
  all?: boolean;
  auto?: boolean;
  force?: boolean;
  owner?: string;
  repo?: string;
  token?: string;
  server?: string;
}

/**
 * 大模型引用文件配置
 */
interface LLMFileConfig {
  id: string;
  name: string;
  filename: string;
  description: string;
  subdir?: string;
}

const LLM_FILES: LLMFileConfig[] = [
  { id: 'claude', name: 'Claude', filename: 'CLAUDE.md', description: 'Claude Code / Claude API' },
  { id: 'cursor', name: 'Cursor', filename: '.cursorrules', description: 'Cursor IDE' },
  { id: 'copilot', name: 'Copilot', filename: 'copilot-instructions.md', subdir: '.github', description: 'GitHub Copilot' },
  { id: 'windsurf', name: 'Windsurf', filename: '.windsurfrules', description: 'Windsurf IDE' },
  { id: 'gemini', name: 'Gemini', filename: 'GEMINI.md', description: 'Google Gemini' },
  { id: 'deepseek', name: 'DeepSeek', filename: 'DEEPSEEK.md', description: 'DeepSeek Coder' },
  { id: 'qwen', name: '通义千问', filename: 'QWEN.md', description: '通义千问 / 通义灵码' },
  { id: 'gpt', name: 'GPT', filename: 'GPT.md', description: 'ChatGPT / GPT API' },
  { id: 'llama', name: 'Llama', filename: 'LLAMA.md', description: 'Meta Llama' },
  { id: 'ernie', name: '文心一言', filename: 'ERNIE.md', description: '百度文心大模型' },
  { id: 'doubao', name: '豆包', filename: 'DOUBAO.md', description: '字节豆包 / 云雀' },
  { id: 'glm', name: 'GLM', filename: 'GLM.md', description: '智谱 ChatGLM' },
];

/**
 * 可选初始化项选择
 */
interface ExtraChoice {
  value: string;
  title: string;
  description: string;
  selected: boolean;
}

const EXTRA_CHOICES: ExtraChoice[] = [
  { value: 'agentMd', title: 'AI 规范文件', description: '生成 AGENT.md 及大模型引用文件', selected: false },
  { value: 'workflow', title: '工作流配置', description: '创建 .gitea/issue-workflow.yaml', selected: false },
  { value: 'labels', title: '工单标签', description: '在仓库创建标准化标签（类型/状态/优先级）', selected: false },
  { value: 'board', title: '项目看板', description: '创建 Issue 看板', selected: false },
  { value: 'cicd', title: 'CI/CD 配置', description: '创建 .gitea/workflows/*.yaml', selected: false },
  { value: 'protection', title: '分支保护规则', description: '为 main/dev 分支设置保护', selected: false },
];

/**
 * 运行可选初始化项
 */
export async function runExtraInit(options: ExtraInitOptions): Promise<void> {
  const projectPath = cwd();

  // 如果指定了 --all，则选择所有项
  if (options.all) {
    options.withAgentMd = true;
    options.withWorkflow = true;
    options.withLabels = true;
    options.withBoard = true;
    options.withCicd = true;
    options.withProtection = true;
  }

  // 如果没有指定任何选项且不是自动模式，显示交互选择
  const hasAnyOption = options.withAgentMd || options.withWorkflow || options.withLabels ||
    options.withBoard || options.withCicd || options.withProtection;

  let selectedExtras: string[] = [];

  if (!hasAnyOption && !options.auto) {
    console.log();
    console.log(chalk.gray('  ─'.repeat(30)));
    console.log();

    const { extras } = await prompts({
      type: 'multiselect',
      name: 'extras',
      message: '是否继续初始化以下可选项?',
      choices: EXTRA_CHOICES.map(c => ({
        title: c.title,
        description: c.description,
        value: c.value,
        selected: c.selected,
      })),
      hint: '- 空格选择，回车确认',
    }, {
      onCancel: () => {
        console.log(chalk.gray('\n  跳过可选初始化\n'));
        return;
      },
    });

    if (!extras || extras.length === 0) {
      console.log(chalk.gray('\n  跳过可选初始化\n'));
      return;
    }

    selectedExtras = extras;
  } else if (hasAnyOption) {
    if (options.withAgentMd) selectedExtras.push('agentMd');
    if (options.withWorkflow) selectedExtras.push('workflow');
    if (options.withLabels) selectedExtras.push('labels');
    if (options.withBoard) selectedExtras.push('board');
    if (options.withCicd) selectedExtras.push('cicd');
    if (options.withProtection) selectedExtras.push('protection');
  }

  if (selectedExtras.length === 0) {
    return;
  }

  console.log();
  console.log(chalk.bold.cyan('  📦 初始化可选项'));
  console.log(chalk.gray('  ─'.repeat(30)));

  // 执行各项初始化
  for (const extra of selectedExtras) {
    console.log();

    switch (extra) {
      case 'agentMd':
        await initAgentMd(projectPath, options);
        break;
      case 'workflow':
        await initWorkflowConfig(options);
        break;
      case 'labels':
        await initLabels(options);
        break;
      case 'board':
        console.log(chalk.yellow('  ⚠ 项目看板初始化暂未实现'));
        break;
      case 'cicd':
        await initCicdConfig(options);
        break;
      case 'protection':
        await initBranchProtection(options);
        break;
    }
  }

  console.log();
  console.log(chalk.green('  ✓ 可选项初始化完成'));
  console.log();
}

/**
 * 初始化 AGENT.md 及大模型引用文件
 */
async function initAgentMd(projectPath: string, options: ExtraInitOptions): Promise<void> {
  console.log(chalk.cyan('  📝 初始化 AI 规范文件...'));

  const agentMdPath = path.join(projectPath, 'AGENT.md');

  // 检查 AGENT.md 是否已存在
  if (fs.existsSync(agentMdPath) && !options.force) {
    console.log(chalk.yellow('    ⚠ AGENT.md 已存在'));

    if (!options.auto) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: '是否覆盖现有 AGENT.md?',
        initial: false,
      });

      if (!overwrite) {
        console.log(chalk.gray('    跳过 AGENT.md 生成'));
      } else {
        await generateAgentMd(projectPath, options);
      }
    }
  } else {
    await generateAgentMd(projectPath, options);
  }

  // 选择大模型引用文件
  let selectedLlms: string[] = [];

  if (options.allLlm) {
    selectedLlms = LLM_FILES.map(f => f.id);
  } else if (options.llm && options.llm.length > 0) {
    selectedLlms = options.llm;
  } else if (!options.noLlm && !options.auto) {
    const { llms } = await prompts({
      type: 'multiselect',
      name: 'llms',
      message: '选择要生成的大模型引用文件:',
      choices: LLM_FILES.map(f => ({
        title: f.filename,
        description: f.description,
        value: f.id,
        selected: f.id === 'claude' || f.id === 'cursor', // 默认选中 Claude 和 Cursor
      })),
      hint: '- 空格选择，回车确认',
    });

    selectedLlms = llms || [];
  }

  // 生成大模型引用文件
  for (const llmId of selectedLlms) {
    const llmConfig = LLM_FILES.find(f => f.id === llmId);
    if (llmConfig) {
      await generateLlmFile(projectPath, llmConfig, options);
    }
  }
}

/**
 * 生成 AGENT.md 文件
 */
async function generateAgentMd(projectPath: string, options: ExtraInitOptions): Promise<void> {
  const owner = options.owner || '';
  const repo = options.repo || path.basename(projectPath);

  // 检测项目类型和语言
  const projectType = detectProjectType(projectPath);
  const language = detectLanguage(projectPath);

  const content = generateAgentMdContent({
    projectName: repo,
    owner,
    repo,
    projectType,
    language,
  });

  const agentMdPath = path.join(projectPath, 'AGENT.md');
  fs.writeFileSync(agentMdPath, content);
  console.log(chalk.green('    ✓ AGENT.md'));
}

/**
 * 生成大模型引用文件
 */
async function generateLlmFile(projectPath: string, config: LLMFileConfig, options: ExtraInitOptions): Promise<void> {
  let filePath: string;

  if (config.subdir) {
    const subdir = path.join(projectPath, config.subdir);
    if (!fs.existsSync(subdir)) {
      fs.mkdirSync(subdir, { recursive: true });
    }
    filePath = path.join(subdir, config.filename);
  } else {
    filePath = path.join(projectPath, config.filename);
  }

  // 检查文件是否已存在
  if (fs.existsSync(filePath) && !options.force) {
    console.log(chalk.gray(`    - ${config.filename} (已存在，跳过)`));
    return;
  }

  // 生成引用内容
  const content = '@AGENT.md\n';
  fs.writeFileSync(filePath, content);
  console.log(chalk.green(`    ✓ ${config.subdir ? config.subdir + '/' : ''}${config.filename} → @AGENT.md`));
}

/**
 * 检测项目类型
 */
function detectProjectType(projectPath: string): string {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.react || deps.vue || deps.angular || deps['@angular/core'] || deps.svelte) {
        return 'frontend';
      }
      if (deps.next || deps.nuxt || deps['@nestjs/core'] || deps.express) {
        return 'fullstack';
      }
    } catch {
      // ignore
    }
    return 'library';
  }

  if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
    if (fs.existsSync(path.join(projectPath, 'cmd')) || fs.existsSync(path.join(projectPath, 'main.go'))) {
      return 'backend';
    }
    return 'library';
  }

  if (fs.existsSync(path.join(projectPath, 'requirements.txt')) || fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
    return 'backend';
  }

  if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
    return 'library';
  }

  return 'backend';
}

/**
 * 检测主要编程语言
 */
function detectLanguage(projectPath: string): string {
  if (fs.existsSync(path.join(projectPath, 'package.json'))) {
    if (fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
      return 'TypeScript';
    }
    return 'JavaScript';
  }
  if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
    return 'Go';
  }
  if (fs.existsSync(path.join(projectPath, 'requirements.txt')) || fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
    return 'Python';
  }
  if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
    return 'Rust';
  }
  return 'Unknown';
}

/**
 * 生成 AGENT.md 内容
 */
interface AgentMdConfig {
  projectName: string;
  owner: string;
  repo: string;
  projectType: string;
  language: string;
}

function generateAgentMdContent(config: AgentMdConfig): string {
  const buildCommands = getBuildCommands(config.language);

  return `# ${config.projectName} - AI 工作指南

本文档定义 AI Agent 在 ${config.projectName} 项目中的工作规范。**项目级规范优先于 Wiki 通用规范**。

> 扩展参考：[Wiki](https://gitea.ktyun.cc/Kysion/ai-work-guidelines-wiki/wiki)

---

## 1. 项目概述

| 项目 | 内容 |
|------|------|
| **项目名称** | ${config.projectName} |
| **项目定位** | {项目定位描述} |
| **当前版本** | {版本号} |
| **仓库地址** | ${config.owner}/${config.repo} |

### 技术栈

| 类型 | 技术 | 版本要求 |
|------|------|----------|
| **语言** | ${config.language} | >= {版本} |
| **框架** | {框架} | >= {版本} |
| **数据库** | {数据库} | >= {版本} |

---

## 2. 目录结构

\`\`\`
${config.projectName}/
├── src/                # 源代码
├── tests/              # 测试文件
├── docs/               # 文档
├── AGENT.md            # 本文件
└── README.md           # 项目说明
\`\`\`

---

## 3. 构建命令

### 开发构建

\`\`\`bash
${buildCommands.install}

${buildCommands.build}

${buildCommands.run}
\`\`\`

### 代码检查

\`\`\`bash
${buildCommands.format}

${buildCommands.lint}
\`\`\`

### 测试

\`\`\`bash
${buildCommands.test}
\`\`\`

---

## 4. 工单规范

### 工单生命周期

\`\`\`mermaid
flowchart TD
    A[创建工单] --> B{需要拆分?}
    B -->|是| C[拆分子工单]
    B -->|否| D[分配负责人]
    C --> D
    D --> E[开始工作]
    E --> F{完成?}
    F -->|否| G{阻塞?}
    G -->|是| H[记录阻塞]
    H --> I[等待解决]
    I --> E
    G -->|否| E
    F -->|是| J[提交总结]
    J --> K[验收]
    K --> L{通过?}
    L -->|否| E
    L -->|是| M[关闭工单]
\`\`\`

### 状态标签

| 标签 | 说明 | 触发时机 |
|------|------|----------|
| \`状态/待处理\` | 等待开始 | 分配工单时 |
| \`状态/进行中\` | 正在处理 | 开始工作时 |
| \`状态/待验收\` | 等待验收 | 完成工作时 |
| \`状态/已阻塞\` | 被阻塞 | 发现依赖时 |
| \`状态/已完成\` | 已完成 | 验收通过时 |

> 更多详情：[Wiki - 工单工作流](https://gitea.ktyun.cc/Kysion/ai-work-guidelines-wiki/wiki/工单工作流)

---

## 5. 分支与PR规范

### 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| **功能** | \`feat/issue-{号}-{简述}\` | \`feat/issue-10-user-auth\` |
| **修复** | \`fix/issue-{号}-{简述}\` | \`fix/issue-15-login-bug\` |
| **子工单** | \`feat/issue-{子}-p{父}-{简述}\` | \`feat/issue-12-p10-api\` |

### 提交信息格式

\`\`\`
{类型}({模块}): {描述} #{工单号}
\`\`\`

| 类型 | 说明 |
|------|------|
| \`feat\` | 新功能 |
| \`fix\` | Bug修复 |
| \`docs\` | 文档 |
| \`refactor\` | 重构 |
| \`test\` | 测试 |
| \`chore\` | 杂项 |

> 更多详情：[Wiki - 分支管理规范](https://gitea.ktyun.cc/Kysion/ai-work-guidelines-wiki/wiki/分支管理规范)

---

## 6. 验收规范

### 验收前置条件

| 序号 | 条件 |
|------|------|
| 1 | 功能清单全部勾选 ✅ |
| 2 | 任务清单全部勾选 ✅ |
| 3 | 验收标准全部通过 ✅ |
| 4 | 用户验收确认 ✅ |
| 5 | 代码已合并 ✅ |

> 更多详情：[Wiki - 工单验收规范](https://gitea.ktyun.cc/Kysion/ai-work-guidelines-wiki/wiki/工单验收规范)

---

## 7. 评论模板

### 开始工作

\`\`\`markdown
## 开始处理

**时间**: YYYY-MM-DD HH:mm
**分支**: feat/issue-xx-xxx
**状态**: → 状态/进行中

### 工作计划
1. [计划步骤1]
2. [计划步骤2]
\`\`\`

### 工作总结

\`\`\`markdown
## 工作总结

**完成时间**: YYYY-MM-DD HH:mm
**状态**: → 状态/待验收

### 完成内容
- [完成项1]
- [完成项2]

### 代码变更
- 新增: [文件]
- 修改: [文件]
\`\`\`

> 更多模板：[Wiki - 工单评论模板](https://gitea.ktyun.cc/Kysion/ai-work-guidelines-wiki/wiki/工单评论模板)

---

## 8. 必须事项 & 禁止事项

### 必须事项

| 序号 | 事项 |
|------|------|
| 1 | 工作状态变更时**同步更新状态标签** |
| 2 | 开始/完成/阻塞时**在工单评论区记录** |
| 3 | **确认身份后**再开始工作 |
| 4 | 在**独立会话**中处理工单 |
| 5 | 代码提交前**通过测试和检查** |
| 6 | **所有改动必须通过 PR** |
| 7 | **关闭工单前必须勾选所有复选框** |
| 8 | **用户验收后才能关闭工单** |

### 禁止事项

| 序号 | 事项 | 后果 |
|------|------|------|
| 1 | 未经分配擅自处理工单 | 工作无效 |
| 2 | 同一会话处理多个工单 | 工作无效 |
| 3 | 使用 Mock 数据冒充实现 | 工作无效 |
| 4 | 声称测试通过但未执行 | 工作无效 |
| 5 | 直接提交到保护分支 | 需回退 |
| 6 | 用户验收前关闭工单 | 需重开 |
| 7 | 留有未勾选复选框关闭工单 | 需重开 |

> 更多详情：[Wiki - 违规处理](https://gitea.ktyun.cc/Kysion/ai-work-guidelines-wiki/wiki/违规处理)

---

## 9. 工具使用

| 优先级 | 工具 | 说明 |
|--------|------|------|
| 1 | **Gitea MCP** | MCP 协议工具 |
| 2 | **keactl** | 命令行工具 |
| 3 | **Gitea API** | REST API |

---

## 10. 项目特定规范

{项目特有的规范，如无可删除此章节}

---

## 相关文档

- [Wiki 首页](https://gitea.ktyun.cc/Kysion/ai-work-guidelines-wiki/wiki)
- [AI规范文件体系](https://gitea.ktyun.cc/Kysion/ai-work-guidelines-wiki/wiki/AI规范文件体系)

---

## 版本信息

| 项目 | 内容 |
|------|------|
| **版本** | v1.0 |
| **最后更新** | ${new Date().toISOString().split('T')[0]} |
| **维护者** | {维护者} |
`;
}

/**
 * 获取构建命令
 */
function getBuildCommands(language: string): Record<string, string> {
  switch (language) {
    case 'TypeScript':
    case 'JavaScript':
      return {
        install: '# 安装依赖\nnpm install',
        build: '# 编译\nnpm run build',
        run: '# 运行\nnpm run dev',
        format: '# 格式化\nnpm run lint:fix',
        lint: '# 静态检查\nnpm run lint',
        test: '# 运行测试\nnpm run test',
      };
    case 'Go':
      return {
        install: '# 安装依赖\ngo mod tidy',
        build: '# 编译\ngo build ./...',
        run: '# 运行\ngo run .',
        format: '# 格式化\ngo fmt ./...',
        lint: '# 静态检查\ngo vet ./...',
        test: '# 运行测试\ngo test ./...',
      };
    case 'Python':
      return {
        install: '# 安装依赖\npip install -r requirements.txt',
        build: '# 无需编译',
        run: '# 运行\npython main.py',
        format: '# 格式化\nblack .',
        lint: '# 静态检查\nflake8 .',
        test: '# 运行测试\npytest',
      };
    case 'Rust':
      return {
        install: '# 安装依赖（自动）',
        build: '# 编译\ncargo build',
        run: '# 运行\ncargo run',
        format: '# 格式化\ncargo fmt',
        lint: '# 静态检查\ncargo clippy',
        test: '# 运行测试\ncargo test',
      };
    default:
      return {
        install: '# 安装依赖\n{安装命令}',
        build: '# 编译\n{编译命令}',
        run: '# 运行\n{运行命令}',
        format: '# 格式化\n{格式化命令}',
        lint: '# 静态检查\n{检查命令}',
        test: '# 运行测试\n{测试命令}',
      };
  }
}

/**
 * 初始化工作流配置
 */
async function initWorkflowConfig(options: ExtraInitOptions): Promise<void> {
  console.log(chalk.cyan('  📋 初始化工作流配置...'));

  try {
    await initWorkflow({
      owner: options.owner,
      repo: options.repo,
      interactive: !options.auto,
      force: options.force,
    });
  } catch (error: any) {
    console.log(chalk.yellow(`    ⚠ 工作流配置失败: ${error.message}`));
  }
}

/**
 * 初始化工单标签
 */
async function initLabels(options: ExtraInitOptions): Promise<void> {
  console.log(chalk.cyan('  🏷️  初始化工单标签...'));

  if (!options.owner || !options.repo) {
    console.log(chalk.yellow('    ⚠ 需要提供 owner 和 repo 参数'));
    return;
  }

  try {
    await syncLabels({
      owner: options.owner,
      repo: options.repo,
      dryRun: false,
    });
    console.log(chalk.green('    ✓ 工单标签同步完成'));
  } catch (error: any) {
    console.log(chalk.yellow(`    ⚠ 标签同步失败: ${error.message}`));
  }
}

/**
 * 初始化 CI/CD 配置
 */
async function initCicdConfig(options: ExtraInitOptions): Promise<void> {
  console.log(chalk.cyan('  🚀 初始化 CI/CD 配置...'));

  try {
    await initCICD({
      interactive: !options.auto,
      force: options.force,
      branchProtection: false, // 分支保护单独处理
    });
  } catch (error: any) {
    console.log(chalk.yellow(`    ⚠ CI/CD 配置失败: ${error.message}`));
  }
}

/**
 * 分支保护规则预设
 */
const BRANCH_PROTECTION_PRESETS = [
  {
    name: 'main',
    ruleName: 'main',
    config: {
      enable_push: false,
      required_approvals: 1,
      enable_status_check: true,
      block_on_rejected_reviews: true,
      dismiss_stale_approvals: true,
    },
  },
  {
    name: 'dev',
    ruleName: 'dev',
    config: {
      enable_push: true,
      required_approvals: 0,
      enable_status_check: true,
      block_on_rejected_reviews: false,
      dismiss_stale_approvals: false,
    },
  },
];

/**
 * 初始化分支保护规则
 */
async function initBranchProtection(options: ExtraInitOptions): Promise<void> {
  console.log(chalk.cyan('  🔒 初始化分支保护规则...'));

  if (!options.owner || !options.repo) {
    console.log(chalk.yellow('    ⚠ 需要提供 owner 和 repo 参数'));
    return;
  }

  // 创建 API 客户端
  const client = await createClientAsync({
    token: options.token,
    server: options.server,
  });

  if (!client) {
    console.log(chalk.yellow('    ⚠ 无法创建 API 客户端'));
    return;
  }

  // 获取上下文
  const context = getContextFromConfig();
  const owner = options.owner || context.owner;
  const repo = options.repo || context.repo;

  // 选择要保护的分支
  let selectedBranches: string[] = [];

  if (options.auto) {
    selectedBranches = ['main', 'dev'];
  } else {
    const { branches } = await prompts({
      type: 'multiselect',
      name: 'branches',
      message: '选择要添加保护规则的分支:',
      choices: BRANCH_PROTECTION_PRESETS.map(p => ({
        title: `${p.name} - ${p.config.enable_push ? '允许推送' : '禁止直接推送'}`,
        value: p.name,
        selected: true,
      })),
      hint: '- 空格选择，回车确认',
    });

    selectedBranches = branches || [];
  }

  if (selectedBranches.length === 0) {
    console.log(chalk.gray('    跳过分支保护规则'));
    return;
  }

  // 创建分支保护规则
  for (const branchName of selectedBranches) {
    const preset = BRANCH_PROTECTION_PRESETS.find(p => p.name === branchName);
    if (!preset) continue;

    try {
      await createBranchProtection(
        { client, contextManager: null as any },
        {
          owner,
          repo,
          rule_name: preset.ruleName,
          ...preset.config,
        }
      );
      console.log(chalk.green(`    ✓ ${branchName} 分支保护规则已创建`));
    } catch (error: any) {
      if (error.message?.includes('already exist') || error.message?.includes('409')) {
        console.log(chalk.gray(`    - ${branchName} 分支保护规则已存在`));
      } else {
        console.log(chalk.yellow(`    ⚠ ${branchName}: ${error.message}`));
      }
    }
  }
}
