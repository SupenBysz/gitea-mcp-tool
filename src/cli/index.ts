#!/usr/bin/env node

/**
 * keactl - Gitea Command Line Tool
 * 独立的命令行工具，提供完整的 Gitea API 操作能力
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// 获取 package.json 的版本信息
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

// 创建主命令
const program = new Command();

program
  .name('keactl')
  .description('Gitea Command Line Tool - 完整的 Gitea API 操作工具')
  .version(packageJson.version, '-v, --version', '显示版本号')
  .option('-t, --token <token>', 'Gitea API Token')
  .option('-s, --server <url>', 'Gitea Server URL')
  .option('-o, --owner <owner>', '仓库所有者（用户名或组织名）')
  .option('-r, --repo <repo>', '仓库名称')
  .option('--json', '以 JSON 格式输出结果')
  .option('--no-color', '禁用彩色输出');

// 上下文管理命令
program
  .command('context')
  .description('管理默认上下文')
  .addCommand(
    new Command('get')
      .description('获取当前上下文')
      .action(async () => {
        const { contextGet } = await import('./commands/context.js');
        await contextGet(program.opts());
      })
  )
  .addCommand(
    new Command('set')
      .description('设置默认上下文')
      .option('-o, --owner <owner>', '默认所有者')
      .option('-r, --repo <repo>', '默认仓库')
      .option('--org <org>', '默认组织')
      .option('--project <id>', '默认项目 ID')
      .action(async (options) => {
        const { contextSet } = await import('./commands/context.js');
        await contextSet({ ...program.opts(), ...options });
      })
  );

// 用户命令
program
  .command('user')
  .description('用户管理')
  .addCommand(
    new Command('current')
      .description('获取当前用户信息')
      .action(async () => {
        const { userCurrent } = await import('./commands/user.js');
        await userCurrent(program.opts());
      })
  )
  .addCommand(
    new Command('get')
      .description('获取用户详情')
      .argument('<username>', '用户名')
      .action(async (username) => {
        const { userGet } = await import('./commands/user.js');
        await userGet(username, program.opts());
      })
  );

// 仓库管理命令
program
  .command('repo')
  .description('仓库管理')
  .addCommand(
    new Command('list')
      .description('列出仓库')
      .option('-u, --owner <owner>', '所有者（留空则列出当前用户的仓库）')
      .option('-l, --limit <number>', '每页数量', '20')
      .option('-p, --page <number>', '页码', '1')
      .action(async (options) => {
        const { repoList } = await import('./commands/repo.js');
        await repoList({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('get')
      .description('获取仓库详情')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (options) => {
        const { repoGet } = await import('./commands/repo.js');
        await repoGet({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('create')
      .description('创建新仓库')
      .requiredOption('-n, --name <name>', '仓库名称')
      .option('-d, --description <desc>', '仓库描述')
      .option('--private', '创建私有仓库')
      .option('--auto-init', '自动初始化（创建 README）')
      .option('-o, --owner <owner>', '所有者（组织名，留空则创建在个人账户下）')
      .action(async (options) => {
        const { repoCreate } = await import('./commands/repo.js');
        await repoCreate({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('delete')
      .description('删除仓库')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-y, --yes', '跳过确认')
      .action(async (options) => {
        const { repoDelete } = await import('./commands/repo.js');
        await repoDelete({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('search')
      .description('搜索仓库')
      .argument('<query>', '搜索关键词')
      .option('-l, --limit <number>', '每页数量', '10')
      .option('-p, --page <number>', '页码', '1')
      .action(async (query, options) => {
        const { repoSearch } = await import('./commands/repo.js');
        await repoSearch(query, { ...program.opts(), ...options });
      })
  );

// Issue 管理命令
program
  .command('issue')
  .description('Issue 管理')
  .addCommand(
    new Command('list')
      .description('列出 Issues')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-s, --state <state>', '状态过滤 (open/closed/all)', 'open')
      .option('-l, --limit <number>', '每页数量', '20')
      .option('-p, --page <number>', '页码', '1')
      .action(async (options) => {
        const { issueList } = await import('./commands/issue.js');
        await issueList({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('get')
      .description('获取 Issue 详情')
      .argument('<index>', 'Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (index, options) => {
        const { issueGet } = await import('./commands/issue.js');
        await issueGet(parseInt(index), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('create')
      .description('创建新 Issue')
      .requiredOption('-t, --title <title>', 'Issue 标题')
      .option('-b, --body <body>', 'Issue 内容')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-a, --assignees <users...>', '指派给（用户名列表）')
      .option('-l, --labels <ids...>', '标签 ID 列表')
      .action(async (options) => {
        const { issueCreate } = await import('./commands/issue.js');
        await issueCreate({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('update')
      .description('更新 Issue')
      .argument('<index>', 'Issue 编号')
      .option('-t, --title <title>', '新标题')
      .option('-b, --body <body>', '新内容')
      .option('-s, --state <state>', '新状态 (open/closed)')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (index, options) => {
        const { issueUpdate } = await import('./commands/issue.js');
        await issueUpdate(parseInt(index), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('close')
      .description('关闭 Issue')
      .argument('<index>', 'Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (index, options) => {
        const { issueClose } = await import('./commands/issue.js');
        await issueClose(parseInt(index), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('comment')
      .description('添加 Issue 评论')
      .argument('<index>', 'Issue 编号')
      .requiredOption('-b, --body <body>', '评论内容')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (index, options) => {
        const { issueComment } = await import('./commands/issue.js');
        await issueComment(parseInt(index), { ...program.opts(), ...options });
      })
  );

// PR 管理命令
program
  .command('pr')
  .description('Pull Request 管理')
  .addCommand(
    new Command('list')
      .description('列出 Pull Requests')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-s, --state <state>', '状态过滤 (open/closed/all)', 'open')
      .option('-l, --limit <number>', '每页数量', '20')
      .option('-p, --page <number>', '页码', '1')
      .action(async (options) => {
        const { prList } = await import('./commands/pr.js');
        await prList({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('get')
      .description('获取 PR 详情')
      .argument('<index>', 'PR 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (index, options) => {
        const { prGet } = await import('./commands/pr.js');
        await prGet(parseInt(index), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('create')
      .description('创建新 PR')
      .requiredOption('-t, --title <title>', 'PR 标题')
      .requiredOption('--head <branch>', '源分支')
      .requiredOption('--base <branch>', '目标分支')
      .option('-b, --body <body>', 'PR 描述')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (options) => {
        const { prCreate } = await import('./commands/pr.js');
        await prCreate({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('merge')
      .description('合并 PR')
      .argument('<index>', 'PR 编号')
      .option('-m, --method <method>', '合并方式 (merge/rebase/squash)', 'merge')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (index, options) => {
        const { prMerge } = await import('./commands/pr.js');
        await prMerge(parseInt(index), { ...program.opts(), ...options });
      })
  );

// 项目看板管理命令
program
  .command('project')
  .description('项目看板管理')
  .addCommand(
    new Command('list')
      .description('列出项目看板')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-s, --state <state>', '状态过滤 (open/closed/all)', 'open')
      .action(async (options) => {
        const { projectList } = await import('./commands/project.js');
        await projectList({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('get')
      .description('获取项目详情')
      .argument('<id>', '项目 ID')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (id, options) => {
        const { projectGet } = await import('./commands/project.js');
        await projectGet(parseInt(id), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('create')
      .description('创建项目看板')
      .requiredOption('-t, --title <title>', '项目标题')
      .option('-d, --description <desc>', '项目描述')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (options) => {
        const { projectCreate } = await import('./commands/project.js');
        await projectCreate({ ...program.opts(), ...options });
      })
  );

// 配置管理命令
program
  .command('config')
  .description('配置管理')
  .addCommand(
    new Command('init')
      .description('初始化项目配置')
      .option('--gitea-url <url>', 'Gitea 服务器 URL')
      .option('--owner <owner>', '仓库所有者')
      .option('--repo <repo>', '仓库名称')
      .option('--force', '强制覆盖已有配置')
      .action(async (options) => {
        const { configInit } = await import('./commands/config.js');
        await configInit({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('show')
      .description('显示当前配置')
      .action(async () => {
        const { configShow } = await import('./commands/config.js');
        await configShow(program.opts());
      })
  );

// 错误处理
program.on('command:*', () => {
  console.error(chalk.red(`\n错误: 未知命令 '${program.args.join(' ')}'`));
  console.log(chalk.yellow('\n使用 --help 查看可用命令\n'));
  process.exit(1);
});

// 解析命令行参数
program.parse();
