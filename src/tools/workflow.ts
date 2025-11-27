/**
 * Workflow Management Tools
 * 工作流管理 MCP 工具实现
 *
 * 提供 10 个工作流自动化管理工具：
 * 1. gitea_workflow_init - 初始化工作流配置
 * 2. gitea_workflow_load_config - 加载工作流配置
 * 3. gitea_workflow_sync_labels - 同步标签系统
 * 4. gitea_workflow_sync_board - 同步项目看板
 * 5. gitea_workflow_check_issues - 检查并应用工作流规则
 * 6. gitea_workflow_infer_labels - 智能标签推断
 * 7. gitea_workflow_check_blocked - 检测阻塞 Issue
 * 8. gitea_workflow_escalate_priority - 优先级升级
 * 9. gitea_workflow_sync_status - 状态双向同步
 * 10. gitea_workflow_generate_report - 生成工作流报告
 */

import type { GiteaClient } from '../gitea-client.js';
import type { ContextManager } from '../context-manager.js';
import { createLogger } from '../logger.js';
import {
  type WorkflowConfig,
  type ProjectType,
  generateDefaultConfig,
  serializeConfig,
  parseConfig,
  validateConfig,
  getAllLabels,
  getSLAHours,
} from '../utils/workflow-config.js';
import {
  LabelInferenceEngine,
  calculateIssueAgeDays,
  calculateHoursSinceUpdate,
  getIssuePriority,
  getIssueStatus,
  hasLabel,
  type Issue,
} from '../utils/label-inference.js';
import {
  BoardSyncManager,
  createEmptySyncReport,
  type SyncReport,
  type SyncAction,
} from '../utils/board-sync.js';

const logger = createLogger('tools:workflow');

export interface WorkflowToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// ============ 工具 1: 初始化工作流配置 ============

/**
 * 初始化工作流配置
 */
export async function workflowInit(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    project_type: ProjectType;
    language?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  config_path: string;
  config_content: string;
}> {
  logger.debug({ args }, 'Initializing workflow config');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 生成默认配置
  const config = generateDefaultConfig(repo, args.project_type, `${owner}/${repo}`, args.language);

  // 序列化为 YAML
  const yamlContent = serializeConfig(config);
  const configPath = '.gitea/issue-workflow.yaml';

  logger.info({ owner, repo, project_type: args.project_type }, 'Workflow config generated');

  return {
    success: true,
    message: `工作流配置已生成，请将以下内容保存到 ${configPath}`,
    config_path: configPath,
    config_content: yamlContent,
  };
}

// ============ 工具 2: 加载工作流配置 ============

/**
 * 加载工作流配置
 */
export async function workflowLoadConfig(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
  }
): Promise<{
  success: boolean;
  config?: WorkflowConfig;
  validation?: { valid: boolean; errors: string[]; warnings: string[] };
  error?: string;
}> {
  logger.debug({ args }, 'Loading workflow config');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  try {
    // 尝试从仓库读取配置文件
    const response = await ctx.client.get<{ content: string }>(
      `/repos/${owner}/${repo}/contents/.gitea/issue-workflow.yaml`
    );

    // 解码 Base64 内容
    const yamlContent = Buffer.from(response.content, 'base64').toString('utf-8');
    const parseResult = parseConfig(yamlContent);

    if (!parseResult.success || !parseResult.config) {
      return {
        success: false,
        error: `配置解析失败: ${parseResult.errors?.join(', ') || '未知错误'}`,
      };
    }

    const validation = validateConfig(parseResult.config);

    logger.info({ owner, repo, valid: validation.valid }, 'Workflow config loaded');

    return {
      success: true,
      config: parseResult.config,
      validation,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn({ owner, repo, error: errorMessage }, 'Failed to load workflow config');

    return {
      success: false,
      error: `无法加载工作流配置: ${errorMessage}`,
    };
  }
}

// ============ 工具 3: 同步标签系统 ============

/**
 * 同步标签系统
 */
export async function workflowSyncLabels(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    config?: WorkflowConfig;
    dry_run?: boolean;
  }
): Promise<{
  success: boolean;
  created: string[];
  updated: string[];
  skipped: string[];
  errors: string[];
}> {
  logger.debug({ args: { ...args, config: args.config ? '[provided]' : undefined } }, 'Syncing labels');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);
  const dryRun = args.dry_run ?? false;

  // 获取配置
  let config = args.config;
  if (!config) {
    const loadResult = await workflowLoadConfig(ctx, { owner, repo });
    if (!loadResult.success || !loadResult.config) {
      return {
        success: false,
        created: [],
        updated: [],
        skipped: [],
        errors: [loadResult.error || '无法加载配置'],
      };
    }
    config = loadResult.config;
  }

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // 获取现有标签
  const existingLabels = await ctx.client.get<Array<{ id: number; name: string; color: string }>>(
    `/repos/${owner}/${repo}/labels`
  );
  const existingLabelMap = new Map(existingLabels.map((l) => [l.name, l]));

  // 获取配置中的所有标签
  const configLabels = getAllLabels(config);

  for (const { name, config: labelConfig } of configLabels) {
    try {
      const existing = existingLabelMap.get(name);

      if (existing) {
        // 检查是否需要更新
        if (existing.color !== labelConfig.color) {
          if (!dryRun) {
            await ctx.client.patch(`/repos/${owner}/${repo}/labels/${existing.id}`, {
              color: labelConfig.color,
              description: labelConfig.description,
            });
          }
          updated.push(name);
        } else {
          skipped.push(name);
        }
      } else {
        // 创建新标签
        if (!dryRun) {
          await ctx.client.post(`/repos/${owner}/${repo}/labels`, {
            name,
            color: labelConfig.color,
            description: labelConfig.description,
          });
        }
        created.push(name);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`标签 ${name}: ${errorMessage}`);
    }
  }

  logger.info(
    { owner, repo, created: created.length, updated: updated.length, skipped: skipped.length },
    'Labels synced'
  );

  return {
    success: errors.length === 0,
    created,
    updated,
    skipped,
    errors,
  };
}

// ============ 工具 4: 同步项目看板 ============

/**
 * 同步项目看板
 */
export async function workflowSyncBoard(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    config?: WorkflowConfig;
    board_name?: string;
  }
): Promise<{
  success: boolean;
  project_id?: number;
  project_name?: string;
  columns_created: string[];
  columns_existing: string[];
  error?: string;
}> {
  logger.debug({ args: { ...args, config: args.config ? '[provided]' : undefined } }, 'Syncing board');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 获取配置
  let config = args.config;
  if (!config) {
    const loadResult = await workflowLoadConfig(ctx, { owner, repo });
    if (!loadResult.success || !loadResult.config) {
      return {
        success: false,
        columns_created: [],
        columns_existing: [],
        error: loadResult.error || '无法加载配置',
      };
    }
    config = loadResult.config;
  }

  const boardName = args.board_name || config.board.name;
  const columnsCreated: string[] = [];
  const columnsExisting: string[] = [];

  try {
    // 获取现有项目
    const projects = await ctx.client.get<Array<{ id: number; title: string }>>(
      `/repos/${owner}/${repo}/projects`
    );

    let project = projects.find((p) => p.title === boardName);

    // 创建项目（如果不存在）
    if (!project) {
      project = await ctx.client.post<{ id: number; title: string }>(
        `/repos/${owner}/${repo}/projects`,
        {
          title: boardName,
        }
      );
      logger.info({ owner, repo, project_id: project.id }, 'Project created');
    }

    // 获取现有列
    const existingColumns = await ctx.client.get<Array<{ id: number; title: string }>>(
      `/projects/${project.id}/columns`
    );
    const existingColumnNames = new Set(existingColumns.map((c) => c.title));

    // 创建缺失的列
    for (const column of config.board.columns) {
      if (existingColumnNames.has(column.name)) {
        columnsExisting.push(column.name);
      } else {
        await ctx.client.post(`/projects/${project.id}/columns`, {
          title: column.name,
        });
        columnsCreated.push(column.name);
      }
    }

    logger.info(
      { owner, repo, project_id: project.id, created: columnsCreated.length },
      'Board synced'
    );

    return {
      success: true,
      project_id: project.id,
      project_name: boardName,
      columns_created: columnsCreated,
      columns_existing: columnsExisting,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ owner, repo, error: errorMessage }, 'Failed to sync board');

    return {
      success: false,
      columns_created: columnsCreated,
      columns_existing: columnsExisting,
      error: errorMessage,
    };
  }
}

// ============ 工具 5: 检查并应用工作流规则 ============

/**
 * 检查并应用工作流规则
 */
export async function workflowCheckIssues(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    config?: WorkflowConfig;
    issue_number?: number;
    rules?: string[];
  }
): Promise<{
  success: boolean;
  checked: number;
  issues_with_problems: Array<{
    number: number;
    title: string;
    problems: string[];
    suggestions: string[];
  }>;
  error?: string;
}> {
  logger.debug({ args: { ...args, config: args.config ? '[provided]' : undefined } }, 'Checking issues');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 获取配置
  let config = args.config;
  if (!config) {
    const loadResult = await workflowLoadConfig(ctx, { owner, repo });
    if (!loadResult.success || !loadResult.config) {
      return {
        success: false,
        checked: 0,
        issues_with_problems: [],
        error: loadResult.error || '无法加载配置',
      };
    }
    config = loadResult.config;
  }

  const issuesWithProblems: Array<{
    number: number;
    title: string;
    problems: string[];
    suggestions: string[];
  }> = [];

  try {
    // 获取 Issue 列表
    let issues: Issue[];
    if (args.issue_number) {
      const issue = await ctx.client.get<Issue>(`/repos/${owner}/${repo}/issues/${args.issue_number}`);
      issues = [issue];
    } else {
      issues = await ctx.client.get<Issue[]>(`/repos/${owner}/${repo}/issues?state=open&limit=100`);
    }

    const inferenceEngine = new LabelInferenceEngine(config);
    const boardSyncManager = new BoardSyncManager(config);

    for (const issue of issues) {
      const problems: string[] = [];
      const suggestions: string[] = [];

      // 检查标签完整性
      const missingLabels = inferenceEngine.checkMissingLabels(issue);
      if (missingLabels.length > 0) {
        problems.push(`缺少必要标签: ${missingLabels.join(', ')}`);

        // 推断标签
        const inference = inferenceEngine.inferAll(issue);
        for (const item of inference.all) {
          suggestions.push(`建议添加标签 ${item.label} (置信度: ${(item.confidence * 100).toFixed(0)}%)`);
        }
      }

      // 检查标签冲突
      const conflicts = boardSyncManager.checkLabelConflicts(issue);
      if (conflicts.length > 0) {
        problems.push(...conflicts);
        suggestions.push('建议保留最新的标签，移除冲突标签');
      }

      // 检查是否需要添加到 Backlog
      if (boardSyncManager.shouldAddToBacklog(issue)) {
        suggestions.push('建议添加 status/backlog 标签');
      }

      if (problems.length > 0 || suggestions.length > 0) {
        issuesWithProblems.push({
          number: issue.number,
          title: issue.title,
          problems,
          suggestions,
        });
      }
    }

    logger.info(
      { owner, repo, checked: issues.length, problems: issuesWithProblems.length },
      'Issues checked'
    );

    return {
      success: true,
      checked: issues.length,
      issues_with_problems: issuesWithProblems,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ owner, repo, error: errorMessage }, 'Failed to check issues');

    return {
      success: false,
      checked: 0,
      issues_with_problems: [],
      error: errorMessage,
    };
  }
}

// ============ 工具 6: 智能标签推断 ============

/**
 * 智能标签推断
 */
export async function workflowInferLabels(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    config?: WorkflowConfig;
    issue_number: number;
    auto_apply?: boolean;
  }
): Promise<{
  success: boolean;
  issue_number: number;
  inferred_labels: Array<{ label: string; confidence: number; reason: string }>;
  applied_labels?: string[];
  error?: string;
}> {
  logger.debug({ args: { ...args, config: args.config ? '[provided]' : undefined } }, 'Inferring labels');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);
  const autoApply = args.auto_apply ?? false;

  // 获取配置
  let config = args.config;
  if (!config) {
    const loadResult = await workflowLoadConfig(ctx, { owner, repo });
    if (!loadResult.success || !loadResult.config) {
      return {
        success: false,
        issue_number: args.issue_number,
        inferred_labels: [],
        error: loadResult.error || '无法加载配置',
      };
    }
    config = loadResult.config;
  }

  try {
    // 获取 Issue
    const issue = await ctx.client.get<Issue>(`/repos/${owner}/${repo}/issues/${args.issue_number}`);

    // 推断标签
    const inferenceEngine = new LabelInferenceEngine(config);
    const recommendedLabels = inferenceEngine.getRecommendedLabels(issue);

    const appliedLabels: string[] = [];

    // 自动应用标签
    if (autoApply && recommendedLabels.length > 0) {
      // 获取仓库的标签 ID 映射
      const repoLabels = await ctx.client.get<Array<{ id: number; name: string }>>(
        `/repos/${owner}/${repo}/labels`
      );
      const labelIdMap = new Map(repoLabels.map((l) => [l.name, l.id]));

      for (const item of recommendedLabels) {
        const labelId = labelIdMap.get(item.label);
        if (labelId) {
          try {
            await ctx.client.post(`/repos/${owner}/${repo}/issues/${args.issue_number}/labels`, {
              labels: [labelId],
            });
            appliedLabels.push(item.label);
          } catch (error) {
            logger.warn({ label: item.label, error }, 'Failed to apply label');
          }
        }
      }
    }

    logger.info(
      { owner, repo, issue_number: args.issue_number, inferred: recommendedLabels.length, applied: appliedLabels.length },
      'Labels inferred'
    );

    return {
      success: true,
      issue_number: args.issue_number,
      inferred_labels: recommendedLabels,
      applied_labels: autoApply ? appliedLabels : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ owner, repo, issue_number: args.issue_number, error: errorMessage }, 'Failed to infer labels');

    return {
      success: false,
      issue_number: args.issue_number,
      inferred_labels: [],
      error: errorMessage,
    };
  }
}

// ============ 工具 7: 检测阻塞 Issue ============

/**
 * 检测阻塞 Issue
 */
export async function workflowCheckBlocked(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    config?: WorkflowConfig;
    threshold_hours?: number;
  }
): Promise<{
  success: boolean;
  blocked_issues: Array<{
    number: number;
    title: string;
    priority: string | null;
    hours_since_update: number;
    sla_hours: number | null;
    reason: string;
  }>;
  error?: string;
}> {
  logger.debug({ args: { ...args, config: args.config ? '[provided]' : undefined } }, 'Checking blocked issues');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 获取配置
  let config = args.config;
  if (!config) {
    const loadResult = await workflowLoadConfig(ctx, { owner, repo });
    if (!loadResult.success || !loadResult.config) {
      return {
        success: false,
        blocked_issues: [],
        error: loadResult.error || '无法加载配置',
      };
    }
    config = loadResult.config;
  }

  const blockedIssues: Array<{
    number: number;
    title: string;
    priority: string | null;
    hours_since_update: number;
    sla_hours: number | null;
    reason: string;
  }> = [];

  try {
    // 获取开放的 Issue
    const issues = await ctx.client.get<Issue[]>(`/repos/${owner}/${repo}/issues?state=open&limit=100`);

    for (const issue of issues) {
      const priority = getIssuePriority(issue);
      const hoursSinceUpdate = calculateHoursSinceUpdate(issue);
      const slaHours = priority ? getSLAHours(config, priority) : null;

      // 检查是否已有阻塞标签
      const alreadyBlocked = hasLabel(issue, 'workflow/blocked');

      // 检查是否超过 SLA
      let isBlocked = false;
      let reason = '';

      if (args.threshold_hours && hoursSinceUpdate > args.threshold_hours) {
        isBlocked = true;
        reason = `超过指定阈值 ${args.threshold_hours} 小时未更新`;
      } else if (slaHours && hoursSinceUpdate > slaHours) {
        isBlocked = true;
        reason = `超过 SLA 时间 (${slaHours} 小时)`;
      } else if (hasLabel(issue, 'workflow/needs-info') && hoursSinceUpdate > 48) {
        isBlocked = true;
        reason = '标记为需要信息但超过 48 小时未响应';
      } else if (hasLabel(issue, 'workflow/needs-review') && hoursSinceUpdate > 72) {
        isBlocked = true;
        reason = '标记为需要审查但超过 72 小时未处理';
      }

      if (isBlocked && !alreadyBlocked) {
        blockedIssues.push({
          number: issue.number,
          title: issue.title,
          priority,
          hours_since_update: hoursSinceUpdate,
          sla_hours: slaHours ?? null,
          reason,
        });
      }
    }

    logger.info({ owner, repo, blocked: blockedIssues.length }, 'Blocked issues checked');

    return {
      success: true,
      blocked_issues: blockedIssues,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ owner, repo, error: errorMessage }, 'Failed to check blocked issues');

    return {
      success: false,
      blocked_issues: [],
      error: errorMessage,
    };
  }
}

// ============ 工具 8: 优先级升级 ============

/**
 * 优先级升级
 */
export async function workflowEscalatePriority(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    config?: WorkflowConfig;
    dry_run?: boolean;
  }
): Promise<{
  success: boolean;
  escalated: Array<{
    number: number;
    title: string;
    from_priority: string;
    to_priority: string;
    reason: string;
  }>;
  error?: string;
}> {
  logger.debug({ args: { ...args, config: args.config ? '[provided]' : undefined } }, 'Escalating priorities');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);
  const dryRun = args.dry_run ?? false;

  // 获取配置
  let config = args.config;
  if (!config) {
    const loadResult = await workflowLoadConfig(ctx, { owner, repo });
    if (!loadResult.success || !loadResult.config) {
      return {
        success: false,
        escalated: [],
        error: loadResult.error || '无法加载配置',
      };
    }
    config = loadResult.config;
  }

  const escalated: Array<{
    number: number;
    title: string;
    from_priority: string;
    to_priority: string;
    reason: string;
  }> = [];

  try {
    // 获取开放的 Issue
    const issues = await ctx.client.get<Issue[]>(`/repos/${owner}/${repo}/issues?state=open&limit=100`);

    // 获取标签 ID 映射
    const repoLabels = await ctx.client.get<Array<{ id: number; name: string }>>(
      `/repos/${owner}/${repo}/labels`
    );
    const labelIdMap = new Map(repoLabels.map((l) => [l.name, l.id]));
    const idToLabelMap = new Map(repoLabels.map((l) => [l.id, l.name]));

    // 定义升级映射
    const upgradeMap: Record<string, { days: number; to: string }> = {
      P3: { days: 30, to: 'P2' },
      P2: { days: 14, to: 'P1' },
      P1: { days: 3, to: 'P0' },
    };

    for (const issue of issues) {
      const currentPriority = getIssuePriority(issue);
      const issueType = issue.labels.find((l) => l.name.startsWith('type/'))?.name;
      const ageDays = calculateIssueAgeDays(issue);

      let newPriority: string | null = null;
      let reason = '';

      // 安全问题强制 P0
      if (issueType === 'type/security' && currentPriority !== 'P0') {
        newPriority = 'P0';
        reason = '安全问题自动升级为紧急';
      } else if (currentPriority && upgradeMap[currentPriority]) {
        const upgrade = upgradeMap[currentPriority];
        if (ageDays > upgrade.days) {
          newPriority = upgrade.to;
          reason = `超过 ${upgrade.days} 天未解决`;
        }
      }

      if (newPriority && currentPriority) {
        if (!dryRun) {
          // 移除旧优先级标签
          const oldLabelId = labelIdMap.get(`priority/${currentPriority}`);
          if (oldLabelId) {
            try {
              await ctx.client.delete(
                `/repos/${owner}/${repo}/issues/${issue.number}/labels/${oldLabelId}`
              );
            } catch {
              // 忽略删除失败
            }
          }

          // 添加新优先级标签
          const newLabelId = labelIdMap.get(`priority/${newPriority}`);
          if (newLabelId) {
            await ctx.client.post(`/repos/${owner}/${repo}/issues/${issue.number}/labels`, {
              labels: [newLabelId],
            });
          }
        }

        escalated.push({
          number: issue.number,
          title: issue.title,
          from_priority: currentPriority,
          to_priority: newPriority,
          reason,
        });
      }
    }

    logger.info({ owner, repo, escalated: escalated.length, dry_run: dryRun }, 'Priorities escalated');

    return {
      success: true,
      escalated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ owner, repo, error: errorMessage }, 'Failed to escalate priorities');

    return {
      success: false,
      escalated: [],
      error: errorMessage,
    };
  }
}

// ============ 工具 9: 状态双向同步 ============

/**
 * 状态双向同步
 */
export async function workflowSyncStatus(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    config?: WorkflowConfig;
    direction: 'label-to-board' | 'board-to-label' | 'both';
  }
): Promise<{
  success: boolean;
  synced_count: number;
  actions: SyncAction[];
  error?: string;
}> {
  logger.debug({ args: { ...args, config: args.config ? '[provided]' : undefined } }, 'Syncing status');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 获取配置
  let config = args.config;
  if (!config) {
    const loadResult = await workflowLoadConfig(ctx, { owner, repo });
    if (!loadResult.success || !loadResult.config) {
      return {
        success: false,
        synced_count: 0,
        actions: [],
        error: loadResult.error || '无法加载配置',
      };
    }
    config = loadResult.config;
  }

  const boardSyncManager = new BoardSyncManager(config);
  const actions: SyncAction[] = [];

  try {
    // 获取项目和列
    const projects = await ctx.client.get<Array<{ id: number; title: string }>>(
      `/repos/${owner}/${repo}/projects`
    );

    const workflowProject = projects.find((p) => p.title === config.board.name);
    if (!workflowProject) {
      return {
        success: false,
        synced_count: 0,
        actions: [],
        error: `未找到项目看板: ${config.board.name}`,
      };
    }

    // 获取开放的 Issue
    const issues = await ctx.client.get<Issue[]>(`/repos/${owner}/${repo}/issues?state=open&limit=100`);

    // 计算同步操作（这里只返回建议的操作，实际同步需要更复杂的实现）
    for (const issue of issues) {
      const syncActions = boardSyncManager.calculateSyncActions(issue, null, args.direction);
      actions.push(...syncActions);
    }

    logger.info({ owner, repo, actions: actions.length }, 'Status sync calculated');

    return {
      success: true,
      synced_count: actions.length,
      actions,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ owner, repo, error: errorMessage }, 'Failed to sync status');

    return {
      success: false,
      synced_count: 0,
      actions: [],
      error: errorMessage,
    };
  }
}

// ============ 工具 10: 生成工作流报告 ============

/**
 * 生成工作流报告
 */
export async function workflowGenerateReport(
  ctx: WorkflowToolsContext,
  args: {
    owner?: string;
    repo?: string;
    config?: WorkflowConfig;
    time_range?: 'day' | 'week' | 'month';
  }
): Promise<{
  success: boolean;
  report: {
    summary: {
      total_open: number;
      total_closed: number;
      by_status: Record<string, number>;
      by_priority: Record<string, number>;
      by_type: Record<string, number>;
    };
    blocked_count: number;
    avg_age_days: number;
    health_score: number;
    recommendations: string[];
  };
  markdown_report: string;
  error?: string;
}> {
  logger.debug({ args: { ...args, config: args.config ? '[provided]' : undefined } }, 'Generating report');

  const { owner, repo } = ctx.contextManager.resolveOwnerRepo(args.owner, args.repo);

  // 获取配置
  let config = args.config;
  if (!config) {
    const loadResult = await workflowLoadConfig(ctx, { owner, repo });
    if (!loadResult.success || !loadResult.config) {
      return {
        success: false,
        report: {
          summary: { total_open: 0, total_closed: 0, by_status: {}, by_priority: {}, by_type: {} },
          blocked_count: 0,
          avg_age_days: 0,
          health_score: 0,
          recommendations: [],
        },
        markdown_report: '',
        error: loadResult.error || '无法加载配置',
      };
    }
    config = loadResult.config;
  }

  try {
    // 获取开放和关闭的 Issue
    const openIssues = await ctx.client.get<Issue[]>(`/repos/${owner}/${repo}/issues?state=open&limit=100`);
    const closedIssues = await ctx.client.get<Issue[]>(`/repos/${owner}/${repo}/issues?state=closed&limit=50`);

    // 统计
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalAgeDays = 0;
    let blockedCount = 0;

    for (const issue of openIssues) {
      // 状态统计
      const status = getIssueStatus(issue) || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;

      // 优先级统计
      const priority = getIssuePriority(issue) || 'unknown';
      byPriority[priority] = (byPriority[priority] || 0) + 1;

      // 类型统计
      const typeLabel = issue.labels.find((l) => l.name.startsWith('type/'));
      const type = typeLabel ? typeLabel.name.replace('type/', '') : 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      // 年龄统计
      totalAgeDays += calculateIssueAgeDays(issue);

      // 阻塞统计
      if (hasLabel(issue, 'workflow/blocked')) {
        blockedCount++;
      }
    }

    const avgAgeDays = openIssues.length > 0 ? Math.round(totalAgeDays / openIssues.length) : 0;

    // 计算健康度评分 (0-100)
    let healthScore = 100;
    if (blockedCount > 0) healthScore -= blockedCount * 5;
    if (avgAgeDays > 30) healthScore -= 20;
    else if (avgAgeDays > 14) healthScore -= 10;
    if (byPriority['P0'] && byPriority['P0'] > 0) healthScore -= byPriority['P0'] * 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    // 生成建议
    const recommendations: string[] = [];
    if (blockedCount > 0) {
      recommendations.push(`有 ${blockedCount} 个 Issue 被阻塞，请及时处理`);
    }
    if (byPriority['P0'] && byPriority['P0'] > 0) {
      recommendations.push(`有 ${byPriority['P0']} 个紧急 Issue (P0)，需要立即关注`);
    }
    if (avgAgeDays > 30) {
      recommendations.push(`Issue 平均年龄为 ${avgAgeDays} 天，建议加快处理速度`);
    }
    if (byStatus['unknown'] && byStatus['unknown'] > 0) {
      recommendations.push(`有 ${byStatus['unknown']} 个 Issue 缺少状态标签`);
    }

    // 生成 Markdown 报告
    const markdownReport = generateMarkdownReport(
      owner,
      repo,
      {
        total_open: openIssues.length,
        total_closed: closedIssues.length,
        by_status: byStatus,
        by_priority: byPriority,
        by_type: byType,
      },
      blockedCount,
      avgAgeDays,
      healthScore,
      recommendations
    );

    logger.info({ owner, repo, open: openIssues.length, health_score: healthScore }, 'Report generated');

    return {
      success: true,
      report: {
        summary: {
          total_open: openIssues.length,
          total_closed: closedIssues.length,
          by_status: byStatus,
          by_priority: byPriority,
          by_type: byType,
        },
        blocked_count: blockedCount,
        avg_age_days: avgAgeDays,
        health_score: healthScore,
        recommendations,
      },
      markdown_report: markdownReport,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ owner, repo, error: errorMessage }, 'Failed to generate report');

    return {
      success: false,
      report: {
        summary: { total_open: 0, total_closed: 0, by_status: {}, by_priority: {}, by_type: {} },
        blocked_count: 0,
        avg_age_days: 0,
        health_score: 0,
        recommendations: [],
      },
      markdown_report: '',
      error: errorMessage,
    };
  }
}

// ============ 辅助函数 ============

function generateMarkdownReport(
  owner: string,
  repo: string,
  summary: {
    total_open: number;
    total_closed: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_type: Record<string, number>;
  },
  blockedCount: number,
  avgAgeDays: number,
  healthScore: number,
  recommendations: string[]
): string {
  const lines: string[] = [
    `# ${owner}/${repo} 工作流报告`,
    '',
    `生成时间: ${new Date().toISOString()}`,
    '',
    '## 概览',
    '',
    `| 指标 | 值 |`,
    `|------|-----|`,
    `| 开放 Issue | ${summary.total_open} |`,
    `| 已关闭 Issue | ${summary.total_closed} |`,
    `| 阻塞 Issue | ${blockedCount} |`,
    `| 平均年龄 | ${avgAgeDays} 天 |`,
    `| 健康度评分 | ${healthScore}/100 |`,
    '',
    '## 状态分布',
    '',
    '| 状态 | 数量 |',
    '|------|------|',
  ];

  for (const [status, count] of Object.entries(summary.by_status)) {
    lines.push(`| ${status} | ${count} |`);
  }

  lines.push('');
  lines.push('## 优先级分布');
  lines.push('');
  lines.push('| 优先级 | 数量 |');
  lines.push('|--------|------|');

  for (const [priority, count] of Object.entries(summary.by_priority)) {
    lines.push(`| ${priority} | ${count} |`);
  }

  lines.push('');
  lines.push('## 类型分布');
  lines.push('');
  lines.push('| 类型 | 数量 |');
  lines.push('|------|------|');

  for (const [type, count] of Object.entries(summary.by_type)) {
    lines.push(`| ${type} | ${count} |`);
  }

  if (recommendations.length > 0) {
    lines.push('');
    lines.push('## 建议');
    lines.push('');
    for (const rec of recommendations) {
      lines.push(`- ${rec}`);
    }
  }

  return lines.join('\n');
}
