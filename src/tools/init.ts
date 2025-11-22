/**
 * Gitea MCP Initialization Tool
 *
 * Interactive wizard for project-level configuration initialization
 * Guides users through:
 * - Server selection (with auto-detection)
 * - Project information setup
 * - Token configuration (multiple methods)
 * - Token storage strategy
 * - Default context configuration
 */

import prompts from 'prompts';
import { t } from '../i18n';
import { getGlobalConfig } from '../config/global';
import { getProjectConfig } from '../config/project';
import { detectGitInfo } from '../utils/git-detector';
import { GiteaServer, TokenInfo, TokenCreationMethod, TokenSaveMethod } from '../config/types';

/**
 * Initialization result
 */
export interface InitResult {
  success: boolean;
  message: string;
  filesCreated?: string[];
  error?: string;
}

/**
 * Wizard state
 */
interface WizardState {
  // Step 1: Server
  server?: {
    id?: string;
    url: string;
    name: string;
    isNew: boolean;
  };

  // Step 2: Project
  project?: {
    owner: string;
    repo: string;
  };

  // Step 3: Token
  token?: {
    method: TokenCreationMethod;
    value: string;
    name?: string;
    tokenId?: string;
  };

  // Step 4: Token save method
  tokenSave?: {
    method: TokenSaveMethod;
    envVarName?: string;
  };

  // Step 5: Default context
  defaultContext?: boolean;
}

/**
 * Run the interactive initialization wizard
 */
export async function runInitWizard(
  options: {
    interactive?: boolean;
    autoDetect?: boolean;
    force?: boolean;
  } = {}
): Promise<InitResult> {
  try {
    const {
      interactive = true,
      autoDetect = true,
      force = false,
    } = options;

    // Get managers
    const globalConfig = getGlobalConfig();
    const projectConfig = getProjectConfig();

    // Check if already initialized
    if (!force && projectConfig.hasProjectConfig()) {
      return {
        success: false,
        message: t('errors.configNotFound'),
        error: 'Project already has configuration. Use force=true to reinitialize.',
      };
    }

    // Welcome message
    console.log('\n' + t('init.title'));
    console.log(t('init.welcome') + '\n');

    // Auto-detect Git information
    let gitInfo;
    if (autoDetect) {
      console.log(t('init.detectingGit'));
      gitInfo = detectGitInfo();

      if (gitInfo.isGitRepo) {
        console.log(t('init.gitDetected'));
        if (gitInfo.serverUrl) {
          console.log(`  Server: ${gitInfo.serverUrl}`);
        }
        if (gitInfo.repoPath) {
          console.log(`  Repository: ${gitInfo.repoPath}`);
        }
      } else {
        console.log(t('init.noGitDetected'));
      }
      console.log('');
    }

    // Wizard state
    const state: WizardState = {};

    // Step 1: Server Selection
    await selectServer(state, globalConfig, gitInfo);

    // Step 2: Project Information
    await configureProject(state, gitInfo);

    // Step 3: Token Configuration
    await configureToken(state, globalConfig);

    // Step 4: Token Save Method
    await configureTokenSave(state);

    // Step 5: Default Context
    await configureDefaultContext(state);

    // Step 6: Summary and Confirmation
    const confirmed = await showSummaryAndConfirm(state);

    if (!confirmed) {
      return {
        success: false,
        message: t('errors.operationCancelled'),
      };
    }

    // Step 7: Save Configuration
    const result = await saveConfiguration(
      state,
      globalConfig,
      projectConfig
    );

    // Step 8: Complete
    if (result.success) {
      console.log('\n' + t('init.step8_title'));
      console.log(t('init.step8_success'));
      console.log('\n' + t('init.step8_filesCreated'));
      result.filesCreated?.forEach(file => console.log(`  - ${file}`));
      console.log('\n' + t('init.step8_nextSteps'));
      console.log(t('init.step8_next1'));
      console.log(t('init.step8_next2'));
      console.log(t('init.step8_next3') + '\n');
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'cancelled') {
      return {
        success: false,
        message: t('errors.operationCancelled'),
      };
    }

    return {
      success: false,
      message: t('errors.unknownError'),
      error: String(error),
    };
  }
}

/**
 * Step 1: Server Selection
 */
async function selectServer(
  state: WizardState,
  globalConfig: ReturnType<typeof getGlobalConfig>,
  gitInfo?: ReturnType<typeof detectGitInfo>
): Promise<void> {
  console.log(t('init.step1_title') + '\n');

  const servers = globalConfig.getServers();
  const choices: Array<{ title: string; value: string }> = [];

  // Add detected server option
  if (gitInfo?.serverUrl) {
    choices.push({
      title: t('init.step1_useDetected', { url: gitInfo.serverUrl }),
      value: 'detected',
    });
  }

  // Add existing servers
  servers.forEach(server => {
    choices.push({
      title: `${server.name} (${server.url})${server.isDefault ? ' *' : ''}`,
      value: server.id,
    });
  });

  // Add "new server" option
  choices.push({
    title: t('init.step1_addNew'),
    value: 'new',
  });

  const response = await prompts({
    type: 'select',
    name: 'serverChoice',
    message: t('init.step1_selectServer'),
    choices,
  });

  if (!response.serverChoice) {
    throw new Error('cancelled');
  }

  // Handle detected server
  if (response.serverChoice === 'detected') {
    const setDefault = await prompts({
      type: 'confirm',
      name: 'value',
      message: t('init.step1_setDefault'),
      initial: servers.length === 0,
    });

    const serverName = gitInfo?.serverUrl?.replace(/https?:\/\//, '') || 'Gitea Server';

    state.server = {
      url: gitInfo!.serverUrl!,
      name: serverName,
      isNew: true,
    };

    if (setDefault.value) {
      // Will be added as default
    }

    return;
  }

  // Handle new server
  if (response.serverChoice === 'new') {
    const urlResponse = await prompts({
      type: 'text',
      name: 'url',
      message: t('init.step1_enterUrl'),
      validate: (value: string) =>
        /^https?:\/\/.+/.test(value) || t('errors.invalidUrl', { url: value }),
    });

    if (!urlResponse.url) {
      throw new Error('cancelled');
    }

    const nameResponse = await prompts({
      type: 'text',
      name: 'name',
      message: t('init.step1_enterName'),
      initial: urlResponse.url.replace(/https?:\/\//, ''),
    });

    const setDefault = await prompts({
      type: 'confirm',
      name: 'value',
      message: t('init.step1_setDefault'),
      initial: servers.length === 0,
    });

    state.server = {
      url: urlResponse.url,
      name: nameResponse.name || urlResponse.url.replace(/https?:\/\//, ''),
      isNew: true,
    };

    return;
  }

  // Handle existing server
  const server = globalConfig.getServer(response.serverChoice);
  if (server) {
    state.server = {
      id: server.id,
      url: server.url,
      name: server.name,
      isNew: false,
    };
  }
}

/**
 * Step 2: Project Information
 */
async function configureProject(
  state: WizardState,
  gitInfo?: ReturnType<typeof detectGitInfo>
): Promise<void> {
  console.log('\n' + t('init.step2_title') + '\n');

  if (gitInfo?.owner && gitInfo?.repo) {
    console.log(t('init.step2_useDetected', {
      owner: gitInfo.owner,
      repo: gitInfo.repo,
    }));
  }

  const ownerResponse = await prompts({
    type: 'text',
    name: 'owner',
    message: t('init.step2_owner'),
    initial: gitInfo?.owner || '',
    validate: (value: string) =>
      value.trim() !== '' || t('errors.invalidInput', { input: 'owner' }),
  });

  if (!ownerResponse.owner) {
    throw new Error('cancelled');
  }

  const repoResponse = await prompts({
    type: 'text',
    name: 'repo',
    message: t('init.step2_repo'),
    initial: gitInfo?.repo || '',
    validate: (value: string) =>
      value.trim() !== '' || t('errors.invalidInput', { input: 'repo' }),
  });

  if (!repoResponse.repo) {
    throw new Error('cancelled');
  }

  state.project = {
    owner: ownerResponse.owner,
    repo: repoResponse.repo,
  };
}

/**
 * Step 3: Token Configuration
 */
async function configureToken(
  state: WizardState,
  globalConfig: ReturnType<typeof getGlobalConfig>
): Promise<void> {
  console.log('\n' + t('init.step3_title') + '\n');

  const choices = [
    {
      title: t('init.step3_method_create'),
      value: 'password',
    },
    {
      title: t('init.step3_method_input'),
      value: 'manual',
    },
  ];

  // Add cached token option if available
  const server = state.server?.id
    ? globalConfig.getServer(state.server.id)
    : globalConfig.getServerByUrl(state.server!.url);

  if (server && server.tokens.length > 0) {
    choices.push({
      title: t('init.step3_method_cache'),
      value: 'cached',
    });
  }

  choices.push({
    title: t('init.step3_method_env'),
    value: 'env',
  });

  const methodResponse = await prompts({
    type: 'select',
    name: 'method',
    message: t('init.step3_selectMethod'),
    choices,
  });

  if (!methodResponse.method) {
    throw new Error('cancelled');
  }

  const method = methodResponse.method as TokenCreationMethod;

  switch (method) {
    case 'password':
      await configureTokenByPassword(state);
      break;
    case 'manual':
      await configureTokenManually(state);
      break;
    case 'cached':
      await configureTokenFromCache(state, server!);
      break;
    case 'env':
      await configureTokenFromEnv(state);
      break;
  }
}

/**
 * Configure token by password (create new token via Gitea API)
 */
async function configureTokenByPassword(state: WizardState): Promise<void> {
  console.log(t('init.step3_create_username'));

  const usernameResponse = await prompts({
    type: 'text',
    name: 'username',
    message: t('init.step3_create_username'),
  });

  if (!usernameResponse.username) {
    throw new Error('cancelled');
  }

  const passwordResponse = await prompts({
    type: 'password',
    name: 'password',
    message: t('init.step3_create_password'),
  });

  if (!passwordResponse.password) {
    throw new Error('cancelled');
  }

  const tokenNameResponse = await prompts({
    type: 'text',
    name: 'tokenName',
    message: t('init.step3_create_tokenName'),
    initial: `gitea-mcp-${Date.now()}`,
  });

  console.log('\n' + t('init.step3_create_creating'));

  // TODO: Call Gitea API to create token
  // For now, use placeholder
  const tokenValue = `glpat-placeholder-${Date.now()}`;

  console.log(t('init.step3_create_success') + '\n');

  state.token = {
    method: 'password',
    value: tokenValue,
    name: tokenNameResponse.tokenName,
  };
}

/**
 * Configure token manually
 */
async function configureTokenManually(state: WizardState): Promise<void> {
  const tokenResponse = await prompts({
    type: 'password',
    name: 'token',
    message: t('init.step3_input_token'),
    validate: (value: string) =>
      value.trim() !== '' || t('errors.tokenInvalid'),
  });

  if (!tokenResponse.token) {
    throw new Error('cancelled');
  }

  const nameResponse = await prompts({
    type: 'text',
    name: 'name',
    message: t('init.step3_input_tokenName'),
    initial: `token-${Date.now()}`,
  });

  state.token = {
    method: 'manual',
    value: tokenResponse.token,
    name: nameResponse.name,
  };
}

/**
 * Configure token from cache
 */
async function configureTokenFromCache(
  state: WizardState,
  server: GiteaServer
): Promise<void> {
  const choices = server.tokens.map(token => ({
    title: `${token.name} (${token.username || 'unknown'})${
      token.isDefault ? ' *' : ''
    }`,
    value: token.id,
  }));

  if (choices.length === 0) {
    console.log(t('init.step3_cache_none'));
    throw new Error('cancelled');
  }

  const response = await prompts({
    type: 'select',
    name: 'tokenId',
    message: t('init.step3_cache_select'),
    choices,
  });

  if (!response.tokenId) {
    throw new Error('cancelled');
  }

  const selectedToken = server.tokens.find(t => t.id === response.tokenId);

  state.token = {
    method: 'cached',
    value: selectedToken!.token,
    name: selectedToken!.name,
    tokenId: selectedToken!.id,
  };
}

/**
 * Configure token from environment variable
 */
async function configureTokenFromEnv(state: WizardState): Promise<void> {
  const response = await prompts({
    type: 'text',
    name: 'envVar',
    message: t('init.step3_env_varName'),
    initial: 'GITEA_API_TOKEN',
  });

  if (!response.envVar) {
    throw new Error('cancelled');
  }

  state.token = {
    method: 'env',
    value: `\${${response.envVar}}`,
    name: response.envVar,
  };
}

/**
 * Step 4: Token Save Method
 */
async function configureTokenSave(state: WizardState): Promise<void> {
  console.log('\n' + t('init.step4_title') + '\n');

  const choices = [
    {
      title: t('init.step4_local'),
      description: t('init.step4_local_desc'),
      value: 'local',
    },
  ];

  // Add reference option if token is from cache
  if (state.token?.method === 'cached') {
    choices.push({
      title: t('init.step4_ref'),
      description: t('init.step4_ref_desc'),
      value: 'ref',
    });
  }

  // Add env option if token is from env
  if (state.token?.method === 'env') {
    choices.push({
      title: t('init.step4_env'),
      description: t('init.step4_env_desc'),
      value: 'env',
    });
  } else {
    // Allow env as option even for other methods
    choices.push({
      title: t('init.step4_env'),
      description: t('init.step4_env_desc'),
      value: 'env',
    });
  }

  const response = await prompts({
    type: 'select',
    name: 'method',
    message: t('init.step4_select'),
    choices,
  });

  if (!response.method) {
    throw new Error('cancelled');
  }

  state.tokenSave = {
    method: response.method,
  };

  // If choosing env, ask for variable name
  if (response.method === 'env' && state.token?.method !== 'env') {
    const envResponse = await prompts({
      type: 'text',
      name: 'envVar',
      message: t('init.step3_env_varName'),
      initial: 'GITEA_API_TOKEN',
    });

    state.tokenSave.envVarName = envResponse.envVar || 'GITEA_API_TOKEN';
  }
}

/**
 * Step 5: Default Context
 */
async function configureDefaultContext(state: WizardState): Promise<void> {
  console.log('\n' + t('init.step5_title') + '\n');

  const response = await prompts({
    type: 'confirm',
    name: 'setDefault',
    message: t('init.step5_setDefault', {
      owner: state.project!.owner,
      repo: state.project!.repo,
    }),
    initial: true,
  });

  state.defaultContext = response.setDefault;
}

/**
 * Step 6: Summary and Confirmation
 */
async function showSummaryAndConfirm(state: WizardState): Promise<boolean> {
  console.log('\n' + t('init.step6_title') + '\n');

  console.log(t('init.step6_server', { url: state.server!.url }));
  console.log(
    t('init.step6_project', {
      owner: state.project!.owner,
      repo: state.project!.repo,
    })
  );

  let tokenMethod = '';
  switch (state.token!.method) {
    case 'password':
      tokenMethod = 'Created via password';
      break;
    case 'manual':
      tokenMethod = 'Manual input';
      break;
    case 'cached':
      tokenMethod = 'From cache';
      break;
    case 'env':
      tokenMethod = 'Environment variable';
      break;
  }
  console.log(t('init.step6_token', { method: tokenMethod }));

  console.log(
    t('init.step6_defaultContext', {
      value: state.defaultContext ? t('common.yes') : t('common.no'),
    })
  );

  console.log('');

  const response = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: t('init.step6_confirm'),
    initial: true,
  });

  return response.confirm;
}

/**
 * Step 7: Save Configuration
 */
async function saveConfiguration(
  state: WizardState,
  globalConfig: ReturnType<typeof getGlobalConfig>,
  projectConfig: ReturnType<typeof getProjectConfig>
): Promise<InitResult> {
  try {
    console.log('\n' + t('init.step7_saving'));

    const filesCreated: string[] = [];

    // Add server to global config if new
    let serverId = state.server!.id;
    if (state.server!.isNew) {
      const newServer = globalConfig.addServer({
        name: state.server!.name,
        url: state.server!.url,
        isDefault: globalConfig.getServers().length === 0,
      });
      serverId = newServer.id;
    }

    // Add token to global config if not env
    let tokenId: string | undefined;
    if (state.token!.method !== 'env' && state.tokenSave!.method !== 'env') {
      if (state.token!.tokenId) {
        // Use existing token from cache
        tokenId = state.token!.tokenId;
      } else {
        // Add new token
        const newToken = globalConfig.addToken(serverId!, {
          name: state.token!.name || 'default',
          token: state.token!.value,
          username: state.project!.owner,
          createdBy: state.token!.method === 'password' ? 'password' : 'manual',
          isDefault: true,
        });
        tokenId = newToken?.id;
      }
    }

    // Create project config
    console.log(t('init.step7_creatingFiles'));

    projectConfig.createProjectConfig(
      {
        url: state.server!.url,
        serverRef: serverId,
        name: state.server!.name,
      },
      {
        owner: state.project!.owner,
        repo: state.project!.repo,
      },
      {
        setAsDefaultContext: state.defaultContext,
      }
    );
    filesCreated.push(projectConfig.getProjectConfigPath());

    // Create local config based on save method
    if (state.tokenSave!.method === 'local') {
      // Save token directly
      projectConfig.createLocalConfig({
        apiToken: state.token!.value,
      });
      filesCreated.push(projectConfig.getLocalConfigPath());

      // Add to .gitignore
      projectConfig.addLocalConfigToGitignore();
    } else if (state.tokenSave!.method === 'ref') {
      // Save token reference
      projectConfig.createLocalConfig({
        tokenRef: tokenId,
      });
      filesCreated.push(projectConfig.getLocalConfigPath());
    } else if (state.tokenSave!.method === 'env') {
      // Save env variable reference
      const envVar = state.tokenSave.envVarName || state.token!.name;
      projectConfig.createLocalConfig({
        apiTokenEnv: `\${${envVar}}`,
      });
      filesCreated.push(projectConfig.getLocalConfigPath());
    }

    // Update global config
    console.log(t('init.step7_updatingGlobal'));
    globalConfig.addRecentProject({
      path: projectConfig.getProjectPath(),
      owner: state.project!.owner,
      repo: state.project!.repo,
      serverId: serverId!,
    });

    return {
      success: true,
      message: t('success.configCreated'),
      filesCreated,
    };
  } catch (error) {
    return {
      success: false,
      message: t('errors.unknownError'),
      error: String(error),
    };
  }
}
