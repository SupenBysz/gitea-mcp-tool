/**
 * Board Sync Logic
 * 看板同步逻辑 - 同步 Issue 标签与项目看板状态
 */

import type { WorkflowConfig, SyncDirection, BoardColumn } from './workflow-config.js';
import type { Issue } from './label-inference.js';
import { getLabelPrefixes, buildLabel, matchLabel } from './workflow-config.js';

// ============ 类型定义 ============

export interface Project {
  id: number;
  title: string;
  description?: string;
  columns?: ProjectColumn[];
}

export interface ProjectColumn {
  id: number;
  name: string;
  project_id: number;
}

export interface ProjectCard {
  id: number;
  project_id: number;
  column_id: number;
  issue?: {
    id: number;
    number: number;
  };
}

export interface SyncAction {
  type: 'move_card' | 'add_label' | 'remove_label' | 'create_card';
  issue_number: number;
  details: {
    from_column?: string;
    to_column?: string;
    label?: string;
    card_id?: number;
    column_id?: number;
  };
  reason: string;
}

export interface SyncReport {
  total_issues: number;
  synced: number;
  skipped: number;
  errors: number;
  actions: SyncAction[];
  error_details: Array<{ issue_number: number; error: string }>;
}

export interface BoardSyncOptions {
  direction: SyncDirection;
  dryRun?: boolean;
  issueNumbers?: number[];
}

// ============ 看板同步类 ============

/**
 * 看板同步管理器
 */
export class BoardSyncManager {
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  /**
   * 计算 Issue 需要的同步操作
   */
  calculateSyncActions(
    issue: Issue,
    currentColumn: ProjectColumn | null,
    direction: SyncDirection
  ): SyncAction[] {
    const actions: SyncAction[] = [];
    const statusLabel = this.getStatusLabel(issue);
    const expectedColumn = statusLabel ? this.findColumnByLabel(statusLabel) : null;

    if (direction === 'label-to-board' || direction === 'both') {
      // 标签 → 看板：根据状态标签移动卡片
      if (statusLabel && expectedColumn) {
        if (!currentColumn) {
          // Issue 不在看板上，需要创建卡片
          actions.push({
            type: 'create_card',
            issue_number: issue.number,
            details: {
              to_column: expectedColumn.name,
            },
            reason: `根据标签 ${statusLabel} 添加到看板列 ${expectedColumn.name}`,
          });
        } else if (currentColumn.name !== expectedColumn.name) {
          // 卡片在错误的列，需要移动
          actions.push({
            type: 'move_card',
            issue_number: issue.number,
            details: {
              from_column: currentColumn.name,
              to_column: expectedColumn.name,
            },
            reason: `根据标签 ${statusLabel} 移动卡片`,
          });
        }
      }
    }

    if (direction === 'board-to-label' || direction === 'both') {
      // 看板 → 标签：根据卡片位置更新标签
      if (currentColumn) {
        const expectedLabel = this.findLabelByColumn(currentColumn.name);
        if (expectedLabel && expectedLabel !== statusLabel) {
          // 需要更新状态标签
          if (statusLabel) {
            actions.push({
              type: 'remove_label',
              issue_number: issue.number,
              details: { label: statusLabel },
              reason: `移除旧状态标签 ${statusLabel}`,
            });
          }
          actions.push({
            type: 'add_label',
            issue_number: issue.number,
            details: { label: expectedLabel },
            reason: `根据看板位置 ${currentColumn.name} 添加标签`,
          });
        }
      }
    }

    return actions;
  }

  /**
   * 检查 Issue 是否需要添加到 Backlog
   */
  shouldAddToBacklog(issue: Issue): boolean {
    if (!this.config.automation.new_issue_defaults.auto_add_to_backlog) {
      return false;
    }

    // 如果没有状态标签，应该添加到 Backlog
    const statusLabel = this.getStatusLabel(issue);
    return !statusLabel;
  }

  /**
   * 获取 Backlog 列信息
   */
  getBacklogColumn(): BoardColumn | undefined {
    const prefixes = getLabelPrefixes(this.config);
    const backlogLabel = buildLabel(prefixes.status, 'backlog');
    return this.config.board.columns.find(
      (col) => col.maps_to === backlogLabel || col.name.toLowerCase() === 'backlog'
    );
  }

  /**
   * 检查标签冲突（多个状态标签）
   */
  checkLabelConflicts(issue: Issue): string[] {
    const conflicts: string[] = [];
    const prefixes = getLabelPrefixes(this.config);
    const statusLabels = issue.labels.filter((l) => matchLabel(prefixes.status, l.name) !== null);

    if (statusLabels.length > 1) {
      conflicts.push(
        `Issue #${issue.number} 有多个状态标签: ${statusLabels.map((l) => l.name).join(', ')}`
      );
    }

    const priorityLabels = issue.labels.filter((l) => matchLabel(prefixes.priority, l.name) !== null);
    if (priorityLabels.length > 1) {
      conflicts.push(
        `Issue #${issue.number} 有多个优先级标签: ${priorityLabels.map((l) => l.name).join(', ')}`
      );
    }

    return conflicts;
  }

  /**
   * 解决标签冲突
   */
  resolveConflicts(issue: Issue, conflictResolution: 'keep-first' | 'keep-last'): SyncAction[] {
    const actions: SyncAction[] = [];

    // 解决状态标签冲突
    const prefixes = getLabelPrefixes(this.config);
    const statusLabels = issue.labels.filter((l) => matchLabel(prefixes.status, l.name) !== null);
    if (statusLabels.length > 1) {
      const toRemove =
        conflictResolution === 'keep-first' ? statusLabels.slice(1) : statusLabels.slice(0, -1);

      for (const label of toRemove) {
        actions.push({
          type: 'remove_label',
          issue_number: issue.number,
          details: { label: label.name },
          reason: `解决状态标签冲突，保留 ${conflictResolution === 'keep-first' ? '第一个' : '最后一个'}`,
        });
      }
    }

    // 解决优先级标签冲突
    const priorityLabels = issue.labels.filter((l) => matchLabel(prefixes.priority, l.name) !== null);
    if (priorityLabels.length > 1) {
      const toRemove =
        conflictResolution === 'keep-first' ? priorityLabels.slice(1) : priorityLabels.slice(0, -1);

      for (const label of toRemove) {
        actions.push({
          type: 'remove_label',
          issue_number: issue.number,
          details: { label: label.name },
          reason: `解决优先级标签冲突，保留 ${conflictResolution === 'keep-first' ? '第一个' : '最后一个'}`,
        });
      }
    }

    return actions;
  }

  /**
   * 生成同步报告摘要
   */
  generateReportSummary(report: SyncReport): string {
    const lines: string[] = [
      '## 看板同步报告',
      '',
      `- 总 Issue 数: ${report.total_issues}`,
      `- 已同步: ${report.synced}`,
      `- 已跳过: ${report.skipped}`,
      `- 错误: ${report.errors}`,
      '',
    ];

    if (report.actions.length > 0) {
      lines.push('### 执行的操作');
      lines.push('');
      for (const action of report.actions) {
        switch (action.type) {
          case 'move_card':
            lines.push(
              `- Issue #${action.issue_number}: 移动卡片 ${action.details.from_column} → ${action.details.to_column}`
            );
            break;
          case 'create_card':
            lines.push(
              `- Issue #${action.issue_number}: 创建卡片到 ${action.details.to_column}`
            );
            break;
          case 'add_label':
            lines.push(`- Issue #${action.issue_number}: 添加标签 ${action.details.label}`);
            break;
          case 'remove_label':
            lines.push(`- Issue #${action.issue_number}: 移除标签 ${action.details.label}`);
            break;
        }
      }
      lines.push('');
    }

    if (report.error_details.length > 0) {
      lines.push('### 错误详情');
      lines.push('');
      for (const error of report.error_details) {
        lines.push(`- Issue #${error.issue_number}: ${error.error}`);
      }
    }

    return lines.join('\n');
  }

  // ============ 私有方法 ============

  private getStatusLabel(issue: Issue): string | null {
    const prefixes = getLabelPrefixes(this.config);
    const statusLabel = issue.labels.find((l) => matchLabel(prefixes.status, l.name) !== null);
    return statusLabel?.name || null;
  }

  private findColumnByLabel(labelName: string): BoardColumn | undefined {
    return this.config.board.columns.find((col) => col.maps_to === labelName);
  }

  private findLabelByColumn(columnName: string): string | undefined {
    const column = this.config.board.columns.find((col) => col.name === columnName);
    return column?.maps_to;
  }
}

// ============ 辅助函数 ============

/**
 * 创建空的同步报告
 */
export function createEmptySyncReport(): SyncReport {
  return {
    total_issues: 0,
    synced: 0,
    skipped: 0,
    errors: 0,
    actions: [],
    error_details: [],
  };
}

/**
 * 合并多个同步报告
 */
export function mergeSyncReports(...reports: SyncReport[]): SyncReport {
  const merged = createEmptySyncReport();

  for (const report of reports) {
    merged.total_issues += report.total_issues;
    merged.synced += report.synced;
    merged.skipped += report.skipped;
    merged.errors += report.errors;
    merged.actions.push(...report.actions);
    merged.error_details.push(...report.error_details);
  }

  return merged;
}

/**
 * 验证看板配置
 */
export function validateBoardConfig(config: WorkflowConfig): string[] {
  const errors: string[] = [];

  if (!config.board) {
    errors.push('缺少看板配置');
    return errors;
  }

  if (!config.board.name) {
    errors.push('缺少看板名称');
  }

  if (!config.board.columns || config.board.columns.length === 0) {
    errors.push('缺少看板列配置');
  } else {
    // 验证每个列的映射
    for (const column of config.board.columns) {
      if (!column.name) {
        errors.push('看板列缺少名称');
      }
      if (!column.maps_to) {
        errors.push(`看板列 "${column.name}" 缺少标签映射`);
      } else {
        const prefixes = getLabelPrefixes(config);
        if (prefixes.status && !column.maps_to.startsWith(prefixes.status)) {
          errors.push(`看板列 "${column.name}" 的映射应该以 "${prefixes.status}" 开头`);
        }
      }
    }

    // 检查是否有 Backlog 列
    const prefixes = getLabelPrefixes(config);
    const backlogLabel = buildLabel(prefixes.status, 'backlog');
    const hasBacklog = config.board.columns.some(
      (col) => col.maps_to === backlogLabel || col.name.toLowerCase() === 'backlog'
    );
    if (!hasBacklog) {
      errors.push('建议添加 Backlog 列');
    }
  }

  return errors;
}

/**
 * 获取列排序（用于流转验证）
 */
export function getColumnOrder(config: WorkflowConfig): Map<string, number> {
  const order = new Map<string, number>();
  config.board.columns.forEach((col, index) => {
    order.set(col.name, index);
    order.set(col.maps_to, index);
  });
  return order;
}

/**
 * 检查状态流转是否合法
 */
export function isValidTransition(
  config: WorkflowConfig,
  fromStatus: string,
  toStatus: string
): boolean {
  const order = getColumnOrder(config);
  const fromIndex = order.get(fromStatus);
  const toIndex = order.get(toStatus);

  if (fromIndex === undefined || toIndex === undefined) {
    return true; // 未知状态，允许流转
  }

  // 允许向前或向后移动（不强制单向流转）
  return true;
}
