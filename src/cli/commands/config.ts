/**
 * 配置管理命令
 */

import { ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, info } from '../utils/output.js';
import { ProjectConfigManager } from '../../config/project.js';
import { GlobalConfigManager } from '../../config/global.js';
import { detectGitInfo } from '../../utils/git-detector.js';
import { cwd } from 'process';
import prompts from 'prompts';

/**
 * 初始化项目配置
 */
export async function configInit(options: ClientOptions & {
  giteaUrl?: string;
  owner?: string;
  repo?: string;
  force?: boolean;
}) {
  try {
    const projectRoot = cwd();
    const projectConfigManager = new ProjectConfigManager(projectRoot);

    // 检查是否已有配置
    const existingConfig = projectConfigManager.loadConfig();
    if (existingConfig.giteaUrl && !options.force) {
      error('配置文件已存在');
      error('使用 --force 选项强制覆盖');
      process.exit(1);
    }

    // 尝试自动检测 Git 信息
    const gitInfo = detectGitInfo(projectRoot);

    let giteaUrl = options.giteaUrl || gitInfo?.serverUrl;
    let owner = options.owner || gitInfo?.owner;
    let repo = options.repo || gitInfo?.repo;

    // 如果仍然缺少信息，交互式询问
    if (!giteaUrl || !owner || !repo) {
      info('自动检测到的信息:', options);
      if (gitInfo) {
        outputDetails({
          serverUrl: gitInfo.serverUrl || '(未检测到)',
          owner: gitInfo.owner || '(未检测到)',
          repo: gitInfo.repo || '(未检测到)',
        }, options);
      }

      const response = await prompts([
        {
          type: giteaUrl ? null : 'text',
          name: 'giteaUrl',
          message: 'Gitea 服务器地址:',
          initial: gitInfo?.serverUrl || 'https://gitea.example.com',
          validate: (value: string) => value ? true : '服务器地址不能为空',
        },
        {
          type: owner ? null : 'text',
          name: 'owner',
          message: '仓库所有者 (用户名或组织名):',
          initial: gitInfo?.owner || '',
          validate: (value: string) => value ? true : '所有者不能为空',
        },
        {
          type: repo ? null : 'text',
          name: 'repo',
          message: '仓库名称:',
          initial: gitInfo?.repo || '',
          validate: (value: string) => value ? true : '仓库名称不能为空',
        },
      ]);

      giteaUrl = giteaUrl || response.giteaUrl;
      owner = owner || response.owner;
      repo = repo || response.repo;
    }

    // 创建配置
    const config = {
      giteaUrl,
      owner,
      repo,
      defaultBranch: 'main',
    };

    projectConfigManager.saveConfig(config);
    success('配置文件已创建: .gitea-mcp.json', options);

    info('\n提示: Token 应保存在 .gitea-mcp.local.json 中（此文件会被 Git 忽略）', options);
    outputDetails(config, options);
  } catch (err: any) {
    error(`初始化配置失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 显示当前配置
 */
export async function configShow(options: ClientOptions) {
  try {
    const projectRoot = cwd();
    const projectConfigManager = new ProjectConfigManager(projectRoot);
    const projectConfig = projectConfigManager.loadConfig();

    const globalConfigManager = new GlobalConfigManager();
    const globalConfig = globalConfigManager.loadConfig();

    info('=== 项目配置 ===', options);
    if (projectConfig.giteaUrl) {
      outputDetails({
        giteaUrl: projectConfig.giteaUrl,
        owner: projectConfig.owner || '(未设置)',
        repo: projectConfig.repo || '(未设置)',
        token: projectConfig.token ? '***已配置***' : '(未设置)',
      }, options);
    } else {
      info('未找到项目配置文件', options);
    }

    info('\n=== 全局配置 ===', options);
    if (globalConfig.servers && globalConfig.servers.length > 0) {
      const servers = globalConfig.servers.map(s => ({
        url: s.url,
        name: s.name || '-',
        isDefault: s.isDefault ? 'Yes' : 'No',
        token: s.token ? '***已配置***' : '(未设置)',
      }));

      outputDetails({
        servers: servers.length,
        language: globalConfig.language || 'zh-CN',
      }, options);
    } else {
      info('未找到全局配置', options);
    }
  } catch (err: any) {
    error(`显示配置失败: ${err.message}`);
    process.exit(1);
  }
}
