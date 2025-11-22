/**
 * Configuration Type Definitions
 *
 * Defines the structure for all configuration levels:
 * - Global config (~/.gitea-mcp/config.json)
 * - Project config (.gitea-mcp.json)
 * - Local config (.gitea-mcp.local.json)
 */

import { SupportedLocale } from '../i18n/types';

/**
 * Token metadata
 */
export interface TokenInfo {
  /** Unique token ID */
  id: string;

  /** Token display name */
  name: string;

  /** Associated username */
  username?: string;

  /** Token value prefix (for display, e.g., "glpat-xxx...xxx") */
  tokenPrefix?: string;

  /** Full token value (sensitive!) */
  token: string;

  /** Token creation timestamp */
  createdAt: string;

  /** How the token was created ('password' | 'manual' | 'import') */
  createdBy: 'password' | 'manual' | 'import';

  /** Token scopes/permissions */
  scopes?: string[];

  /** Is this the default token for the server? */
  isDefault?: boolean;

  /** Last used timestamp */
  lastUsed?: string;
}

/**
 * Gitea server configuration
 */
export interface GiteaServer {
  /** Unique server ID */
  id: string;

  /** Server display name */
  name: string;

  /** Server base URL */
  url: string;

  /** Is this the default server? */
  isDefault?: boolean;

  /** Associated tokens */
  tokens: TokenInfo[];

  /** Additional metadata */
  metadata?: {
    /** Server version */
    version?: string;

    /** Last connected timestamp */
    lastConnected?: string;

    /** Connection status */
    status?: 'active' | 'inactive' | 'error';
  };
}

/**
 * Recent project info
 */
export interface RecentProject {
  /** Project path */
  path: string;

  /** Project owner */
  owner: string;

  /** Project repo */
  repo: string;

  /** Associated server ID */
  serverId: string;

  /** Last accessed timestamp */
  lastAccessed: string;
}

/**
 * Global configuration settings
 */
export interface GlobalSettings {
  /** UI language */
  language: SupportedLocale;

  /** Auto-save configuration changes */
  autoSave: boolean;

  /** Auto-detect project info from Git */
  autoDetectFromGit: boolean;

  /** Show initialization wizard on first run */
  showWizardOnFirstRun?: boolean;

  /** Timeout for API requests (milliseconds) */
  apiTimeout?: number;

  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Global configuration structure
 * Stored at: ~/.gitea-mcp/config.json
 */
export interface GlobalConfig {
  /** Config version */
  version: string;

  /** List of Gitea servers */
  giteaServers: GiteaServer[];

  /** Recently accessed projects */
  recentProjects: RecentProject[];

  /** Global settings */
  settings: GlobalSettings;
}

/**
 * Project configuration structure
 * Stored at: .gitea-mcp.json (committed to Git)
 */
export interface ProjectConfig {
  /** Config version */
  version: string;

  /** Gitea server configuration */
  gitea: {
    /** Server reference ID (from global config) */
    serverRef?: string;

    /** Server URL (if not using reference) */
    url?: string;

    /** Server name */
    name?: string;
  };

  /** Project information */
  project: {
    /** Repository owner */
    owner: string;

    /** Repository name */
    repo: string;

    /** Organization (optional) */
    org?: string;

    /** Project ID (optional) */
    projectId?: number;
  };

  /** Default context settings */
  defaults?: {
    /** Use this project as default context */
    setAsDefaultContext?: boolean;
  };
}

/**
 * Local configuration structure
 * Stored at: .gitea-mcp.local.json (NOT committed to Git)
 */
export interface LocalConfig {
  /** Gitea authentication */
  gitea: {
    /** Direct API token */
    apiToken?: string;

    /** Token reference ID (from global config) */
    tokenRef?: string;

    /** Environment variable reference (e.g., "${GITEA_API_TOKEN}") */
    apiTokenEnv?: string;
  };

  /** Local overrides (optional) */
  overrides?: {
    /** Override owner */
    owner?: string;

    /** Override repo */
    repo?: string;

    /** Override server URL */
    url?: string;
  };
}

/**
 * Effective (merged) configuration
 * Result of merging all configuration sources with priority:
 * explicit params > local config > project config > env vars > global config
 */
export interface EffectiveConfig {
  /** Gitea server URL */
  baseUrl: string;

  /** API token */
  apiToken: string;

  /** Default owner */
  owner?: string;

  /** Default repo */
  repo?: string;

  /** Default org */
  org?: string;

  /** Default project ID */
  projectId?: number;

  /** Settings */
  settings: GlobalSettings;

  /** Configuration sources (for debugging) */
  sources?: {
    baseUrl: 'global' | 'project' | 'local' | 'env' | 'param';
    apiToken: 'global' | 'local' | 'env' | 'param';
    owner?: 'global' | 'project' | 'local' | 'env' | 'param';
    repo?: 'global' | 'project' | 'local' | 'env' | 'param';
  };
}

/**
 * Configuration validation result
 */
export interface ConfigValidation {
  /** Is configuration valid? */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}

/**
 * Token creation method
 */
export type TokenCreationMethod = 'password' | 'manual' | 'cached' | 'env';

/**
 * Token save method
 */
export type TokenSaveMethod = 'local' | 'ref' | 'env';
