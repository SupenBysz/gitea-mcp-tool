/**
 * Workflow Escalate Priority Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig } from '../../../utils/workflow-config.js';
import { createClient as createClientAsync, getContextFromConfig } from '../../utils/client.js';

export interface EscalateOptions {
  token?: string;
  server?: string;
  owner?: string;
  repo?: string;
  dryRun?: boolean;
}

interface EscalationResult {
  number: number;
  title: string;
  oldPriority: string;
  newPriority: string;
  reason: string;
}

// 优先级升级规则
const ESCALATION_RULES = {
  'P3': { nextPriority: 'P2', afterDays: 30 },
  'P2': { nextPriority: 'P1', afterDays: 14 },
  'P1': { nextPriority: 'P0', afterDays: 3 },
};

/**
 * 自动升级超时 Issue 的优先级
 */
export async function escalatePriority(options: EscalateOptions): Promise<void> {
  const configPath = path.join(process.cwd(), '.gitea', 'issue-workflow.yaml');

  if (!fs.existsSync(configPath)) {
    console.log(chalk.red(`\n❌ 未找到工作流配置文件: ${configPath}`));
    console.log(chalk.yellow('\n💡 提示: 运行 `keactl workflow init` 初始化配置'));
    return;
  }

  // 读取并解析配置
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const parseResult = parseConfig(configContent);

  if (!parseResult.success || !parseResult.config) {
    console.log(chalk.red('\n❌ 配置文件解析失败'));
    return;
  }

  // 获取上下文
  const context = getContextFromConfig();
  const owner = options.owner || context.owner;
  const repo = options.repo || context.repo;

  if (!owner || !repo) {
    console.log(chalk.red('\n❌ 请提供仓库信息: --owner 和 --repo'));
    return;
  }

  console.log(chalk.bold(`\n📈 优先级升级检查 - ${owner}/${repo}\n`));

  if (options.dryRun) {
    console.log(chalk.yellow('⚠️  预览模式 - 不会执行实际变更\n'));
  }

  // 创建客户端
  const client = await createClientAsync({
    token: options.token,
    server: options.server,
  });
  if (!client) {
    console.log(chalk.red('\n❌ 无法创建 API 客户端，请检查配置'));
    return;
  }

  try {
    // 获取开放的 Issues
    const issuesResponse = await client.repoListIssues(owner, repo, { state: 'open' });
    const issues = (issuesResponse.data || []) as Array<{
      number?: number;
      title?: string;
      body?: string;
      labels?: Array<{ id?: number; name?: string }>;
      created_at?: string;
    }>;

    // 获取仓库所有标签
    const labelsResponse = await client.repoListLabels(owner, repo);
    const repoLabels = (labelsResponse.data || []) as Array<{ id?: number; name?: string }>;

    const now = Date.now();
    const results: EscalationResult[] = [];

    console.log(chalk.gray(`检查 ${issues.length} 个 Issue\n`));

    for (const issue of issues) {
      const labels = (issue.labels || []).map((l) => l.name || '');

      // 检查是否是安全相关 Issue
      const isSecurityIssue = labels.includes('type/security') ||
        /security|vulnerability|cve|漏洞|安全/i.test(issue.title || '') ||
        /security|vulnerability|cve|漏洞|安全/i.test(issue.body || '');

      // 安全 Issue 直接升级到 P0
      if (isSecurityIssue && !labels.includes('priority/P0')) {
        const oldPriority = labels.find((l) => l.startsWith('priority/'))?.replace('priority/', '') || '无';

        results.push({
          number: issue.number || 0,
          title: issue.title || '',
          oldPriority,
          newPriority: 'P0',
          reason: '安全相关 Issue 自动升级为 P0',
        });

        if (!options.dryRun) {
          await updatePriority(client, owner, repo, issue, repoLabels, 'priority/P0');
        }
        continue;
      }

      // 获取当前优先级
      const priorityLabel = labels.find((l) => l.startsWith('priority/'));
      if (!priorityLabel) continue;

      const currentPriority = priorityLabel.replace('priority/', '') as keyof typeof ESCALATION_RULES;
      const rule = ESCALATION_RULES[currentPriority];
      if (!rule) continue; // P0 没有升级规则

      // 计算 Issue 年龄
      const createdAt = new Date(issue.created_at || now).getTime();
      const ageDays = Math.round((now - createdAt) / (1000 * 60 * 60 * 24));

      // 检查是否需要升级
      if (ageDays >= rule.afterDays) {
        results.push({
          number: issue.number || 0,
          title: issue.title || '',
          oldPriority: currentPriority,
          newPriority: rule.nextPriority,
          reason: `超过 ${rule.afterDays} 天未解决`,
        });

        if (!options.dryRun) {
          await updatePriority(client, owner, repo, issue, repoLabels, `priority/${rule.nextPriority}`);
        }
      }
    }

    // 显示结果
    if (results.length === 0) {
      console.log(chalk.green('✓ 没有需要升级的 Issue\n'));
      return;
    }

    console.log(chalk.bold(`📋 ${options.dryRun ? '将升级' : '已升级'} ${results.length} 个 Issue:\n`));

    for (const result of results) {
      console.log(`  #${result.number} ${result.title}`);
      console.log(`    ${chalk.yellow(result.oldPriority)} → ${chalk.red(result.newPriority)}`);
      console.log(`    原因: ${chalk.gray(result.reason)}`);
      console.log();
    }

    if (options.dryRun) {
      console.log(chalk.yellow('💡 移除 --dry-run 执行实际升级'));
    } else {
      console.log(chalk.green('✅ 优先级升级完成！'));
    }
  } catch (error) {
    console.log(chalk.red(`\n❌ 升级失败: ${error instanceof Error ? error.message : String(error)}`));
  }

  console.log();
}

/**
 * 更新 Issue 优先级
 */
async function updatePriority(
  client: ReturnType<typeof createClient>,
  owner: string,
  repo: string,
  issue: { number?: number; labels?: Array<{ id?: number; name?: string }> },
  repoLabels: Array<{ id?: number; name?: string }>,
  newPriorityLabel: string
): Promise<void> {
  if (!client) return;

  // 移除旧的优先级标签，添加新的
  const existingLabels = (issue.labels || [])
    .filter((l) => !l.name?.startsWith('priority/'))
    .map((l) => l.id)
    .filter((id): id is number => id !== undefined);

  // 找到新优先级标签的 ID
  const newLabel = repoLabels.find((l) => l.name === newPriorityLabel);
  if (newLabel && newLabel.id) {
    existingLabels.push(newLabel.id);
  }

  await client.repoReplaceIssueLabels(owner, repo, issue.number || 0, {
    labels: existingLabels,
  });
}
