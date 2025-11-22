/**
 * English Language Pack (Default)
 */

import { I18nMessages } from '../types';

export const en: I18nMessages = {
  common: {
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
    confirm: 'Confirm',
    continue: 'Continue',
    back: 'Back',
    skip: 'Skip',
    done: 'Done',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    loading: 'Loading...',
    saving: 'Saving...',
  },

  init: {
    title: '🚀 Gitea MCP Configuration Wizard',
    welcome: 'Welcome to Gitea MCP! Let\'s set up your project configuration.',
    detectingGit: 'Detecting Git repository information...',
    gitDetected: '✓ Git repository detected',
    noGitDetected: '⚠ No Git repository detected',

    // Step 1: Server Selection
    step1_title: 'Step 1/6: Select Gitea Server',
    step1_selectServer: 'Select a Gitea server:',
    step1_useDetected: 'Use detected: {url}',
    step1_addNew: 'Add new server',
    step1_enterUrl: 'Enter Gitea server URL:',
    step1_enterName: 'Enter server name (optional):',
    step1_setDefault: 'Set as default server?',

    // Step 2: Project Info
    step2_title: 'Step 2/6: Project Information',
    step2_owner: 'Repository owner (username or organization):',
    step2_repo: 'Repository name:',
    step2_useDetected: 'Detected: {owner}/{repo}',

    // Step 3: Token Configuration
    step3_title: 'Step 3/6: API Token Configuration',
    step3_selectMethod: 'How would you like to configure the API token?',
    step3_method_create: 'Create new token (via password)',
    step3_method_input: 'Enter existing token',
    step3_method_cache: 'Use cached token',
    step3_method_env: 'Use environment variable',

    // Token Creation
    step3_create_username: 'Gitea username:',
    step3_create_password: 'Gitea password:',
    step3_create_tokenName: 'Token name:',
    step3_create_creating: 'Creating token...',
    step3_create_success: '✓ Token created successfully',
    step3_create_failed: '✗ Failed to create token: {error}',

    // Token Input
    step3_input_token: 'Enter API token:',
    step3_input_tokenName: 'Token name (optional):',

    // Token Cache Selection
    step3_cache_select: 'Select a cached token:',
    step3_cache_none: 'No cached tokens available',

    // Environment Variable
    step3_env_varName: 'Environment variable name (default: GITEA_API_TOKEN):',

    // Step 4: Token Save Method
    step4_title: 'Step 4/6: Token Storage Method',
    step4_select: 'How would you like to save the token?',
    step4_local: 'Local file (.gitea-mcp.local.json)',
    step4_local_desc: 'Saved to .gitea-mcp.local.json (not committed to Git)',
    step4_ref: 'Reference cached token',
    step4_ref_desc: 'Reference token from global config (~/.gitea-mcp/config.json)',
    step4_env: 'Environment variable',
    step4_env_desc: 'Use ${GITEA_API_TOKEN} in config file',

    // Step 5: Default Context
    step5_title: 'Step 5/6: Default Context',
    step5_setDefault: 'Set {owner}/{repo} as default context?',

    // Step 6: Summary
    step6_title: 'Step 6/6: Configuration Summary',
    step6_server: 'Server: {url}',
    step6_project: 'Project: {owner}/{repo}',
    step6_token: 'Token: {method}',
    step6_defaultContext: 'Default Context: {value}',
    step6_confirm: 'Confirm and create configuration?',

    // Step 7: Saving
    step7_saving: 'Saving configuration...',
    step7_creatingFiles: 'Creating configuration files...',
    step7_updatingGlobal: 'Updating global configuration...',

    // Step 8: Complete
    step8_title: '✨ Configuration Complete!',
    step8_success: 'Gitea MCP has been successfully configured for this project.',
    step8_filesCreated: 'Files created:',
    step8_nextSteps: 'Next steps:',
    step8_next1: '1. Start using Gitea MCP tools',
    step8_next2: '2. Add .gitea-mcp.local.json to .gitignore (if using local file)',
    step8_next3: '3. Run `gitea_mcp_config_list` to view effective configuration',
  },

  server: {
    add_title: 'Add Gitea Server',
    add_url: 'Server URL:',
    add_name: 'Server name:',
    add_setDefault: 'Set as default?',
    add_success: '✓ Server added successfully: {name}',
    add_failed: '✗ Failed to add server: {error}',

    list_title: 'Gitea Servers',
    list_noServers: 'No servers configured',
    list_default: '(default)',

    remove_confirm: 'Remove server "{name}"?',
    remove_success: '✓ Server removed: {name}',
    remove_failed: '✗ Failed to remove server: {error}',
  },

  token: {
    add_title: 'Add API Token',
    add_selectServer: 'Select server:',
    add_tokenValue: 'Token value:',
    add_tokenName: 'Token name:',
    add_username: 'Username (optional):',
    add_setDefault: 'Set as default for this server?',
    add_success: '✓ Token added successfully',
    add_failed: '✗ Failed to add token: {error}',

    create_title: 'Create API Token',
    create_username: 'Username:',
    create_password: 'Password:',
    create_tokenName: 'Token name:',
    create_scopes: 'Token scopes (comma-separated, optional):',
    create_creating: 'Creating token...',
    create_success: '✓ Token created: {token}',
    create_failed: '✗ Failed to create token: {error}',

    list_title: 'API Tokens',
    list_noTokens: 'No tokens available',
    list_default: '(default)',
    list_lastUsed: 'Last used: {time}',
    list_never: 'never',

    remove_confirm: 'Remove token "{name}"?',
    remove_success: '✓ Token removed',
    remove_failed: '✗ Failed to remove token: {error}',
  },

  config: {
    list_title: 'Configuration Overview',
    list_global: 'Global Config',
    list_project: 'Project Config',
    list_local: 'Local Config',
    list_env: 'Environment Variables',
    list_effective: 'Effective Configuration',
    list_notSet: '(not set)',

    validate_title: 'Validating Configuration',
    validate_checking: 'Checking configuration...',
    validate_success: '✓ Configuration is valid',
    validate_failed: '✗ Configuration validation failed: {error}',

    reset_confirm: 'Reset project configuration? This will delete .gitea-mcp.json and .gitea-mcp.local.json',
    reset_success: '✓ Configuration reset',
    reset_failed: '✗ Failed to reset configuration: {error}',
  },

  language: {
    set_title: 'Set Language',
    set_select: 'Select language:',
    set_success: '✓ Language changed to: {language}',
    set_failed: '✗ Failed to set language: {error}',

    get_current: 'Current language: {language}',
    get_supported: 'Supported languages:',

    names: {
      en: 'English',
      'zh-CN': '简体中文 (Simplified Chinese)',
      'zh-TW': '繁體中文 (Traditional Chinese)',
      ja: '日本語 (Japanese)',
      ko: '한국어 (Korean)',
    },
  },

  errors: {
    configNotFound: 'Configuration file not found',
    configInvalid: 'Invalid configuration format',
    serverNotFound: 'Server not found: {server}',
    tokenNotFound: 'Token not found',
    tokenInvalid: 'Invalid token',
    apiError: 'API error: {message}',
    networkError: 'Network error: {message}',
    permissionDenied: 'Permission denied',
    fileNotFound: 'File not found: {path}',
    fileWriteError: 'Failed to write file: {path}',
    gitNotFound: 'Git repository not found',
    gitRemoteNotFound: 'Git remote not configured',
    invalidUrl: 'Invalid URL: {url}',
    invalidInput: 'Invalid input: {input}',
    operationCancelled: 'Operation cancelled',
    unknownError: 'Unknown error occurred',
  },

  success: {
    configCreated: 'Configuration created successfully',
    configUpdated: 'Configuration updated successfully',
    serverAdded: 'Server added successfully',
    serverRemoved: 'Server removed successfully',
    tokenAdded: 'Token added successfully',
    tokenCreated: 'Token created successfully',
    tokenRemoved: 'Token removed successfully',
    languageChanged: 'Language changed successfully',
    operationCompleted: 'Operation completed successfully',
  },
};
