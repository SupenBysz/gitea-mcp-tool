/**
 * Workflow Status Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig, validateConfig, getAllLabels, getSLAHours, getLabelPrefixes } from '../../../utils/workflow-config.js';

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
      console.log(JSON.stringify({ error: 'Config parse error', details: parseResult.errors || [] }, null, 2));
    } else {
      console.log(chalk.red('\n❌ 配置文件解析失败:'));
      for (const error of parseResult.errors || []) {
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

  // 计算各类标签数量
  const statusCount = Object.keys(config.labels.status).length;
  const priorityCount = Object.keys(config.labels.priority).length;
  const typeCount = Object.keys(config.labels.type).length;
  const areaCount = Object.keys(config.labels.area || {}).length;
  const workflowCount = Object.keys(config.labels.workflow || {}).length;
  const prefixes = getLabelPrefixes(config);

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
          status: statusCount,
          priority: priorityCount,
          type: typeCount,
          area: areaCount,
          workflow: workflowCount,
        },
        prefixes,
      },
      board: {
        name: config.board.name,
        columns: config.board.columns.length,
      },
      automation: {
        labelInference: config.automation.label_inference.enabled,
        priorityEscalation: config.automation.priority_escalation.enabled,
        blockedDetection: config.automation.blocked_detection.enabled,
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
  console.log(chalk.gray(`  语言: ${config.project.language || '未指定'}`));

  // 标签统计
  console.log(chalk.bold('\n🏷️  标签配置'));
  const fmt = (p?: string) => (p && p.length > 0 ? p : '');
  console.log(chalk.gray(`  总计: ${allLabels.length} 个标签`));
  console.log(chalk.gray(`  前缀: status='${prefixes.status}', priority='${prefixes.priority}', type='${prefixes.type}', area='${prefixes.area}', workflow='${prefixes.workflow}'`));
  console.log(chalk.gray(`  - status (${fmt(prefixes.status)})   : ${statusCount} 个状态标签`));
  console.log(chalk.gray(`  - priority (${fmt(prefixes.priority)}) : ${priorityCount} 个优先级标签`));
  console.log(chalk.gray(`  - type (${fmt(prefixes.type)})     : ${typeCount} 个类型标签`));
  console.log(chalk.gray(`  - area (${fmt(prefixes.area)})     : ${areaCount} 个领域标签`));
  console.log(chalk.gray(`  - workflow (${fmt(prefixes.workflow)}) : ${workflowCount} 个工作流标签`));

  // 看板配置
  console.log(chalk.bold('\n📋 看板配置'));
  console.log(chalk.gray(`  名称: ${config.board.name}`));
  console.log(chalk.gray(`  列数: ${config.board.columns.length}`));
  for (const column of config.board.columns) {
    console.log(chalk.gray(`    - ${column.name} → ${column.maps_to}`));
  }

  // 自动化配置
  console.log(chalk.bold('\n🤖 自动化配置'));
  console.log(chalk.gray(`  智能标签推断: ${config.automation.label_inference.enabled ? chalk.green('已启用') : chalk.gray('已禁用')}`));
  console.log(chalk.gray(`  优先级自动升级: ${config.automation.priority_escalation.enabled ? chalk.green('已启用') : chalk.gray('已禁用')}`));
  console.log(chalk.gray(`  阻塞检测: ${config.automation.blocked_detection.enabled ? chalk.green('已启用') : chalk.gray('已禁用')}`));

  // SLA 配置 - 从优先级标签配置中获取
  const slaP0 = getSLAHours(config, 'P0');
  const slaP1 = getSLAHours(config, 'P1');
  const slaP2 = getSLAHours(config, 'P2');
  const slaP3 = getSLAHours(config, 'P3');
  if (slaP0 || slaP1 || slaP2 || slaP3) {
    console.log(chalk.bold('\n⏰ SLA 配置'));
    if (slaP0) console.log(chalk.gray(`  P0 紧急: ${slaP0}h`));
    if (slaP1) console.log(chalk.gray(`  P1 高: ${slaP1}h`));
    if (slaP2) console.log(chalk.gray(`  P2 中: ${slaP2}h`));
    if (slaP3) console.log(chalk.gray(`  P3 低: ${slaP3}h`));
  }

  console.log();
}
