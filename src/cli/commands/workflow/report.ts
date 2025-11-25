/**
 * Workflow Report Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig } from '../../../utils/workflow-config.js';
import { createClient as createClientAsync, getContextFromConfig } from '../../utils/client.js';

export interface ReportOptions {
  owner?: string;
  repo?: string;
  timeRange?: 'day' | 'week' | 'month';
  json?: boolean;
}

interface ReportData {
  owner: string;
  repo: string;
  generatedAt: string;
  timeRange: string;
  summary: {
    totalOpen: number;
    totalClosed: number;
    healthScore: number;
  };
  distribution: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  };
  blockedIssues: Array<{
    number: number;
    title: string;
    ageHours: number;
  }>;
  recommendations: string[];
}

/**
 * 生成工作流分析报告
 */
export async function generateReport(options: ReportOptions): Promise<void> {
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
  const timeRange = options.timeRange || 'week';

  if (!owner || !repo) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Missing owner or repo' }, null, 2));
    } else {
      console.log(chalk.red('\n❌ 请提供仓库信息: --owner 和 --repo'));
    }
    return;
  }

  if (!options.json) {
    console.log(chalk.bold(`\n📊 工作流分析报告 - ${owner}/${repo}\n`));
    console.log(chalk.gray(`时间范围: ${timeRange}`));
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

  // 计算时间范围
  const now = Date.now();
  const rangeMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }[timeRange];

  const since = new Date(now - rangeMs).toISOString();

  try {
    // 获取开放的 Issues
    const openIssuesResponse = await client.repoListIssues(owner, repo, { state: 'open' });
    const openIssues = (openIssuesResponse.data || []) as Array<{
      number?: number;
      title?: string;
      labels?: Array<{ name?: string }>;
      created_at?: string;
      updated_at?: string;
    }>;

    // 获取关闭的 Issues
    const closedIssuesResponse = await client.repoListIssues(owner, repo, { state: 'closed' });
    const closedIssues = (closedIssuesResponse.data || []) as Array<{
      labels?: Array<{ name?: string }>;
      closed_at?: string;
    }>;

    // 过滤时间范围内关闭的 Issues
    const recentClosed = closedIssues.filter((issue) => {
      const closedAt = new Date(issue.closed_at || 0).getTime();
      return closedAt >= now - rangeMs;
    });

    // 统计分布
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const issue of openIssues) {
      const labels = (issue.labels || []).map((l) => l.name || '');

      // 统计状态
      const statusLabel = labels.find((l) => l.startsWith('status/'));
      const status = statusLabel ? statusLabel.replace('status/', '') : 'no-status';
      byStatus[status] = (byStatus[status] || 0) + 1;

      // 统计优先级
      const priorityLabel = labels.find((l) => l.startsWith('priority/'));
      const priority = priorityLabel ? priorityLabel.replace('priority/', '') : 'no-priority';
      byPriority[priority] = (byPriority[priority] || 0) + 1;

      // 统计类型
      const typeLabel = labels.find((l) => l.startsWith('type/'));
      const type = typeLabel ? typeLabel.replace('type/', '') : 'no-type';
      byType[type] = (byType[type] || 0) + 1;
    }

    // 检测阻塞 Issue
    const sla = config.automation.sla || { P0: 4, P1: 24, P2: 72, P3: 168 };
    const blockedIssues: Array<{ number: number; title: string; ageHours: number }> = [];

    for (const issue of openIssues) {
      const labels = (issue.labels || []).map((l) => l.name || '');
      const priorityLabel = labels.find((l) => l.startsWith('priority/'));
      const priority = priorityLabel?.replace('priority/', '').toUpperCase() || 'P3';
      const issueSla = sla[priority as keyof typeof sla] || sla.P3;

      const updatedAt = new Date(issue.updated_at || issue.created_at || now).getTime();
      const ageHours = Math.round((now - updatedAt) / (1000 * 60 * 60));

      if (ageHours > issueSla) {
        blockedIssues.push({
          number: issue.number || 0,
          title: issue.title || '',
          ageHours,
        });
      }
    }

    // 计算健康度
    let healthScore = 100;

    // 阻塞 Issue 扣分
    healthScore -= Math.min(30, blockedIssues.length * 5);

    // 无标签 Issue 扣分
    const noLabelRatio = (byStatus['no-status'] || 0) / Math.max(1, openIssues.length);
    healthScore -= Math.round(noLabelRatio * 20);

    // P0/P1 积压扣分
    const criticalCount = (byPriority['P0'] || 0) + (byPriority['P1'] || 0);
    healthScore -= Math.min(20, criticalCount * 3);

    healthScore = Math.max(0, healthScore);

    // 生成建议
    const recommendations: string[] = [];

    if (blockedIssues.length > 0) {
      recommendations.push(`有 ${blockedIssues.length} 个 Issue 超过 SLA，建议优先处理`);
    }
    if ((byStatus['no-status'] || 0) > 0) {
      recommendations.push(`有 ${byStatus['no-status']} 个 Issue 缺少状态标签，请添加状态标签`);
    }
    if ((byPriority['no-priority'] || 0) > 0) {
      recommendations.push(`有 ${byPriority['no-priority']} 个 Issue 缺少优先级标签，建议评估优先级`);
    }
    if (criticalCount > 5) {
      recommendations.push(`P0/P1 Issue 积压过多（${criticalCount}个），建议增加资源处理高优先级问题`);
    }
    if (recentClosed.length === 0) {
      recommendations.push(`${timeRange === 'day' ? '今天' : timeRange === 'week' ? '本周' : '本月'}没有关闭的 Issue，建议检查进度`);
    }

    if (recommendations.length === 0) {
      recommendations.push('工作流状态良好，继续保持！');
    }

    // 构建报告数据
    const report: ReportData = {
      owner,
      repo,
      generatedAt: new Date().toISOString(),
      timeRange,
      summary: {
        totalOpen: openIssues.length,
        totalClosed: recentClosed.length,
        healthScore,
      },
      distribution: {
        byStatus,
        byPriority,
        byType,
      },
      blockedIssues,
      recommendations,
    };

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    // 显示报告
    console.log(chalk.bold('\n📋 概览\n'));

    const scoreColor = healthScore >= 80 ? chalk.green : healthScore >= 60 ? chalk.yellow : chalk.red;
    console.log(`  健康度: ${scoreColor(healthScore + '%')}`);
    console.log(`  开放 Issue: ${openIssues.length}`);
    console.log(`  近期关闭: ${recentClosed.length}`);

    console.log(chalk.bold('\n📊 状态分布\n'));
    for (const [status, count] of Object.entries(byStatus)) {
      const bar = '█'.repeat(Math.min(20, Math.round(count / Math.max(1, openIssues.length) * 20)));
      console.log(`  ${status.padEnd(15)} ${bar} ${count}`);
    }

    console.log(chalk.bold('\n📊 优先级分布\n'));
    for (const [priority, count] of Object.entries(byPriority)) {
      const bar = '█'.repeat(Math.min(20, Math.round(count / Math.max(1, openIssues.length) * 20)));
      const color = priority === 'P0' ? chalk.red : priority === 'P1' ? chalk.yellow : chalk.gray;
      console.log(`  ${color(priority.padEnd(15))} ${bar} ${count}`);
    }

    if (blockedIssues.length > 0) {
      console.log(chalk.bold('\n🚨 阻塞 Issue\n'));
      for (const issue of blockedIssues.slice(0, 5)) {
        console.log(`  #${issue.number} ${issue.title} (${issue.ageHours}h)`);
      }
      if (blockedIssues.length > 5) {
        console.log(chalk.gray(`  ... 还有 ${blockedIssues.length - 5} 个`));
      }
    }

    console.log(chalk.bold('\n💡 建议\n'));
    for (const rec of recommendations) {
      console.log(`  • ${rec}`);
    }
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2));
    } else {
      console.log(chalk.red(`\n❌ 生成报告失败: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  if (!options.json) {
    console.log();
  }
}
