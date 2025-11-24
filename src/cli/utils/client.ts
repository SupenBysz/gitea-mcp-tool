/**
 * Gitea API 客户端工具
 */

import { GiteaClient } from '../../gitea-client.js';
import { GlobalConfigManager } from '../../config/global.js';
import { ProjectConfigManager } from '../../config/project.js';
import { ContextManager } from '../../context-manager.js';
import { error } from './output.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';

export interface ClientOptions {
  token?: string;
  server?: string;
  owner?: string;
  repo?: string;
}

/**
 * 创建 Gitea API 客户端
 */
export async function createClient(options: ClientOptions) {
  try {
    // 1. 尝试从命令行参数获取配置
    let token = options.token;
    let serverUrl = options.server;

    // 2. 如果没有，尝试从项目配置文件加载
    if (!token || !serverUrl) {
      const projectConfig = await loadProjectConfig();
      if (projectConfig) {
        token = token || projectConfig.token;
        serverUrl = serverUrl || projectConfig.giteaUrl;
      }
    }

    // 3. 如果还没有，尝试从全局配置加载
    if (!token || !serverUrl) {
      const globalConfig = await loadGlobalConfig();
      if (globalConfig) {
        token = token || globalConfig.token;
        serverUrl = serverUrl || globalConfig.serverUrl;
      }
    }

    // 4. 最后尝试从环境变量加载
    if (!token) {
      token = process.env.GITEA_API_TOKEN || process.env.GITEA_TOKEN;
    }
    if (!serverUrl) {
      serverUrl = process.env.GITEA_SERVER_URL || process.env.GITEA_URL;
    }

    // 5. 验证必要参数
    if (!token) {
      error('错误: 未找到 Gitea API Token');
      error('请通过以下方式之一提供 Token:');
      error('  1. 命令行参数: --token <token>');
      error('  2. 项目配置: .gitea-mcp.local.json');
      error('  3. 全局配置: ~/.gitea-mcp/config.json');
      error('  4. 环境变量: GITEA_API_TOKEN 或 GITEA_TOKEN');
      process.exit(1);
    }

    if (!serverUrl) {
      error('错误: 未找到 Gitea 服务器地址');
      error('请通过以下方式之一提供服务器地址:');
      error('  1. 命令行参数: --server <url>');
      error('  2. 项目配置: .gitea-mcp.json');
      error('  3. 全局配置: ~/.gitea-mcp/config.json');
      error('  4. 环境变量: GITEA_SERVER_URL 或 GITEA_URL');
      process.exit(1);
    }

    // 创建客户端
    const client = new GiteaClient({
      baseUrl: serverUrl,
      apiToken: token,
    });

    // 将 serverUrl 附加到 client 上以便后续使用
    (client as any)._serverUrl = serverUrl;

    return client;
  } catch (err: any) {
    error(`创建客户端失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建上下文管理器
 */
export async function createContextManager(client: GiteaClient, options: ClientOptions) {
  // 从 client 获取 serverUrl
  const serverUrl = (client as any)._serverUrl;

  // 从项目配置加载默认上下文
  const projectConfig = await loadProjectConfig();

  // 构建完整配置
  const config: any = {
    baseUrl: serverUrl,
    defaultOwner: options.owner || projectConfig?.owner,
    defaultRepo: options.repo || projectConfig?.repo,
  };

  const contextManager = new ContextManager(config);
  return contextManager;
}

/**
 * 加载项目配置
 */
async function loadProjectConfig() {
  try {
    const projectRoot = cwd();
    const projectConfigPath = join(projectRoot, '.gitea-mcp.json');
    const localConfigPath = join(projectRoot, '.gitea-mcp.local.json');

    if (!existsSync(projectConfigPath)) {
      return null;
    }

    const projectConfigManager = new ProjectConfigManager(projectRoot);
    const config = projectConfigManager.loadConfig();

    return {
      giteaUrl: config.giteaUrl,
      owner: config.owner,
      repo: config.repo,
      token: config.token,
    };
  } catch (err) {
    // 忽略配置加载错误
    return null;
  }
}

/**
 * 加载全局配置
 */
async function loadGlobalConfig() {
  try {
    const globalConfigManager = new GlobalConfigManager();
    const config = globalConfigManager.loadConfig();

    // 获取默认服务器
    if (!config.servers || config.servers.length === 0) {
      return null;
    }

    const defaultServer = config.servers.find(s => s.isDefault) || config.servers[0];

    return {
      serverUrl: defaultServer.url,
      token: defaultServer.token,
    };
  } catch (err) {
    // 忽略配置加载错误
    return null;
  }
}

/**
 * 解析 owner 和 repo
 */
export function resolveOwnerRepo(
  contextManager: ContextManager,
  options: { owner?: string; repo?: string }
): { owner: string; repo: string } {
  const owner = contextManager.resolveOwner(options.owner);
  const repo = contextManager.resolveRepo(options.repo);

  if (!owner) {
    error('错误: 未指定仓库所有者');
    error('请通过以下方式之一提供:');
    error('  1. 命令行参数: --owner <owner>');
    error('  2. 项目配置: .gitea-mcp.json');
    error('  3. 上下文设置: keactl context set --owner <owner>');
    process.exit(1);
  }

  if (!repo) {
    error('错误: 未指定仓库名称');
    error('请通过以下方式之一提供:');
    error('  1. 命令行参数: --repo <repo>');
    error('  2. 项目配置: .gitea-mcp.json');
    error('  3. 上下文设置: keactl context set --repo <repo>');
    process.exit(1);
  }

  return { owner, repo };
}
