/**
 * Workflow Status Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig, validateConfig, getAllLabels } from '../../../utils/workflow-config.js';

export interface StatusOptions {
  owner?: string;
  repo?: string;
  json?: boolean;
}

/**
 * 显示工作流状态
 */
export async function showStatus(options: StatusOptions): Promise<void> {
  const configPath = path.join(process.cwd(), '.gitea', 'issue-workflow.yaml');

  if (!fs.existsSync(configPath)) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Config file not found', path: configPath }, null, 2));
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
      console.log(JSON.stringify({ error: 'Config parse error', details: parseResult.errors }, null, 2));
    } else {
      console.log(chalk.red('\n❌ 配置文件解析失败:'));
      for (const error of parseResult.errors) {
        console.log(chalk.red(`  - ${error}`));
      }
    }
    return;
  }

  const config = parseResult.config;

  // 验证配置
  const validation = validateConfig(config);

  // 获取所有标签
  const allLabels = getAllLabels(config);

  if (options.json) {
    const result = {
      configPath,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      project: config.project,
      labels: {
        total: allLabels.length,
        byCategory: {
          status: config.labels.status.length,
          priority: config.labels.priority.length,
          type: config.labels.type.length,
          area: config.labels.area.length,
          workflow: config.labels.workflow.length,
        },
      },
      board: {
        name: config.board.name,
        columns: config.board.columns.length,
      },
      automation: {
        autoLabeling: config.automation.autoLabeling,
        priorityEscalation: config.automation.priorityEscalation,
        blockingDetection: config.automation.blockingDetection,
      },
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // 显示配置状态
  console.log(chalk.bold('\n📊 工作流配置状态\n'));
  console.log(chalk.gray(`配置文件: ${configPath}`));

  // 验证状态
  if (validation.valid) {
    console.log(chalk.green('\n✓ 配置验证通过'));
  } else {
    console.log(chalk.red('\n✗ 配置验证失败'));
    for (const error of validation.errors) {
      console.log(chalk.red(`  - ${error}`));
    }
  }

  if (validation.warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  警告:'));
    for (const warning of validation.warnings) {
      console.log(chalk.yellow(`  - ${warning}`));
    }
  }

  // 项目信息
  console.log(chalk.bold('\n📦 项目信息'));
  console.log(chalk.gray(`  类型: ${config.project.type}`));
  console.log(chalk.gray(`  语言: ${config.project.language}`));

  // 标签统计
  console.log(chalk.bold('\n🏷️  标签配置'));
  console.log(chalk.gray(`  总计: ${allLabels.length} 个标签`));
  console.log(chalk.gray(`  - status/*   : ${config.labels.status.length} 个`));
  console.log(chalk.gray(`  - priority/* : ${config.labels.priority.length} 个`));
  console.log(chalk.gray(`  - type/*     : ${config.labels.type.length} 个`));
  console.log(chalk.gray(`  - area/*     : ${config.labels.area.length} 个`));
  console.log(chalk.gray(`  - workflow/* : ${config.labels.workflow.length} 个`));

  // 看板配置
  console.log(chalk.bold('\n📋 看板配置'));
  console.log(chalk.gray(`  名称: ${config.board.name}`));
  console.log(chalk.gray(`  列数: ${config.board.columns.length}`));
  for (const column of config.board.columns) {
    console.log(chalk.gray(`    - ${column.name} → ${column.mappedStatus}`));
  }

  // 自动化配置
  console.log(chalk.bold('\n🤖 自动化配置'));
  console.log(chalk.gray(`  智能标签推断: ${config.automation.autoLabeling ? chalk.green('已启用') : chalk.gray('已禁用')}`));
  console.log(chalk.gray(`  优先级自动升级: ${config.automation.priorityEscalation ? chalk.green('已启用') : chalk.gray('已禁用')}`));
  console.log(chalk.gray(`  阻塞检测: ${config.automation.blockingDetection ? chalk.green('已启用') : chalk.gray('已禁用')}`));

  // SLA 配置
  if (config.automation.sla) {
    console.log(chalk.bold('\n⏰ SLA 配置'));
    console.log(chalk.gray(`  P0 紧急: ${config.automation.sla.P0}h`));
    console.log(chalk.gray(`  P1 高: ${config.automation.sla.P1}h`));
    console.log(chalk.gray(`  P2 中: ${config.automation.sla.P2}h`));
    console.log(chalk.gray(`  P3 低: ${config.automation.sla.P3}h`));
  }

  console.log();
}
