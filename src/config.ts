/**
 * Configuration Management
 *
 * 加载和验证 MCP Server 配置
 *
 * 支持所有 MCP 客户端的配置方式：
 * - Claude Desktop: claude_desktop_config.json
 * - Cline (VSCode): settings.json
 * - Continue (VSCode): config.json
 * - 其他 MCP 客户端: 通过环境变量配置
 */

import { createLogger } from './logger.js';

const logger = createLogger('config');

export interface GiteaConfig {
  // Gitea 服务器配置（必填）
  baseUrl: string;

  // 认证配置（二选一）
  apiToken?: string;
  username?: string;
  password?: string;

  // 默认上下文（可选）
  defaultOwner?: string;
  defaultRepo?: string;
  defaultOrg?: string;       // 默认组织
  defaultProject?: number;   // 默认项目 ID

  // 其他配置
  logLevel?: string;
  timeout?: number; // API 请求超时时间（毫秒）
}

/**
 * 从环境变量加载配置
 */
export function loadConfigFromEnv(): GiteaConfig {
  const config: GiteaConfig = {
    // Gitea 服务器配置
    baseUrl: process.env.GITEA_BASE_URL || '',

    // 认证配置
    apiToken: process.env.GITEA_API_TOKEN,
    username: process.env.GITEA_USERNAME,
    password: process.env.GITEA_PASSWORD,

    // 默认上下文
    defaultOwner: process.env.GITEA_DEFAULT_OWNER,
    defaultRepo: process.env.GITEA_DEFAULT_REPO,
    defaultOrg: process.env.GITEA_DEFAULT_ORG,
    defaultProject: process.env.GITEA_DEFAULT_PROJECT
      ? parseInt(process.env.GITEA_DEFAULT_PROJECT, 10)
      : undefined,

    // 其他配置
    logLevel: process.env.LOG_LEVEL || 'info',
    timeout: process.env.GITEA_TIMEOUT ? parseInt(process.env.GITEA_TIMEOUT, 10) : 30000,
  };

  return config;
}

/**
 * 验证必填配置
 */
export function validateConfig(config: GiteaConfig): void {
  // 验证 baseUrl
  if (!config.baseUrl) {
    const errorMessage =
      `Missing required configuration: baseUrl\n\n` +
      `Please configure the following environment variable in your MCP client config:\n` +
      `  - GITEA_BASE_URL (example: http://10.16.72.101:3008)\n\n` +
      `Configuration examples:\n` +
      `  - Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json\n` +
      `  - Cline (VSCode): .vscode/settings.json\n` +
      `  - Continue (VSCode): ~/.continue/config.json`;

    logger.error('Missing GITEA_BASE_URL');
    throw new Error(errorMessage);
  }

  // 验证 URL 格式
  try {
    new URL(config.baseUrl);
  } catch {
    throw new Error(`Invalid GITEA_BASE_URL: ${config.baseUrl}`);
  }

  // 验证认证配置（二选一）
  const hasToken = !!config.apiToken;
  const hasCredentials = !!(config.username && config.password);

  if (!hasToken && !hasCredentials) {
    const errorMessage =
      `Missing authentication configuration.\n\n` +
      `Please configure ONE of the following:\n\n` +
      `Option 1 (Recommended): API Token\n` +
      `  - GITEA_API_TOKEN=your_token_here\n\n` +
      `Option 2: Username + Password\n` +
      `  - GITEA_USERNAME=your_username\n` +
      `  - GITEA_PASSWORD=your_password\n\n` +
      `To create an API Token:\n` +
      `  1. Login to Gitea\n` +
      `  2. Go to Settings → Applications\n` +
      `  3. Generate New Token\n` +
      `  4. Copy and paste it to GITEA_API_TOKEN`;

    logger.error('Missing authentication configuration');
    throw new Error(errorMessage);
  }

  if (hasCredentials && !config.username) {
    throw new Error('GITEA_PASSWORD is set but GITEA_USERNAME is missing');
  }

  if (hasCredentials && !config.password) {
    throw new Error('GITEA_USERNAME is set but GITEA_PASSWORD is missing');
  }

  logger.info({
    baseUrl: config.baseUrl,
    authMethod: hasToken ? 'api_token' : 'username_password',
    defaultOwner: config.defaultOwner || '(not set)',
    defaultRepo: config.defaultRepo || '(not set)',
  }, 'Configuration validated successfully');
}

/**
 * 获取认证头
 */
export function getAuthHeader(config: GiteaConfig): Record<string, string> {
  if (config.apiToken) {
    return {
      'Authorization': `token ${config.apiToken}`,
    };
  }

  if (config.username && config.password) {
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
    };
  }

  throw new Error('No authentication configuration available');
}
