/**
 * CLI 输出格式化工具
 */

import chalk from 'chalk';

export interface OutputOptions {
  json?: boolean;
  noColor?: boolean;
}

// Helper to extract output flags from any options object
function getFlags(options?: object): OutputOptions {
  if (!options) return {};
  const opt = options as Record<string, unknown>;
  return {
    json: Boolean(opt.json),
    noColor: Boolean(opt.noColor),
  };
}

/**
 * 格式化并输出结果
 */
export function output(data: any, options?: object) {
  const flags = getFlags(options);
  if (flags.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(formatData(data, flags));
  }
}

/**
 * 输出成功消息
 */
export function success(message: string, options?: object) {
  const flags = getFlags(options);
  if (flags.noColor) {
    console.log(`✓ ${message}`);
  } else {
    console.log(chalk.green(`✓ ${message}`));
  }
}

/**
 * 输出错误消息
 */
export function error(message: string, options?: object) {
  const flags = getFlags(options);
  if (flags.noColor) {
    console.error(`✗ ${message}`);
  } else {
    console.error(chalk.red(`✗ ${message}`));
  }
}

/**
 * 输出警告消息
 */
export function warning(message: string, options?: object) {
  const flags = getFlags(options);
  if (flags.noColor) {
    console.warn(`⚠ ${message}`);
  } else {
    console.warn(chalk.yellow(`⚠ ${message}`));
  }
}

/**
 * 输出信息消息
 */
export function info(message: string, options?: object) {
  const flags = getFlags(options);
  if (flags.noColor) {
    console.log(`ℹ ${message}`);
  } else {
    console.log(chalk.blue(`ℹ ${message}`));
  }
}

/**
 * 格式化数据为易读格式
 */
function formatData(data: any, flags: OutputOptions): string {
  if (data === null || data === undefined) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (Array.isArray(data)) {
    return formatArray(data, flags);
  }

  if (typeof data === 'object') {
    return formatObject(data, flags);
  }

  return String(data);
}

/**
 * 格式化数组
 */
function formatArray(arr: any[], flags: OutputOptions): string {
  if (arr.length === 0) {
    return '(空列表)';
  }

  // 如果数组元素是对象，尝试表格化输出
  if (typeof arr[0] === 'object' && arr[0] !== null) {
    return formatTable(arr, flags);
  }

  // 简单列表
  return arr.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

/**
 * 格式化对象
 */
function formatObject(obj: any, flags: OutputOptions, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const coloredKey = flags.noColor ? key : chalk.cyan(key);

    if (value === null || value === undefined) {
      lines.push(`${indentStr}${coloredKey}: (空)`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${indentStr}${coloredKey}:`);
      lines.push(formatObject(value, flags, indent + 1));
    } else if (Array.isArray(value)) {
      lines.push(`${indentStr}${coloredKey}: [${value.length} 项]`);
    } else {
      lines.push(`${indentStr}${coloredKey}: ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * 格式化为表格（简单实现）
 */
function formatTable(data: any[], flags: OutputOptions): string {
  if (data.length === 0) return '';

  // 获取所有键
  const keys = Array.from(
    new Set(data.flatMap(obj => Object.keys(obj)))
  );

  // 计算每列宽度
  const columnWidths: Record<string, number> = {};
  for (const key of keys) {
    columnWidths[key] = Math.max(
      key.length,
      ...data.map(obj => String(obj[key] || '').length)
    );
  }

  // 构建表头
  const header = keys.map(key => {
    const coloredKey = flags.noColor ? key : chalk.cyan(key);
    return coloredKey.padEnd(columnWidths[key]);
  }).join('  ');

  // 构建分隔线
  const separator = keys.map(key => '-'.repeat(columnWidths[key])).join('  ');

  // 构建数据行
  const rows = data.map(obj => {
    return keys.map(key => {
      const value = obj[key];
      let strValue = '';

      if (value === null || value === undefined) {
        strValue = '-';
      } else if (typeof value === 'object') {
        strValue = '[Object]';
      } else {
        strValue = String(value);
      }

      return strValue.padEnd(columnWidths[key]);
    }).join('  ');
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * 输出列表（带编号）
 */
export function outputList(items: any[], options?: object) {
  const flags = getFlags(options);
  if (!items || items.length === 0) {
    info('没有找到数据', options);
    return;
  }

  if (flags.json) {
    console.log(JSON.stringify(items, null, 2));
  } else {
    console.log(formatArray(items, flags));
  }
}

/**
 * 输出对象详情
 */
export function outputDetails(obj: any, options?: object) {
  const flags = getFlags(options);
  if (!obj) {
    info('没有找到数据', options);
    return;
  }

  if (flags.json) {
    console.log(JSON.stringify(obj, null, 2));
  } else {
    console.log(formatObject(obj, flags));
  }
}
