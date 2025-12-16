/**
 * 配置管理命令
 */

import path from 'path';
import { ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, info, warning } from '../utils/output.js';
import { ProjectConfigManager } from '../../config/project.js';
import { GlobalConfigManager } from '../../config/global.js';
import { detectGitInfo } from '../../utils/git-detector.js';
import { cwd } from 'process';
import prompts from 'prompts';
import type { GiteaServer, TokenInfo } from '../../config/types.js';

const NEW_SERVER_VALUE = '__NEW_SERVER__';
const NEW_TOKEN_VALUE = '__NEW_TOKEN__';
const NEW_OWNER_VALUE = '__NEW_OWNER__';
const NEW_REPO_VALUE = '__NEW_REPO__';
const USE_DIRNAME_VALUE = '__USE_DIRNAME__';

/**
 * 步骤1: 选择或输入 Gitea 服务器 URL
 */
async function selectServer(
  globalConfig: GlobalConfigManager,
  gitDetectedUrl?: string
): Promise<{ server: GiteaServer | null; url: string }> {
  const servers = globalConfig.getServers();
  
  if (servers.length === 0 && !gitDetectedUrl) {
    // 没有历史，直接输入
    const response = await prompts({
      type: 'text',
      name: 'url',
      message: 'Gitea 服务器地址:',
      initial: 'https://gitea.example.com',
      validate: (v: string) => v ? true : '服务器地址不能为空',
    });
    if (!response.url) process.exit(0);
    return { server: null, url: response.url };
  }

  // 构建选择列表
  const choices: Array<{ title: string; value: string; description?: string }> = [];
  
  // 添加历史服务器
  for (const s of servers) {
    choices.push({
      title: s.url + (s.isDefault ? ' (默认)' : ''),
      value: s.id,
      description: s.name || undefined,
    });
  }

  // 如果 Git 检测到的 URL 不在历史中，添加它
  if (gitDetectedUrl && !servers.find(s => s.url === gitDetectedUrl)) {
    choices.unshift({
      title: gitDetectedUrl + ' (Git 检测)',
      value: gitDetectedUrl,
    });
  }

  // 添加 "输入新地址" 选项
  choices.push({
    title: '+ 输入新的服务器地址...',
    value: NEW_SERVER_VALUE,
  });

  const response = await prompts({
    type: 'select',
    name: 'selection',
    message: '选择 Gitea 服务器:',
    choices,
    initial: 0,
  });

  if (response.selection === undefined) process.exit(0);

  if (response.selection === NEW_SERVER_VALUE) {
    const newUrl = await prompts({
      type: 'text',
      name: 'url',
      message: 'Gitea 服务器地址:',
      validate: (v: string) => v ? true : '服务器地址不能为空',
    });
    if (!newUrl.url) process.exit(0);
    return { server: null, url: newUrl.url };
  }

  // 检查是否选择的是 Git 检测的 URL（不在历史中）
  const server = globalConfig.getServer(response.selection);
  if (server) {
    return { server, url: server.url };
  }

  // Git 检测的 URL
  return { server: null, url: response.selection };
}

/**
 * 步骤2: 选择或输入 Token
 */
async function selectToken(
  globalConfig: GlobalConfigManager,
  server: GiteaServer | null,
  serverUrl: string
): Promise<{ token: TokenInfo | null; tokenValue: string }> {
  const tokens = server?.tokens || [];

  if (tokens.length === 0) {
    // 没有历史 Token，直接输入
    const response = await prompts({
      type: 'password',
      name: 'token',
      message: 'API Token:',
      validate: (v: string) => v ? true : 'Token 不能为空',
    });
    if (!response.token) process.exit(0);
    return { token: null, tokenValue: response.token };
  }

  // 构建选择列表
  const choices: Array<{ title: string; value: string }> = [];

  for (const t of tokens) {
    const prefix = t.token.substring(0, 4);
    const suffix = t.token.substring(t.token.length - 4);
    const displayName = t.username || t.name || 'Token';
    choices.push({
      title: `${displayName} (${prefix}...${suffix})` + (t.isDefault ? ' - 默认' : ''),
      value: t.id,
    });
  }

  choices.push({
    title: '+ 输入新的 Token...',
    value: NEW_TOKEN_VALUE,
  });

  const response = await prompts({
    type: 'select',
    name: 'selection',
    message: `选择 API Token (${serverUrl}):`,
    choices,
    initial: 0,
  });

  if (response.selection === undefined) process.exit(0);

  if (response.selection === NEW_TOKEN_VALUE) {
    const newToken = await prompts({
      type: 'password',
      name: 'token',
      message: 'API Token:',
      validate: (v: string) => v ? true : 'Token 不能为空',
    });
    if (!newToken.token) process.exit(0);
    return { token: null, tokenValue: newToken.token };
  }

  const token = tokens.find(t => t.id === response.selection);
  return { token: token || null, tokenValue: token?.token || '' };
}

/**
 * 步骤3: 选择或输入 Owner
 */
async function selectOwner(
  globalConfig: GlobalConfigManager,
  server: GiteaServer | null,
  serverUrl: string,
  tokenValue: string,
  gitDetectedOwner?: string
): Promise<string> {
  const recentOwners = server ? globalConfig.getRecentOwners(server.id, 10) : [];

  // 尝试通过 API 获取当前用户和组织
  let apiOwners: Array<{ name: string; type: 'user' | 'org' }> = [];
  try {
    const userRes = await fetch(`${serverUrl}/api/v1/user`, {
      headers: { Authorization: `token ${tokenValue}` },
    });
    if (userRes.ok) {
      const user = await userRes.json() as { login?: string; username?: string };
      apiOwners.push({ name: user.login || user.username || '', type: 'user' });
    }

    const orgsRes = await fetch(`${serverUrl}/api/v1/user/orgs`, {
      headers: { Authorization: `token ${tokenValue}` },
    });
    if (orgsRes.ok) {
      const orgs = await orgsRes.json() as Array<{ username?: string; name?: string }>;
      for (const org of orgs) {
        apiOwners.push({ name: org.username || org.name || '', type: 'org' });
      }
    }
  } catch {
    // API 调用失败，忽略
  }

  // 合并列表（去重）
  const allOwners = new Map<string, { name: string; type: 'user' | 'org'; source: string }>();
  
  // Git 检测的优先
  if (gitDetectedOwner) {
    allOwners.set(gitDetectedOwner, { name: gitDetectedOwner, type: 'org', source: 'Git 检测' });
  }

  // API 获取的
  for (const o of apiOwners) {
    if (!allOwners.has(o.name)) {
      allOwners.set(o.name, { ...o, source: o.type === 'user' ? '个人' : '组织' });
    }
  }

  // 历史记录
  for (const o of recentOwners) {
    if (!allOwners.has(o.name)) {
      allOwners.set(o.name, { ...o, source: '历史' });
    }
  }

  if (allOwners.size === 0) {
    // 没有任何选项，直接输入
    const response = await prompts({
      type: 'text',
      name: 'owner',
      message: '仓库所有者 (用户名或组织名):',
      validate: (v: string) => v ? true : '所有者不能为空',
    });
    if (!response.owner) process.exit(0);
    return response.owner;
  }

  // 构建选择列表
  const choices: Array<{ title: string; value: string }> = [];

  for (const [name, info] of allOwners) {
    choices.push({
      title: `${name} (${info.source})`,
      value: name,
    });
  }

  choices.push({
    title: '+ 输入其他所有者...',
    value: NEW_OWNER_VALUE,
  });

  const response = await prompts({
    type: 'select',
    name: 'selection',
    message: `选择仓库所有者 (${serverUrl}):`,
    choices,
    initial: 0,
  });

  if (response.selection === undefined) process.exit(0);

  if (response.selection === NEW_OWNER_VALUE) {
    const newOwner = await prompts({
      type: 'text',
      name: 'owner',
      message: '仓库所有者 (用户名或组织名):',
      validate: (v: string) => v ? true : '所有者不能为空',
    });
    if (!newOwner.owner) process.exit(0);
    return newOwner.owner;
  }

  return response.selection;
}

/**
 * 步骤4: 选择或输入仓库
 */
async function selectRepo(
  globalConfig: GlobalConfigManager,
  server: GiteaServer | null,
  serverUrl: string,
  owner: string,
  gitDetectedRepo?: string
): Promise<{ repo: string; needsCreate: boolean }> {
  const currentDirName = path.basename(cwd());
  const recentRepos = server ? globalConfig.getRecentRepos(server.id, owner, 10) : [];

  // 构建选择列表
  const choices: Array<{ title: string; value: string; description?: string }> = [];

  // 首选：使用当前目录名
  choices.push({
    title: `使用当前目录名: ${currentDirName}`,
    value: USE_DIRNAME_VALUE,
    description: '不存在则创建',
  });

  // Git 检测的仓库（如果与目录名不同）
  if (gitDetectedRepo && gitDetectedRepo !== currentDirName) {
    choices.push({
      title: `${gitDetectedRepo} (Git 检测)`,
      value: gitDetectedRepo,
    });
  }

  // 历史仓库
  for (const r of recentRepos) {
    if (r.repo !== currentDirName && r.repo !== gitDetectedRepo) {
      choices.push({
        title: `${r.repo} (历史)`,
        value: r.repo,
      });
    }
  }

  choices.push({
    title: '+ 输入仓库名称...',
    value: NEW_REPO_VALUE,
  });

  const response = await prompts({
    type: 'select',
    name: 'selection',
    message: `选择仓库 (${owner}@${new URL(serverUrl).hostname}):`,
    choices,
    initial: 0,
  });

  if (response.selection === undefined) process.exit(0);

  if (response.selection === NEW_REPO_VALUE) {
    const newRepo = await prompts({
      type: 'text',
      name: 'repo',
      message: '仓库名称:',
      validate: (v: string) => v ? true : '仓库名称不能为空',
    });
    if (!newRepo.repo) process.exit(0);
    return { repo: newRepo.repo, needsCreate: true };
  }

  if (response.selection === USE_DIRNAME_VALUE) {
    return { repo: currentDirName, needsCreate: true };
  }

  return { repo: response.selection, needsCreate: false };
}

/**
 * 检查仓库是否存在，不存在则询问创建
 */
async function ensureRepoExists(
  serverUrl: string,
  tokenValue: string,
  owner: string,
  repo: string,
  needsCheck: boolean
): Promise<boolean> {
  if (!needsCheck) return true;

  try {
    const res = await fetch(`${serverUrl}/api/v1/repos/${owner}/${repo}`, {
      headers: { Authorization: `token ${tokenValue}` },
    });

    if (res.ok) {
      info(`仓库 ${owner}/${repo} 已存在，将进行关联`);
      return true;
    }

    if (res.status === 404) {
      const response = await prompts({
        type: 'confirm',
        name: 'create',
        message: `仓库 "${owner}/${repo}" 不存在，是否创建？`,
        initial: true,
      });

      if (!response.create) {
        warning('已取消，请重新选择仓库');
        return false;
      }

      // 创建仓库
      const createRes = await fetch(`${serverUrl}/api/v1/orgs/${owner}/repos`, {
        method: 'POST',
        headers: {
          Authorization: `token ${tokenValue}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repo,
          private: false,
          auto_init: true,
        }),
      });

      if (!createRes.ok) {
        // 尝试在用户下创建
        const userCreateRes = await fetch(`${serverUrl}/api/v1/user/repos`, {
          method: 'POST',
          headers: {
            Authorization: `token ${tokenValue}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: repo,
            private: false,
            auto_init: true,
          }),
        });

        if (!userCreateRes.ok) {
          const errData = await userCreateRes.json().catch(() => ({})) as { message?: string };
          error(`创建仓库失败: ${errData.message || userCreateRes.statusText}`);
          return false;
        }
      }

      success(`仓库 ${owner}/${repo} 创建成功`);
      return true;
    }

    error(`检查仓库失败: ${res.statusText}`);
    return false;
  } catch (err: any) {
    error(`API 调用失败: ${err.message}`);
    return false;
  }
}

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
    const globalConfigManager = new GlobalConfigManager();

    // 检查是否已有配置
    const existingConfig = projectConfigManager.loadProjectConfig();
    if (existingConfig?.gitea?.url && !options.force) {
      error('配置文件已存在');
      error('使用 --force 选项强制覆盖');
      process.exit(1);
    }

    // 尝试自动检测 Git 信息
    const gitInfo = detectGitInfo(projectRoot);

    info('🔧 配置初始化向导\n');

    // 如果命令行参数都提供了，跳过交互
    if (options.giteaUrl && options.owner && options.repo && options.token) {
      const giteaUrl = options.giteaUrl;
      const owner = options.owner;
      const repo = options.repo;
      const tokenValue = options.token;

      // 保存到全局配置
      let server = globalConfigManager.getServerByUrl(giteaUrl);
      if (!server) {
        server = globalConfigManager.addServer({ url: giteaUrl, name: new URL(giteaUrl).hostname });
      }
      globalConfigManager.addRecentOwner(server.id, { name: owner, type: 'org' });
      globalConfigManager.addRecentRepo(server.id, { owner, repo });

      // 创建项目配置
      projectConfigManager.createProjectConfig(
        { url: giteaUrl },
        { owner, repo }
      );

      // 保存 Token 到本地配置
      projectConfigManager.saveLocalConfig({ gitea: { apiToken: tokenValue } });
      projectConfigManager.addLocalConfigToGitignore();

      success('配置文件已创建: .gitea-mcp.json');
      info('Token 已保存到: .gitea-mcp.local.json（已添加到 .gitignore）');
      outputDetails({ giteaUrl, owner, repo });
      return;
    }

    // 步骤1: 选择服务器
    const { server, url: giteaUrl } = await selectServer(
      globalConfigManager,
      options.giteaUrl || gitInfo?.serverUrl
    );

    // 步骤2: 选择 Token
    const { token, tokenValue } = await selectToken(
      globalConfigManager,
      server,
      giteaUrl
    );

    // 步骤3: 选择 Owner
    const owner = options.owner || await selectOwner(
      globalConfigManager,
      server,
      giteaUrl,
      tokenValue,
      gitInfo?.owner
    );

    // 步骤4: 选择仓库
    const { repo, needsCreate } = options.repo
      ? { repo: options.repo, needsCreate: true }
      : await selectRepo(
          globalConfigManager,
          server,
          giteaUrl,
          owner,
          gitInfo?.repo
        );

    // 检查/创建仓库
    const repoExists = await ensureRepoExists(giteaUrl, tokenValue, owner, repo, needsCreate);
    if (!repoExists) {
      process.exit(1);
    }

    // 保存到全局配置
    let finalServer = server;
    if (!finalServer) {
      finalServer = globalConfigManager.addServer({
        url: giteaUrl,
        name: new URL(giteaUrl).hostname,
      });
    }

    // 保存新 Token（如果是新输入的）
    if (!token && tokenValue) {
      // 获取用户名
      let username = '';
      try {
        const userRes = await fetch(`${giteaUrl}/api/v1/user`, {
          headers: { Authorization: `token ${tokenValue}` },
        });
        if (userRes.ok) {
          const user = await userRes.json() as { login?: string; username?: string };
          username = user.login || user.username || '';
        }
      } catch {
        // 忽略
      }

      globalConfigManager.addToken(finalServer.id, {
        name: username || 'Token',
        username,
        token: tokenValue,
        createdAt: new Date().toISOString(),
        createdBy: 'manual',
        isDefault: finalServer.tokens.length === 0,
      });
    }

    // 保存历史
    globalConfigManager.addRecentOwner(finalServer.id, { name: owner, type: 'org' });
    globalConfigManager.addRecentRepo(finalServer.id, { owner, repo });

    // 创建项目配置
    projectConfigManager.createProjectConfig(
      { url: giteaUrl },
      { owner, repo }
    );

    // 创建本地配置（保存 Token）
    projectConfigManager.saveLocalConfig({ gitea: { apiToken: tokenValue } });
    projectConfigManager.addLocalConfigToGitignore();

    console.log();
    success('配置文件已创建: .gitea-mcp.json');
    info('Token 已保存到: .gitea-mcp.local.json（已添加到 .gitignore）');
    console.log();
    outputDetails({ giteaUrl, owner, repo });
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
    const mergedConfig = projectConfigManager.getMergedConfig();

    const globalConfigManager = new GlobalConfigManager();
    const globalConfig = globalConfigManager.getConfig();

    info('=== 项目配置 ===', options);
    if (mergedConfig.url) {
      outputDetails({
        giteaUrl: mergedConfig.url,
        owner: mergedConfig.owner || '(未设置)',
        repo: mergedConfig.repo || '(未设置)',
        org: mergedConfig.org || '(未设置)',
        token: mergedConfig.apiToken ? '***已配置***' : '(未设置)',
      }, options);
    } else {
      info('未找到项目配置文件', options);
    }

    info('\n=== 全局配置 ===', options);
    if (globalConfig.giteaServers && globalConfig.giteaServers.length > 0) {
      const servers = globalConfig.giteaServers.map(s => ({
        url: s.url,
        name: s.name || '-',
        isDefault: s.isDefault ? 'Yes' : 'No',
        tokens: s.tokens.length > 0 ? `${s.tokens.length} 个` : '(未设置)',
      }));

      info(`服务器数量: ${servers.length}`, options);
      for (const server of servers) {
        outputDetails(server, options);
      }

      outputDetails({
        language: globalConfig.settings?.language || 'en',
      }, options);
    } else {
      info('未找到全局配置', options);
    }
  } catch (err: any) {
    error(`显示配置失败: ${err.message}`);
    process.exit(1);
  }
}
