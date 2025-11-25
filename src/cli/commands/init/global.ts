/**
 * Global Environment Initialization
 *
 * 初始化全局配置 (~/.gitea-mcp/config.json)
 * - 配置 Gitea 服务器
 * - 配置 API Token
 * - 验证连接
 */

import prompts from 'prompts';
import chalk from 'chalk';
import { GlobalConfigManager } from '../../../config/global.js';
import { GiteaClient } from '../../../gitea-client.js';
import type { SupportedLocale } from '../../../i18n/types.js';

export interface InitGlobalOptions {
  server?: string;
  name?: string;
  token?: string;
  default?: boolean;
  skipVerify?: boolean;
  lang?: string;
}

/**
 * 全局环境初始化
 */
export async function initGlobal(options: InitGlobalOptions): Promise<void> {
  console.log();
  console.log(chalk.bold.cyan('  🚀 Gitea MCP Tool - 全局环境初始化'));
  console.log(chalk.gray('  ─'.repeat(30)));
  console.log();

  const globalConfig = new GlobalConfigManager();
  const existingServers = globalConfig.getServers();

  // 显示已有服务器信息
  if (existingServers.length > 0) {
    console.log(chalk.yellow('  ℹ 已配置的服务器:'));
    existingServers.forEach((s, i) => {
      const defaultMark = s.isDefault ? chalk.green(' (默认)') : '';
      console.log(chalk.gray(`    ${i + 1}. ${s.name || s.url}${defaultMark}`));
    });
    console.log();
  }

  // 收集服务器信息
  let serverUrl = options.server;
  let serverName = options.name;
  let apiToken = options.token;
  let setDefault = options.default ?? true;
  let language = options.lang || 'zh-CN';

  // 交互式收集缺失信息
  if (!serverUrl || !apiToken) {
    const response = await prompts([
      {
        type: serverUrl ? null : 'text',
        name: 'serverUrl',
        message: 'Gitea 服务器地址:',
        initial: 'https://gitea.example.com',
        validate: (value: string) => {
          if (!value) return '服务器地址不能为空';
          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            return '请输入有效的 URL (http:// 或 https://)';
          }
          return true;
        },
      },
      {
        type: serverName ? null : 'text',
        name: 'serverName',
        message: '服务器别名 (可选):',
        initial: '',
      },
      {
        type: apiToken ? null : 'password',
        name: 'apiToken',
        message: 'API Token:',
        validate: (value: string) => value ? true : 'Token 不能为空',
      },
      {
        type: 'confirm',
        name: 'setDefault',
        message: '设为默认服务器?',
        initial: true,
      },
      {
        type: 'select',
        name: 'language',
        message: '默认语言:',
        choices: [
          { title: '简体中文', value: 'zh-CN' },
          { title: 'English', value: 'en' },
        ],
        initial: 0,
      },
    ], {
      onCancel: () => {
        console.log(chalk.yellow('\n  已取消初始化\n'));
        process.exit(0);
      },
    });

    serverUrl = serverUrl || response.serverUrl;
    serverName = serverName || response.serverName;
    apiToken = apiToken || response.apiToken;
    setDefault = response.setDefault ?? setDefault;
    language = response.language || language;
  }

  // 规范化 URL (移除末尾斜杠)
  serverUrl = serverUrl!.replace(/\/+$/, '');

  // 验证连接
  if (!options.skipVerify) {
    console.log();
    console.log(chalk.gray('  ℹ 正在验证连接...'));

    try {
      const client = new GiteaClient({
        baseUrl: serverUrl,
        apiToken: apiToken!,
      });

      const user = await client.get<{ login: string; full_name?: string }>('/user');
      const displayName = user.full_name || user.login;
      console.log(chalk.green(`  ✓ 连接成功！用户: ${displayName}`));
    } catch (err: any) {
      console.log(chalk.red(`  ✗ 连接失败: ${err.message}`));
      console.log();

      const { continueAnyway } = await prompts({
        type: 'confirm',
        name: 'continueAnyway',
        message: '连接验证失败，是否仍要保存配置?',
        initial: false,
      });

      if (!continueAnyway) {
        console.log(chalk.yellow('\n  已取消初始化\n'));
        process.exit(1);
      }
    }
  }

  // 检查是否已存在相同 URL 的服务器
  const existingServer = globalConfig.getServerByUrl(serverUrl);
  if (existingServer) {
    console.log();
    console.log(chalk.yellow(`  ⚠ 服务器 ${serverUrl} 已存在`));

    const { updateExisting } = await prompts({
      type: 'confirm',
      name: 'updateExisting',
      message: '是否更新现有配置?',
      initial: true,
    });

    if (updateExisting) {
      // 添加新 Token 到现有服务器
      globalConfig.addToken(existingServer.id, {
        name: `Token-${new Date().toISOString().slice(0, 10)}`,
        token: apiToken!,
        createdAt: new Date().toISOString(),
        createdBy: 'manual',
        isDefault: true,
      });

      if (setDefault) {
        globalConfig.setDefaultServer(existingServer.id);
      }

      console.log(chalk.green('\n  ✓ Token 已更新'));
    } else {
      console.log(chalk.yellow('\n  已跳过\n'));
      return;
    }
  } else {
    // 添加新服务器
    const newServer = globalConfig.addServer({
      name: serverName || new URL(serverUrl).hostname,
      url: serverUrl,
      isDefault: setDefault,
    });

    // 添加 Token
    globalConfig.addToken(newServer.id, {
      name: `Token-${new Date().toISOString().slice(0, 10)}`,
      token: apiToken!,
      createdAt: new Date().toISOString(),
      createdBy: 'manual',
      isDefault: true,
    });

    console.log(chalk.green('\n  ✓ 服务器已添加'));
  }

  // 更新语言设置
  globalConfig.updateSettings({ language: language as SupportedLocale });

  // 显示结果
  console.log();
  console.log(chalk.gray('  ─'.repeat(30)));
  console.log(chalk.green('  ✓ 全局配置已保存'));
  console.log(chalk.gray(`    位置: ~/.gitea-mcp/config.json`));
  console.log();
  console.log(chalk.cyan('  下一步:'));
  console.log(chalk.gray('    cd your-project && keactl init project'));
  console.log();
}
