/**
 * CI/CD Configuration Validation
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as yaml from 'yaml';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface WorkflowValidation {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 验证工作流文件语法
 */
function validateWorkflowFile(filePath: string): WorkflowValidation {
  const result: WorkflowValidation = {
    file: filePath,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.parse(content);

    // 检查基本结构
    if (!parsed.name) {
      result.warnings.push('缺少 name 字段');
    }

    if (!parsed.on) {
      result.errors.push('缺少 on 字段（触发条件）');
      result.valid = false;
    }

    if (!parsed.jobs) {
      result.errors.push('缺少 jobs 字段');
      result.valid = false;
    } else {
      // 检查每个 job
      for (const [jobName, job] of Object.entries(parsed.jobs)) {
        const jobObj = job as Record<string, unknown>;
        if (!jobObj['runs-on']) {
          result.errors.push(`Job "${jobName}" 缺少 runs-on 字段`);
          result.valid = false;
        }
        if (!jobObj.steps) {
          result.errors.push(`Job "${jobName}" 缺少 steps 字段`);
          result.valid = false;
        }
      }
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`YAML 解析错误: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * 检查分支是否存在
 */
function branchExists(branchName: string): boolean {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查远程分支是否存在
 */
function remoteBranchExists(branchName: string): boolean {
  try {
    execSync(`git show-ref --verify --quiet refs/remotes/origin/${branchName}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 从工作流文件中提取分支名
 */
function extractBranchesFromWorkflow(filePath: string): string[] {
  const branches: string[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.parse(content);

    const on = parsed.on;
    if (!on) return branches;

    // 从 push 触发器提取
    if (on.push?.branches) {
      branches.push(...on.push.branches);
    }

    // 从 pull_request 触发器提取
    if (on.pull_request?.branches) {
      branches.push(...on.pull_request.branches);
    }
  } catch {
    // 忽略错误
  }

  return [...new Set(branches)];
}

/**
 * 验证 CI/CD 配置
 */
export async function validateConfig(options: { fix?: boolean }): Promise<void> {
  console.log(chalk.bold('\n🔍 验证 CI/CD 配置\n'));

  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // 检查是否在 Git 仓库中
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    result.errors.push('当前目录不是 Git 仓库');
    result.valid = false;
    printResult(result);
    return;
  }

  // 检查工作流目录
  const giteaDir = '.gitea/workflows';
  const githubDir = '.github/workflows';
  const hasGitea = fs.existsSync(giteaDir);
  const hasGitHub = fs.existsSync(githubDir);

  if (!hasGitea && !hasGitHub) {
    result.errors.push('未找到 CI/CD 配置（.gitea/workflows 或 .github/workflows）');
    result.valid = false;
    result.suggestions.push('运行 `keactl cicd init` 初始化 CI/CD 配置');
    printResult(result);
    return;
  }

  // 验证工作流文件
  const workflowDirs = [];
  if (hasGitea) workflowDirs.push({ dir: giteaDir, platform: 'Gitea' });
  if (hasGitHub) workflowDirs.push({ dir: githubDir, platform: 'GitHub' });

  const allBranches: string[] = [];

  for (const { dir, platform } of workflowDirs) {
    console.log(chalk.bold(`📁 ${platform} Actions (${dir})`));

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    if (files.length === 0) {
      result.warnings.push(`${platform}: 工作流目录为空`);
      console.log(chalk.yellow('   ⚠️  工作流目录为空\n'));
      continue;
    }

    for (const file of files) {
      const filePath = path.join(dir, file);
      const validation = validateWorkflowFile(filePath);

      // 提取分支
      allBranches.push(...extractBranchesFromWorkflow(filePath));

      if (validation.valid) {
        console.log(chalk.green(`   ✓ ${file}`));
      } else {
        console.log(chalk.red(`   ✗ ${file}`));
        result.valid = false;
      }

      for (const error of validation.errors) {
        result.errors.push(`${file}: ${error}`);
        console.log(chalk.red(`     - ${error}`));
      }

      for (const warning of validation.warnings) {
        result.warnings.push(`${file}: ${warning}`);
        console.log(chalk.yellow(`     - ${warning}`));
      }
    }
    console.log();
  }

  // 检查分支
  const uniqueBranches = [...new Set(allBranches)];
  if (uniqueBranches.length > 0) {
    console.log(chalk.bold('🌳 分支检查'));

    for (const branch of uniqueBranches) {
      const localExists = branchExists(branch);
      const remoteExists = remoteBranchExists(branch);

      if (localExists && remoteExists) {
        console.log(chalk.green(`   ✓ ${branch} (本地 + 远程)`));
      } else if (localExists) {
        console.log(chalk.yellow(`   ⚠️  ${branch} (仅本地，未推送)`));
        result.warnings.push(`分支 "${branch}" 仅存在于本地`);
        result.suggestions.push(`推送分支: git push -u origin ${branch}`);
      } else if (remoteExists) {
        console.log(chalk.cyan(`   ○ ${branch} (仅远程)`));
      } else {
        console.log(chalk.red(`   ✗ ${branch} (不存在)`));
        result.warnings.push(`分支 "${branch}" 不存在`);
        result.suggestions.push(`创建分支: git checkout -b ${branch} && git push -u origin ${branch}`);
      }
    }
    console.log();
  }

  // 检查必要文件
  console.log(chalk.bold('📝 必要文件'));

  const requiredFiles = [
    { path: 'CONTRIBUTING.md', name: '贡献指南' },
  ];

  for (const { path: filePath, name } of requiredFiles) {
    if (fs.existsSync(filePath)) {
      console.log(chalk.green(`   ✓ ${name} (${filePath})`));
    } else {
      console.log(chalk.yellow(`   ⚠️  ${name} (${filePath}) - 不存在`));
      result.warnings.push(`缺少 ${name}`);
    }
  }
  console.log();

  // 检查 package.json 脚本（如果存在）
  if (fs.existsSync('package.json')) {
    console.log(chalk.bold('📦 package.json 脚本'));

    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const scripts = pkg.scripts || {};

      const requiredScripts = ['build', 'typecheck', 'lint', 'test'];
      for (const script of requiredScripts) {
        if (scripts[script]) {
          console.log(chalk.green(`   ✓ ${script}`));
        } else {
          console.log(chalk.yellow(`   ⚠️  ${script} - 未定义`));
          result.warnings.push(`package.json 缺少 "${script}" 脚本`);
        }
      }
    } catch {
      result.warnings.push('无法解析 package.json');
    }
    console.log();
  }

  // 打印结果
  printResult(result);

  // 尝试修复
  if (options.fix && result.suggestions.length > 0) {
    console.log(chalk.bold('🔧 自动修复\n'));

    for (const suggestion of result.suggestions) {
      if (suggestion.startsWith('创建分支:') || suggestion.startsWith('推送分支:')) {
        const match = suggestion.match(/:\s*(.+)$/);
        if (match) {
          const command = match[1];
          console.log(chalk.gray(`   执行: ${command}`));
          try {
            execSync(command, { stdio: 'inherit' });
            console.log(chalk.green(`   ✓ 成功`));
          } catch {
            console.log(chalk.red(`   ✗ 失败`));
          }
        }
      }
    }
    console.log();
  }
}

/**
 * 打印验证结果
 */
function printResult(result: ValidationResult): void {
  console.log(chalk.bold('📊 验证结果\n'));

  if (result.valid) {
    console.log(chalk.green('   ✅ 配置有效\n'));
  } else {
    console.log(chalk.red('   ❌ 配置存在问题\n'));
  }

  if (result.errors.length > 0) {
    console.log(chalk.red('   错误:'));
    for (const error of result.errors) {
      console.log(chalk.red(`     - ${error}`));
    }
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log(chalk.yellow('   警告:'));
    for (const warning of result.warnings) {
      console.log(chalk.yellow(`     - ${warning}`));
    }
    console.log();
  }

  if (result.suggestions.length > 0) {
    console.log(chalk.cyan('   建议:'));
    for (const suggestion of result.suggestions) {
      console.log(chalk.cyan(`     - ${suggestion}`));
    }
    console.log();
  }
}
