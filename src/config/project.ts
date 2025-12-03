/**
 * Project Configuration Manager
 *
 * Manages project-level configuration files:
 * - .gitea-mcp.json (public, committed to Git)
 * - .gitea-mcp.local.json (private, not committed)
 *
 * Provides APIs for:
 * - Loading/saving project configuration
 * - Loading/saving local configuration
 * - Merging configurations with priority handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectConfig, LocalConfig } from './types';

/**
 * Project config file names
 */
const PROJECT_CONFIG_FILE = '.gitea-mcp.json';
const LOCAL_CONFIG_FILE = '.gitea-mcp.local.json';

/**
 * Project Configuration Manager
 */
export class ProjectConfigManager {
  private projectPath: string;
  private projectConfigPath: string;
  private localConfigPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.projectConfigPath = path.join(projectPath, PROJECT_CONFIG_FILE);
    this.localConfigPath = path.join(projectPath, LOCAL_CONFIG_FILE);
  }

  // ==================== Project Config (.gitea-mcp.json) ====================

  /**
   * Check if project config exists
   */
  hasProjectConfig(): boolean {
    return fs.existsSync(this.projectConfigPath);
  }

  /**
   * Load project configuration
   */
  loadProjectConfig(): ProjectConfig | null {
    try {
      if (!this.hasProjectConfig()) {
        return null;
      }

      const content = fs.readFileSync(this.projectConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to load project config: ${error}`);
      return null;
    }
  }

  /**
   * Save project configuration
   */
  saveProjectConfig(config: ProjectConfig): void {
    try {
      fs.writeFileSync(
        this.projectConfigPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save project config: ${error}`);
    }
  }

  /**
   * Create a new project configuration
   */
  createProjectConfig(
    server: { url: string; serverRef?: string; name?: string },
    project: { owner: string; repo: string; org?: string; projectId?: number },
    defaults?: { setAsDefaultContext?: boolean }
  ): ProjectConfig {
    const config: ProjectConfig = {
      version: '1.0',
      gitea: {
        url: server.url,
        serverRef: server.serverRef,
        name: server.name,
      },
      project: {
        owner: project.owner,
        repo: project.repo,
        org: project.org,
        projectId: project.projectId,
      },
      defaults: defaults || {},
    };

    this.saveProjectConfig(config);
    return config;
  }

  /**
   * Delete project configuration
   */
  deleteProjectConfig(): boolean {
    try {
      if (this.hasProjectConfig()) {
        fs.unlinkSync(this.projectConfigPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to delete project config: ${error}`);
      return false;
    }
  }

  // ==================== Local Config (.gitea-mcp.local.json) ====================

  /**
   * Check if local config exists
   */
  hasLocalConfig(): boolean {
    return fs.existsSync(this.localConfigPath);
  }

  /**
   * Load local configuration
   */
  loadLocalConfig(): LocalConfig | null {
    try {
      if (!this.hasLocalConfig()) {
        return null;
      }

      const content = fs.readFileSync(this.localConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to load local config: ${error}`);
      return null;
    }
  }

  /**
   * Save local configuration
   */
  saveLocalConfig(config: LocalConfig): void {
    try {
      fs.writeFileSync(
        this.localConfigPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save local config: ${error}`);
    }
  }

  /**
   * Create a new local configuration
   */
  createLocalConfig(
    token: {
      apiToken?: string;
      tokenRef?: string;
      apiTokenEnv?: string;
    },
    overrides?: {
      owner?: string;
      repo?: string;
      url?: string;
    }
  ): LocalConfig {
    const config: LocalConfig = {
      gitea: {
        apiToken: token.apiToken,
        tokenRef: token.tokenRef,
        apiTokenEnv: token.apiTokenEnv,
      },
      overrides: overrides || {},
    };

    this.saveLocalConfig(config);
    return config;
  }

  /**
   * Delete local configuration
   */
  deleteLocalConfig(): boolean {
    try {
      if (this.hasLocalConfig()) {
        fs.unlinkSync(this.localConfigPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to delete local config: ${error}`);
      return false;
    }
  }

  // ==================== Merged Configuration ====================

  /**
   * Get merged configuration from project + local
   * Local config takes priority over project config
   */
  getMergedConfig(): {
    project: ProjectConfig | null;
    local: LocalConfig | null;
    url?: string;
    serverRef?: string;
    owner?: string;
    repo?: string;
    org?: string;
    projectId?: number;
    apiToken?: string;
    tokenRef?: string;
    apiTokenEnv?: string;
  } {
    const project = this.loadProjectConfig();
    const local = this.loadLocalConfig();

    return {
      project,
      local,
      // Server info (project config)
      url: project?.gitea.url,
      serverRef: project?.gitea.serverRef,
      // Project info (project config, overridden by local)
      owner: local?.overrides?.owner || project?.project.owner,
      repo: local?.overrides?.repo || project?.project.repo,
      org: project?.project.org,
      projectId: project?.project.projectId,
      // Token info (local config only)
      apiToken: local?.gitea.apiToken,
      tokenRef: local?.gitea.tokenRef,
      apiTokenEnv: local?.gitea.apiTokenEnv,
    };
  }

  // ==================== Utility Methods ====================

  /**
   * Add .gitea-mcp.local.json to .gitignore
   */
  addLocalConfigToGitignore(): void {
    const gitignorePath = path.join(this.projectPath, '.gitignore');
    const ignoreEntry = '.gitea-mcp.local.json';

    try {
      let content = '';

      // Read existing .gitignore if it exists
      if (fs.existsSync(gitignorePath)) {
        content = fs.readFileSync(gitignorePath, 'utf-8');

        // Check if already exists
        if (content.includes(ignoreEntry)) {
          return; // Already added
        }
      }

      // Add entry
      if (content && !content.endsWith('\n')) {
        content += '\n';
      }
      content += ignoreEntry + '\n';

      // Write back
      fs.writeFileSync(gitignorePath, content, 'utf-8');
    } catch (error) {
      console.warn(`Failed to update .gitignore: ${error}`);
    }
  }

  /**
   * Get project path
   */
  getProjectPath(): string {
    return this.projectPath;
  }

  /**
   * Get project config file path
   */
  getProjectConfigPath(): string {
    return this.projectConfigPath;
  }

  /**
   * Get local config file path
   */
  getLocalConfigPath(): string {
    return this.localConfigPath;
  }
}

/**
 * Create project config manager for current directory
 */
export function getProjectConfig(projectPath?: string): ProjectConfigManager {
  return new ProjectConfigManager(projectPath);
}
