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
import { createInitCommand } from './commands/init/index.js';
import { createCICDCommand } from './commands/cicd/index.js';
import { createWorkflowCommand } from './commands/workflow/index.js';

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

// Help 头部显示版本信息
program.addHelpText('beforeAll', `
◆ keactl v${packageJson.version} - Gitea Command Line Tool
`);

// Help 尾部显示仓库链接
program.addHelpText('afterAll', `
GitHub: https://github.com/SupenBysz/gitea-mcp-tool
Wiki:   https://github.com/SupenBysz/gitea-mcp-tool/wiki
Issues: https://github.com/SupenBysz/gitea-mcp-tool/issues
`);

// 初始化命令 (放在最前面，最常用)
program.addCommand(createInitCommand());

// CI/CD 管理命令
program.addCommand(createCICDCommand());

// Issue 工作流管理命令
program.addCommand(createWorkflowCommand());

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

// Branch 分支管理命令
program
  .command('branch')
  .description('分支管理')
  .addCommand(
    new Command('list')
      .description('列出分支')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-l, --limit <number>', '每页数量', '30')
      .option('-p, --page <number>', '页码', '1')
      .action(async (options) => {
        const { branchList } = await import('./commands/branch.js');
        await branchList({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('get')
      .description('获取分支详情')
      .argument('<name>', '分支名称')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (name, options) => {
        const { branchGet } = await import('./commands/branch.js');
        await branchGet(name, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('create')
      .description('创建分支')
      .argument('<name>', '新分支名称')
      .option('--from <ref>', '从指定分支/tag/commit 创建')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (name, options) => {
        const { branchCreate } = await import('./commands/branch.js');
        await branchCreate(name, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('delete')
      .description('删除分支')
      .argument('<name>', '分支名称')
      .option('-y, --yes', '跳过确认')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (name, options) => {
        const { branchDelete } = await import('./commands/branch.js');
        await branchDelete(name, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('rename')
      .description('重命名分支')
      .argument('<old-name>', '原分支名称')
      .argument('<new-name>', '新分支名称')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (oldName, newName, options) => {
        const { branchRename } = await import('./commands/branch.js');
        await branchRename(oldName, newName, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('protection')
      .description('分支保护规则管理')
      .addCommand(
        new Command('list')
          .description('列出分支保护规则')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (options) => {
            const { protectionList } = await import('./commands/branch.js');
            await protectionList({ ...program.opts(), ...options });
          })
      )
      .addCommand(
        new Command('get')
          .description('获取分支保护规则详情')
          .argument('<name>', '规则名称')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (name, options) => {
            const { protectionGet } = await import('./commands/branch.js');
            await protectionGet(name, { ...program.opts(), ...options });
          })
      )
      .addCommand(
        new Command('create')
          .description('创建分支保护规则')
          .requiredOption('--rule-name <name>', '规则名称（可使用通配符如 main, release/*）')
          .option('--enable-push', '允许推送')
          .option('--required-approvals <number>', '要求的审批数量')
          .option('--enable-status-check', '启用状态检查')
          .option('--require-signed-commits', '要求签名提交')
          .option('--block-on-rejected-reviews', '有拒绝审查时阻止合并')
          .option('--block-on-outdated-branch', '分支过时时阻止合并')
          .option('--dismiss-stale-approvals', '推送后取消过时审批')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (options) => {
            const { protectionCreate } = await import('./commands/branch.js');
            await protectionCreate({ ...program.opts(), ...options });
          })
      )
      .addCommand(
        new Command('update')
          .description('更新分支保护规则')
          .argument('<name>', '规则名称')
          .option('--enable-push', '允许推送')
          .option('--no-enable-push', '禁止推送')
          .option('--required-approvals <number>', '要求的审批数量')
          .option('--enable-status-check', '启用状态检查')
          .option('--no-enable-status-check', '禁用状态检查')
          .option('--require-signed-commits', '要求签名提交')
          .option('--no-require-signed-commits', '不要求签名提交')
          .option('--block-on-rejected-reviews', '有拒绝审查时阻止合并')
          .option('--block-on-outdated-branch', '分支过时时阻止合并')
          .option('--dismiss-stale-approvals', '推送后取消过时审批')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (name, options) => {
            const { protectionUpdate } = await import('./commands/branch.js');
            await protectionUpdate(name, { ...program.opts(), ...options });
          })
      )
      .addCommand(
        new Command('delete')
          .description('删除分支保护规则')
          .argument('<name>', '规则名称')
          .option('-y, --yes', '跳过确认')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (name, options) => {
            const { protectionDelete } = await import('./commands/branch.js');
            await protectionDelete(name, { ...program.opts(), ...options });
          })
      )
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
  )
  .addCommand(
    new Command('comments')
      .description('列出 Issue 评论')
      .argument('<index>', 'Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-l, --limit <number>', '每页数量', '30')
      .option('-p, --page <number>', '页码', '1')
      .action(async (index, options) => {
        const { issueCommentsList } = await import('./commands/issue.js');
        await issueCommentsList(parseInt(index), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('comment-get')
      .description('获取评论详情')
      .argument('<id>', '评论 ID')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (id, options) => {
        const { issueCommentGet } = await import('./commands/issue.js');
        await issueCommentGet(parseInt(id), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('comment-edit')
      .description('编辑评论')
      .argument('<id>', '评论 ID')
      .requiredOption('-b, --body <body>', '新评论内容')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (id, options) => {
        const { issueCommentEdit } = await import('./commands/issue.js');
        await issueCommentEdit(parseInt(id), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('comment-delete')
      .description('删除评论')
      .argument('<id>', '评论 ID')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (id, options) => {
        const { issueCommentDelete } = await import('./commands/issue.js');
        await issueCommentDelete(parseInt(id), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('deps')
      .description('查看 Issue 依赖列表')
      .argument('<index>', 'Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-l, --limit <number>', '每页数量', '30')
      .option('-p, --page <number>', '页码', '1')
      .action(async (index, options) => {
        const { issueDeps } = await import('./commands/issue.js');
        await issueDeps(parseInt(index), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('dep-add')
      .description('添加 Issue 依赖关系')
      .argument('<index>', 'Issue 编号')
      .argument('<dependency-index>', '依赖的 Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (index, dependencyIndex, options) => {
        const { issueDepAdd } = await import('./commands/issue.js');
        await issueDepAdd(parseInt(index), parseInt(dependencyIndex), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('dep-remove')
      .description('移除 Issue 依赖关系')
      .argument('<index>', 'Issue 编号')
      .argument('<dependency-index>', '要移除的依赖 Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (index, dependencyIndex, options) => {
        const { issueDepRemove } = await import('./commands/issue.js');
        await issueDepRemove(parseInt(index), parseInt(dependencyIndex), { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('blocks')
      .description('查看哪些 Issue 依赖当前 Issue（反向查询）')
      .argument('<index>', 'Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-l, --limit <number>', '每页数量', '30')
      .option('-p, --page <number>', '页码', '1')
      .action(async (index, options) => {
        const { issueBlocks } = await import('./commands/issue.js');
        await issueBlocks(parseInt(index), { ...program.opts(), ...options });
      })
  )
  // ===== 标签操作命令 =====
  .addCommand(
    new Command('label')
      .description('Issue 标签操作')
      .addCommand(
        new Command('list')
          .description('列出 Issue 的标签')
          .argument('<index>', 'Issue 编号')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (index, options) => {
            const { issueLabelList } = await import('./commands/label.js');
            await issueLabelList(parseInt(index), { ...program.opts(), ...options });
          })
      )
      .addCommand(
        new Command('add')
          .description('为 Issue 添加标签')
          .argument('<index>', 'Issue 编号')
          .requiredOption('-l, --labels <labels...>', '标签名称（支持多个）')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (index, options) => {
            const { issueLabelAdd } = await import('./commands/label.js');
            await issueLabelAdd(parseInt(index), { ...program.opts(), ...options });
          })
      )
      .addCommand(
        new Command('remove')
          .description('从 Issue 移除标签')
          .argument('<index>', 'Issue 编号')
          .requiredOption('-l, --labels <labels...>', '标签名称（支持多个）')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (index, options) => {
            const { issueLabelRemove } = await import('./commands/label.js');
            await issueLabelRemove(parseInt(index), { ...program.opts(), ...options });
          })
      )
      .addCommand(
        new Command('set')
          .description('设置 Issue 的标签（替换所有）')
          .argument('<index>', 'Issue 编号')
          .requiredOption('-l, --labels <labels...>', '标签名称（支持多个）')
          .option('-o, --owner <owner>', '仓库所有者')
          .option('-r, --repo <repo>', '仓库名称')
          .action(async (index, options) => {
            const { issueLabelSet } = await import('./commands/label.js');
            await issueLabelSet(parseInt(index), { ...program.opts(), ...options });
          })
      )
  )
  // ===== 工作流集成命令 =====
  .addCommand(
    new Command('infer-labels')
      .description('智能推断 Issue 标签')
      .argument('<index>', 'Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('--apply', '自动应用推断的标签')
      .action(async (index, options) => {
        const { inferLabels } = await import('./commands/workflow/infer-labels.js');
        await inferLabels({
          ...program.opts(),
          ...options,
          issue: index,
          autoApply: options.apply,
        });
      })
  )
  .addCommand(
    new Command('check')
      .description('检查单个 Issue 是否符合工作流规范')
      .argument('<index>', 'Issue 编号')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('--json', '以 JSON 格式输出')
      .action(async (index, options) => {
        const { checkIssues } = await import('./commands/workflow/check-issues.js');
        await checkIssues({
          ...program.opts(),
          ...options,
          issue: index,
        });
      })
  )
  .addCommand(
    new Command('check-all')
      .description('检查所有开放 Issue 是否符合工作流规范')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('--json', '以 JSON 格式输出')
      .action(async (options) => {
        const { checkIssues } = await import('./commands/workflow/check-issues.js');
        await checkIssues({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('check-blocked')
      .description('检测阻塞或超期的 Issue')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('--threshold <hours>', 'SLA 阈值（小时）')
      .option('--json', '以 JSON 格式输出')
      .action(async (options) => {
        const { checkBlocked } = await import('./commands/workflow/check-blocked.js');
        await checkBlocked({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('escalate')
      .description('自动升级老化 Issue 的优先级')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('--dry-run', '预览变更但不执行')
      .action(async (options) => {
        const { escalatePriority } = await import('./commands/workflow/escalate.js');
        await escalatePriority({ ...program.opts(), ...options, dryRun: options.dryRun });
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

// Label 管理命令
program
  .command('label')
  .description('仓库标签管理')
  .addCommand(
    new Command('list')
      .description('列出仓库所有标签')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (options) => {
        const { labelList } = await import('./commands/label.js');
        await labelList({ ...program.opts(), ...options });
      })
  );

// Wiki 管理命令
program
  .command('wiki')
  .description('Wiki 页面管理')
  .addCommand(
    new Command('list')
      .description('列出 Wiki 页面')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-l, --limit <number>', '每页数量', '30')
      .option('-p, --page <number>', '页码', '1')
      .action(async (options) => {
        const { wikiList } = await import('./commands/wiki.js');
        await wikiList({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('get')
      .description('获取 Wiki 页面内容')
      .argument('<page>', '页面名称')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (page, options) => {
        const { wikiGet } = await import('./commands/wiki.js');
        await wikiGet(page, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('create')
      .description('创建 Wiki 页面')
      .requiredOption('-t, --title <title>', '页面标题')
      .requiredOption('-c, --content <content>', '页面内容 (Markdown)')
      .option('-m, --message <message>', '提交信息')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (options) => {
        const { wikiCreate } = await import('./commands/wiki.js');
        await wikiCreate({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('update')
      .description('更新 Wiki 页面')
      .argument('<page>', '页面名称')
      .option('-t, --title <title>', '新标题')
      .option('-c, --content <content>', '新内容 (Markdown)')
      .option('-m, --message <message>', '提交信息')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (page, options) => {
        const { wikiUpdate } = await import('./commands/wiki.js');
        await wikiUpdate(page, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('delete')
      .description('删除 Wiki 页面')
      .argument('<page>', '页面名称')
      .option('-y, --yes', '跳过确认')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (page, options) => {
        const { wikiDelete } = await import('./commands/wiki.js');
        await wikiDelete(page, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('search')
      .description('搜索 Wiki 页面')
      .argument('<query>', '搜索关键词')
      .option('-l, --limit <number>', '结果数量', '20')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (query, options) => {
        const { wikiSearch } = await import('./commands/wiki.js');
        await wikiSearch(query, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('revisions')
      .description('查看 Wiki 页面修订历史')
      .argument('<page>', '页面名称')
      .option('-l, --limit <number>', '每页数量', '20')
      .option('-p, --page <number>', '页码', '1')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (page, options) => {
        const { wikiRevisions } = await import('./commands/wiki.js');
        await wikiRevisions(page, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('revision-get')
      .description('获取 Wiki 页面特定版本')
      .argument('<page>', '页面名称')
      .argument('<revision>', '版本 SHA')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (page, revision, options) => {
        const { wikiRevisionGet } = await import('./commands/wiki.js');
        await wikiRevisionGet(page, revision, { ...program.opts(), ...options });
      })
  );

// Release 发布管理命令
program
  .command('release')
  .description('发布版本管理')
  .addCommand(
    new Command('list')
      .description('列出发布版本')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .option('-l, --limit <number>', '每页数量', '30')
      .option('-p, --page <number>', '页码', '1')
      .option('--draft', '只显示草稿')
      .option('--prerelease', '只显示预发布版本')
      .action(async (options) => {
        const { releaseList } = await import('./commands/release.js');
        await releaseList({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('get')
      .description('获取发布版本详情（按 ID）')
      .argument('<id>', '发布 ID')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (id, options) => {
        const { releaseGet } = await import('./commands/release.js');
        await releaseGet(id, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('get-by-tag')
      .description('获取发布版本详情（按 Tag）')
      .argument('<tag>', 'Tag 名称')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (tag, options) => {
        const { releaseGetByTag } = await import('./commands/release.js');
        await releaseGetByTag(tag, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('create')
      .description('创建发布版本')
      .requiredOption('-t, --tag <tag>', 'Tag 名称')
      .option('-n, --name <name>', '发布名称')
      .option('-b, --body <body>', '发布说明')
      .option('--draft', '创建为草稿')
      .option('--prerelease', '标记为预发布版本')
      .option('--target <branch>', '目标分支或 commit SHA')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (options) => {
        const { releaseCreate } = await import('./commands/release.js');
        await releaseCreate({ ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('update')
      .description('更新发布版本')
      .argument('<id>', '发布 ID')
      .option('-t, --tag <tag>', '新 Tag 名称')
      .option('-n, --name <name>', '新发布名称')
      .option('-b, --body <body>', '新发布说明')
      .option('--draft', '设置为草稿')
      .option('--no-draft', '取消草稿状态')
      .option('--prerelease', '设置为预发布版本')
      .option('--no-prerelease', '取消预发布状态')
      .option('--target <branch>', '新目标分支或 commit SHA')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (id, options) => {
        const { releaseUpdate } = await import('./commands/release.js');
        await releaseUpdate(id, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('delete')
      .description('删除发布版本')
      .argument('<id>', '发布 ID')
      .option('-y, --yes', '跳过确认')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (id, options) => {
        const { releaseDelete } = await import('./commands/release.js');
        await releaseDelete(id, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('attachments')
      .description('列出发布版本附件')
      .argument('<id>', '发布 ID')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (id, options) => {
        const { releaseAttachments } = await import('./commands/release.js');
        await releaseAttachments(id, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('attachment-get')
      .description('获取发布附件详情')
      .argument('<release-id>', '发布 ID')
      .argument('<attachment-id>', '附件 ID')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (releaseId, attachmentId, options) => {
        const { releaseAttachmentGet } = await import('./commands/release.js');
        await releaseAttachmentGet(releaseId, attachmentId, { ...program.opts(), ...options });
      })
  )
  .addCommand(
    new Command('attachment-delete')
      .description('删除发布附件')
      .argument('<release-id>', '发布 ID')
      .argument('<attachment-id>', '附件 ID')
      .option('-y, --yes', '跳过确认')
      .option('-o, --owner <owner>', '仓库所有者')
      .option('-r, --repo <repo>', '仓库名称')
      .action(async (releaseId, attachmentId, options) => {
        const { releaseAttachmentDelete } = await import('./commands/release.js');
        await releaseAttachmentDelete(releaseId, attachmentId, { ...program.opts(), ...options });
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

// 升级命令 (顶层命令，方便使用)
program
  .command('upgrade')
  .description('检查并升级到新版本')
  .argument('[version]', '指定版本号（如 1.7.5）')
  .option('-b, --beta', '升级到 beta 版本')
  .option('-c, --check', '仅检查版本，不执行升级')
  .option('-y, --yes', '跳过确认，直接执行')
  .action(async (version, options) => {
    const { upgrade } = await import('./commands/upgrade.js');
    await upgrade(version, { ...program.opts(), ...options });
  });

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
