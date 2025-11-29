/**
 * Workflow Check Issues Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig, getLabelPrefixes, matchLabel } from '../../../utils/workflow-config.js';
import { createClient as createClientAsync, getContextFromConfig } from '../../utils/client.js';

export interface CheckIssuesOptions {
  token?: string;
  server?: string;
  owner?: string;
  repo?: string;
  issue?: string;
  json?: boolean;
}

interface IssueCheckResult {
  number: number;
  title: string;
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
  }>;
}

/**
 * 检查 Issue 工作流一致性
 */
export async function checkIssues(options: CheckIssuesOptions): Promise<void> {
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
    console.log(chalk.bold(`\n🔍 检查 ${owner}/${repo} 的 Issue 工作流\n`));
  }

  // 创建客户端
  const client = await createClientAsync({
    token: options.token,
    server: options.server,
  });
  if (!client) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Cannot create API client' }, null, 2));
    } else {
      console.log(chalk.red('\n❌ 无法创建 API 客户端，请检查配置'));
    }
    return;
  }

  try {
    // 获取 Issues
    type IssueType = { number?: number; title?: string; labels?: Array<{ name?: string }> };
    let issues: IssueType[];

    if (options.issue) {
      const issue = await client.get<IssueType>(`/repos/${owner}/${repo}/issues/${options.issue}`);
      issues = [issue];
    } else {
      issues = await client.get<IssueType[]>(`/repos/${owner}/${repo}/issues`, { state: 'open' });
    }

    if (!options.json) {
      console.log(chalk.gray(`检查 ${issues.length} 个 Issue\n`));
    }

    const results: IssueCheckResult[] = [];

    // 定义标签前缀
  const prefixes = getLabelPrefixes(config);
  const statusPrefix = prefixes.status;
  const priorityPrefix = prefixes.priority;
  const typePrefix = prefixes.type;

    for (const issue of issues) {
      const labels = (issue.labels || []).map((l) => l.name || '');
      const checkResult: IssueCheckResult = {
        number: issue.number || 0,
        title: issue.title || '',
        score: 100,
        issues: [],
      };

      // 检查状态标签
      const statusLabels = labels.filter((l) => matchLabel(statusPrefix, l) !== null);
      if (statusLabels.length === 0) {
        checkResult.issues.push({
          type: 'warning',
          message: `缺少状态标签 (${statusPrefix || '状态标签'})`,
        });
        checkResult.score -= 15;
      } else if (statusLabels.length > 1) {
        checkResult.issues.push({
          type: 'error',
          message: `状态标签冲突: ${statusLabels.join(', ')}`,
        });
        checkResult.score -= 25;
      }

      // 检查优先级标签
      const priorityLabels = labels.filter((l) => matchLabel(priorityPrefix, l) !== null);
      if (priorityLabels.length === 0) {
        checkResult.issues.push({
          type: 'warning',
          message: `缺少优先级标签 (${priorityPrefix || '优先级标签'})`,
        });
        checkResult.score -= 10;
      } else if (priorityLabels.length > 1) {
        checkResult.issues.push({
          type: 'error',
          message: `优先级标签冲突: ${priorityLabels.join(', ')}`,
        });
        checkResult.score -= 25;
      }

      // 检查类型标签
      const typeLabels = labels.filter((l) => matchLabel(typePrefix, l) !== null);
      if (typeLabels.length === 0) {
        checkResult.issues.push({
          type: 'info',
          message: `缺少类型标签 (${typePrefix || '类型标签'})`,
        });
        checkResult.score -= 5;
      }

      // 确保分数不为负
      checkResult.score = Math.max(0, checkResult.score);

      results.push(checkResult);
    }

    if (options.json) {
      const avgScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 100;

      console.log(JSON.stringify({
        owner,
        repo,
        totalIssues: results.length,
        averageScore: avgScore,
        issues: results,
      }, null, 2));
    } else {
      // 显示结果
      for (const result of results) {
        const scoreColor = result.score >= 80 ? chalk.green : result.score >= 60 ? chalk.yellow : chalk.red;

        console.log(`#${result.number} ${result.title}`);
        console.log(`  健康度: ${scoreColor(result.score + '%')}`);

        if (result.issues.length === 0) {
          console.log(chalk.green('  ✓ 所有检查通过'));
        } else {
          for (const issue of result.issues) {
            const icon = issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : 'ℹ';
            const color = issue.type === 'error' ? chalk.red : issue.type === 'warning' ? chalk.yellow : chalk.blue;
            console.log(color(`  ${icon} ${issue.message}`));
          }
        }
        console.log();
      }

      // 显示总结
      const avgScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 100;

      console.log(chalk.bold('📊 检查总结:'));
      console.log(chalk.gray(`  Issue 数量: ${results.length}`));
      console.log(chalk.gray(`  平均健康度: ${avgScore}%`));

      const errorCount = results.filter((r) => r.issues.some((i) => i.type === 'error')).length;
      const warningCount = results.filter((r) => r.issues.some((i) => i.type === 'warning')).length;

      if (errorCount > 0) {
        console.log(chalk.red(`  错误: ${errorCount} 个 Issue`));
      }
      if (warningCount > 0) {
        console.log(chalk.yellow(`  警告: ${warningCount} 个 Issue`));
      }
    }
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2));
    } else {
      console.log(chalk.red(`\n❌ 检查失败: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  if (!options.json) {
    console.log();
  }
}
