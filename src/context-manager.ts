/**
 * Context Manager
 *
 * 管理默认的 owner 和 repo 上下文，简化高频操作
 */

import { createLogger } from './logger.js';
import type { GiteaConfig } from './config.js';

const logger = createLogger('context-manager');

export interface GiteaContext {
  owner?: string;
  repo?: string;
  org?: string;      // 默认组织
  project?: number;  // 默认项目 ID
}

export class ContextManager {
  private context: GiteaContext = {};

  constructor(config: GiteaConfig) {
    // 从配置加载默认上下文
    if (config.defaultOwner) {
      this.context.owner = config.defaultOwner;
      logger.debug({ owner: config.defaultOwner }, 'Default owner set from config');
    }
    if (config.defaultRepo) {
      this.context.repo = config.defaultRepo;
      logger.debug({ repo: config.defaultRepo }, 'Default repo set from config');
    }
    if (config.defaultOrg) {
      this.context.org = config.defaultOrg;
      logger.debug({ org: config.defaultOrg }, 'Default org set from config');
    }
    if (config.defaultProject) {
      this.context.project = config.defaultProject;
      logger.debug({ project: config.defaultProject }, 'Default project set from config');
    }

    const contextParts: string[] = [];
    if (this.context.owner && this.context.repo) {
      contextParts.push(`owner/repo: ${this.context.owner}/${this.context.repo}`);
    } else if (this.context.owner) {
      contextParts.push(`owner: ${this.context.owner}`);
    }
    if (this.context.org) {
      contextParts.push(`org: ${this.context.org}`);
    }
    if (this.context.project) {
      contextParts.push(`project: ${this.context.project}`);
    }

    if (contextParts.length > 0) {
      logger.info({ context: contextParts.join(', ') }, 'Context initialized');
    }
  }

  /**
   * 获取当前上下文
   */
  getContext(): GiteaContext {
    return { ...this.context };
  }

  /**
   * 设置上下文
   */
  setContext(context: Partial<GiteaContext>): void {
    if (context.owner !== undefined) {
      this.context.owner = context.owner;
      logger.debug({ owner: context.owner }, 'Owner context updated');
    }
    if (context.repo !== undefined) {
      this.context.repo = context.repo;
      logger.debug({ repo: context.repo }, 'Repo context updated');
    }
    if (context.org !== undefined) {
      this.context.org = context.org;
      logger.debug({ org: context.org }, 'Org context updated');
    }
    if (context.project !== undefined) {
      this.context.project = context.project;
      logger.debug({ project: context.project }, 'Project context updated');
    }
  }

  /**
   * 清除上下文
   */
  clearContext(
    clearOwner = false,
    clearRepo = false,
    clearOrg = false,
    clearProject = false
  ): void {
    if (clearOwner) {
      this.context.owner = undefined;
      logger.debug('Owner context cleared');
    }
    if (clearRepo) {
      this.context.repo = undefined;
      logger.debug('Repo context cleared');
    }
    if (clearOrg) {
      this.context.org = undefined;
      logger.debug('Org context cleared');
    }
    if (clearProject) {
      this.context.project = undefined;
      logger.debug('Project context cleared');
    }
  }

  /**
   * 解析 owner，优先使用参数，否则使用上下文
   */
  resolveOwner(owner?: string): string {
    const resolved = owner ?? this.context.owner;
    if (!resolved) {
      throw new Error(
        'Owner is required. Please provide owner parameter or set default owner via set_context tool.'
      );
    }
    return resolved;
  }

  /**
   * 解析 repo，优先使用参数，否则使用上下文
   */
  resolveRepo(repo?: string): string {
    const resolved = repo ?? this.context.repo;
    if (!resolved) {
      throw new Error(
        'Repository is required. Please provide repo parameter or set default repo via set_context tool.'
      );
    }
    return resolved;
  }

  /**
   * 同时解析 owner 和 repo
   */
  resolveOwnerRepo(owner?: string, repo?: string): { owner: string; repo: string } {
    return {
      owner: this.resolveOwner(owner),
      repo: this.resolveRepo(repo),
    };
  }

  /**
   * 解析 org，优先使用参数，否则使用上下文
   */
  resolveOrg(org?: string): string {
    const resolved = org ?? this.context.org;
    if (!resolved) {
      throw new Error(
        'Organization is required. Please provide org parameter or set default org via set_context tool.'
      );
    }
    return resolved;
  }

  /**
   * 尝试解析 org（不抛出错误）
   */
  tryResolveOrg(org?: string): string | undefined {
    return org ?? this.context.org;
  }

  /**
   * 解析 project，优先使用参数，否则使用上下文
   */
  resolveProject(project?: number): number {
    const resolved = project ?? this.context.project;
    if (!resolved) {
      throw new Error(
        'Project is required. Please provide project parameter or set default project via set_context tool.'
      );
    }
    return resolved;
  }

  /**
   * 尝试解析 project（不抛出错误）
   */
  tryResolveProject(project?: number): number | undefined {
    return project ?? this.context.project;
  }

  /**
   * 获取当前的 owner（可能为 undefined）
   */
  getOwner(): string | undefined {
    return this.context.owner;
  }

  /**
   * 获取当前的 repo（可能为 undefined）
   */
  getRepo(): string | undefined {
    return this.context.repo;
  }

  /**
   * 获取当前的 org（可能为 undefined）
   */
  getOrg(): string | undefined {
    return this.context.org;
  }

  /**
   * 获取当前的 project（可能为 undefined）
   */
  getProject(): number | undefined {
    return this.context.project;
  }

  /**
   * 检查是否设置了完整的上下文（owner + repo）
   */
  hasFullContext(): boolean {
    return !!(this.context.owner && this.context.repo);
  }

  /**
   * 检查是否设置了 owner
   */
  hasOwner(): boolean {
    return !!this.context.owner;
  }

  /**
   * 检查是否设置了 repo
   */
  hasRepo(): boolean {
    return !!this.context.repo;
  }

  /**
   * 检查是否设置了 org
   */
  hasOrg(): boolean {
    return !!this.context.org;
  }

  /**
   * 检查是否设置了 project
   */
  hasProject(): boolean {
    return !!this.context.project;
  }

  /**
   * 获取上下文摘要（用于日志和调试）
   */
  getSummary(): string {
    const parts: string[] = [];

    if (this.hasFullContext()) {
      parts.push(`${this.context.owner}/${this.context.repo}`);
    } else if (this.hasOwner()) {
      parts.push(`${this.context.owner}/*`);
    } else if (this.hasRepo()) {
      parts.push(`*/${this.context.repo}`);
    }

    if (this.hasOrg()) {
      parts.push(`org:${this.context.org}`);
    }

    if (this.hasProject()) {
      parts.push(`project:${this.context.project}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'no context';
  }
}
