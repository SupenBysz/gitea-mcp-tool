/**
 * Workflow Check Blocked Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig } from '../../../utils/workflow-config.js';
import { createClient as createClientAsync, getContextFromConfig } from '../../utils/client.js';

export interface CheckBlockedOptions {
  owner?: string;
  repo?: string;
  threshold?: string;
  json?: boolean;
}

interface BlockedIssue {
  number: number;
  title: string;
  priority: string | null;
  ageHours: number;
  slaHours: number;
  exceededBy: number;
  status: 'blocked' | 'warning' | 'ok';
}

/**
 * 检测阻塞的 Issue
 */
export async function checkBlocked(options: CheckBlockedOptions): Promise<void> {
  const configPath = path.join(process.cwd(), '.gitea', 'issue-workflow.yaml');

  if (!fs.existsSync(configPath)) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Config file not found' }, null, 2));
    } else {
      console.log(chalk.red(`\n❌ 未找到工作流配置文件: ${configPath}`));
      console.log(chalk.yellow('\n💡 提示: 运行 `keactl workflow init` 初始化配置'));
    }
    return;
  }

  // 读取并解析配置
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const parseResult = parseConfig(configContent);

  if (!parseResult.success || !parseResult.config) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Config parse error' }, null, 2));
    } else {
      console.log(chalk.red('\n❌ 配置文件解析失败'));
    }
    return;
  }

  const config = parseResult.config;

  // 获取上下文
  const context = getContextFromConfig();
  const owner = options.owner || context.owner;
  const repo = options.repo || context.repo;

  if (!owner || !repo) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Missing owner or repo' }, null, 2));
    } else {
      console.log(chalk.red('\n❌ 请提供仓库信息: --owner 和 --repo'));
    }
    return;
  }

  if (!options.json) {
    console.log(chalk.bold(`\n🚨 检测阻塞 Issue - ${owner}/${repo}\n`));
  }

  // 创建客户端
  const client = await createClientAsync({});
  if (!client) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Cannot create API client' }, null, 2));
    } else {
      console.log(chalk.red('\n❌ 无法创建 API 客户端，请检查配置'));
    }
    return;
  }

  // SLA 配置 - 从 priority labels 的 sla_hours 获取
  const sla: Record<string, number> = {
    P0: config.labels.priority['P0']?.sla_hours || 4,
    P1: config.labels.priority['P1']?.sla_hours || 24,
    P2: config.labels.priority['P2']?.sla_hours || 72,
    P3: config.labels.priority['P3']?.sla_hours || 168,
  };

  const thresholdHours = options.threshold ? parseInt(options.threshold) : undefined;

  try {
    // 获取开放的 Issues
    const issues = await client.get<Array<{
      number?: number;
      title?: string;
      labels?: Array<{ name?: string }>;
      updated_at?: string;
      created_at?: string;
    }>>(`/repos/${owner}/${repo}/issues`, { state: 'open' });

    const now = Date.now();
    const results: BlockedIssue[] = [];

    for (const issue of issues) {
      const labels = (issue.labels || []).map((l) => l.name || '');

      // 获取优先级
      const priorityLabel = labels.find((l) => l.startsWith('priority/'));
      const priority = priorityLabel ? priorityLabel.replace('priority/', '').toUpperCase() : null;

      // 获取 SLA
      let issueSla: number;
      if (thresholdHours !== undefined) {
        issueSla = thresholdHours;
      } else if (priority && priority in sla) {
        issueSla = sla[priority as keyof typeof sla];
      } else {
        issueSla = sla.P3; // 默认使用 P3 的 SLA
      }

      // 计算 Issue 年龄（基于最后更新时间）
      const updatedAt = new Date(issue.updated_at || issue.created_at || now).getTime();
      const ageHours = Math.round((now - updatedAt) / (1000 * 60 * 60));

      // 检查是否超过 SLA
      const exceededBy = ageHours - issueSla;
      let status: 'blocked' | 'warning' | 'ok';

      if (exceededBy > 0) {
        status = 'blocked';
      } else if (exceededBy > -issueSla * 0.2) {
        // 接近 SLA 80%
        status = 'warning';
      } else {
        status = 'ok';
      }

      results.push({
        number: issue.number || 0,
        title: issue.title || '',
        priority,
        ageHours,
        slaHours: issueSla,
        exceededBy,
        status,
      });
    }

    // 排序：阻塞 > 警告 > 正常，按超时时间排序
    results.sort((a, b) => {
      const statusOrder = { blocked: 0, warning: 1, ok: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.exceededBy - a.exceededBy;
    });

    const blocked = results.filter((r) => r.status === 'blocked');
    const warning = results.filter((r) => r.status === 'warning');

    if (options.json) {
      console.log(JSON.stringify({
        owner,
        repo,
        totalIssues: results.length,
        blockedCount: blocked.length,
        warningCount: warning.length,
        sla,
        issues: results.filter((r) => r.status !== 'ok'),
      }, null, 2));
      return;
    }

    // 显示结果
    if (blocked.length === 0 && warning.length === 0) {
      console.log(chalk.green('✓ 没有检测到阻塞或即将超时的 Issue\n'));
      return;
    }

    if (blocked.length > 0) {
      console.log(chalk.red.bold(`🚨 阻塞 Issue (${blocked.length}):\n`));

      for (const issue of blocked) {
        const priorityStr = issue.priority ? chalk.cyan(`[${issue.priority}]`) : chalk.gray('[无优先级]');
        console.log(`  #${issue.number} ${issue.title}`);
        console.log(`    ${priorityStr} 超时 ${chalk.red(issue.exceededBy + 'h')} (年龄: ${issue.ageHours}h, SLA: ${issue.slaHours}h)`);
        console.log();
      }
    }

    if (warning.length > 0) {
      console.log(chalk.yellow.bold(`⚠️  即将超时 (${warning.length}):\n`));

      for (const issue of warning) {
        const priorityStr = issue.priority ? chalk.cyan(`[${issue.priority}]`) : chalk.gray('[无优先级]');
        const remaining = issue.slaHours - issue.ageHours;
        console.log(`  #${issue.number} ${issue.title}`);
        console.log(`    ${priorityStr} 剩余 ${chalk.yellow(remaining + 'h')} (年龄: ${issue.ageHours}h, SLA: ${issue.slaHours}h)`);
        console.log();
      }
    }

    // 显示 SLA 配置
    console.log(chalk.gray('SLA 配置:'));
    console.log(chalk.gray(`  P0 紧急: ${sla.P0}h | P1 高: ${sla.P1}h | P2 中: ${sla.P2}h | P3 低: ${sla.P3}h`));
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2));
    } else {
      console.log(chalk.red(`\n❌ 检测失败: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  if (!options.json) {
    console.log();
  }
}
