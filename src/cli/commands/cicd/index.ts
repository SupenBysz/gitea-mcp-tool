/**
 * CI/CD Command Entry
 *
 * keactl cicd init - 交互式初始化 CI/CD
 * keactl cicd templates - 列出可用模板
 * keactl cicd status - 查看配置状态
 * keactl cicd validate - 验证配置
 */

import { Command } from 'commander';
import { initCICD, CICDInitOptions } from './init.js';
import { listTemplates } from './templates.js';
import { showStatus } from './status.js';
import { validateConfig } from './validate.js';

/**
 * 创建 cicd 命令
 */
export function createCICDCommand(): Command {
  const cicdCmd = new Command('cicd')
    .description('CI/CD 配置管理');

  // 子命令: cicd init
  cicdCmd
    .command('init')
    .description('交互式初始化 CI/CD 配置')
    .option('-p, --platform <platform>', 'CI 平台 (gitea/github)', 'gitea')
    .option('-t, --template <template>', '项目模板 (nodejs/go/python/rust/docker)')
    .option('--main-branch <branch>', '主分支名称', 'main')
    .option('--dev-branch <branch>', '开发分支名称', 'dev')
    .option('--no-branch-protection', '不配置分支保护规则')
    .option('--no-interactive', '非交互模式')
    .option('-f, --force', '强制覆盖已有配置')
    .action(async (options: CICDInitOptions) => {
      await initCICD(options);
    });

  // 子命令: cicd templates
  cicdCmd
    .command('templates')
    .description('列出可用的 CI/CD 模板')
    .option('-p, --platform <platform>', '过滤平台 (gitea/github)')
    .option('--json', '以 JSON 格式输出')
    .action(async (options) => {
      await listTemplates(options);
    });

  // 子命令: cicd status
  cicdCmd
    .command('status')
    .description('查看当前 CI/CD 配置状态')
    .option('--json', '以 JSON 格式输出')
    .action(async (options) => {
      await showStatus(options);
    });

  // 子命令: cicd validate
  cicdCmd
    .command('validate')
    .description('验证 CI/CD 配置')
    .option('--fix', '尝试自动修复问题')
    .action(async (options) => {
      await validateConfig(options);
    });

  return cicdCmd;
}
