/**
 * Label Inference Engine
 * 标签推断引擎 - 基于 Issue 内容智能推断标签
 */

import type { WorkflowConfig } from './workflow-config.js';
import { DEFAULT_LABEL_PREFIXES, getLabelPrefixes, matchLabel } from './workflow-config.js';

// ============ 类型定义 ============

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: Array<{ id: number; name: string }>;
  created_at: string;
  updated_at: string;
  comments?: number;
}

export interface InferenceResult<T> {
  value: T;
  confidence: number;
  reason: string;
}

export interface LabelInferenceResult {
  type: InferenceResult<string> | null;
  priority: InferenceResult<string> | null;
  areas: InferenceResult<string>[];
  all: Array<{ label: string; confidence: number; reason: string }>;
}

// ============ 推断引擎 ============

/**
 * 标签推断引擎
 */
export class LabelInferenceEngine {
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  /**
   * 对 Issue 进行完整的标签推断
   */
  inferAll(issue: Issue): LabelInferenceResult {
    const typeResult = this.inferType(issue);
    const priorityResult = this.inferPriority(issue, typeResult?.value);
    const areaResults = this.inferAreas(issue);

    // 收集所有推断结果
    const all: Array<{ label: string; confidence: number; reason: string }> = [];

    const prefixes = getLabelPrefixes(this.config);

    if (typeResult && typeResult.confidence >= this.getConfidenceThreshold()) {
      all.push({
        label: `${prefixes.type}${typeResult.value}`,
        confidence: typeResult.confidence,
        reason: typeResult.reason,
      });
    }

    if (priorityResult && priorityResult.confidence >= this.getConfidenceThreshold()) {
      all.push({
        label: `${prefixes.priority}${priorityResult.value}`,
        confidence: priorityResult.confidence,
        reason: priorityResult.reason,
      });
    }

    for (const area of areaResults) {
      if (area.confidence >= this.getConfidenceThreshold()) {
        all.push({
          label: `${prefixes.area}${area.value}`,
          confidence: area.confidence,
          reason: area.reason,
        });
      }
    }

    return {
      type: typeResult,
      priority: priorityResult,
      areas: areaResults,
      all,
    };
  }

  /**
   * 推断 Issue 类型
   */
  inferType(issue: Issue): InferenceResult<string> | null {
    const text = this.normalizeText(issue.title + ' ' + issue.body);
    const keywords = this.config.automation.label_inference.type_keywords;

    let bestMatch: InferenceResult<string> | null = null;
    let maxScore = 0;

    for (const [type, typeKeywords] of Object.entries(keywords)) {
      const { score, matchedKeywords } = this.calculateKeywordScore(text, typeKeywords);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = {
          value: type,
          confidence: Math.min(score, 1.0),
          reason: `匹配关键词: ${matchedKeywords.join(', ')}`,
        };
      }
    }

    // 如果没有匹配到，尝试从标题前缀推断
    if (!bestMatch || maxScore < 0.3) {
      const prefixMatch = this.inferTypeFromPrefix(issue.title);
      if (prefixMatch) {
        return prefixMatch;
      }
    }

    return bestMatch;
  }

  /**
   * 推断 Issue 优先级
   */
  inferPriority(issue: Issue, inferredType?: string): InferenceResult<string> | null {
    const text = this.normalizeText(issue.title + ' ' + issue.body);
    const keywords = this.config.automation.label_inference.priority_keywords;

    // 安全问题强制 P0
    if (inferredType === 'security') {
      return {
        value: 'P0',
        confidence: 1.0,
        reason: '安全问题自动标记为紧急',
      };
    }

    // 根据关键词匹配
    for (const [priority, priorityKeywords] of Object.entries(keywords)) {
      const { score, matchedKeywords } = this.calculateKeywordScore(text, priorityKeywords);

      if (score >= 0.3) {
        return {
          value: priority,
          confidence: Math.min(score + 0.2, 1.0),
          reason: `匹配关键词: ${matchedKeywords.join(', ')}`,
        };
      }
    }

    // 默认优先级
    const defaultPriority = this.config.automation.new_issue_defaults.default_priority;
    return {
      value: defaultPriority,
      confidence: 0.5,
      reason: '使用默认优先级',
    };
  }

  /**
   * 推断领域标签
   */
  inferAreas(issue: Issue): InferenceResult<string>[] {
    const results: InferenceResult<string>[] = [];
    const text = this.normalizeText(issue.title + ' ' + issue.body);
    const patterns = this.config.automation.label_inference.area_patterns;

    if (!patterns) {
      return results;
    }

    for (const [area, areaPatterns] of Object.entries(patterns)) {
      for (const pattern of areaPatterns) {
        if (text.includes(pattern.toLowerCase())) {
          results.push({
            value: area,
            confidence: 0.8,
            reason: `匹配路径模式: ${pattern}`,
          });
          break; // 每个领域只匹配一次
        }
      }
    }

    // 根据关键词推断领域
    const areaKeywords: Record<string, string[]> = {
      api: ['api', 'endpoint', '接口', 'rest', 'graphql', 'grpc'],
      database: ['database', 'db', '数据库', 'sql', 'migration', 'model', '模型'],
      auth: ['auth', 'authentication', 'authorization', '认证', '授权', 'login', 'token', 'jwt'],
      ui: ['ui', 'component', '组件', 'button', 'form', 'modal', '界面'],
      performance: ['performance', '性能', 'slow', '慢', 'optimize', '优化', 'memory', 'cpu'],
    };

    for (const [area, keywords] of Object.entries(areaKeywords)) {
      // 只推断配置中存在的领域
      if (!this.config.labels.area || !this.config.labels.area[area]) {
        continue;
      }

      const { score, matchedKeywords } = this.calculateKeywordScore(text, keywords);
      if (score >= 0.3 && !results.some((r) => r.value === area)) {
        results.push({
          value: area,
          confidence: score,
          reason: `匹配关键词: ${matchedKeywords.join(', ')}`,
        });
      }
    }

    return results;
  }

  /**
   * 检查 Issue 是否缺少必要标签
   */
  checkMissingLabels(issue: Issue): string[] {
    const missing: string[] = [];
    const existingLabels = issue.labels.map((l) => l.name);
    const prefixes = getLabelPrefixes(this.config);

    // 检查类型标签
    const hasTypeLabel = existingLabels.some((l) => matchLabel(prefixes.type, l) !== null);
    if (this.config.automation.new_issue_defaults.require_type_label && !hasTypeLabel) {
      missing.push('type');
    }

    // 检查优先级标签
    const hasPriorityLabel = existingLabels.some((l) => matchLabel(prefixes.priority, l) !== null);
    if (this.config.automation.new_issue_defaults.require_priority_label && !hasPriorityLabel) {
      missing.push('priority');
    }

    // 检查状态标签
    const hasStatusLabel = existingLabels.some((l) => matchLabel(prefixes.status, l) !== null);
    if (!hasStatusLabel) {
      missing.push('status');
    }

    return missing;
  }

  /**
   * 获取推荐添加的标签
   */
  getRecommendedLabels(issue: Issue): Array<{ label: string; confidence: number; reason: string }> {
    const existingLabels = new Set(issue.labels.map((l) => l.name));
    const inference = this.inferAll(issue);

    return inference.all.filter((item) => !existingLabels.has(item.label));
  }

  // ============ 私有方法 ============

  private normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  private getConfidenceThreshold(): number {
    return this.config.automation.label_inference.confidence_threshold;
  }

  private calculateKeywordScore(
    text: string,
    keywords: string[]
  ): { score: number; matchedKeywords: string[] } {
    const matchedKeywords: string[] = [];
    let matchCount = 0;

    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      // 使用词边界匹配，避免部分匹配
      const regex = new RegExp(`\\b${this.escapeRegex(normalizedKeyword)}\\b|${this.escapeRegex(normalizedKeyword)}`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matchCount += matches.length;
        matchedKeywords.push(keyword);
      }
    }

    // 计算分数：匹配数量 / 关键词数量，加权处理
    const baseScore = matchedKeywords.length / keywords.length;
    const bonusScore = Math.min(matchCount * 0.1, 0.3); // 多次匹配加分

    return {
      score: Math.min(baseScore + bonusScore, 1.0),
      matchedKeywords,
    };
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private inferTypeFromPrefix(title: string): InferenceResult<string> | null {
    const prefixPatterns: Array<{ pattern: RegExp; type: string }> = [
      { pattern: /^(fix|bug|修复|修正)[\s:：]/i, type: 'bug' },
      { pattern: /^(feat|feature|新增|添加|实现)[\s:：]/i, type: 'feature' },
      { pattern: /^(docs|文档|doc)[\s:：]/i, type: 'docs' },
      { pattern: /^(refactor|重构)[\s:：]/i, type: 'refactor' },
      { pattern: /^(test|测试)[\s:：]/i, type: 'test' },
      { pattern: /^(security|安全)[\s:：]/i, type: 'security' },
      { pattern: /^(chore|杂项)[\s:：]/i, type: 'refactor' },
      { pattern: /^(perf|性能)[\s:：]/i, type: 'refactor' },
    ];

    for (const { pattern, type } of prefixPatterns) {
      if (pattern.test(title)) {
        return {
          value: type,
          confidence: 0.9,
          reason: `标题前缀匹配: ${pattern.source}`,
        };
      }
    }

    return null;
  }
}

// ============ 辅助函数 ============

/**
 * 计算 Issue 年龄（天数）
 */
export function calculateIssueAgeDays(issue: Issue): number {
  const created = new Date(issue.created_at);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 计算距离上次更新的小时数
 */
export function calculateHoursSinceUpdate(issue: Issue): number {
  const updated = new Date(issue.updated_at);
  const now = new Date();
  return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60));
}

/**
 * 获取 Issue 的优先级标签
 */
export function getIssuePriority(issue: Issue, prefixes = DEFAULT_LABEL_PREFIXES): string | null {
  const priorityLabel = issue.labels.find((l) => matchLabel(prefixes.priority, l.name) !== null);
  return priorityLabel ? matchLabel(prefixes.priority, priorityLabel.name) : null;
}

/**
 * 获取 Issue 的类型标签
 */
export function getIssueType(issue: Issue, prefixes = DEFAULT_LABEL_PREFIXES): string | null {
  const typeLabel = issue.labels.find((l) => matchLabel(prefixes.type, l.name) !== null);
  return typeLabel ? matchLabel(prefixes.type, typeLabel.name) : null;
}

/**
 * 获取 Issue 的状态标签
 */
export function getIssueStatus(issue: Issue, prefixes = DEFAULT_LABEL_PREFIXES): string | null {
  const statusLabel = issue.labels.find((l) => matchLabel(prefixes.status, l.name) !== null);
  return statusLabel ? matchLabel(prefixes.status, statusLabel.name) : null;
}

/**
 * 检查 Issue 是否有特定标签
 */
export function hasLabel(issue: Issue, labelName: string): boolean {
  return issue.labels.some((l) => l.name === labelName);
}
