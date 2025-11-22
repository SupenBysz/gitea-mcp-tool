/**
 * 简体中文语言包
 */

import { I18nMessages } from '../types';

export const zhCN: I18nMessages = {
  common: {
    yes: '是',
    no: '否',
    cancel: '取消',
    confirm: '确认',
    continue: '继续',
    back: '返回',
    skip: '跳过',
    done: '完成',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
    loading: '加载中...',
    saving: '保存中...',
  },

  init: {
    title: '🚀 Gitea MCP 配置向导',
    welcome: '欢迎使用 Gitea MCP！让我们为您的项目配置。',
    detectingGit: '正在检测 Git 仓库信息...',
    gitDetected: '✓ 检测到 Git 仓库',
    noGitDetected: '⚠ 未检测到 Git 仓库',

    // Step 1: Server Selection
    step1_title: '第 1/6 步：选择 Gitea 服务器',
    step1_selectServer: '请选择 Gitea 服务器：',
    step1_useDetected: '使用检测到的：{url}',
    step1_addNew: '添加新服务器',
    step1_enterUrl: '请输入 Gitea 服务器 URL：',
    step1_enterName: '请输入服务器名称（可选）：',
    step1_setDefault: '设为默认服务器？',

    // Step 2: Project Info
    step2_title: '第 2/6 步：项目信息',
    step2_owner: '仓库所有者（用户名或组织）：',
    step2_repo: '仓库名称：',
    step2_useDetected: '检测到：{owner}/{repo}',

    // Step 3: Token Configuration
    step3_title: '第 3/6 步：API Token 配置',
    step3_selectMethod: '如何配置 API Token？',
    step3_method_create: '创建新 Token（通过密码）',
    step3_method_input: '输入已有 Token',
    step3_method_cache: '使用缓存的 Token',
    step3_method_env: '使用环境变量',

    // Token Creation
    step3_create_username: 'Gitea 用户名：',
    step3_create_password: 'Gitea 密码：',
    step3_create_tokenName: 'Token 名称：',
    step3_create_creating: '正在创建 Token...',
    step3_create_success: '✓ Token 创建成功',
    step3_create_failed: '✗ Token 创建失败：{error}',

    // Token Input
    step3_input_token: '请输入 API Token：',
    step3_input_tokenName: 'Token 名称（可选）：',

    // Token Cache Selection
    step3_cache_select: '请选择缓存的 Token：',
    step3_cache_none: '没有可用的缓存 Token',

    // Environment Variable
    step3_env_varName: '环境变量名称（默认：GITEA_API_TOKEN）：',

    // Step 4: Token Save Method
    step4_title: '第 4/6 步：Token 存储方式',
    step4_select: '如何保存 Token？',
    step4_local: '本地文件（.gitea-mcp.local.json）',
    step4_local_desc: '保存到 .gitea-mcp.local.json（不会提交到 Git）',
    step4_ref: '引用缓存的 Token',
    step4_ref_desc: '引用全局配置中的 Token（~/.gitea-mcp/config.json）',
    step4_env: '环境变量',
    step4_env_desc: '在配置文件中使用 ${GITEA_API_TOKEN}',

    // Step 5: Default Context
    step5_title: '第 5/6 步：默认上下文',
    step5_setDefault: '将 {owner}/{repo} 设为默认上下文？',

    // Step 6: Summary
    step6_title: '第 6/6 步：配置汇总',
    step6_server: '服务器：{url}',
    step6_project: '项目：{owner}/{repo}',
    step6_token: 'Token：{method}',
    step6_defaultContext: '默认上下文：{value}',
    step6_confirm: '确认并创建配置？',

    // Step 7: Saving
    step7_saving: '正在保存配置...',
    step7_creatingFiles: '正在创建配置文件...',
    step7_updatingGlobal: '正在更新全局配置...',

    // Step 8: Complete
    step8_title: '✨ 配置完成！',
    step8_success: 'Gitea MCP 已成功为此项目配置。',
    step8_filesCreated: '已创建的文件：',
    step8_nextSteps: '后续步骤：',
    step8_next1: '1. 开始使用 Gitea MCP 工具',
    step8_next2: '2. 将 .gitea-mcp.local.json 添加到 .gitignore（如果使用本地文件）',
    step8_next3: '3. 运行 `gitea_mcp_config_list` 查看有效配置',
  },

  server: {
    add_title: '添加 Gitea 服务器',
    add_url: '服务器 URL：',
    add_name: '服务器名称：',
    add_setDefault: '设为默认？',
    add_success: '✓ 服务器添加成功：{name}',
    add_failed: '✗ 服务器添加失败：{error}',

    list_title: 'Gitea 服务器列表',
    list_noServers: '没有配置的服务器',
    list_default: '（默认）',

    remove_confirm: '确认删除服务器 "{name}"？',
    remove_success: '✓ 服务器已删除：{name}',
    remove_failed: '✗ 服务器删除失败：{error}',
  },

  token: {
    add_title: '添加 API Token',
    add_selectServer: '选择服务器：',
    add_tokenValue: 'Token 值：',
    add_tokenName: 'Token 名称：',
    add_username: '用户名（可选）：',
    add_setDefault: '设为此服务器的默认 Token？',
    add_success: '✓ Token 添加成功',
    add_failed: '✗ Token 添加失败：{error}',

    create_title: '创建 API Token',
    create_username: '用户名：',
    create_password: '密码：',
    create_tokenName: 'Token 名称：',
    create_scopes: 'Token 权限范围（逗号分隔，可选）：',
    create_creating: '正在创建 Token...',
    create_success: '✓ Token 已创建：{token}',
    create_failed: '✗ Token 创建失败：{error}',

    list_title: 'API Token 列表',
    list_noTokens: '没有可用的 Token',
    list_default: '（默认）',
    list_lastUsed: '最后使用：{time}',
    list_never: '从未使用',

    remove_confirm: '确认删除 Token "{name}"？',
    remove_success: '✓ Token 已删除',
    remove_failed: '✗ Token 删除失败：{error}',
  },

  config: {
    list_title: '配置概览',
    list_global: '全局配置',
    list_project: '项目配置',
    list_local: '本地配置',
    list_env: '环境变量',
    list_effective: '有效配置',
    list_notSet: '（未设置）',

    validate_title: '验证配置',
    validate_checking: '正在检查配置...',
    validate_success: '✓ 配置有效',
    validate_failed: '✗ 配置验证失败：{error}',

    reset_confirm: '重置项目配置？这将删除 .gitea-mcp.json 和 .gitea-mcp.local.json',
    reset_success: '✓ 配置已重置',
    reset_failed: '✗ 配置重置失败：{error}',
  },

  language: {
    set_title: '设置语言',
    set_select: '选择语言：',
    set_success: '✓ 语言已更改为：{language}',
    set_failed: '✗ 语言设置失败：{error}',

    get_current: '当前语言：{language}',
    get_supported: '支持的语言：',

    names: {
      en: 'English（英语）',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      ja: '日本語（日语）',
      ko: '한국어（韩语）',
    },
  },

  errors: {
    configNotFound: '未找到配置文件',
    configInvalid: '配置格式无效',
    serverNotFound: '未找到服务器：{server}',
    tokenNotFound: '未找到 Token',
    tokenInvalid: 'Token 无效',
    apiError: 'API 错误：{message}',
    networkError: '网络错误：{message}',
    permissionDenied: '权限被拒绝',
    fileNotFound: '文件未找到：{path}',
    fileWriteError: '文件写入失败：{path}',
    gitNotFound: '未找到 Git 仓库',
    gitRemoteNotFound: 'Git 远程仓库未配置',
    invalidUrl: 'URL 无效：{url}',
    invalidInput: '输入无效：{input}',
    operationCancelled: '操作已取消',
    unknownError: '发生未知错误',
  },

  success: {
    configCreated: '配置创建成功',
    configUpdated: '配置更新成功',
    serverAdded: '服务器添加成功',
    serverRemoved: '服务器删除成功',
    tokenAdded: 'Token 添加成功',
    tokenCreated: 'Token 创建成功',
    tokenRemoved: 'Token 删除成功',
    languageChanged: '语言更改成功',
    operationCompleted: '操作完成',
  },
};
