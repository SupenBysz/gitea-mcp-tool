/**
 * Workflow Infer Labels Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig } from '../../../utils/workflow-config.js';
import { LabelInferenceEngine } from '../../../utils/label-inference.js';
import { createClient as createClientAsync, getContextFromConfig } from '../../utils/client.js';

export interface InferLabelsOptions {
  token?: string;
  server?: string;
  issue: string;
  owner?: string;
  repo?: string;
  autoApply?: boolean;
}

/**
 * 智能推断 Issue 标签
 */
export async function inferLabels(options: InferLabelsOptions): Promise<void> {
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

  const config = parseResult.config;

  // 获取上下文
  const context = getContextFromConfig();
  const owner = options.owner || context.owner;
  const repo = options.repo || context.repo;
  const issueNumber = parseInt(options.issue);

  if (!owner || !repo) {
    console.log(chalk.red('\n❌ 请提供仓库信息: --owner 和 --repo'));
    return;
  }

  if (isNaN(issueNumber)) {
    console.log(chalk.red('\n❌ 无效的 Issue 编号'));
    return;
  }

  console.log(chalk.bold(`\n🤖 智能标签推断 - ${owner}/${repo}#${issueNumber}\n`));

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
    // 定义 Issue 类型
    type IssueType = {
      number?: number;
      title?: string;
      body?: string;
      labels?: Array<{ id?: number; name?: string }>;
    };

    // 获取 Issue 详情
    const issue = await client.get<IssueType>(`/repos/${owner}/${repo}/issues/${issueNumber}`);

    console.log(chalk.gray(`标题: ${issue.title}`));
    console.log();

    // 创建推断引擎
    const engine = new LabelInferenceEngine(config);

    // 推断标签
    const inferResult = engine.inferAll({
      id: issue.number || 0,
      number: issue.number || 0,
      title: issue.title || '',
      body: issue.body || '',
      labels: (issue.labels || []).map((l) => ({ id: l.id || 0, name: l.name || '' })),
      created_at: '',
      updated_at: '',
    });

    // 显示推断结果 - 使用 inferResult.all 获取带前缀的标签
    console.log(chalk.bold('📋 推断结果:\n'));

    if (inferResult.all.length === 0) {
      console.log(chalk.yellow('未能推断出任何标签'));
      return;
    }

    for (const item of inferResult.all) {
      const confidence = Math.round(item.confidence * 100);
      const confidenceColor = confidence >= 80 ? chalk.green : confidence >= 60 ? chalk.yellow : chalk.gray;

      console.log(`${chalk.cyan(item.label)}`);
      console.log(`  置信度: ${confidenceColor(confidence + '%')}`);
      console.log(`  原因: ${chalk.gray(item.reason)}`);
      console.log();
    }

    // 检查现有标签 - 使用带前缀的标签名
    const existingLabels = (issue.labels || []).map((l) => l.name || '');
    const labelsToAdd = inferResult.all.map((item) => item.label);
    const newLabels = labelsToAdd.filter((l) => !existingLabels.includes(l));

    if (newLabels.length === 0) {
      console.log(chalk.green('✓ 推断的标签已存在，无需更新'));
      return;
    }

    console.log(chalk.bold('🏷️  将添加以下标签:\n'));
    for (const label of newLabels) {
      console.log(chalk.green(`  + ${label}`));
    }
    console.log();

    // 自动应用标签
    if (options.autoApply) {
      console.log(chalk.gray('正在应用标签...'));

      // 获取仓库所有标签以找到 ID
      type LabelType = { id?: number; name?: string };
      const repoLabels = await client.get<LabelType[]>(`/repos/${owner}/${repo}/labels`);

      const labelIds: number[] = [];
      for (const labelName of newLabels) {
        const found = repoLabels.find((l) => l.name === labelName);
        if (found && found.id) {
          labelIds.push(found.id);
        } else {
          console.log(chalk.yellow(`  ⚠ 标签 "${labelName}" 不存在，请先运行 sync-labels`));
        }
      }

      if (labelIds.length > 0) {
        // 添加到现有标签
        const existingIds = (issue.labels || [])
          .map((l) => l.id)
          .filter((id): id is number => id !== undefined);

        await client.put(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
          labels: [...existingIds, ...labelIds],
        });

        console.log(chalk.green('\n✅ 标签已应用！'));
      }
    } else {
      console.log(chalk.yellow('💡 使用 --auto-apply 自动应用推断的标签'));
    }
  } catch (error) {
    console.log(chalk.red(`\n❌ 推断失败: ${error instanceof Error ? error.message : String(error)}`));
  }

  console.log();
}
