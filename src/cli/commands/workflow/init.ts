/**
 * Workflow Init Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import prompts from 'prompts';
import {
  ProjectType,
  generateDefaultConfig,
  serializeConfig,
} from '../../../utils/workflow-config.js';

export interface WorkflowInitOptions {
  type?: ProjectType;
  language?: string;
  owner?: string;
  repo?: string;
  interactive?: boolean;
  force?: boolean;
}

/**
 * 检测项目类型
 */
function detectProjectType(): ProjectType | null {
  const cwd = process.cwd();

  // 检查前端项目
  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // 检查是否是前端框架
      if (deps.react || deps.vue || deps.angular || deps['@angular/core'] || deps.svelte) {
        return 'frontend';
      }
      // 检查是否是全栈框架
      if (deps.next || deps.nuxt || deps['@nestjs/core'] || deps.express) {
        return 'fullstack';
      }
    } catch {
      // 忽略解析错误
    }
    return 'library'; // 默认 Node.js 项目作为 library
  }

  // Go 项目
  if (fs.existsSync(path.join(cwd, 'go.mod'))) {
    // 检查是否是 CLI/后端
    if (fs.existsSync(path.join(cwd, 'cmd')) || fs.existsSync(path.join(cwd, 'main.go'))) {
      return 'backend';
    }
    return 'library';
  }

  // Python 项目
  if (
    fs.existsSync(path.join(cwd, 'requirements.txt')) ||
    fs.existsSync(path.join(cwd, 'pyproject.toml'))
  ) {
    return 'backend';
  }

  // Rust 项目
  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
    return 'library';
  }

  return null;
}

/**
 * 检测主要编程语言
 */
function detectLanguage(): string | null {
  const cwd = process.cwd();

  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    // 检查是否是 TypeScript 项目
    if (fs.existsSync(path.join(cwd, 'tsconfig.json'))) {
      return 'typescript';
    }
    return 'javascript';
  }
  if (fs.existsSync(path.join(cwd, 'go.mod'))) {
    return 'go';
  }
  if (fs.existsSync(path.join(cwd, 'requirements.txt')) || fs.existsSync(path.join(cwd, 'pyproject.toml'))) {
    return 'python';
  }
  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
    return 'rust';
  }

  return null;
}

/**
 * 获取仓库信息
 */
function getRepoInfo(): { owner: string; repo: string } | null {
  // 尝试从 .gitea-mcp.json 读取
  const configPath = path.join(process.cwd(), '.gitea-mcp.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.owner && config.repo) {
        return { owner: config.owner, repo: config.repo };
      }
    } catch {
      // 忽略
    }
  }

  // 尝试从 git remote 获取
  try {
    const { execSync } = require('child_process');
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();

    let owner = '';
    let repo = '';

    if (remoteUrl.startsWith('https://')) {
      const urlPath = remoteUrl.replace(/^https:\/\/[^/]+\//, '').replace(/\.git$/, '');
      const parts = urlPath.split('/');
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1];
      }
    } else if (remoteUrl.startsWith('git@')) {
      const urlPath = remoteUrl.replace(/^git@[^:]+:/, '').replace(/\.git$/, '');
      const parts = urlPath.split('/');
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    if (owner && repo) {
      return { owner, repo };
    }
  } catch {
    // 忽略
  }

  return null;
}

/**
 * 初始化工作流配置
 */
export async function initWorkflow(options: WorkflowInitOptions): Promise<void> {
  console.log(chalk.bold('\n🔧 Issue 工作流配置初始化\n'));

  // 检测项目信息
  const detectedType = detectProjectType();
  const detectedLanguage = detectLanguage();
  const repoInfo = getRepoInfo();

  if (detectedType) {
    console.log(chalk.gray(`📦 检测到项目类型: ${detectedType}`));
  }
  if (detectedLanguage) {
    console.log(chalk.gray(`💻 检测到编程语言: ${detectedLanguage}`));
  }
  if (repoInfo) {
    console.log(chalk.gray(`📁 仓库: ${repoInfo.owner}/${repoInfo.repo}`));
  }

  // 检查现有配置
  const configPath = path.join(process.cwd(), '.gitea', 'issue-workflow.yaml');
  if (fs.existsSync(configPath)) {
    console.log(chalk.yellow('\n⚠️  检测到现有工作流配置'));

    if (!options.force) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: '是否覆盖现有配置？',
        initial: false,
      });

      if (!confirm) {
        console.log(chalk.gray('\n已取消'));
        return;
      }
    }
  }

  // 收集配置参数
  let projectType: ProjectType = options.type || detectedType || 'backend';
  let language: string = options.language || detectedLanguage || 'typescript';
  let owner: string = options.owner || repoInfo?.owner || '';
  let repo: string = options.repo || repoInfo?.repo || '';

  if (options.interactive !== false) {
    const response = await prompts([
      {
        type: 'select',
        name: 'projectType',
        message: '选择项目类型',
        choices: [
          { title: 'Backend - 后端项目', value: 'backend' },
          { title: 'Frontend - 前端项目', value: 'frontend' },
          { title: 'Fullstack - 全栈项目', value: 'fullstack' },
          { title: 'Library - 库项目', value: 'library' },
        ],
        initial: ['backend', 'frontend', 'fullstack', 'library'].indexOf(projectType),
      },
      {
        type: 'select',
        name: 'language',
        message: '选择主要编程语言',
        choices: [
          { title: 'TypeScript', value: 'typescript' },
          { title: 'JavaScript', value: 'javascript' },
          { title: 'Go', value: 'go' },
          { title: 'Python', value: 'python' },
          { title: 'Rust', value: 'rust' },
          { title: 'Java', value: 'java' },
          { title: 'Other', value: 'other' },
        ],
        initial: ['typescript', 'javascript', 'go', 'python', 'rust', 'java', 'other'].indexOf(language) || 0,
      },
      {
        type: 'text',
        name: 'owner',
        message: '仓库所有者',
        initial: owner,
      },
      {
        type: 'text',
        name: 'repo',
        message: '仓库名称',
        initial: repo,
      },
    ]);

    if (!response.projectType) {
      console.log(chalk.gray('\n已取消'));
      return;
    }

    projectType = response.projectType;
    language = response.language;
    owner = response.owner;
    repo = response.repo;
  }

  // 生成配置
  console.log(chalk.bold('\n📝 生成工作流配置...\n'));

  const config = generateDefaultConfig(projectType, language);
  const configContent = serializeConfig(config);

  // 确保目录存在
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 写入配置文件
  fs.writeFileSync(configPath, configContent);
  console.log(chalk.green(`  ✓ ${configPath}`));

  console.log(chalk.bold('\n✅ 工作流配置完成！\n'));

  // 显示配置摘要
  console.log(chalk.bold('📋 配置摘要:\n'));

  console.log(chalk.cyan('  标签分类:'));
  console.log(chalk.gray(`    - status/*   : ${config.labels.status.length} 个状态标签`));
  console.log(chalk.gray(`    - priority/* : ${config.labels.priority.length} 个优先级标签`));
  console.log(chalk.gray(`    - type/*     : ${config.labels.type.length} 个类型标签`));
  console.log(chalk.gray(`    - area/*     : ${config.labels.area.length} 个领域标签`));
  console.log(chalk.gray(`    - workflow/* : ${config.labels.workflow.length} 个工作流标签`));

  console.log(chalk.cyan('\n  看板列:'));
  for (const column of config.board.columns) {
    console.log(chalk.gray(`    - ${column.name} (${column.mappedStatus})`));
  }

  console.log(chalk.bold('\n📋 后续步骤:\n'));
  console.log(chalk.cyan('  1. 同步标签到仓库'));
  console.log(chalk.white('     keactl workflow sync-labels'));
  console.log(chalk.cyan('\n  2. 创建项目看板'));
  console.log(chalk.white('     keactl workflow sync-board'));
  console.log(chalk.cyan('\n  3. 检查现有 Issue'));
  console.log(chalk.white('     keactl workflow check-issues'));

  console.log();
}
