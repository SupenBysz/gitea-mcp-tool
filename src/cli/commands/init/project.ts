/**
 * Project Initialization
 *
 * 初始化项目级配置
 * - .gitea-mcp.json (提交到 Git)
 * - .gitea-mcp.local.json (不提交到 Git，包含 Token)
 */

import prompts from 'prompts';
import chalk from 'chalk';
import { cwd } from 'process';
import { ProjectConfigManager } from '../../../config/project.js';
import { GlobalConfigManager } from '../../../config/global.js';
import { detectGitInfo, isGitRepository } from '../../../utils/git-detector.js';
import { GiteaClient } from '../../../gitea-client.js';

export interface InitProjectOptions {
  server?: string;
  owner?: string;
  repo?: string;
  token?: string;
  tokenRef?: string;
  tokenEnv?: string;
  auto?: boolean;
  force?: boolean;
}

interface TokenChoice {
  type: 'global' | 'new' | 'env';
  value?: string;
  serverId?: string;
  tokenId?: string;
  envVar?: string;
}

/**
 * 项目级初始化
 */
export async function initProject(options: InitProjectOptions): Promise<void> {
  const projectPath = cwd();

  console.log();
  console.log(chalk.bold.cyan('  📁 项目配置初始化'));
  console.log(chalk.gray('  ─'.repeat(30)));
  console.log();

  // 检查是否为 Git 仓库
  if (!isGitRepository(projectPath)) {
    console.log(chalk.yellow('  ⚠ 当前目录不是 Git 仓库'));
    console.log(chalk.gray('    建议先执行: git init'));
    console.log();

    if (!options.auto) {
      const { continueAnyway } = await prompts({
        type: 'confirm',
        name: 'continueAnyway',
        message: '是否继续初始化?',
        initial: false,
      });

      if (!continueAnyway) {
        console.log(chalk.yellow('\n  已取消\n'));
        return;
      }
    }
  }

  // 检查已有配置
  const projectConfig = new ProjectConfigManager(projectPath);
  if (projectConfig.hasProjectConfig() && !options.force) {
    console.log(chalk.yellow('  ⚠ 配置文件已存在: .gitea-mcp.json'));

    if (!options.auto) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: '是否覆盖现有配置?',
        initial: false,
      });

      if (!overwrite) {
        console.log(chalk.yellow('\n  已取消\n'));
        return;
      }
    } else {
      console.log(chalk.red('  使用 --force 选项覆盖已有配置\n'));
      process.exit(1);
    }
  }

  // 自动检测 Git 信息
  const gitInfo = detectGitInfo(projectPath);
  let serverUrl = options.server || gitInfo.serverUrl;
  let owner = options.owner || gitInfo.owner;
  let repo = options.repo || gitInfo.repo;

  // 显示检测结果
  if (gitInfo.isGitRepo && (gitInfo.serverUrl || gitInfo.owner || gitInfo.repo)) {
    console.log(chalk.gray('  ℹ 检测到 Git 仓库信息:'));
    if (gitInfo.serverUrl) console.log(chalk.gray(`    服务器: ${gitInfo.serverUrl}`));
    if (gitInfo.owner) console.log(chalk.gray(`    所有者: ${gitInfo.owner}`));
    if (gitInfo.repo) console.log(chalk.gray(`    仓库名: ${gitInfo.repo}`));
    console.log();
  }

  // 交互式收集缺失信息
  if (!options.auto && (!serverUrl || !owner || !repo)) {
    const response = await prompts([
      {
        type: serverUrl ? null : 'text',
        name: 'serverUrl',
        message: 'Gitea 服务器地址:',
        initial: gitInfo.serverUrl || 'https://gitea.example.com',
        validate: (value: string) => {
          if (!value) return '服务器地址不能为空';
          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            return '请输入有效的 URL';
          }
          return true;
        },
      },
      {
        type: owner ? null : 'text',
        name: 'owner',
        message: '仓库所有者 (用户名或组织名):',
        initial: gitInfo.owner || '',
        validate: (value: string) => value ? true : '所有者不能为空',
      },
      {
        type: repo ? null : 'text',
        name: 'repo',
        message: '仓库名称:',
        initial: gitInfo.repo || '',
        validate: (value: string) => value ? true : '仓库名称不能为空',
      },
    ], {
      onCancel: () => {
        console.log(chalk.yellow('\n  已取消\n'));
        process.exit(0);
      },
    });

    serverUrl = serverUrl || response.serverUrl;
    owner = owner || response.owner;
    repo = repo || response.repo;
  }

  // 验证必要信息
  if (!serverUrl || !owner || !repo) {
    console.log(chalk.red('  ✗ 缺少必要信息'));
    console.log(chalk.gray('    请提供 --server, --owner, --repo 参数'));
    process.exit(1);
  }

  // 规范化 URL
  serverUrl = serverUrl.replace(/\/+$/, '');

  // 处理 Token
  let tokenChoice: TokenChoice | null = null;

  if (options.token) {
    tokenChoice = { type: 'new', value: options.token };
  } else if (options.tokenEnv) {
    tokenChoice = { type: 'env', envVar: options.tokenEnv };
  } else if (options.tokenRef) {
    tokenChoice = { type: 'global', tokenId: options.tokenRef };
  } else if (!options.auto) {
    tokenChoice = await selectTokenSource(serverUrl);
  }

  // 验证 Token 连接
  if (tokenChoice && tokenChoice.type === 'new' && tokenChoice.value) {
    console.log(chalk.gray('\n  ℹ 正在验证连接...'));

    try {
      const client = new GiteaClient({
        baseUrl: serverUrl,
        apiToken: tokenChoice.value,
      });

      // 验证仓库访问权限
      await client.get(`/repos/${owner}/${repo}`);
      console.log(chalk.green(`  ✓ 验证成功！可以访问 ${owner}/${repo}`));
    } catch (err: any) {
      console.log(chalk.yellow(`  ⚠ 验证失败: ${err.message}`));

      if (!options.auto) {
        const { continueAnyway } = await prompts({
          type: 'confirm',
          name: 'continueAnyway',
          message: '是否仍要保存配置?',
          initial: true,
        });

        if (!continueAnyway) {
          console.log(chalk.yellow('\n  已取消\n'));
          process.exit(1);
        }
      }
    }
  }

  // 创建项目配置
  projectConfig.createProjectConfig(
    {
      url: serverUrl,
      serverRef: tokenChoice?.serverId,
    },
    {
      owner,
      repo,
    },
    {
      setAsDefaultContext: true,
    }
  );

  // 创建本地配置 (Token)
  if (tokenChoice) {
    if (tokenChoice.type === 'new' && tokenChoice.value) {
      projectConfig.createLocalConfig({
        apiToken: tokenChoice.value,
      });
    } else if (tokenChoice.type === 'env' && tokenChoice.envVar) {
      projectConfig.createLocalConfig({
        apiTokenEnv: `\${${tokenChoice.envVar}}`,
      });
    } else if (tokenChoice.type === 'global' && tokenChoice.tokenId) {
      projectConfig.createLocalConfig({
        tokenRef: tokenChoice.tokenId,
      });
    }

    // 添加到 .gitignore
    projectConfig.addLocalConfigToGitignore();
  }

  // 显示结果
  console.log();
  console.log(chalk.gray('  ─'.repeat(30)));
  console.log(chalk.green('  ✓ 项目配置已创建:'));
  console.log(chalk.gray('    .gitea-mcp.json (提交到 Git)'));
  if (tokenChoice) {
    console.log(chalk.gray('    .gitea-mcp.local.json (已添加到 .gitignore)'));
  }
  console.log();
  console.log(chalk.cyan('  现在可以使用:'));
  console.log(chalk.gray('    keactl issue list'));
  console.log(chalk.gray('    keactl pr list'));
  console.log(chalk.gray('    keactl repo get'));
  console.log();
}

/**
 * 交互式选择 Token 来源
 */
async function selectTokenSource(serverUrl: string): Promise<TokenChoice | null> {
  const globalConfig = new GlobalConfigManager();
  const servers = globalConfig.getServers();

  // 查找匹配的服务器
  const matchingServer = servers.find(s => s.url === serverUrl);
  const globalTokens = matchingServer?.tokens || [];

  // 构建选项
  const choices: prompts.Choice[] = [];

  // 如果有匹配的全局 Token
  if (globalTokens.length > 0) {
    globalTokens.forEach((token, index) => {
      const defaultMark = token.isDefault ? ' (默认)' : '';
      choices.push({
        title: `使用全局 Token: ${token.name}${defaultMark}`,
        value: { type: 'global', serverId: matchingServer!.id, tokenId: token.id } as TokenChoice,
      });
    });
  }

  // 其他选项
  choices.push({
    title: '输入新 Token',
    value: { type: 'new' } as TokenChoice,
  });

  choices.push({
    title: '使用环境变量',
    value: { type: 'env' } as TokenChoice,
  });

  choices.push({
    title: '跳过 Token 配置',
    value: null,
  });

  console.log();
  const { tokenChoice } = await prompts({
    type: 'select',
    name: 'tokenChoice',
    message: 'Token 配置方式:',
    choices,
  }, {
    onCancel: () => {
      console.log(chalk.yellow('\n  已取消\n'));
      process.exit(0);
    },
  });

  if (!tokenChoice) {
    return null;
  }

  // 如果选择输入新 Token
  if (tokenChoice.type === 'new') {
    const { token } = await prompts({
      type: 'password',
      name: 'token',
      message: 'API Token:',
      validate: (value: string) => value ? true : 'Token 不能为空',
    });

    return { type: 'new', value: token };
  }

  // 如果选择环境变量
  if (tokenChoice.type === 'env') {
    const { envVar } = await prompts({
      type: 'text',
      name: 'envVar',
      message: '环境变量名:',
      initial: 'GITEA_API_TOKEN',
      validate: (value: string) => value ? true : '变量名不能为空',
    });

    return { type: 'env', envVar };
  }

  return tokenChoice;
}
