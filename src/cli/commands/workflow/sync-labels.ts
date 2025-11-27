/**
 * Workflow Sync Labels Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig, getAllLabels } from '../../../utils/workflow-config.js';
import { createClient as createClientAsync, getContextFromConfig } from '../../utils/client.js';

export interface SyncLabelsOptions {
  owner?: string;
  repo?: string;
  dryRun?: boolean;
}

/**
 * 同步标签系统
 */
export async function syncLabels(options: SyncLabelsOptions): Promise<void> {
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

  if (!owner || !repo) {
    console.log(chalk.red('\n❌ 请提供仓库信息: --owner 和 --repo'));
    return;
  }

  console.log(chalk.bold(`\n🏷️  同步标签到 ${owner}/${repo}\n`));

  if (options.dryRun) {
    console.log(chalk.yellow('⚠️  预览模式 - 不会执行实际变更\n'));
  }

  // 获取所有需要的标签
  const allLabels = getAllLabels(config);
  console.log(chalk.gray(`配置中定义了 ${allLabels.length} 个标签\n`));

  // 创建客户端
  const client = await createClientAsync({});
  if (!client) {
    console.log(chalk.red('\n❌ 无法创建 API 客户端，请检查配置'));
    return;
  }

  try {
    // 获取现有标签
    type LabelType = { id?: number; name?: string; color?: string; description?: string };
    const existingLabels = await client.get<LabelType[]>(`/repos/${owner}/${repo}/labels`);
    const existingLabelNames = new Set(existingLabels.map((l) => l.name));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const label of allLabels) {
      const fullName = label.name;
      const labelColor = label.config.color;
      const labelDescription = label.config.description;
      const exists = existingLabelNames.has(fullName);

      if (exists) {
        // 检查是否需要更新
        const existing = existingLabels.find((l) => l.name === fullName);
        const needsUpdate = existing && (
          existing.color !== labelColor ||
          existing.description !== labelDescription
        );

        if (needsUpdate && existing) {
          if (options.dryRun) {
            console.log(chalk.yellow(`  ~ ${fullName} (需要更新)`));
          } else {
            // 找到标签 ID
            const labelId = existing.id;
            if (labelId) {
              await client.patch(`/repos/${owner}/${repo}/labels/${labelId}`, {
                name: fullName,
                color: labelColor,
                description: labelDescription,
              });
              console.log(chalk.yellow(`  ~ ${fullName} (已更新)`));
            }
          }
          updated++;
        } else {
          console.log(chalk.gray(`  - ${fullName} (已存在)`));
          skipped++;
        }
      } else {
        if (options.dryRun) {
          console.log(chalk.green(`  + ${fullName} (将创建)`));
        } else {
          await client.post(`/repos/${owner}/${repo}/labels`, {
            name: fullName,
            color: labelColor,
            description: labelDescription,
          });
          console.log(chalk.green(`  + ${fullName} (已创建)`));
        }
        created++;
      }
    }

    // 显示统计
    console.log(chalk.bold('\n📊 同步结果:'));
    console.log(chalk.green(`  创建: ${created}`));
    console.log(chalk.yellow(`  更新: ${updated}`));
    console.log(chalk.gray(`  跳过: ${skipped}`));

    if (options.dryRun) {
      console.log(chalk.yellow('\n💡 使用 --no-dry-run 执行实际同步'));
    } else {
      console.log(chalk.green('\n✅ 标签同步完成！'));
    }
  } catch (error) {
    console.log(chalk.red(`\n❌ 同步失败: ${error instanceof Error ? error.message : String(error)}`));
  }

  console.log();
}
