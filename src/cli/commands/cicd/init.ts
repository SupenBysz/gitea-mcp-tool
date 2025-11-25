/**
 * CI/CD Initialization
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';
import {
  Platform,
  ProjectType,
  TEMPLATES,
  getTemplate,
  getTemplateContent,
  TemplateVariables,
} from './templates.js';

export interface CICDInitOptions {
  platform?: Platform;
  template?: ProjectType;
  mainBranch?: string;
  devBranch?: string;
  branchProtection?: boolean;
  interactive?: boolean;
  force?: boolean;
}

interface GitInfo {
  owner: string;
  repo: string;
  platform: Platform;
  remoteUrl: string;
}

/**
 * 检测 Git 信息
 */
function detectGitInfo(): GitInfo | null {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();

    // 解析 Git URL
    // 支持格式:
    // - https://github.com/owner/repo.git
    // - https://gitea.example.com/owner/repo.git
    // - git@github.com:owner/repo.git
    // - git@gitea.example.com:owner/repo.git

    let owner = '';
    let repo = '';
    let platform: Platform = 'gitea';

    if (remoteUrl.includes('github.com')) {
      platform = 'github';
    }

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
      return { owner, repo, platform, remoteUrl };
    }
  } catch {
    // 忽略错误
  }

  return null;
}

/**
 * 检测项目类型
 */
function detectProjectType(): ProjectType | null {
  const cwd = process.cwd();

  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return 'nodejs';
  }
  if (fs.existsSync(path.join(cwd, 'go.mod'))) {
    return 'go';
  }
  if (
    fs.existsSync(path.join(cwd, 'requirements.txt')) ||
    fs.existsSync(path.join(cwd, 'pyproject.toml')) ||
    fs.existsSync(path.join(cwd, 'setup.py'))
  ) {
    return 'python';
  }
  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
    return 'rust';
  }
  if (fs.existsSync(path.join(cwd, 'Dockerfile'))) {
    return 'docker';
  }

  return null;
}

/**
 * 获取项目名称
 */
function getProjectName(): string {
  const cwd = process.cwd();

  // 尝试从 package.json 获取
  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (pkg.name) {
        return pkg.name;
      }
    } catch {
      // 忽略
    }
  }

  // 使用目录名
  return path.basename(cwd);
}

/**
 * 获取工作流目录
 */
function getWorkflowDir(platform: Platform): string {
  if (platform === 'github') {
    return '.github/workflows';
  }
  return '.gitea/workflows';
}

/**
 * 检查现有配置
 */
function checkExistingConfig(): { gitea: boolean; github: boolean } {
  return {
    gitea: fs.existsSync('.gitea/workflows'),
    github: fs.existsSync('.github/workflows'),
  };
}

/**
 * 初始化 CI/CD
 */
export async function initCICD(options: CICDInitOptions): Promise<void> {
  console.log(chalk.bold('\n🚀 CI/CD 配置初始化\n'));

  // 检测 Git 信息
  const gitInfo = detectGitInfo();
  if (!gitInfo) {
    console.log(chalk.yellow('⚠️  未检测到 Git 仓库，请确保在 Git 仓库目录中运行'));
  } else {
    console.log(chalk.gray(`📁 仓库: ${gitInfo.owner}/${gitInfo.repo}`));
    console.log(chalk.gray(`🔗 平台: ${gitInfo.platform === 'github' ? 'GitHub' : 'Gitea'}`));
  }

  // 检测项目类型
  const detectedType = detectProjectType();
  if (detectedType) {
    console.log(chalk.gray(`📦 检测到项目类型: ${detectedType}`));
  }

  // 检查现有配置
  const existing = checkExistingConfig();
  if (existing.gitea || existing.github) {
    const platforms = [];
    if (existing.gitea) platforms.push('Gitea');
    if (existing.github) platforms.push('GitHub');
    console.log(chalk.yellow(`\n⚠️  检测到现有 CI/CD 配置: ${platforms.join(', ')}`));

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

  // 交互式收集配置
  let platform: Platform = options.platform || gitInfo?.platform || 'gitea';
  let template: ProjectType = options.template || detectedType || 'nodejs';
  let mainBranch = options.mainBranch || 'main';
  let devBranch = options.devBranch || 'dev';
  let setupBranchProtection = options.branchProtection !== false;

  if (options.interactive !== false) {
    const response = await prompts([
      {
        type: 'select',
        name: 'platform',
        message: '选择 CI 平台',
        choices: [
          { title: 'Gitea Actions', value: 'gitea' },
          { title: 'GitHub Actions', value: 'github' },
        ],
        initial: platform === 'github' ? 1 : 0,
      },
      {
        type: 'select',
        name: 'template',
        message: '选择项目类型',
        choices: TEMPLATES.map((t) => ({
          title: `${t.name} - ${t.description}`,
          value: t.id,
        })),
        initial: TEMPLATES.findIndex((t) => t.id === template) || 0,
      },
      {
        type: 'text',
        name: 'mainBranch',
        message: '主分支名称（发布正式版）',
        initial: mainBranch,
      },
      {
        type: 'text',
        name: 'devBranch',
        message: '开发分支名称（发布 Beta 版）',
        initial: devBranch,
      },
      {
        type: 'confirm',
        name: 'branchProtection',
        message: '是否配置分支保护规则？',
        initial: setupBranchProtection,
      },
    ]);

    if (!response.platform) {
      console.log(chalk.gray('\n已取消'));
      return;
    }

    platform = response.platform;
    template = response.template;
    mainBranch = response.mainBranch;
    devBranch = response.devBranch;
    setupBranchProtection = response.branchProtection;
  }

  // 准备模板变量
  const variables: TemplateVariables = {
    projectName: getProjectName(),
    owner: gitInfo?.owner || 'owner',
    repo: gitInfo?.repo || 'repo',
    mainBranch,
    devBranch,
    nodeVersion: '20',
    goVersion: '1.21',
    pythonVersion: '3.11',
    rustVersion: 'stable',
  };

  // 获取模板信息
  const templateInfo = getTemplate(template);
  if (!templateInfo) {
    console.log(chalk.red(`\n❌ 未找到模板: ${template}`));
    return;
  }

  // 创建工作流目录
  const workflowDir = getWorkflowDir(platform);
  fs.mkdirSync(workflowDir, { recursive: true });

  console.log(chalk.bold('\n📝 生成工作流文件...\n'));

  // 生成工作流文件
  for (const fileName of templateInfo.files) {
    const filePath = path.join(workflowDir, fileName);
    const content = getTemplateContent(template, platform, fileName, variables);
    fs.writeFileSync(filePath, content);
    console.log(chalk.green(`  ✓ ${filePath}`));
  }

  // 创建 CONTRIBUTING.md（如果不存在）
  if (!fs.existsSync('CONTRIBUTING.md')) {
    const contributingContent = generateContributingDoc(mainBranch, devBranch);
    fs.writeFileSync('CONTRIBUTING.md', contributingContent);
    console.log(chalk.green(`  ✓ CONTRIBUTING.md`));
  }

  console.log(chalk.bold('\n✅ CI/CD 配置完成！\n'));

  // 显示后续步骤
  console.log(chalk.bold('📋 后续步骤:\n'));

  if (template === 'nodejs') {
    console.log(chalk.cyan('  1. 配置 NPM_TOKEN secret'));
    console.log(chalk.gray(`     在仓库设置中添加 NPM_TOKEN 用于发布到 npm`));
  } else if (template === 'python') {
    console.log(chalk.cyan('  1. 配置 PYPI_TOKEN secret'));
    console.log(chalk.gray(`     在仓库设置中添加 PYPI_TOKEN 用于发布到 PyPI`));
  } else if (template === 'docker') {
    console.log(chalk.cyan('  1. 配置 Docker secrets'));
    console.log(chalk.gray(`     DOCKER_USERNAME 和 DOCKER_PASSWORD`));
  }

  if (setupBranchProtection) {
    console.log(chalk.cyan('\n  2. 配置分支保护规则'));
    console.log(chalk.gray(`     运行以下命令配置分支保护：`));
    console.log(chalk.white(`     keactl cicd validate --fix`));
  }

  console.log(chalk.cyan('\n  3. 创建开发分支'));
  console.log(chalk.gray(`     git checkout -b ${devBranch}`));
  console.log(chalk.gray(`     git push -u origin ${devBranch}`));

  console.log(chalk.cyan('\n  4. 开始开发'));
  console.log(chalk.gray(`     按照 CONTRIBUTING.md 中的流程进行开发`));

  console.log();
}

/**
 * 生成 CONTRIBUTING.md 文档
 */
function generateContributingDoc(mainBranch: string, devBranch: string): string {
  return `# 贡献指南

## 分支策略

\`\`\`
feature/*  ──┐
bugfix/*   ──┼──→ ${devBranch} ──────→ ${mainBranch}
fix/*      ──┤      │           │
feat/*     ──┘      ↓           ↓
                 beta版      正式版

hotfix/*   ─────────────────→ ${mainBranch} (紧急修复)
\`\`\`

### 分支说明

| 分支 | 用途 | 合并来源 |
|------|------|----------|
| \`${mainBranch}\` | 稳定版本，发布正式版 | \`${devBranch}\`, \`hotfix/*\` |
| \`${devBranch}\` | 开发分支，发布 beta 版 | \`feature/*\`, \`bugfix/*\`, \`fix/*\`, \`feat/*\` |
| \`feature/*\` | 新功能开发 | - |
| \`bugfix/*\` / \`fix/*\` | Bug 修复 | - |
| \`hotfix/*\` | 紧急修复 | - |

## 开发流程

### 1. 创建功能分支

\`\`\`bash
# 新功能
git checkout ${devBranch}
git pull origin ${devBranch}
git checkout -b feature/your-feature

# Bug 修复
git checkout -b fix/issue-description
\`\`\`

### 2. 开发和提交

\`\`\`bash
# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/your-feature
\`\`\`

### 3. 创建 Pull Request

- **目标分支**: \`${devBranch}\`
- **标题格式**: \`feat: xxx\` 或 \`fix: xxx\`
- 等待 CI 检查通过
- 请求 review（如需要）

### 4. 合并后自动发布

- 合并到 \`${devBranch}\` → 自动发布 beta 版本
- 合并到 \`${mainBranch}\` → 自动发布正式版本

## Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

### Type 类型

| 类型 | 说明 | 版本影响 |
|------|------|----------|
| \`feat\` | 新功能 | minor (1.0.0 → 1.1.0) |
| \`fix\` | Bug 修复 | patch (1.0.0 → 1.0.1) |
| \`docs\` | 文档更新 | - |
| \`style\` | 代码格式 | - |
| \`refactor\` | 重构 | - |
| \`test\` | 测试 | - |
| \`chore\` | 构建/工具 | - |
| \`breaking\` | 破坏性变更 | major (1.0.0 → 2.0.0) |

### 示例

\`\`\`bash
# 新功能
git commit -m "feat(cli): add init command"

# Bug 修复
git commit -m "fix(api): handle null response"

# 破坏性变更
git commit -m "feat!: change API response format

BREAKING CHANGE: response format changed from array to object"
\`\`\`

## 紧急修复

\`\`\`bash
# 创建 hotfix 分支
git checkout ${mainBranch}
git checkout -b hotfix/critical-fix

# 修复并提交
git commit -m "fix: critical bug fix"

# 直接 PR 到 ${mainBranch}
git push origin hotfix/critical-fix
# 创建 PR: hotfix/critical-fix → ${mainBranch}
\`\`\`
`;
}
