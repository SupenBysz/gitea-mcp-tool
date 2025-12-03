/**
 * CI/CD Tools
 * CI/CD 配置管理工具
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export type Platform = 'gitea' | 'github';
export type ProjectType = 'nodejs' | 'go' | 'python' | 'rust' | 'docker';

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  platforms: Platform[];
  files: string[];
}

export interface TemplateVariables {
  projectName: string;
  owner: string;
  repo: string;
  mainBranch: string;
  devBranch: string;
  nodeVersion?: string;
  goVersion?: string;
  pythonVersion?: string;
  rustVersion?: string;
}

export interface CICDInitParams {
  platform?: Platform;
  template?: ProjectType;
  mainBranch?: string;
  devBranch?: string;
  force?: boolean;
}

export interface CICDStatusResult {
  hasGitea: boolean;
  hasGitHub: boolean;
  giteaFiles: string[];
  githubFiles: string[];
  hasContributing: boolean;
  branches: {
    current: string;
    main: string | null;
    dev: string | null;
  };
  remoteInfo: {
    platform: Platform | null;
    owner: string;
    repo: string;
    url: string;
  } | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * 可用模板列表
 */
export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'Node.js 项目 - 包含 CI 检查、Beta 发布、正式发布',
    projectType: 'nodejs',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'publish-beta.yaml', 'publish.yaml'],
  },
  {
    id: 'go',
    name: 'Go',
    description: 'Go 项目 - 包含 CI 检查、构建、发布',
    projectType: 'go',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'release.yaml'],
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Python 项目 - 包含 CI 检查、PyPI 发布',
    projectType: 'python',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'publish.yaml'],
  },
  {
    id: 'rust',
    name: 'Rust',
    description: 'Rust 项目 - 包含 CI 检查、Cargo 发布',
    projectType: 'rust',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'release.yaml'],
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Docker 项目 - 包含构建和推送镜像',
    projectType: 'docker',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'docker-publish.yaml'],
  },
];

/**
 * 列出可用模板
 */
export function listTemplates(platform?: Platform): TemplateInfo[] {
  if (platform) {
    return TEMPLATES.filter((t) => t.platforms.includes(platform));
  }
  return TEMPLATES;
}

/**
 * 获取 CI/CD 状态
 */
export function getCICDStatus(workingDir: string = process.cwd()): CICDStatusResult {
  const status: CICDStatusResult = {
    hasGitea: false,
    hasGitHub: false,
    giteaFiles: [],
    githubFiles: [],
    hasContributing: false,
    branches: {
      current: '',
      main: null,
      dev: null,
    },
    remoteInfo: null,
  };

  // 检查工作流目录
  const giteaDir = path.join(workingDir, '.gitea/workflows');
  const githubDir = path.join(workingDir, '.github/workflows');

  if (fs.existsSync(giteaDir)) {
    status.hasGitea = true;
    status.giteaFiles = fs.readdirSync(giteaDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  }

  if (fs.existsSync(githubDir)) {
    status.hasGitHub = true;
    status.githubFiles = fs.readdirSync(githubDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  }

  // 检查 CONTRIBUTING.md
  status.hasContributing = fs.existsSync(path.join(workingDir, 'CONTRIBUTING.md'));

  // 获取分支信息
  try {
    status.branches.current = execSync('git branch --show-current', {
      encoding: 'utf-8',
      cwd: workingDir,
    }).trim();

    const branches = execSync('git branch -a', { encoding: 'utf-8', cwd: workingDir })
      .split('\n')
      .map((b) => b.trim().replace('* ', ''));

    for (const mainName of ['main', 'master']) {
      if (branches.some((b) => b === mainName || b.endsWith(`/${mainName}`))) {
        status.branches.main = mainName;
        break;
      }
    }

    for (const devName of ['dev', 'develop', 'development']) {
      if (branches.some((b) => b === devName || b.endsWith(`/${devName}`))) {
        status.branches.dev = devName;
        break;
      }
    }
  } catch {
    // 忽略错误
  }

  // 获取远程信息
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf-8',
      cwd: workingDir,
    }).trim();

    let platform: Platform | null = null;
    let owner = '';
    let repo = '';

    if (remoteUrl.includes('github.com')) {
      platform = 'github';
    } else if (remoteUrl.includes('gitea') || remoteUrl.includes('git.')) {
      platform = 'gitea';
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

    status.remoteInfo = { platform, owner, repo, url: remoteUrl };
  } catch {
    // 忽略错误
  }

  return status;
}

/**
 * 验证 CI/CD 配置
 */
export function validateCICDConfig(workingDir: string = process.cwd()): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // 检查是否在 Git 仓库中
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore', cwd: workingDir });
  } catch {
    result.errors.push('当前目录不是 Git 仓库');
    result.valid = false;
    return result;
  }

  const status = getCICDStatus(workingDir);

  if (!status.hasGitea && !status.hasGitHub) {
    result.errors.push('未找到 CI/CD 配置（.gitea/workflows 或 .github/workflows）');
    result.valid = false;
    result.suggestions.push('使用 gitea_cicd_init 工具初始化 CI/CD 配置');
    return result;
  }

  // 检查必要文件
  if (!status.hasContributing) {
    result.warnings.push('缺少 CONTRIBUTING.md 文件');
  }

  // 检查分支
  if (!status.branches.main) {
    result.warnings.push('未检测到主分支 (main/master)');
  }

  if (!status.branches.dev) {
    result.warnings.push('未检测到开发分支 (dev/develop)');
    result.suggestions.push('创建开发分支: git checkout -b dev && git push -u origin dev');
  }

  return result;
}

/**
 * 检测项目类型
 */
export function detectProjectType(workingDir: string = process.cwd()): ProjectType | null {
  if (fs.existsSync(path.join(workingDir, 'package.json'))) {
    return 'nodejs';
  }
  if (fs.existsSync(path.join(workingDir, 'go.mod'))) {
    return 'go';
  }
  if (
    fs.existsSync(path.join(workingDir, 'requirements.txt')) ||
    fs.existsSync(path.join(workingDir, 'pyproject.toml')) ||
    fs.existsSync(path.join(workingDir, 'setup.py'))
  ) {
    return 'python';
  }
  if (fs.existsSync(path.join(workingDir, 'Cargo.toml'))) {
    return 'rust';
  }
  if (fs.existsSync(path.join(workingDir, 'Dockerfile'))) {
    return 'docker';
  }

  return null;
}

/**
 * 获取项目名称
 */
export function getProjectName(workingDir: string = process.cwd()): string {
  const packageJsonPath = path.join(workingDir, 'package.json');
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

  return path.basename(workingDir);
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
 * 初始化 CI/CD 配置
 */
export async function initCICD(
  params: CICDInitParams,
  workingDir: string = process.cwd()
): Promise<{
  success: boolean;
  message: string;
  filesCreated: string[];
  errors?: string[];
}> {
  const {
    platform = 'gitea',
    template = 'nodejs',
    mainBranch = 'main',
    devBranch = 'dev',
    force = false,
  } = params;

  const filesCreated: string[] = [];
  const errors: string[] = [];

  try {
    // 检查现有配置
    const workflowDir = path.join(workingDir, getWorkflowDir(platform));
    if (fs.existsSync(workflowDir) && !force) {
      return {
        success: false,
        message: `CI/CD 配置已存在: ${workflowDir}`,
        filesCreated: [],
        errors: ['使用 force=true 覆盖现有配置'],
      };
    }

    // 获取模板信息
    const templateInfo = TEMPLATES.find((t) => t.id === template);
    if (!templateInfo) {
      return {
        success: false,
        message: `未找到模板: ${template}`,
        filesCreated: [],
        errors: [`可用模板: ${TEMPLATES.map((t) => t.id).join(', ')}`],
      };
    }

    // 检测 Git 信息
    const status = getCICDStatus(workingDir);
    const projectName = getProjectName(workingDir);
    const owner = status.remoteInfo?.owner || 'owner';
    const repo = status.remoteInfo?.repo || 'repo';

    // 准备模板变量
    const variables: TemplateVariables = {
      projectName,
      owner,
      repo,
      mainBranch,
      devBranch,
      nodeVersion: '20',
      goVersion: '1.21',
      pythonVersion: '3.11',
      rustVersion: 'stable',
    };

    // 创建工作流目录
    fs.mkdirSync(workflowDir, { recursive: true });

    // 动态导入模板生成函数
    const { getTemplateContent } = await import('../cli/commands/cicd/templates.js');

    // 生成工作流文件
    for (const fileName of templateInfo.files) {
      try {
        const content = getTemplateContent(template, platform, fileName, variables);
        const filePath = path.join(workflowDir, fileName);
        fs.writeFileSync(filePath, content);
        filesCreated.push(filePath);
      } catch (err) {
        errors.push(`生成 ${fileName} 失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 创建 CONTRIBUTING.md（如果不存在）
    const contributingPath = path.join(workingDir, 'CONTRIBUTING.md');
    if (!fs.existsSync(contributingPath)) {
      const contributingContent = generateContributingDoc(mainBranch, devBranch);
      fs.writeFileSync(contributingPath, contributingContent);
      filesCreated.push(contributingPath);
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? 'CI/CD 配置初始化成功' : 'CI/CD 配置初始化完成，但有一些错误',
      filesCreated,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: `初始化失败: ${error instanceof Error ? error.message : String(error)}`,
      filesCreated,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
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
git checkout ${devBranch}
git pull origin ${devBranch}
git checkout -b feature/your-feature
\`\`\`

### 2. 开发和提交

\`\`\`bash
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature
\`\`\`

### 3. 创建 Pull Request

- **目标分支**: \`${devBranch}\`
- **标题格式**: \`feat: xxx\` 或 \`fix: xxx\`

### 4. 合并后自动发布

- 合并到 \`${devBranch}\` → 自动发布 beta 版本
- 合并到 \`${mainBranch}\` → 自动发布正式版本

## Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 说明 | 版本影响 |
|------|------|----------|
| \`feat\` | 新功能 | minor |
| \`fix\` | Bug 修复 | patch |
| \`breaking\` | 破坏性变更 | major |
`;
}
