/**
 * Git Auto-Detection Utility
 *
 * Automatically detects project information from Git repository:
 * - Gitea server URL
 * - Repository owner
 * - Repository name
 *
 * Supports multiple Git remote URL formats:
 * - SSH: git@gitea.ktyun.cc:Kysion/entai-gitea-mcp.git
 * - HTTPS: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git
 * - HTTP: http://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Git repository detection result
 */
export interface GitInfo {
  /** Is this a Git repository? */
  isGitRepo: boolean;

  /** Remote URL (origin) */
  remoteUrl?: string;

  /** Gitea server base URL */
  serverUrl?: string;

  /** Repository owner (username or organization) */
  owner?: string;

  /** Repository name */
  repo?: string;

  /** Full repo path (owner/repo) */
  repoPath?: string;
}

/**
 * Detect Git repository information
 * @param projectPath - Project directory path (default: current directory)
 * @returns Git information
 */
export function detectGitInfo(projectPath: string = process.cwd()): GitInfo {
  const result: GitInfo = {
    isGitRepo: false,
  };

  try {
    // Check if .git directory exists
    const gitDir = path.join(projectPath, '.git');
    if (!fs.existsSync(gitDir)) {
      return result;
    }

    result.isGitRepo = true;

    // Get remote URL (origin)
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', {
        cwd: projectPath,
        encoding: 'utf-8',
      }).trim();

      if (!remoteUrl) {
        return result;
      }

      result.remoteUrl = remoteUrl;

      // Parse the remote URL
      const parsed = parseGitRemoteUrl(remoteUrl);
      if (parsed) {
        result.serverUrl = parsed.serverUrl;
        result.owner = parsed.owner;
        result.repo = parsed.repo;
        result.repoPath = `${parsed.owner}/${parsed.repo}`;
      }
    } catch (error) {
      // Git remote not configured
      console.debug('Git remote not configured');
    }

    return result;
  } catch (error) {
    console.debug(`Failed to detect Git info: ${error}`);
    return result;
  }
}

/**
 * Parse Git remote URL to extract server, owner, and repo
 * @param remoteUrl - Git remote URL
 * @returns Parsed information
 */
export function parseGitRemoteUrl(remoteUrl: string): {
  serverUrl: string;
  owner: string;
  repo: string;
} | null {
  try {
    // Remove .git suffix
    let url = remoteUrl.replace(/\.git$/, '');

    // SSH format: git@gitea.ktyun.cc:Kysion/entai-gitea-mcp
    const sshMatch = url.match(/^git@([^:]+):(.+)$/);
    if (sshMatch) {
      const host = sshMatch[1];
      const repoPath = sshMatch[2];
      const [owner, repo] = repoPath.split('/');

      return {
        serverUrl: `https://${host}`,
        owner,
        repo,
      };
    }

    // HTTPS/HTTP format: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp
    const httpsMatch = url.match(/^(https?):\/\/([^/]+)\/(.+)$/);
    if (httpsMatch) {
      const protocol = httpsMatch[1];
      const host = httpsMatch[2];
      const repoPath = httpsMatch[3];
      const [owner, repo] = repoPath.split('/');

      return {
        serverUrl: `${protocol}://${host}`,
        owner,
        repo,
      };
    }

    return null;
  } catch (error) {
    console.debug(`Failed to parse Git remote URL: ${error}`);
    return null;
  }
}

/**
 * Check if a directory is a Git repository
 * @param projectPath - Directory path
 * @returns true if it's a Git repository
 */
export function isGitRepository(projectPath: string = process.cwd()): boolean {
  const gitDir = path.join(projectPath, '.git');
  return fs.existsSync(gitDir);
}

/**
 * Get Git remote URL
 * @param projectPath - Project directory path
 * @param remoteName - Remote name (default: 'origin')
 * @returns Remote URL or null
 */
export function getGitRemoteUrl(
  projectPath: string = process.cwd(),
  remoteName: string = 'origin'
): string | null {
  try {
    const remoteUrl = execSync(
      `git config --get remote.${remoteName}.url`,
      {
        cwd: projectPath,
        encoding: 'utf-8',
      }
    ).trim();

    return remoteUrl || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all Git remotes
 * @param projectPath - Project directory path
 * @returns Array of remote names
 */
export function getGitRemotes(projectPath: string = process.cwd()): string[] {
  try {
    const output = execSync('git remote', {
      cwd: projectPath,
      encoding: 'utf-8',
    }).trim();

    if (!output) {
      return [];
    }

    return output.split('\n').filter(name => name.trim());
  } catch (error) {
    return [];
  }
}

/**
 * Get current Git branch
 * @param projectPath - Project directory path
 * @returns Current branch name or null
 */
export function getCurrentBranch(
  projectPath: string = process.cwd()
): string | null {
  try {
    const branch = execSync('git branch --show-current', {
      cwd: projectPath,
      encoding: 'utf-8',
    }).trim();

    return branch || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if working directory is clean
 * @param projectPath - Project directory path
 * @returns true if working directory is clean
 */
export function isWorkingDirectoryClean(
  projectPath: string = process.cwd()
): boolean {
  try {
    const output = execSync('git status --porcelain', {
      cwd: projectPath,
      encoding: 'utf-8',
    }).trim();

    return output === '';
  } catch (error) {
    return false;
  }
}
