/**
 * Interactive Init Wizard
 *
 * 当用户直接运行 `keactl init` 时的交互式向导
 * 引导用户选择初始化类型并执行相应流程
 */

import prompts from 'prompts';
import chalk from 'chalk';
import { GlobalConfigManager } from '../../../config/global.js';
import { ProjectConfigManager } from '../../../config/project.js';
import { isGitRepository } from '../../../utils/git-detector.js';
import { initGlobal } from './global.js';
import { initProject } from './project.js';
import { cwd } from 'process';

type InitType = 'global' | 'project' | 'both';

/**
 * 运行初始化向导
 */
export async function runInitWizard(): Promise<void> {
  console.log();
  console.log(chalk.bold.cyan('  🎯 Gitea MCP Tool 初始化向导'));
  console.log(chalk.gray('  ─'.repeat(30)));
  console.log();

  // 检测当前状态
  const status = detectCurrentStatus();
  showStatusInfo(status);

  // 根据状态推荐初始化类型
  const recommendedType = getRecommendedType(status);

  // 让用户选择
  const { initType } = await prompts({
    type: 'select',
    name: 'initType',
    message: '选择初始化类型:',
    choices: [
      {
        title: `全局环境${recommendedType === 'global' ? chalk.green(' (推荐)') : ''}`,
        description: '配置 Gitea 服务器和 Token (首次使用)',
        value: 'global' as InitType,
      },
      {
        title: `当前项目${recommendedType === 'project' ? chalk.green(' (推荐)') : ''}`,
        description: '为当前 Git 仓库配置',
        value: 'project' as InitType,
      },
      {
        title: `两者都配置${recommendedType === 'both' ? chalk.green(' (推荐)') : ''}`,
        description: '先配置全局环境，再配置当前项目',
        value: 'both' as InitType,
      },
    ],
    initial: recommendedType === 'global' ? 0 : recommendedType === 'project' ? 1 : 2,
  }, {
    onCancel: () => {
      console.log(chalk.yellow('\n  已取消\n'));
      process.exit(0);
    },
  });

  // 执行选择的初始化
  console.log();

  switch (initType) {
    case 'global':
      await initGlobal({});
      break;

    case 'project':
      await initProject({});
      break;

    case 'both':
      await initGlobal({});
      console.log();
      console.log(chalk.gray('  ─'.repeat(30)));
      console.log();
      await initProject({});
      break;
  }
}

interface CurrentStatus {
  hasGlobalConfig: boolean;
  globalServerCount: number;
  hasProjectConfig: boolean;
  isGitRepo: boolean;
}

/**
 * 检测当前配置状态
 */
function detectCurrentStatus(): CurrentStatus {
  const projectPath = cwd();

  // 检查全局配置
  const globalConfig = new GlobalConfigManager();
  const servers = globalConfig.getServers();

  // 检查项目配置
  const projectConfig = new ProjectConfigManager(projectPath);

  return {
    hasGlobalConfig: servers.length > 0,
    globalServerCount: servers.length,
    hasProjectConfig: projectConfig.hasProjectConfig(),
    isGitRepo: isGitRepository(projectPath),
  };
}

/**
 * 显示当前状态信息
 */
function showStatusInfo(status: CurrentStatus): void {
  console.log(chalk.gray('  当前状态:'));

  // 全局配置状态
  if (status.hasGlobalConfig) {
    console.log(chalk.green(`    ✓ 全局配置已存在 (${status.globalServerCount} 个服务器)`));
  } else {
    console.log(chalk.yellow('    ○ 未配置全局环境'));
  }

  // 项目配置状态
  if (status.hasProjectConfig) {
    console.log(chalk.green('    ✓ 项目配置已存在'));
  } else if (status.isGitRepo) {
    console.log(chalk.yellow('    ○ Git 仓库未配置'));
  } else {
    console.log(chalk.gray('    - 当前目录不是 Git 仓库'));
  }

  console.log();
}

/**
 * 根据状态推荐初始化类型
 */
function getRecommendedType(status: CurrentStatus): InitType {
  // 如果没有全局配置，优先推荐全局初始化
  if (!status.hasGlobalConfig) {
    // 如果同时是 Git 仓库且没有项目配置，推荐两者都配置
    if (status.isGitRepo && !status.hasProjectConfig) {
      return 'both';
    }
    return 'global';
  }

  // 如果有全局配置但没有项目配置，且是 Git 仓库
  if (status.isGitRepo && !status.hasProjectConfig) {
    return 'project';
  }

  // 默认推荐项目配置
  return 'project';
}
