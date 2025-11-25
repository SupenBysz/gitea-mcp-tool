/**
 * CI/CD Status Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Platform } from './templates.js';

interface CICDStatus {
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

/**
 * 获取 CI/CD 状态
 */
function getCICDStatus(): CICDStatus {
  const status: CICDStatus = {
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
  const giteaDir = '.gitea/workflows';
  const githubDir = '.github/workflows';

  if (fs.existsSync(giteaDir)) {
    status.hasGitea = true;
    status.giteaFiles = fs.readdirSync(giteaDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  }

  if (fs.existsSync(githubDir)) {
    status.hasGitHub = true;
    status.githubFiles = fs.readdirSync(githubDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  }

  // 检查 CONTRIBUTING.md
  status.hasContributing = fs.existsSync('CONTRIBUTING.md');

  // 获取分支信息
  try {
    status.branches.current = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();

    // 获取所有分支
    const branches = execSync('git branch -a', { encoding: 'utf-8' })
      .split('\n')
      .map((b) => b.trim().replace('* ', ''));

    // 检测主分支
    for (const mainName of ['main', 'master']) {
      if (branches.some((b) => b === mainName || b.endsWith(`/${mainName}`))) {
        status.branches.main = mainName;
        break;
      }
    }

    // 检测开发分支
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
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    let platform: Platform | null = null;
    let owner = '';
    let repo = '';

    if (remoteUrl.includes('github.com')) {
      platform = 'github';
    } else if (remoteUrl.includes('gitea') || remoteUrl.includes('git.')) {
      platform = 'gitea';
    }

    // 解析 URL
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
 * 显示 CI/CD 状态
 */
export async function showStatus(options: { json?: boolean }): Promise<void> {
  const status = getCICDStatus();

  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  console.log(chalk.bold('\n📊 CI/CD 配置状态\n'));

  // 仓库信息
  if (status.remoteInfo) {
    console.log(chalk.bold('🔗 仓库信息'));
    console.log(`   所有者: ${chalk.cyan(status.remoteInfo.owner)}`);
    console.log(`   仓库名: ${chalk.cyan(status.remoteInfo.repo)}`);
    console.log(`   平台: ${chalk.cyan(status.remoteInfo.platform || '未知')}`);
    console.log(`   URL: ${chalk.gray(status.remoteInfo.url)}`);
    console.log();
  } else {
    console.log(chalk.yellow('⚠️  未检测到 Git 仓库\n'));
  }

  // 分支信息
  console.log(chalk.bold('🌳 分支信息'));
  console.log(`   当前分支: ${chalk.cyan(status.branches.current || '未知')}`);
  console.log(
    `   主分支: ${status.branches.main ? chalk.green(status.branches.main) : chalk.yellow('未检测到')}`
  );
  console.log(
    `   开发分支: ${status.branches.dev ? chalk.green(status.branches.dev) : chalk.yellow('未检测到')}`
  );
  console.log();

  // Gitea Actions
  console.log(chalk.bold('🔧 Gitea Actions'));
  if (status.hasGitea) {
    console.log(`   状态: ${chalk.green('已配置')}`);
    console.log(`   工作流文件:`);
    for (const file of status.giteaFiles) {
      console.log(`     - ${chalk.cyan(file)}`);
    }
  } else {
    console.log(`   状态: ${chalk.yellow('未配置')}`);
  }
  console.log();

  // GitHub Actions
  console.log(chalk.bold('🐙 GitHub Actions'));
  if (status.hasGitHub) {
    console.log(`   状态: ${chalk.green('已配置')}`);
    console.log(`   工作流文件:`);
    for (const file of status.githubFiles) {
      console.log(`     - ${chalk.cyan(file)}`);
    }
  } else {
    console.log(`   状态: ${chalk.yellow('未配置')}`);
  }
  console.log();

  // 文档
  console.log(chalk.bold('📝 文档'));
  console.log(
    `   CONTRIBUTING.md: ${status.hasContributing ? chalk.green('存在') : chalk.yellow('不存在')}`
  );
  console.log();

  // 建议
  const suggestions: string[] = [];

  if (!status.hasGitea && !status.hasGitHub) {
    suggestions.push('运行 `keactl cicd init` 初始化 CI/CD 配置');
  }

  if (!status.branches.dev && status.branches.main) {
    suggestions.push(`创建开发分支: git checkout -b dev && git push -u origin dev`);
  }

  if (!status.hasContributing) {
    suggestions.push('运行 `keactl cicd init` 生成 CONTRIBUTING.md');
  }

  if (suggestions.length > 0) {
    console.log(chalk.bold('💡 建议'));
    for (const suggestion of suggestions) {
      console.log(`   - ${suggestion}`);
    }
    console.log();
  }
}
