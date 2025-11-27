/**
 * Workflow Sync Board Command
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig } from '../../../utils/workflow-config.js';
import { createClient as createClientAsync, getContextFromConfig } from '../../utils/client.js';

export interface SyncBoardOptions {
  owner?: string;
  repo?: string;
  name?: string;
}

/**
 * 同步项目看板
 */
export async function syncBoard(options: SyncBoardOptions): Promise<void> {
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
  const boardName = options.name || config.board.name;

  if (!owner || !repo) {
    console.log(chalk.red('\n❌ 请提供仓库信息: --owner 和 --repo'));
    return;
  }

  console.log(chalk.bold(`\n📋 同步项目看板到 ${owner}/${repo}\n`));
  console.log(chalk.gray(`看板名称: ${boardName}`));
  console.log(chalk.gray(`列数: ${config.board.columns.length}\n`));

  // 创建客户端
  const client = await createClientAsync({});
  if (!client) {
    console.log(chalk.red('\n❌ 无法创建 API 客户端，请检查配置'));
    return;
  }

  try {
    // 获取现有项目看板
    type ProjectType = { id: number; title?: string };
    const projects = await client.get<ProjectType[]>(`/repos/${owner}/${repo}/projects`);
    const existingProject = projects.find((p) => p.title === boardName);

    let projectId: number;

    if (existingProject) {
      projectId = existingProject.id;
      console.log(chalk.yellow(`⚠️  项目看板 "${boardName}" 已存在 (ID: ${projectId})`));
    } else {
      // 创建新项目看板
      const createResponse = await client.post<ProjectType>(`/repos/${owner}/${repo}/projects`, {
        title: boardName,
      });
      projectId = createResponse.id;
      console.log(chalk.green(`✓ 创建项目看板 "${boardName}" (ID: ${projectId})`));
    }

    // 获取现有列
    type ColumnType = { id: number; title?: string };
    const existingColumns = await client.get<ColumnType[]>(`/repos/${owner}/${repo}/projects/${projectId}/columns`);
    const existingColumnNames = new Set(existingColumns.map((c) => c.title));

    console.log(chalk.bold('\n📊 同步看板列:\n'));

    let columnsCreated = 0;
    let columnsSkipped = 0;

    for (const column of config.board.columns) {
      if (existingColumnNames.has(column.name)) {
        console.log(chalk.gray(`  - ${column.name} (已存在)`));
        columnsSkipped++;
      } else {
        await client.post(`/repos/${owner}/${repo}/projects/${projectId}/columns`, {
          title: column.name,
        });
        console.log(chalk.green(`  + ${column.name} → ${column.maps_to}`));
        columnsCreated++;
      }
    }

    // 显示统计
    console.log(chalk.bold('\n📊 同步结果:'));
    console.log(chalk.green(`  创建列: ${columnsCreated}`));
    console.log(chalk.gray(`  跳过: ${columnsSkipped}`));

    console.log(chalk.green('\n✅ 看板同步完成！'));

    // 显示看板 URL
    console.log(chalk.cyan(`\n🔗 查看看板: ${process.env.GITEA_URL || 'https://your-gitea-server'}/${owner}/${repo}/projects/${projectId}`));
  } catch (error) {
    console.log(chalk.red(`\n❌ 同步失败: ${error instanceof Error ? error.message : String(error)}`));
  }

  console.log();
}
