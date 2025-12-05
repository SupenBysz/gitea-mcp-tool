/**
 * Branch 分支管理命令
 */

import { createClient, createContextManager, resolveOwnerRepo, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails, outputList, info } from '../utils/output.js';
import {
  listBranches,
  getBranch,
  createBranch,
  deleteBranch,
  renameBranch,
  listBranchProtections,
  getBranchProtection,
  createBranchProtection,
  updateBranchProtection,
  deleteBranchProtection,
} from '../../tools/branch.js';

/**
 * 列出分支
 */
export async function branchList(options: ClientOptions & {
  owner?: string;
  repo?: string;
  limit?: string;
  page?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await listBranches({ client, contextManager }, {
      owner,
      repo,
      limit: parseInt(options.limit || '30'),
      page: parseInt(options.page || '1'),
    }) as any[];

    if (result.length === 0) {
      info('没有找到分支', options);
      return;
    }

    const branches = result.map((branch: any) => ({
      name: branch.name,
      protected: branch.protected ? 'Yes' : 'No',
      commit: branch.commit?.id?.substring(0, 7) || '-',
      author: branch.commit?.author?.name || '-',
      message: truncate(branch.commit?.message?.split('\n')[0] || '-', 40),
    }));

    outputList(branches, options);
  } catch (err: any) {
    error(`列出分支失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取分支详情
 */
export async function branchGet(name: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const branch = await getBranch({ client, contextManager }, {
      owner,
      repo,
      branch: name,
    }) as any;

    outputDetails({
      Name: branch.name,
      Protected: branch.protected ? 'Yes' : 'No',
      'Commit SHA': branch.commit?.id || '-',
      Author: branch.commit?.author?.name || '-',
      Email: branch.commit?.author?.email || '-',
      Date: branch.commit?.timestamp || '-',
      Message: branch.commit?.message || '-',
      URL: branch.commit?.url || '-',
    }, options);
  } catch (err: any) {
    error(`获取分支详情失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建分支
 */
export async function branchCreate(name: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  from?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const branch = await createBranch({ client, contextManager }, {
      owner,
      repo,
      new_branch_name: name,
      old_ref_name: options.from,
    }) as any;

    success(`分支创建成功: ${branch.name}`, options);
    outputDetails({
      Name: branch.name,
      'Commit SHA': branch.commit?.id || '-',
      'Created From': options.from || '(default branch)',
    }, options);
  } catch (err: any) {
    error(`创建分支失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 删除分支
 */
export async function branchDelete(name: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  yes?: boolean;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    // 确认删除
    if (!options.yes) {
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(`确认删除分支 "${name}"? (y/N) `, resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        info('已取消删除', options);
        return;
      }
    }

    await deleteBranch({ client, contextManager }, {
      owner,
      repo,
      branch: name,
    });

    success(`分支 "${name}" 已删除`, options);
  } catch (err: any) {
    error(`删除分支失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 重命名分支
 */
export async function branchRename(oldName: string, newName: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    await renameBranch({ client, contextManager }, {
      owner,
      repo,
      branch: oldName,
      new_name: newName,
    });

    success(`分支重命名成功: "${oldName}" -> "${newName}"`, options);
  } catch (err: any) {
    error(`重命名分支失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 列出分支保护规则
 */
export async function protectionList(options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const result = await listBranchProtections({ client, contextManager }, {
      owner,
      repo,
    }) as any[];

    if (result.length === 0) {
      info('没有找到分支保护规则', options);
      return;
    }

    const protections = result.map((p: any) => ({
      name: p.rule_name || p.branch_name || '-',
      'enable_push': p.enable_push ? 'Yes' : 'No',
      'required_approvals': p.required_approvals || 0,
      'status_check': p.enable_status_check ? 'Yes' : 'No',
      'signed_commits': p.require_signed_commits ? 'Yes' : 'No',
    }));

    outputList(protections, options);
  } catch (err: any) {
    error(`列出分支保护规则失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取分支保护规则详情
 */
export async function protectionGet(name: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const protection = await getBranchProtection({ client, contextManager }, {
      owner,
      repo,
      name,
    }) as any;

    outputDetails({
      'Rule Name': protection.rule_name || protection.branch_name || '-',
      'Enable Push': protection.enable_push ? 'Yes' : 'No',
      'Enable Push Whitelist': protection.enable_push_whitelist ? 'Yes' : 'No',
      'Push Whitelist Users': protection.push_whitelist_usernames?.join(', ') || '-',
      'Push Whitelist Teams': protection.push_whitelist_teams?.join(', ') || '-',
      'Enable Merge Whitelist': protection.enable_merge_whitelist ? 'Yes' : 'No',
      'Merge Whitelist Users': protection.merge_whitelist_usernames?.join(', ') || '-',
      'Enable Status Check': protection.enable_status_check ? 'Yes' : 'No',
      'Status Check Contexts': protection.status_check_contexts?.join(', ') || '-',
      'Required Approvals': protection.required_approvals || 0,
      'Enable Approvals Whitelist': protection.enable_approvals_whitelist ? 'Yes' : 'No',
      'Block on Rejected Reviews': protection.block_on_rejected_reviews ? 'Yes' : 'No',
      'Block on Outdated Branch': protection.block_on_outdated_branch ? 'Yes' : 'No',
      'Dismiss Stale Approvals': protection.dismiss_stale_approvals ? 'Yes' : 'No',
      'Require Signed Commits': protection.require_signed_commits ? 'Yes' : 'No',
      'Protected File Patterns': protection.protected_file_patterns || '-',
    }, options);
  } catch (err: any) {
    error(`获取分支保护规则失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 创建分支保护规则
 */
export async function protectionCreate(options: ClientOptions & {
  owner?: string;
  repo?: string;
  ruleName: string;
  enablePush?: boolean;
  requiredApprovals?: string;
  enableStatusCheck?: boolean;
  requireSignedCommits?: boolean;
  blockOnRejectedReviews?: boolean;
  blockOnOutdatedBranch?: boolean;
  dismissStaleApprovals?: boolean;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const protection = await createBranchProtection({ client, contextManager }, {
      owner,
      repo,
      rule_name: options.ruleName,
      enable_push: options.enablePush,
      required_approvals: options.requiredApprovals ? parseInt(options.requiredApprovals) : undefined,
      enable_status_check: options.enableStatusCheck,
      require_signed_commits: options.requireSignedCommits,
      block_on_rejected_reviews: options.blockOnRejectedReviews,
      block_on_outdated_branch: options.blockOnOutdatedBranch,
      dismiss_stale_approvals: options.dismissStaleApprovals,
    }) as any;

    success(`分支保护规则创建成功: ${protection.rule_name || protection.branch_name}`, options);
    outputDetails({
      'Rule Name': protection.rule_name || protection.branch_name || '-',
      'Enable Push': protection.enable_push ? 'Yes' : 'No',
      'Required Approvals': protection.required_approvals || 0,
    }, options);
  } catch (err: any) {
    error(`创建分支保护规则失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 更新分支保护规则
 */
export async function protectionUpdate(name: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  enablePush?: boolean;
  requiredApprovals?: string;
  enableStatusCheck?: boolean;
  requireSignedCommits?: boolean;
  blockOnRejectedReviews?: boolean;
  blockOnOutdatedBranch?: boolean;
  dismissStaleApprovals?: boolean;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    const protection = await updateBranchProtection({ client, contextManager }, {
      owner,
      repo,
      name,
      enable_push: options.enablePush,
      required_approvals: options.requiredApprovals ? parseInt(options.requiredApprovals) : undefined,
      enable_status_check: options.enableStatusCheck,
      require_signed_commits: options.requireSignedCommits,
      block_on_rejected_reviews: options.blockOnRejectedReviews,
      block_on_outdated_branch: options.blockOnOutdatedBranch,
      dismiss_stale_approvals: options.dismissStaleApprovals,
    }) as any;

    success(`分支保护规则更新成功: ${protection.rule_name || protection.branch_name}`, options);
  } catch (err: any) {
    error(`更新分支保护规则失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 删除分支保护规则
 */
export async function protectionDelete(name: string, options: ClientOptions & {
  owner?: string;
  repo?: string;
  yes?: boolean;
}) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const { owner, repo } = resolveOwnerRepo(contextManager, options);

    // 确认删除
    if (!options.yes) {
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(`确认删除分支保护规则 "${name}"? (y/N) `, resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        info('已取消删除', options);
        return;
      }
    }

    await deleteBranchProtection({ client, contextManager }, {
      owner,
      repo,
      name,
    });

    success(`分支保护规则 "${name}" 已删除`, options);
  } catch (err: any) {
    error(`删除分支保护规则失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 截断字符串
 */
function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}
