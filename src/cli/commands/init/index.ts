/**
 * Init Command Entry
 *
 * 支持多种初始化方式:
 *
 * 1. 交互式向导:
 *    keactl init
 *
 * 2. 快捷一行初始化:
 *    keactl init -g -s <url> -t <token>        全局环境初始化
 *    keactl init -p -s <url> -t <token>        项目级初始化 (自动检测 Git 仓库信息)
 *    keactl init -p -o <owner> -r <repo>       项目级初始化 (指定仓库信息)
 *
 * 3. 子命令方式 (兼容旧版):
 *    keactl init global -s <url> -t <token>
 *    keactl init project -s <url> -o <owner> -r <repo>
 */

import { Command } from 'commander';
import { initGlobal, InitGlobalOptions } from './global.js';
import { initProject, InitProjectOptions } from './project.js';
import { runInitWizard } from './wizard.js';

interface InitShortcutOptions {
  global?: boolean;
  project?: boolean;
  server?: string;
  name?: string;
  token?: string;
  owner?: string;
  repo?: string;
  default?: boolean;
  skipVerify?: boolean;
  lang?: string;
  tokenRef?: string;
  tokenEnv?: string;
  auto?: boolean;
  force?: boolean;
}

/**
 * 创建 init 命令
 */
export function createInitCommand(): Command {
  const initCmd = new Command('init')
    .description('初始化 Gitea MCP 配置 (支持 -g 全局 / -p 项目级)')
    // 快捷模式选项
    .option('-g, --global', '全局环境初始化')
    .option('-p, --project', '项目级初始化')
    // 通用选项
    .option('-s, --server <url>', 'Gitea 服务器地址')
    .option('-t, --token <token>', 'API Token')
    // 全局初始化选项
    .option('-n, --name <name>', '[全局] 服务器别名')
    .option('-d, --default', '[全局] 设为默认服务器')
    .option('--skip-verify', '[全局] 跳过连接验证')
    .option('--lang <lang>', '[全局] 默认语言 (zh-CN/en)', 'zh-CN')
    // 项目初始化选项
    .option('-o, --owner <owner>', '[项目] 仓库所有者')
    .option('-r, --repo <repo>', '[项目] 仓库名称')
    .option('--token-ref <id>', '[项目] 引用全局 Token ID')
    .option('--token-env <var>', '[项目] 使用环境变量名')
    .option('--auto', '[项目] 完全自动模式')
    .option('-f, --force', '[项目] 强制覆盖已有配置')
    .action(async (options: InitShortcutOptions, cmd: Command) => {
      // 合并父命令选项 (支持 keactl -t xxx -s xxx init -g)
      const parentOpts = cmd.parent?.opts() || {};
      const mergedOpts = { ...parentOpts, ...options };

      // 快捷模式: -g 全局初始化
      if (mergedOpts.global) {
        const globalOpts: InitGlobalOptions = {
          server: mergedOpts.server,
          name: mergedOpts.name,
          token: mergedOpts.token,
          default: mergedOpts.default,
          skipVerify: mergedOpts.skipVerify,
          lang: mergedOpts.lang,
        };
        await initGlobal(globalOpts);
        return;
      }

      // 快捷模式: -p 项目初始化
      if (mergedOpts.project) {
        const projectOpts: InitProjectOptions = {
          server: mergedOpts.server,
          owner: mergedOpts.owner,
          repo: mergedOpts.repo,
          token: mergedOpts.token,
          tokenRef: mergedOpts.tokenRef,
          tokenEnv: mergedOpts.tokenEnv,
          auto: mergedOpts.auto,
          force: mergedOpts.force,
        };
        await initProject(projectOpts);
        return;
      }

      // 无快捷参数时运行交互式向导
      await runInitWizard();
    });

  // 子命令: init global (兼容旧版)
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

  // 子命令: init project (兼容旧版)
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
