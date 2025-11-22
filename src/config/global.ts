/**
 * Global Configuration Manager
 *
 * Manages the global configuration stored at ~/.gitea-mcp/config.json
 * Provides APIs for:
 * - Server management (add, remove, list, set default)
 * - Token management (add, remove, list, set default)
 * - Recent projects tracking
 * - Settings management
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import {
  GlobalConfig,
  GiteaServer,
  TokenInfo,
  RecentProject,
  GlobalSettings,
} from './types';

/**
 * Global config file paths
 */
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.gitea-mcp');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

/**
 * Default global configuration
 */
const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  version: '1.0',
  giteaServers: [],
  recentProjects: [],
  settings: {
    language: 'en',
    autoSave: true,
    autoDetectFromGit: true,
    showWizardOnFirstRun: true,
    apiTimeout: 30000,
    logLevel: 'info',
  },
};

/**
 * Global Configuration Manager
 */
export class GlobalConfigManager {
  private config: GlobalConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || GLOBAL_CONFIG_FILE;
    this.config = this.loadConfig();
  }

  /**
   * Load global configuration from file
   */
  private loadConfig(): GlobalConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(content);

        // Merge with defaults to ensure all fields exist
        return {
          ...DEFAULT_GLOBAL_CONFIG,
          ...config,
          settings: {
            ...DEFAULT_GLOBAL_CONFIG.settings,
            ...config.settings,
          },
        };
      }
    } catch (error) {
      console.warn(`Failed to load global config: ${error}`);
    }

    // Return default config if load failed
    return { ...DEFAULT_GLOBAL_CONFIG };
  }

  /**
   * Save global configuration to file
   */
  save(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write config to file
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save global config: ${error}`);
    }
  }

  /**
   * Get the full global configuration
   */
  getConfig(): GlobalConfig {
    return { ...this.config };
  }

  /**
   * Update global settings
   */
  updateSettings(settings: Partial<GlobalSettings>): void {
    this.config.settings = {
      ...this.config.settings,
      ...settings,
    };
    this.save();
  }

  /**
   * Get global settings
   */
  getSettings(): GlobalSettings {
    return { ...this.config.settings };
  }

  // ==================== Server Management ====================

  /**
   * Add a new Gitea server
   */
  addServer(server: Omit<GiteaServer, 'id' | 'tokens'>): GiteaServer {
    const newServer: GiteaServer = {
      id: uuidv4(),
      ...server,
      tokens: [],
      metadata: {
        status: 'inactive',
      },
    };

    // If this is the first server or marked as default, set as default
    if (this.config.giteaServers.length === 0 || server.isDefault) {
      // Clear other defaults
      this.config.giteaServers.forEach(s => (s.isDefault = false));
      newServer.isDefault = true;
    }

    this.config.giteaServers.push(newServer);
    this.save();

    return newServer;
  }

  /**
   * Remove a Gitea server
   */
  removeServer(serverId: string): boolean {
    const index = this.config.giteaServers.findIndex(s => s.id === serverId);

    if (index === -1) {
      return false;
    }

    const wasDefault = this.config.giteaServers[index].isDefault;
    this.config.giteaServers.splice(index, 1);

    // If we removed the default server, set the first remaining as default
    if (wasDefault && this.config.giteaServers.length > 0) {
      this.config.giteaServers[0].isDefault = true;
    }

    this.save();
    return true;
  }

  /**
   * Get a server by ID
   */
  getServer(serverId: string): GiteaServer | undefined {
    return this.config.giteaServers.find(s => s.id === serverId);
  }

  /**
   * Get a server by URL
   */
  getServerByUrl(url: string): GiteaServer | undefined {
    return this.config.giteaServers.find(s => s.url === url);
  }

  /**
   * Get all servers
   */
  getServers(): GiteaServer[] {
    return [...this.config.giteaServers];
  }

  /**
   * Get the default server
   */
  getDefaultServer(): GiteaServer | undefined {
    return this.config.giteaServers.find(s => s.isDefault);
  }

  /**
   * Set a server as default
   */
  setDefaultServer(serverId: string): boolean {
    const server = this.getServer(serverId);

    if (!server) {
      return false;
    }

    // Clear all defaults
    this.config.giteaServers.forEach(s => (s.isDefault = false));

    // Set the new default
    server.isDefault = true;
    this.save();

    return true;
  }

  // ==================== Token Management ====================

  /**
   * Add a token to a server
   */
  addToken(serverId: string, token: Omit<TokenInfo, 'id'>): TokenInfo | null {
    const server = this.getServer(serverId);

    if (!server) {
      return null;
    }

    const newToken: TokenInfo = {
      id: uuidv4(),
      ...token,
      createdAt: token.createdAt || new Date().toISOString(),
    };

    // If this is the first token or marked as default, set as default
    if (server.tokens.length === 0 || token.isDefault) {
      // Clear other defaults for this server
      server.tokens.forEach(t => (t.isDefault = false));
      newToken.isDefault = true;
    }

    server.tokens.push(newToken);
    this.save();

    return newToken;
  }

  /**
   * Remove a token from a server
   */
  removeToken(serverId: string, tokenId: string): boolean {
    const server = this.getServer(serverId);

    if (!server) {
      return false;
    }

    const index = server.tokens.findIndex(t => t.id === tokenId);

    if (index === -1) {
      return false;
    }

    const wasDefault = server.tokens[index].isDefault;
    server.tokens.splice(index, 1);

    // If we removed the default token, set the first remaining as default
    if (wasDefault && server.tokens.length > 0) {
      server.tokens[0].isDefault = true;
    }

    this.save();
    return true;
  }

  /**
   * Get a token by ID
   */
  getToken(serverId: string, tokenId: string): TokenInfo | undefined {
    const server = this.getServer(serverId);
    return server?.tokens.find(t => t.id === tokenId);
  }

  /**
   * Get all tokens for a server
   */
  getTokens(serverId: string): TokenInfo[] {
    const server = this.getServer(serverId);
    return server?.tokens || [];
  }

  /**
   * Get the default token for a server
   */
  getDefaultToken(serverId: string): TokenInfo | undefined {
    const server = this.getServer(serverId);
    return server?.tokens.find(t => t.isDefault);
  }

  /**
   * Set a token as default for a server
   */
  setDefaultToken(serverId: string, tokenId: string): boolean {
    const server = this.getServer(serverId);

    if (!server) {
      return false;
    }

    const token = server.tokens.find(t => t.id === tokenId);

    if (!token) {
      return false;
    }

    // Clear all defaults for this server
    server.tokens.forEach(t => (t.isDefault = false));

    // Set the new default
    token.isDefault = true;
    this.save();

    return true;
  }

  /**
   * Update token's last used timestamp
   */
  updateTokenLastUsed(serverId: string, tokenId: string): void {
    const token = this.getToken(serverId, tokenId);

    if (token) {
      token.lastUsed = new Date().toISOString();
      this.save();
    }
  }

  // ==================== Recent Projects ====================

  /**
   * Add or update a recent project
   */
  addRecentProject(project: Omit<RecentProject, 'lastAccessed'>): void {
    const existing = this.config.recentProjects.findIndex(
      p => p.path === project.path
    );

    const recentProject: RecentProject = {
      ...project,
      lastAccessed: new Date().toISOString(),
    };

    if (existing !== -1) {
      // Update existing
      this.config.recentProjects[existing] = recentProject;
    } else {
      // Add new
      this.config.recentProjects.push(recentProject);
    }

    // Sort by last accessed (most recent first)
    this.config.recentProjects.sort(
      (a, b) =>
        new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
    );

    // Keep only the last 20 projects
    this.config.recentProjects = this.config.recentProjects.slice(0, 20);

    this.save();
  }

  /**
   * Get recent projects
   */
  getRecentProjects(limit: number = 10): RecentProject[] {
    return this.config.recentProjects.slice(0, limit);
  }

  /**
   * Remove a recent project
   */
  removeRecentProject(projectPath: string): boolean {
    const index = this.config.recentProjects.findIndex(
      p => p.path === projectPath
    );

    if (index === -1) {
      return false;
    }

    this.config.recentProjects.splice(index, 1);
    this.save();

    return true;
  }

  /**
   * Clear all recent projects
   */
  clearRecentProjects(): void {
    this.config.recentProjects = [];
    this.save();
  }
}

/**
 * Singleton instance
 */
let globalConfigManager: GlobalConfigManager | null = null;

/**
 * Get the singleton global config manager
 */
export function getGlobalConfig(): GlobalConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new GlobalConfigManager();
  }
  return globalConfigManager;
}

/**
 * Reset the singleton (mainly for testing)
 */
export function resetGlobalConfig(): void {
  globalConfigManager = null;
}
