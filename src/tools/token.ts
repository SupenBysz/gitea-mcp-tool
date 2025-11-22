/**
 * Access Token Management Tools
 *
 * 访问令牌管理相关的 MCP 工具实现
 */

import type { GiteaConfig } from '../config.js';
import type {
  GiteaAccessToken,
  CreateAccessTokenOptions,
} from '../types/gitea.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:token');

export interface TokenToolsContext {
  config: GiteaConfig;
}

/**
 * 通过账号密码创建访问令牌
 *
 * 此功能使用 Basic Authentication（账号密码）来创建新的 API Token
 * 创建成功后，返回的 token 可以用于后续的 API 调用
 *
 * 注意：token 的完整值（sha1）只在创建时返回一次，请妥善保存
 */
export async function createTokenWithPassword(
  ctx: TokenToolsContext,
  args: {
    username: string;
    password: string;
    token_name: string;
    scopes?: string[];
  }
) {
  logger.debug({ username: args.username, token_name: args.token_name }, 'Creating access token with password');

  const baseUrl = ctx.config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/api/v1/users/${args.username}/tokens`;

  // 构建 Basic Authentication header
  const credentials = Buffer.from(`${args.username}:${args.password}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // 构建请求体
  const body: CreateAccessTokenOptions = {
    name: args.token_name,
    scopes: args.scopes,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ctx.config.timeout || 30000),
    });

    // 解析响应
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // 检查响应状态
    if (!response.ok) {
      logger.error(
        {
          status: response.status,
          statusText: response.statusText,
          data,
        },
        'Failed to create access token'
      );

      // 处理常见错误
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid username or password');
      }
      if (response.status === 422) {
        throw new Error(`Token creation failed: ${data.message || 'Invalid parameters'}`);
      }

      throw new Error(`Failed to create token: ${response.status} ${response.statusText}`);
    }

    const token = data as GiteaAccessToken;

    logger.info(
      {
        username: args.username,
        token_id: token.id,
        token_name: token.name,
      },
      'Access token created successfully'
    );

    return {
      success: true,
      token: {
        id: token.id,
        name: token.name,
        token: token.sha1, // The full token value (only returned once!)
        token_last_eight: token.token_last_eight,
        scopes: token.scopes,
      },
      message: 'Token created successfully. Please save the token value as it will not be shown again.',
    };
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ error: error.message }, 'Failed to create access token');
      throw error;
    }
    throw new Error('Failed to create access token: Unknown error');
  }
}

/**
 * 列出用户的访问令牌
 *
 * 注意：此接口需要已有的 token 或 Basic Auth 认证
 * 返回的 token 列表不包含完整的 token 值，只有最后 8 位
 */
export async function listTokens(
  ctx: TokenToolsContext,
  args: {
    username: string;
    password?: string; // 可选：如果提供，使用 Basic Auth；否则使用配置的认证
  }
) {
  logger.debug({ username: args.username }, 'Listing access tokens');

  const baseUrl = ctx.config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/api/v1/users/${args.username}/tokens`;

  // 构建认证头
  let authHeader: string;
  if (args.password) {
    // 使用提供的密码进行 Basic Authentication
    const credentials = Buffer.from(`${args.username}:${args.password}`).toString('base64');
    authHeader = `Basic ${credentials}`;
  } else {
    // 使用配置的认证方式
    if (ctx.config.apiToken) {
      authHeader = `token ${ctx.config.apiToken}`;
    } else if (ctx.config.username && ctx.config.password) {
      const credentials = Buffer.from(`${ctx.config.username}:${ctx.config.password}`).toString('base64');
      authHeader = `Basic ${credentials}`;
    } else {
      throw new Error('No authentication available. Please provide password or configure GITEA_API_TOKEN');
    }
  }

  const headers = {
    'Authorization': authHeader,
    'Accept': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(ctx.config.timeout || 30000),
    });

    if (!response.ok) {
      const data = await response.text();
      logger.error(
        {
          status: response.status,
          statusText: response.statusText,
          data,
        },
        'Failed to list access tokens'
      );

      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      throw new Error(`Failed to list tokens: ${response.status} ${response.statusText}`);
    }

    const tokens = await response.json() as GiteaAccessToken[];

    logger.debug({ count: tokens.length }, 'Access tokens listed');

    return {
      success: true,
      tokens: tokens.map((token) => ({
        id: token.id,
        name: token.name,
        token_last_eight: token.token_last_eight,
        scopes: token.scopes,
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ error: error.message }, 'Failed to list access tokens');
      throw error;
    }
    throw new Error('Failed to list access tokens: Unknown error');
  }
}

/**
 * 删除访问令牌
 *
 * 注意：此接口需要已有的 token 或 Basic Auth 认证
 */
export async function deleteToken(
  ctx: TokenToolsContext,
  args: {
    username: string;
    token_id: number;
    password?: string; // 可选：如果提供，使用 Basic Auth；否则使用配置的认证
  }
) {
  logger.debug({ username: args.username, token_id: args.token_id }, 'Deleting access token');

  const baseUrl = ctx.config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/api/v1/users/${args.username}/tokens/${args.token_id}`;

  // 构建认证头
  let authHeader: string;
  if (args.password) {
    const credentials = Buffer.from(`${args.username}:${args.password}`).toString('base64');
    authHeader = `Basic ${credentials}`;
  } else {
    if (ctx.config.apiToken) {
      authHeader = `token ${ctx.config.apiToken}`;
    } else if (ctx.config.username && ctx.config.password) {
      const credentials = Buffer.from(`${ctx.config.username}:${ctx.config.password}`).toString('base64');
      authHeader = `Basic ${credentials}`;
    } else {
      throw new Error('No authentication available. Please provide password or configure GITEA_API_TOKEN');
    }
  }

  const headers = {
    'Authorization': authHeader,
    'Accept': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(ctx.config.timeout || 30000),
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.text();
      logger.error(
        {
          status: response.status,
          statusText: response.statusText,
          data,
        },
        'Failed to delete access token'
      );

      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid credentials');
      }
      if (response.status === 404) {
        throw new Error(`Token not found: #${args.token_id}`);
      }

      throw new Error(`Failed to delete token: ${response.status} ${response.statusText}`);
    }

    logger.info({ username: args.username, token_id: args.token_id }, 'Access token deleted successfully');

    return {
      success: true,
      message: `Token #${args.token_id} has been deleted`,
    };
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ error: error.message }, 'Failed to delete access token');
      throw error;
    }
    throw new Error('Failed to delete access token: Unknown error');
  }
}
