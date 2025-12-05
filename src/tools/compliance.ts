/**
 * Compliance 规范检查工具
 *
 * 用于检查分支、提交、PR 是否符合项目规范
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tools:compliance');

export interface ComplianceToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// 基础参数
export interface ComplianceParams {
  owner?: string;
  repo?: string;
  token?: string;
}

// ==================== 配置相关 ====================

/**
 * 规范配置接口
 */
export interface ComplianceConfig {
  branch: {
    patterns: string[];
  };
  commit: {
    types: string[];
    scope_required: boolean;
    max_subject_length: number;
  };
  pr: {
    required_sections: string[];
    require_issue_link: boolean;
  };
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ComplianceConfig = {
  branch: {
    patterns: [
      '^feat/issue-\\d+-.*$',
      '^fix/issue-\\d+-.*$',
      '^docs/.*$',
      '^refactor/.*$',
      '^test/.*$',
      '^chore/.*$',
      '^main$',
      '^dev$',
      '^release/.*$',
    ],
  },
  commit: {
    types: ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'style', 'perf', 'ci', 'build', 'revert'],
    scope_required: false,
    max_subject_length: 72,
  },
  pr: {
    required_sections: ['Summary', 'Test Plan'],
    require_issue_link: true,
  },
};

/**
 * 加载规范配置
 */
export function loadComplianceConfig(configPath?: string): ComplianceConfig {
  const searchPaths = [
    configPath,
    path.join(process.cwd(), '.gitea', 'compliance.yaml'),
    path.join(process.cwd(), '.gitea', 'compliance.yml'),
  ].filter(Boolean) as string[];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const parsed = yaml.parse(content);
        logger.info({ path: p }, 'Loaded compliance config');
        return mergeConfig(DEFAULT_CONFIG, parsed);
      } catch (err) {
        logger.warn({ path: p, error: err }, 'Failed to parse compliance config');
      }
    }
  }

  logger.info('Using default compliance config');
  return DEFAULT_CONFIG;
}

/**
 * 合并配置
 */
function mergeConfig(base: ComplianceConfig, override: Partial<ComplianceConfig>): ComplianceConfig {
  return {
    branch: {
      ...base.branch,
      ...(override.branch || {}),
    },
    commit: {
      ...base.commit,
      ...(override.commit || {}),
    },
    pr: {
      ...base.pr,
      ...(override.pr || {}),
    },
  };
}

// ==================== 检查结果接口 ====================

export interface CheckResult {
  compliant: boolean;
  issues: string[];
  suggestions: string[];
}

export interface BranchCheckResult extends CheckResult {
  branch: string;
  matched_pattern?: string;
}

export interface CommitCheckResult extends CheckResult {
  sha: string;
  message: string;
  type?: string;
  scope?: string;
  subject?: string;
}

export interface PRCheckResult extends CheckResult {
  pr_number: number;
  title: string;
  missing_sections: string[];
  has_issue_link: boolean;
}

export interface AllCheckResult {
  branch?: BranchCheckResult;
  commits?: CommitCheckResult[];
  pr?: PRCheckResult;
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    compliant: boolean;
  };
}

// ==================== 分支检查 ====================

export interface CheckBranchParams extends ComplianceParams {
  branch: string;
  config_path?: string;
}

/**
 * 检查分支命名是否符合规范
 */
export async function checkBranch(
  ctx: ComplianceToolsContext,
  params: CheckBranchParams
): Promise<BranchCheckResult> {
  const config = loadComplianceConfig(params.config_path);
  const branch = params.branch;

  logger.info({ branch }, 'Checking branch naming');

  const issues: string[] = [];
  const suggestions: string[] = [];
  let matchedPattern: string | undefined;

  // 检查分支名是否匹配任何允许的模式
  for (const pattern of config.branch.patterns) {
    const regex = new RegExp(pattern);
    if (regex.test(branch)) {
      matchedPattern = pattern;
      break;
    }
  }

  if (!matchedPattern) {
    issues.push(`分支名 "${branch}" 不符合任何允许的命名模式`);

    // 提供建议
    if (branch.includes('feat') || branch.includes('feature')) {
      suggestions.push('功能分支建议格式: feat/issue-{id}-{描述}');
    } else if (branch.includes('fix') || branch.includes('bug')) {
      suggestions.push('修复分支建议格式: fix/issue-{id}-{描述}');
    } else if (branch.includes('doc')) {
      suggestions.push('文档分支建议格式: docs/{描述}');
    } else {
      suggestions.push('建议的分支格式:');
      suggestions.push('  - feat/issue-{id}-{描述} (新功能)');
      suggestions.push('  - fix/issue-{id}-{描述} (修复)');
      suggestions.push('  - docs/{描述} (文档)');
      suggestions.push('  - refactor/{描述} (重构)');
    }
  }

  return {
    branch,
    compliant: issues.length === 0,
    issues,
    suggestions,
    matched_pattern: matchedPattern,
  };
}

// ==================== 提交检查 ====================

export interface CheckCommitParams extends ComplianceParams {
  sha?: string;
  message?: string;
  config_path?: string;
}

/**
 * 解析 Conventional Commit 格式
 */
function parseConventionalCommit(message: string): {
  type?: string;
  scope?: string;
  subject?: string;
  valid: boolean;
} {
  // 格式: type(scope): subject 或 type: subject
  const regex = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/;
  const firstLine = message.split('\n')[0].trim();
  const match = firstLine.match(regex);

  if (match) {
    return {
      type: match[1],
      scope: match[2],
      subject: match[3],
      valid: true,
    };
  }

  return { valid: false };
}

/**
 * 检查提交信息是否符合规范
 */
export async function checkCommit(
  ctx: ComplianceToolsContext,
  params: CheckCommitParams
): Promise<CommitCheckResult> {
  const config = loadComplianceConfig(params.config_path);
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  let message = params.message;
  let sha = params.sha || '';

  // 如果提供了 SHA，从 API 获取提交信息
  if (params.sha && !params.message) {
    try {
      const response = await ctx.client.request({
        method: 'GET',
        path: `/repos/${owner}/${repo}/git/commits/${params.sha}`,
        token: params.token,
      });
      message = (response.data as any)?.commit?.message || (response.data as any)?.message || '';
      sha = params.sha;
    } catch (err) {
      logger.warn({ sha: params.sha, error: err }, 'Failed to fetch commit');
      return {
        sha: params.sha,
        message: '',
        compliant: false,
        issues: [`无法获取提交 ${params.sha} 的信息`],
        suggestions: [],
      };
    }
  }

  if (!message) {
    return {
      sha,
      message: '',
      compliant: false,
      issues: ['未提供提交信息'],
      suggestions: [],
    };
  }

  logger.info({ sha, message: message.substring(0, 50) }, 'Checking commit message');

  const issues: string[] = [];
  const suggestions: string[] = [];
  const parsed = parseConventionalCommit(message);

  if (!parsed.valid) {
    issues.push('提交信息不符合 Conventional Commit 格式');
    suggestions.push('正确格式: <type>(<scope>): <subject>');
    suggestions.push('示例: feat(cli): add new command');
  } else {
    // 检查 type 是否有效
    if (parsed.type && !config.commit.types.includes(parsed.type)) {
      issues.push(`无效的提交类型: ${parsed.type}`);
      suggestions.push(`允许的类型: ${config.commit.types.join(', ')}`);
    }

    // 检查是否需要 scope
    if (config.commit.scope_required && !parsed.scope) {
      issues.push('缺少作用域 (scope)');
      suggestions.push('请在类型后添加作用域，如: feat(cli): ...');
    }

    // 检查 subject 长度
    if (parsed.subject && parsed.subject.length > config.commit.max_subject_length) {
      issues.push(`主题行过长: ${parsed.subject.length} 字符 (最大 ${config.commit.max_subject_length})`);
      suggestions.push('请缩短主题行，详细信息放在正文中');
    }

    // 检查主题行是否以大写开头
    if (parsed.subject && /^[A-Z]/.test(parsed.subject)) {
      issues.push('主题行不应以大写字母开头');
      suggestions.push('主题行应以小写字母开头');
    }

    // 检查主题行是否以句号结尾
    if (parsed.subject && parsed.subject.endsWith('.')) {
      issues.push('主题行不应以句号结尾');
    }
  }

  return {
    sha,
    message,
    compliant: issues.length === 0,
    issues,
    suggestions,
    type: parsed.type,
    scope: parsed.scope,
    subject: parsed.subject,
  };
}

// ==================== PR 检查 ====================

export interface CheckPRParams extends ComplianceParams {
  pr_number: number;
  config_path?: string;
}

/**
 * 检查 PR 格式是否符合规范
 */
export async function checkPR(
  ctx: ComplianceToolsContext,
  params: CheckPRParams
): Promise<PRCheckResult> {
  const config = loadComplianceConfig(params.config_path);
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, pr: params.pr_number }, 'Checking PR format');

  // 获取 PR 信息
  let pr: any;
  try {
    const response = await ctx.client.request({
      method: 'GET',
      path: `/repos/${owner}/${repo}/pulls/${params.pr_number}`,
      token: params.token,
    });
    pr = response.data;
  } catch (err) {
    logger.warn({ pr: params.pr_number, error: err }, 'Failed to fetch PR');
    return {
      pr_number: params.pr_number,
      title: '',
      compliant: false,
      issues: [`无法获取 PR #${params.pr_number} 的信息`],
      suggestions: [],
      missing_sections: [],
      has_issue_link: false,
    };
  }

  const issues: string[] = [];
  const suggestions: string[] = [];
  const body = pr.body || '';
  const title = pr.title || '';

  // 检查必需章节
  const missingSections: string[] = [];
  for (const section of config.pr.required_sections) {
    // 检查 ## Section 或 # Section 格式
    const sectionRegex = new RegExp(`^#+\\s*${section}`, 'mi');
    if (!sectionRegex.test(body)) {
      missingSections.push(section);
    }
  }

  if (missingSections.length > 0) {
    issues.push(`缺少必需的章节: ${missingSections.join(', ')}`);
    suggestions.push('PR 描述应包含以下章节:');
    for (const section of missingSections) {
      suggestions.push(`  ## ${section}`);
    }
  }

  // 检查 Issue 链接
  const issuePatterns = [
    /(?:closes?|fixes?|resolves?)\s+#\d+/i,
    /(?:closes?|fixes?|resolves?)\s+https?:\/\/[^\s]+\/issues\/\d+/i,
    /#\d+/,
    /issue[- ]?\d+/i,
  ];

  const hasIssueLink = issuePatterns.some((pattern) => pattern.test(body) || pattern.test(title));

  if (config.pr.require_issue_link && !hasIssueLink) {
    issues.push('PR 未关联任何 Issue');
    suggestions.push('请在 PR 描述中添加关联的 Issue，如:');
    suggestions.push('  Closes #123');
    suggestions.push('  Fixes #456');
  }

  // 检查标题格式（可选，使用 Conventional Commit 格式）
  const titleParsed = parseConventionalCommit(title);
  if (!titleParsed.valid) {
    suggestions.push('建议 PR 标题使用 Conventional Commit 格式:');
    suggestions.push('  feat(scope): add new feature');
    suggestions.push('  fix(scope): fix bug');
  }

  return {
    pr_number: params.pr_number,
    title,
    compliant: issues.length === 0,
    issues,
    suggestions,
    missing_sections: missingSections,
    has_issue_link: hasIssueLink,
  };
}

// ==================== 综合检查 ====================

export interface CheckAllParams extends ComplianceParams {
  branch?: string;
  pr_number?: number;
  commit_count?: number;
  config_path?: string;
}

/**
 * 执行全面的规范检查
 */
export async function checkAll(
  ctx: ComplianceToolsContext,
  params: CheckAllParams
): Promise<AllCheckResult> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo }, 'Running comprehensive compliance check');

  const result: AllCheckResult = {
    summary: {
      total_checks: 0,
      passed: 0,
      failed: 0,
      compliant: true,
    },
  };

  // 1. 检查分支（如果提供）
  if (params.branch) {
    result.branch = await checkBranch(ctx, {
      branch: params.branch,
      config_path: params.config_path,
    });
    result.summary.total_checks++;
    if (result.branch.compliant) {
      result.summary.passed++;
    } else {
      result.summary.failed++;
      result.summary.compliant = false;
    }
  }

  // 2. 检查 PR（如果提供）
  if (params.pr_number) {
    result.pr = await checkPR(ctx, {
      owner,
      repo,
      pr_number: params.pr_number,
      config_path: params.config_path,
      token: params.token,
    });
    result.summary.total_checks++;
    if (result.pr.compliant) {
      result.summary.passed++;
    } else {
      result.summary.failed++;
      result.summary.compliant = false;
    }

    // 如果有 PR，检查其关联的提交
    try {
      const commitsResponse = await ctx.client.request({
        method: 'GET',
        path: `/repos/${owner}/${repo}/pulls/${params.pr_number}/commits`,
        token: params.token,
      });
      const commits = (commitsResponse.data as any[]) || [];
      const commitCount = params.commit_count || 10;
      const commitsToCheck = commits.slice(0, commitCount);

      result.commits = [];
      for (const commit of commitsToCheck) {
        const commitResult = await checkCommit(ctx, {
          owner,
          repo,
          sha: commit.sha,
          message: commit.commit?.message,
          config_path: params.config_path,
          token: params.token,
        });
        result.commits.push(commitResult);
        result.summary.total_checks++;
        if (commitResult.compliant) {
          result.summary.passed++;
        } else {
          result.summary.failed++;
          result.summary.compliant = false;
        }
      }
    } catch (err) {
      logger.warn({ pr: params.pr_number, error: err }, 'Failed to fetch PR commits');
    }
  }

  return result;
}

// ==================== 初始化配置 ====================

export interface InitConfigParams {
  force?: boolean;
  config_path?: string;
}

/**
 * 初始化规范配置文件
 */
export async function initConfig(params: InitConfigParams): Promise<{ success: boolean; path: string; message: string }> {
  const configPath = params.config_path || path.join(process.cwd(), '.gitea', 'compliance.yaml');
  const configDir = path.dirname(configPath);

  // 检查文件是否存在
  if (fs.existsSync(configPath) && !params.force) {
    return {
      success: false,
      path: configPath,
      message: `配置文件已存在: ${configPath}，使用 --force 覆盖`,
    };
  }

  // 创建目录
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 生成配置内容
  const configContent = `# Gitea 规范检查配置
# 用于检查分支、提交、PR 是否符合项目规范

# 分支命名规范
branch:
  patterns:
    - "^feat/issue-\\\\d+-.*$"     # 功能分支: feat/issue-123-add-feature
    - "^fix/issue-\\\\d+-.*$"      # 修复分支: fix/issue-456-fix-bug
    - "^docs/.*$"                  # 文档分支: docs/update-readme
    - "^refactor/.*$"              # 重构分支: refactor/improve-performance
    - "^test/.*$"                  # 测试分支: test/add-unit-tests
    - "^chore/.*$"                 # 杂务分支: chore/update-deps
    - "^main$"                     # 主分支
    - "^dev$"                      # 开发分支
    - "^release/.*$"               # 发布分支: release/v1.0.0

# 提交信息规范 (Conventional Commits)
commit:
  types:
    - feat      # 新功能
    - fix       # 修复
    - docs      # 文档
    - refactor  # 重构
    - test      # 测试
    - chore     # 杂务
    - style     # 格式
    - perf      # 性能
    - ci        # CI/CD
    - build     # 构建
    - revert    # 回滚
  scope_required: false           # 是否要求 scope
  max_subject_length: 72          # 主题行最大长度

# PR 格式规范
pr:
  required_sections:
    - Summary                     # 摘要
    - Test Plan                   # 测试计划
  require_issue_link: true        # 是否要求关联 Issue
`;

  fs.writeFileSync(configPath, configContent, 'utf-8');

  return {
    success: true,
    path: configPath,
    message: `配置文件已创建: ${configPath}`,
  };
}
