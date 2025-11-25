/**
 * Workflow Command Entry
 *
 * keactl workflow init - 初始化工作流配置
 * keactl workflow status - 查看工作流状态
 * keactl workflow sync-labels - 同步标签系统
 * keactl workflow sync-board - 同步项目看板
 * keactl workflow check-issues - 检查 Issue 工作流
 * keactl workflow infer-labels - 智能标签推断
 * keactl workflow check-blocked - 检测阻塞 Issue
 * keactl workflow escalate - 优先级升级
 * keactl workflow report - 生成工作流报告
 */

import { Command } from 'commander';
import { initWorkflow, WorkflowInitOptions } from './init.js';
import { showStatus, StatusOptions } from './status.js';
import { syncLabels, SyncLabelsOptions } from './sync-labels.js';
import { syncBoard, SyncBoardOptions } from './sync-board.js';
import { checkIssues, CheckIssuesOptions } from './check-issues.js';
import { inferLabels, InferLabelsOptions } from './infer-labels.js';
import { checkBlocked, CheckBlockedOptions } from './check-blocked.js';
import { escalatePriority, EscalateOptions } from './escalate.js';
import { generateReport, ReportOptions } from './report.js';

/**
 * 创建 workflow 命令
 */
export function createWorkflowCommand(): Command {
  const workflowCmd = new Command('workflow')
    .description('Issue 工作流自动化管理');

  // 子命令: workflow init
  workflowCmd
    .command('init')
    .description('初始化 Issue 工作流配置')
    .option('-t, --type <type>', '项目类型 (backend/frontend/fullstack/library)', 'backend')
    .option('-l, --language <language>', '主要编程语言 (go/typescript/python/rust)')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('--no-interactive', '非交互模式')
    .option('-f, --force', '强制覆盖已有配置')
    .action(async (options: WorkflowInitOptions) => {
      await initWorkflow(options);
    });

  // 子命令: workflow status
  workflowCmd
    .command('status')
    .description('查看当前工作流配置状态')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('--json', '以 JSON 格式输出')
    .action(async (options: StatusOptions) => {
      await showStatus(options);
    });

  // 子命令: workflow sync-labels
  workflowCmd
    .command('sync-labels')
    .description('同步标签系统')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('--dry-run', '预览变更但不执行')
    .action(async (options: SyncLabelsOptions) => {
      await syncLabels(options);
    });

  // 子命令: workflow sync-board
  workflowCmd
    .command('sync-board')
    .description('同步项目看板')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('-n, --name <name>', '看板名称')
    .action(async (options: SyncBoardOptions) => {
      await syncBoard(options);
    });

  // 子命令: workflow check-issues
  workflowCmd
    .command('check-issues')
    .description('检查 Issue 工作流一致性')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('-i, --issue <number>', '检查指定 Issue')
    .option('--json', '以 JSON 格式输出')
    .action(async (options: CheckIssuesOptions) => {
      await checkIssues(options);
    });

  // 子命令: workflow infer-labels
  workflowCmd
    .command('infer-labels')
    .description('智能推断 Issue 标签')
    .requiredOption('-i, --issue <number>', 'Issue 编号')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('--auto-apply', '自动应用推断的标签')
    .action(async (options: InferLabelsOptions) => {
      await inferLabels(options);
    });

  // 子命令: workflow check-blocked
  workflowCmd
    .command('check-blocked')
    .description('检测阻塞的 Issue')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('--threshold <hours>', 'SLA 阈值（小时）')
    .option('--json', '以 JSON 格式输出')
    .action(async (options: CheckBlockedOptions) => {
      await checkBlocked(options);
    });

  // 子命令: workflow escalate
  workflowCmd
    .command('escalate')
    .description('自动升级超时 Issue 的优先级')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('--dry-run', '预览变更但不执行')
    .action(async (options: EscalateOptions) => {
      await escalatePriority(options);
    });

  // 子命令: workflow report
  workflowCmd
    .command('report')
    .description('生成工作流分析报告')
    .option('-o, --owner <owner>', '仓库所有者')
    .option('-r, --repo <repo>', '仓库名称')
    .option('-t, --time-range <range>', '时间范围 (day/week/month)', 'week')
    .option('--json', '以 JSON 格式输出')
    .action(async (options: ReportOptions) => {
      await generateReport(options);
    });

  return workflowCmd;
}
