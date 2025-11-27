/**
 * Workflow Configuration Parser
 * 工作流配置解析器
 */

import { parse as parseYAML, stringify as stringifyYAML } from 'yaml';

// ============ 类型定义 ============

export type ProjectType = 'backend' | 'frontend' | 'fullstack' | 'library';
export type SyncDirection = 'label-to-board' | 'board-to-label' | 'both';
export type ConflictResolution = 'board-wins' | 'label-wins';

export interface LabelConfig {
  color: string;
  description: string;
  sla_hours?: number;
}

export interface LabelsConfig {
  status: Record<string, LabelConfig>;
  priority: Record<string, LabelConfig>;
  type: Record<string, LabelConfig>;
  area?: Record<string, LabelConfig>;
  workflow?: Record<string, LabelConfig>;
  special?: Record<string, LabelConfig>;
}

export interface BoardColumn {
  name: string;
  maps_to: string; // e.g., "status/backlog"
}

export interface BoardConfig {
  name: string;
  columns: BoardColumn[];
}

export interface LabelInferenceConfig {
  enabled: boolean;
  confidence_threshold: number;
  type_keywords: Record<string, string[]>;
  priority_keywords: Record<string, string[]>;
  area_patterns?: Record<string, string[]>;
}

export interface EscalationRule {
  condition: string;
  action: string;
}

export interface PriorityEscalationConfig {
  enabled: boolean;
  rules: EscalationRule[];
}

export interface BlockedDetectionConfig {
  enabled: boolean;
  rules: EscalationRule[];
}

export interface StatusSyncConfig {
  enabled: boolean;
  direction: SyncDirection;
  conflict_resolution: ConflictResolution;
}

export interface NewIssueDefaultsConfig {
  auto_add_to_backlog: boolean;
  require_type_label: boolean;
  require_priority_label: boolean;
  default_priority: string;
}

export interface AutomationConfig {
  label_inference: LabelInferenceConfig;
  priority_escalation: PriorityEscalationConfig;
  blocked_detection: BlockedDetectionConfig;
  status_sync: StatusSyncConfig;
  new_issue_defaults: NewIssueDefaultsConfig;
}

export interface AgentAssignmentRule {
  condition: string;
  assign_to: string;
}

export interface AgentAssignmentConfig {
  enabled: boolean;
  rules: AgentAssignmentRule[];
}

export interface NotificationChannel {
  enabled: boolean;
  channels: string[];
  template: string;
}

export interface NotificationsConfig {
  blocked_issues: NotificationChannel;
  priority_escalation: NotificationChannel;
}

export interface ProjectConfig {
  name: string;
  type: ProjectType;
  repo: string;
  language?: string;
}

export interface WorkflowConfig {
  project: ProjectConfig;
  labels: LabelsConfig;
  board: BoardConfig;
  automation: AutomationConfig;
  agent_assignment?: AgentAssignmentConfig;
  notifications?: NotificationsConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============ 默认配置 ============

const DEFAULT_STATUS_LABELS: Record<string, LabelConfig> = {
  backlog: { color: 'ededed', description: '待处理' },
  'in-progress': { color: '0e8a16', description: '开发中' },
  review: { color: 'fbca04', description: '审查中' },
  testing: { color: '1d76db', description: '测试中' },
  done: { color: '0e8a16', description: '已完成' },
};

const DEFAULT_PRIORITY_LABELS: Record<string, LabelConfig> = {
  P0: { color: 'd93f0b', description: '紧急', sla_hours: 4 },
  P1: { color: 'e99695', description: '高', sla_hours: 24 },
  P2: { color: 'fbca04', description: '中', sla_hours: 168 },
  P3: { color: 'c5def5', description: '低' },
};

const DEFAULT_TYPE_LABELS: Record<string, LabelConfig> = {
  bug: { color: 'd73a4a', description: '缺陷修复' },
  feature: { color: '0e8a16', description: '新功能' },
  docs: { color: '0075ca', description: '文档' },
  refactor: { color: 'fbca04', description: '重构' },
  test: { color: '1d76db', description: '测试' },
  security: { color: 'd93f0b', description: '安全问题' },
};

const DEFAULT_WORKFLOW_LABELS: Record<string, LabelConfig> = {
  blocked: { color: 'd93f0b', description: '被阻塞' },
  'needs-info': { color: 'fbca04', description: '需要更多信息' },
  'needs-review': { color: '0075ca', description: '需要代码审查' },
  duplicate: { color: 'cccccc', description: '重复问题' },
};

const DEFAULT_SPECIAL_LABELS: Record<string, LabelConfig> = {
  'good-first-issue': { color: '7057ff', description: '适合新手' },
  'help-wanted': { color: '008672', description: '需要帮助' },
  'breaking-change': { color: 'd93f0b', description: '破坏性变更' },
};

const AREA_LABELS_BY_TYPE: Record<ProjectType, Record<string, LabelConfig>> = {
  backend: {
    api: { color: 'c2e0c6', description: 'API 相关' },
    database: { color: 'f9d0c4', description: '数据库' },
    auth: { color: 'fef2c0', description: '认证授权' },
    performance: { color: 'e99695', description: '性能优化' },
  },
  frontend: {
    ui: { color: 'd4c5f9', description: 'UI 界面' },
    ux: { color: 'bfdadc', description: '用户体验' },
    performance: { color: 'e99695', description: '性能优化' },
    responsive: { color: 'c2e0c6', description: '响应式' },
  },
  fullstack: {
    api: { color: 'c2e0c6', description: 'API 相关' },
    ui: { color: 'd4c5f9', description: 'UI 界面' },
    database: { color: 'f9d0c4', description: '数据库' },
    auth: { color: 'fef2c0', description: '认证授权' },
  },
  library: {
    api: { color: 'c2e0c6', description: '公共API' },
    docs: { color: '0075ca', description: '文档' },
    examples: { color: '1d76db', description: '示例代码' },
    compatibility: { color: 'fbca04', description: '兼容性' },
  },
};

const DEFAULT_BOARD_COLUMNS: BoardColumn[] = [
  { name: 'Backlog', maps_to: 'status/backlog' },
  { name: 'In Progress', maps_to: 'status/in-progress' },
  { name: 'Review', maps_to: 'status/review' },
  { name: 'Testing', maps_to: 'status/testing' },
  { name: 'Done', maps_to: 'status/done' },
];

const DEFAULT_TYPE_KEYWORDS: Record<string, string[]> = {
  bug: ['bug', '错误', '崩溃', '异常', '报错', 'error', 'crash', 'fix', '修复'],
  feature: ['feature', '功能', '新增', '支持', 'add', 'implement', '实现'],
  security: ['安全', '漏洞', 'XSS', 'SQL注入', '认证绕过', 'security', 'vulnerability', 'CVE'],
  docs: ['文档', 'documentation', 'docs', 'readme', '说明'],
  refactor: ['重构', 'refactor', '优化', 'optimize', 'cleanup'],
  test: ['测试', 'test', 'spec', '用例'],
};

const DEFAULT_PRIORITY_KEYWORDS: Record<string, string[]> = {
  P0: ['紧急', '线上故障', '服务中断', 'urgent', 'critical', 'emergency', '严重'],
  P1: ['重要', '阻塞', 'important', 'blocker', 'high'],
};

const DEFAULT_ESCALATION_RULES: EscalationRule[] = [
  { condition: 'label:type/security', action: 'force_priority:P0' },
  { condition: 'label:priority/P3 AND age_days > 30', action: 'upgrade_to:P2' },
  { condition: 'label:priority/P2 AND age_days > 14', action: 'upgrade_to:P1' },
  { condition: 'label:priority/P1 AND age_days > 3', action: 'upgrade_to:P0' },
];

const DEFAULT_BLOCKED_RULES: EscalationRule[] = [
  { condition: 'label:priority/P0 AND no_update_hours > 4', action: 'add_label:workflow/blocked' },
  { condition: 'label:priority/P1 AND no_update_hours > 24', action: 'add_label:workflow/blocked' },
  { condition: 'label:workflow/needs-info AND no_update_hours > 48', action: 'add_label:workflow/blocked' },
];

// ============ 配置生成器 ============

/**
 * 生成默认工作流配置
 */
export function generateDefaultConfig(
  projectName: string,
  projectType: ProjectType,
  repo: string,
  language?: string
): WorkflowConfig {
  return {
    project: {
      name: projectName,
      type: projectType,
      repo,
      language,
    },
    labels: {
      status: DEFAULT_STATUS_LABELS,
      priority: DEFAULT_PRIORITY_LABELS,
      type: DEFAULT_TYPE_LABELS,
      area: AREA_LABELS_BY_TYPE[projectType],
      workflow: DEFAULT_WORKFLOW_LABELS,
      special: DEFAULT_SPECIAL_LABELS,
    },
    board: {
      name: 'Issue Workflow Board',
      columns: DEFAULT_BOARD_COLUMNS,
    },
    automation: {
      label_inference: {
        enabled: true,
        confidence_threshold: 0.7,
        type_keywords: DEFAULT_TYPE_KEYWORDS,
        priority_keywords: DEFAULT_PRIORITY_KEYWORDS,
      },
      priority_escalation: {
        enabled: true,
        rules: DEFAULT_ESCALATION_RULES,
      },
      blocked_detection: {
        enabled: true,
        rules: DEFAULT_BLOCKED_RULES,
      },
      status_sync: {
        enabled: true,
        direction: 'both',
        conflict_resolution: 'board-wins',
      },
      new_issue_defaults: {
        auto_add_to_backlog: true,
        require_type_label: true,
        require_priority_label: false,
        default_priority: 'P2',
      },
    },
    notifications: {
      blocked_issues: {
        enabled: true,
        channels: ['issue_comment'],
        template: '⚠️ 此 Issue 已超过 SLA 时间，请及时处理！',
      },
      priority_escalation: {
        enabled: true,
        channels: ['issue_comment'],
        template: '⬆️ 优先级已自动升级为 {new_priority}',
      },
    },
  };
}

// ============ 配置解析器 ============

export interface ParseResult {
  success: boolean;
  config?: WorkflowConfig;
  errors?: string[];
}

/**
 * 解析 YAML 配置文件内容
 */
export function parseConfig(yamlContent: string): ParseResult {
  try {
    const config = parseYAML(yamlContent) as WorkflowConfig;
    return { success: true, config };
  } catch (error: any) {
    return { success: false, errors: [error.message] };
  }
}

/**
 * 将配置对象序列化为 YAML
 */
export function serializeConfig(config: WorkflowConfig): string {
  return stringifyYAML(config, {
    indent: 2,
    lineWidth: 0,
  });
}

/**
 * 验证配置文件
 */
export function validateConfig(config: WorkflowConfig): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // 验证项目配置
  if (!config.project) {
    result.errors.push('缺少 project 配置');
    result.valid = false;
  } else {
    if (!config.project.name) {
      result.errors.push('缺少 project.name');
      result.valid = false;
    }
    if (!config.project.type) {
      result.errors.push('缺少 project.type');
      result.valid = false;
    } else if (!['backend', 'frontend', 'fullstack', 'library'].includes(config.project.type)) {
      result.errors.push(`无效的 project.type: ${config.project.type}`);
      result.valid = false;
    }
    if (!config.project.repo) {
      result.errors.push('缺少 project.repo');
      result.valid = false;
    }
  }

  // 验证标签配置
  if (!config.labels) {
    result.errors.push('缺少 labels 配置');
    result.valid = false;
  } else {
    if (!config.labels.status || Object.keys(config.labels.status).length === 0) {
      result.errors.push('缺少 labels.status 配置');
      result.valid = false;
    }
    if (!config.labels.priority || Object.keys(config.labels.priority).length === 0) {
      result.errors.push('缺少 labels.priority 配置');
      result.valid = false;
    }
    if (!config.labels.type || Object.keys(config.labels.type).length === 0) {
      result.errors.push('缺少 labels.type 配置');
      result.valid = false;
    }
    if (!config.labels.area) {
      result.warnings.push('未配置 labels.area，建议添加领域标签');
    }
    if (!config.labels.workflow) {
      result.warnings.push('未配置 labels.workflow，建议添加工作流标签');
    }
  }

  // 验证看板配置
  if (!config.board) {
    result.warnings.push('未配置 board，将使用默认看板设置');
  } else {
    if (!config.board.columns || config.board.columns.length === 0) {
      result.warnings.push('未配置 board.columns，将使用默认列设置');
    }
  }

  // 验证自动化配置
  if (!config.automation) {
    result.warnings.push('未配置 automation，自动化功能将被禁用');
  }

  return result;
}

/**
 * 合并配置（用于覆盖默认值）
 */
export function mergeConfig(base: WorkflowConfig, override: Partial<WorkflowConfig>): WorkflowConfig {
  return {
    project: { ...base.project, ...override.project },
    labels: {
      status: { ...base.labels.status, ...override.labels?.status },
      priority: { ...base.labels.priority, ...override.labels?.priority },
      type: { ...base.labels.type, ...override.labels?.type },
      area: { ...base.labels.area, ...override.labels?.area },
      workflow: { ...base.labels.workflow, ...override.labels?.workflow },
      special: { ...base.labels.special, ...override.labels?.special },
    },
    board: override.board || base.board,
    automation: {
      label_inference: { ...base.automation.label_inference, ...override.automation?.label_inference },
      priority_escalation: {
        ...base.automation.priority_escalation,
        ...override.automation?.priority_escalation,
      },
      blocked_detection: { ...base.automation.blocked_detection, ...override.automation?.blocked_detection },
      status_sync: { ...base.automation.status_sync, ...override.automation?.status_sync },
      new_issue_defaults: {
        ...base.automation.new_issue_defaults,
        ...override.automation?.new_issue_defaults,
      },
    },
    agent_assignment: override.agent_assignment || base.agent_assignment,
    notifications: override.notifications
      ? {
          blocked_issues: { ...base.notifications?.blocked_issues, ...override.notifications.blocked_issues },
          priority_escalation: {
            ...base.notifications?.priority_escalation,
            ...override.notifications.priority_escalation,
          },
        }
      : base.notifications,
  };
}

// ============ 辅助函数 ============

/**
 * 获取所有标签（扁平化）
 */
export function getAllLabels(config: WorkflowConfig): Array<{ category: string; name: string; config: LabelConfig }> {
  const labels: Array<{ category: string; name: string; config: LabelConfig }> = [];

  const categories: Array<{ key: keyof LabelsConfig; prefix: string }> = [
    { key: 'status', prefix: 'status' },
    { key: 'priority', prefix: 'priority' },
    { key: 'type', prefix: 'type' },
    { key: 'area', prefix: 'area' },
    { key: 'workflow', prefix: 'workflow' },
    { key: 'special', prefix: '' }, // special 标签不加前缀
  ];

  for (const { key, prefix } of categories) {
    const categoryLabels = config.labels[key];
    if (categoryLabels) {
      for (const [name, labelConfig] of Object.entries(categoryLabels)) {
        labels.push({
          category: key,
          name: prefix ? `${prefix}/${name}` : name,
          config: labelConfig,
        });
      }
    }
  }

  return labels;
}

/**
 * 根据标签名查找列映射
 */
export function findColumnByLabel(config: WorkflowConfig, labelName: string): BoardColumn | undefined {
  return config.board.columns.find((col) => col.maps_to === labelName);
}

/**
 * 根据列名查找标签映射
 */
export function findLabelByColumn(config: WorkflowConfig, columnName: string): string | undefined {
  const column = config.board.columns.find((col) => col.name === columnName);
  return column?.maps_to;
}

/**
 * 获取 SLA 时间（小时）
 */
export function getSLAHours(config: WorkflowConfig, priority: string): number | undefined {
  const priorityConfig = config.labels.priority[priority];
  return priorityConfig?.sla_hours;
}

/**
 * 导出项目类型列表
 */
export const PROJECT_TYPES: ProjectType[] = ['backend', 'frontend', 'fullstack', 'library'];

/**
 * 获取项目类型描述
 */
export function getProjectTypeDescription(type: ProjectType): string {
  const descriptions: Record<ProjectType, string> = {
    backend: '后端项目 - API、数据库、服务端逻辑',
    frontend: '前端项目 - UI、用户体验、响应式设计',
    fullstack: '全栈项目 - 前后端一体化',
    library: '库项目 - 公共API、文档、示例代码',
  };
  return descriptions[type];
}
