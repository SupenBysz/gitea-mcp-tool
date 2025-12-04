/**
 * 版本升级管理命令
 */

import { execSync, spawn } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import { success, error, info } from '../utils/output.js';

const PACKAGE_NAME = 'gitea-mcp-tool';

export interface UpgradeOptions {
  beta?: boolean;
  check?: boolean;
  yes?: boolean;
  json?: boolean;
  noColor?: boolean;
}

interface VersionInfo {
  current: string;
  latest: string;
  beta: string;
}

/**
 * 获取当前安装的版本
 */
function getCurrentVersion(): string {
  try {
    // 从当前包的 package.json 中读取版本
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

/**
 * 从 npm 获取版本信息
 */
function getNpmVersions(): { latest: string; beta: string } {
  let latest = 'unknown';
  let beta = 'unknown';

  try {
    // 获取 latest 版本
    latest = execSync(`npm view ${PACKAGE_NAME} version 2>/dev/null`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    // ignore
  }

  try {
    // 获取 beta 版本
    beta = execSync(`npm view ${PACKAGE_NAME} dist-tags.beta 2>/dev/null`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    beta = 'none';
  }

  return { latest, beta };
}

/**
 * 检查指定版本是否存在
 */
function checkVersionExists(version: string): boolean {
  try {
    const versions = execSync(`npm view ${PACKAGE_NAME} versions --json 2>/dev/null`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const versionList = JSON.parse(versions) as string[];
    return versionList.includes(version);
  } catch {
    return false;
  }
}

/**
 * 比较两个版本号
 * 返回: 1 (v1 > v2), -1 (v1 < v2), 0 (v1 == v2)
 */
function compareVersions(v1: string, v2: string): number {
  // 处理 beta 版本
  const normalize = (v: string) => {
    const [base, prerelease] = v.split('-');
    const parts = base.split('.').map(Number);
    // beta.N 转换为小数
    let prereleaseNum = 0;
    if (prerelease) {
      const match = prerelease.match(/beta\.(\d+)/);
      if (match) {
        prereleaseNum = parseInt(match[1]) / 1000; // beta.1 = 0.001
      }
    } else {
      prereleaseNum = 1; // 正式版大于 beta
    }
    return [...parts, prereleaseNum];
  };

  const p1 = normalize(v1);
  const p2 = normalize(v2);

  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

/**
 * 获取版本状态标签
 */
function getVersionStatus(current: string, target: string): string {
  const cmp = compareVersions(target, current);
  if (cmp > 0) return chalk.green('升级');
  if (cmp < 0) return chalk.yellow('降级');
  return chalk.gray('相同');
}

/**
 * 用户确认
 */
async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (Y/n) `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === '' || normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * 执行 npm 安装
 */
function executeInstall(version: string): Promise<boolean> {
  return new Promise((resolve) => {
    const target = version.includes('@') ? version : `${PACKAGE_NAME}@${version}`;
    console.log(chalk.cyan(`\n正在安装 ${target} ...\n`));

    const child = spawn('npm', ['install', '-g', target], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * 显示版本信息
 */
function displayVersionInfo(versionInfo: VersionInfo, options: UpgradeOptions) {
  if (options.json) {
    console.log(JSON.stringify(versionInfo, null, 2));
    return;
  }

  console.log(chalk.bold('\ngitea-mcp-tool 版本信息\n'));
  console.log(`  当前版本:  ${chalk.white(versionInfo.current)}`);
  console.log(`  最新版本:  ${chalk.green(versionInfo.latest)} ${chalk.gray('(latest)')}`);

  if (versionInfo.beta && versionInfo.beta !== 'none') {
    console.log(`  测试版本:  ${chalk.yellow(versionInfo.beta)} ${chalk.gray('(beta)')}`);
  }

  // 显示状态
  const cmpLatest = compareVersions(versionInfo.latest, versionInfo.current);
  if (cmpLatest > 0) {
    console.log(chalk.green(`\n  状态: 发现新版本 ${versionInfo.latest}`));
  } else if (cmpLatest === 0) {
    console.log(chalk.gray('\n  状态: 已是最新版本'));
  } else {
    console.log(chalk.yellow(`\n  状态: 当前版本高于 latest (可能是 beta 版本)`));
  }
  console.log();
}

/**
 * 升级命令主函数
 */
export async function upgrade(targetVersion: string | undefined, options: UpgradeOptions) {
  try {
    // 获取版本信息
    const current = getCurrentVersion();
    const { latest, beta } = getNpmVersions();

    const versionInfo: VersionInfo = { current, latest, beta };

    // 仅检查模式
    if (options.check) {
      displayVersionInfo(versionInfo, options);
      return;
    }

    // 确定目标版本
    let target: string;
    let targetLabel: string;

    if (targetVersion) {
      // 指定版本
      if (!checkVersionExists(targetVersion)) {
        error(`版本 ${targetVersion} 不存在`);
        info(`使用 'npm view ${PACKAGE_NAME} versions' 查看可用版本`);
        process.exit(1);
      }
      target = targetVersion;
      targetLabel = targetVersion;
    } else if (options.beta) {
      // beta 版本
      if (beta === 'none' || beta === 'unknown') {
        error('当前没有可用的 beta 版本');
        process.exit(1);
      }
      target = beta;
      targetLabel = `${beta} (beta)`;
    } else {
      // latest 版本
      if (latest === 'unknown') {
        error('无法获取 npm 最新版本');
        process.exit(1);
      }
      target = latest;
      targetLabel = `${latest} (latest)`;
    }

    // 检查是否需要更新
    const cmp = compareVersions(target, current);
    if (cmp === 0 && !targetVersion) {
      success('已是最新版本，无需更新');
      displayVersionInfo(versionInfo, options);
      return;
    }

    // 显示升级信息
    const status = getVersionStatus(current, target);
    console.log(`\n当前版本: ${chalk.white(current)}`);
    console.log(`目标版本: ${chalk.cyan(targetLabel)} (${status})`);

    // 确认安装
    if (!options.yes) {
      const shouldProceed = await confirm('\n确认安装?');
      if (!shouldProceed) {
        info('已取消');
        return;
      }
    }

    // 执行安装
    const installSuccess = await executeInstall(target);

    if (installSuccess) {
      success(`安装完成: ${PACKAGE_NAME}@${target}`);
    } else {
      error('安装失败');
      process.exit(1);
    }
  } catch (err: any) {
    error(`升级失败: ${err.message}`);
    process.exit(1);
  }
}
