/**
 * Init Command Entry
 *
 * keactl init - 交互式选择初始化类型
 * keactl init global - 全局环境初始化
 * keactl init project - 项目级初始化
 */

import { Command } from 'commander';
import { initGlobal, InitGlobalOptions } from './global.js';
import { initProject, InitProjectOptions } from './project.js';
import { runInitWizard } from './wizard.js';

/**
 * 创建 init 命令
 */
export function createInitCommand(): Command {
  const initCmd = new Command('init')
    .description('初始化 Gitea MCP 配置')
    .action(async () => {
      // 无子命令时运行交互式向导
      await runInitWizard();
    });

  // 子命令: init global
  initCmd
    .command('global')
    .description('初始化全局环境配置 (~/.gitea-mcp/config.json)')
    .option('-s, --server <url>', 'Gitea 服务器地址')
    .option('-n, --name <name>', '服务器别名')
    .option('-t, --token <token>', 'API Token')
    .option('-d, --default', '设为默认服务器')
    .option('--skip-verify', '跳过连接验证')
    .option('--lang <lang>', '默认语言 (zh-CN/en)', 'zh-CN')
    .action(async (options: InitGlobalOptions) => {
      await initGlobal(options);
    });

  // 子命令: init project
  initCmd
    .command('project')
    .description('初始化当前项目配置 (.gitea-mcp.json)')
    .option('-s, --server <url>', 'Gitea 服务器地址 (覆盖自动检测)')
    .option('-o, --owner <owner>', '仓库所有者 (覆盖自动检测)')
    .option('-r, --repo <repo>', '仓库名称 (覆盖自动检测)')
    .option('-t, --token <token>', 'API Token')
    .option('--token-ref <id>', '引用全局 Token ID')
    .option('--token-env <var>', '使用环境变量名')
    .option('--auto', '完全自动模式，无交互')
    .option('-f, --force', '强制覆盖已有配置')
    .action(async (options: InitProjectOptions) => {
      await initProject(options);
    });

  return initCmd;
}
