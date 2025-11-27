/**
 * Gitea API Client
 *
 * 封装 Gitea REST API 调用
 * 文档: https://docs.gitea.com/api/1.21/
 */

import { createLogger } from './logger.js';
import type { GiteaConfig } from './config.js';
import { getAuthHeader } from './config.js';

const logger = createLogger('gitea-client');

export interface GiteaRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Optional token to override the default authentication for this request */
  token?: string;
}

export interface GiteaResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

export class GiteaAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'GiteaAPIError';
  }
}

export class GiteaClient {
  private baseUrl: string;
  private authHeaders: Record<string, string>;
  private timeout: number;

  constructor(private config: GiteaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
    this.authHeaders = getAuthHeader(config);
    this.timeout = config.timeout || 30000;
  }

  /**
   * 发送 HTTP 请求到 Gitea API
   */
  async request<T = unknown>(options: GiteaRequestOptions): Promise<GiteaResponse<T>> {
    const { method, path, body, query, token } = options;

    // 构建完整 URL
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // 构建请求头，支持请求级别的 token 覆盖
    const authHeaders = token
      ? { 'Authorization': `token ${token}` }
      : this.authHeaders;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,
    };

    // 构建请求配置
    const requestInit: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      requestInit.body = JSON.stringify(body);
    }

    logger.debug({ method, url: url.toString() }, 'Sending request to Gitea API');

    try {
      const response = await fetch(url.toString(), requestInit);

      // 处理 204 No Content (DELETE 操作通常返回 204)
      if (response.status === 204) {
        logger.debug({ status: 204 }, 'Gitea API request succeeded (204 No Content)');
        return {
          data: '' as T,
          status: response.status,
          headers: response.headers,
        };
      }

      // 解析响应体
      let data: T;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json() as T;
      } else {
        data = await response.text() as T;
      }

      // 检查 HTTP 状态码
      if (!response.ok) {
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            data,
          },
          'Gitea API request failed'
        );

        throw new GiteaAPIError(
          `Gitea API Error: ${response.status} ${response.statusText}`,
          response.status,
          data
        );
      }

      logger.debug({ status: response.status }, 'Gitea API request succeeded');

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof GiteaAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          logger.error({ timeout: this.timeout }, 'Gitea API request timeout');
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }

        logger.error({ error: error.message }, 'Gitea API request failed');
        throw new Error(`Gitea API request failed: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * GET 请求
   * @param token - Optional token to override default authentication
   */
  async get<T = unknown>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
    token?: string
  ): Promise<T> {
    const response = await this.request<T>({ method: 'GET', path, query, token });
    return response.data;
  }

  /**
   * POST 请求
   * @param token - Optional token to override default authentication
   */
  async post<T = unknown>(path: string, body?: unknown, token?: string): Promise<T> {
    const response = await this.request<T>({ method: 'POST', path, body, token });
    return response.data;
  }

  /**
   * PATCH 请求
   * @param token - Optional token to override default authentication
   */
  async patch<T = unknown>(path: string, body?: unknown, token?: string): Promise<T> {
    const response = await this.request<T>({ method: 'PATCH', path, body, token });
    return response.data;
  }

  /**
   * DELETE 请求
   * @param token - Optional token to override default authentication
   */
  async delete<T = unknown>(path: string, token?: string): Promise<T> {
    const response = await this.request<T>({ method: 'DELETE', path, token });
    return response.data;
  }

  /**
   * PUT 请求
   * @param token - Optional token to override default authentication
   */
  async put<T = unknown>(path: string, body?: unknown, token?: string): Promise<T> {
    const response = await this.request<T>({ method: 'PUT', path, body, token });
    return response.data;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // 尝试获取当前用户信息
      await this.get('/user');
      logger.info('Successfully connected to Gitea server');
      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Gitea server');
      return false;
    }
  }

  /**
   * 获取当前认证用户信息
   */
  async getCurrentUser(): Promise<{
    id: number;
    login: string;
    full_name: string;
    email: string;
    avatar_url: string;
  }> {
    return this.get('/user');
  }
}
