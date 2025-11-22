/**
 * i18n Message Types
 *
 * Defines the structure of all internationalized messages in the application.
 * Each language pack must implement this interface completely.
 */

export interface I18nMessages {
  /** Common strings used across the application */
  common: {
    yes: string;
    no: string;
    cancel: string;
    confirm: string;
    continue: string;
    back: string;
    skip: string;
    done: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    loading: string;
    saving: string;
  };

  /** Initialization wizard messages */
  init: {
    title: string;
    welcome: string;
    detectingGit: string;
    gitDetected: string;
    noGitDetected: string;

    // Step 1: Server Selection
    step1_title: string;
    step1_selectServer: string;
    step1_useDetected: string;
    step1_addNew: string;
    step1_enterUrl: string;
    step1_enterName: string;
    step1_setDefault: string;

    // Step 2: Project Info
    step2_title: string;
    step2_owner: string;
    step2_repo: string;
    step2_useDetected: string;

    // Step 3: Token Configuration
    step3_title: string;
    step3_selectMethod: string;
    step3_method_create: string;
    step3_method_input: string;
    step3_method_cache: string;
    step3_method_env: string;

    // Token Creation
    step3_create_username: string;
    step3_create_password: string;
    step3_create_tokenName: string;
    step3_create_creating: string;
    step3_create_success: string;
    step3_create_failed: string;

    // Token Input
    step3_input_token: string;
    step3_input_tokenName: string;

    // Token Cache Selection
    step3_cache_select: string;
    step3_cache_none: string;

    // Environment Variable
    step3_env_varName: string;

    // Step 4: Token Save Method
    step4_title: string;
    step4_select: string;
    step4_local: string;
    step4_local_desc: string;
    step4_ref: string;
    step4_ref_desc: string;
    step4_env: string;
    step4_env_desc: string;

    // Step 5: Default Context
    step5_title: string;
    step5_setDefault: string;

    // Step 6: Summary
    step6_title: string;
    step6_server: string;
    step6_project: string;
    step6_token: string;
    step6_defaultContext: string;
    step6_confirm: string;

    // Step 7: Saving
    step7_saving: string;
    step7_creatingFiles: string;
    step7_updatingGlobal: string;

    // Step 8: Complete
    step8_title: string;
    step8_success: string;
    step8_filesCreated: string;
    step8_nextSteps: string;
    step8_next1: string;
    step8_next2: string;
    step8_next3: string;
  };

  /** Server management messages */
  server: {
    add_title: string;
    add_url: string;
    add_name: string;
    add_setDefault: string;
    add_success: string;
    add_failed: string;

    list_title: string;
    list_noServers: string;
    list_default: string;

    remove_confirm: string;
    remove_success: string;
    remove_failed: string;
  };

  /** Token management messages */
  token: {
    add_title: string;
    add_selectServer: string;
    add_tokenValue: string;
    add_tokenName: string;
    add_username: string;
    add_setDefault: string;
    add_success: string;
    add_failed: string;

    create_title: string;
    create_username: string;
    create_password: string;
    create_tokenName: string;
    create_scopes: string;
    create_creating: string;
    create_success: string;
    create_failed: string;

    list_title: string;
    list_noTokens: string;
    list_default: string;
    list_lastUsed: string;
    list_never: string;

    remove_confirm: string;
    remove_success: string;
    remove_failed: string;
  };

  /** Configuration management messages */
  config: {
    list_title: string;
    list_global: string;
    list_project: string;
    list_local: string;
    list_env: string;
    list_effective: string;
    list_notSet: string;

    validate_title: string;
    validate_checking: string;
    validate_success: string;
    validate_failed: string;

    reset_confirm: string;
    reset_success: string;
    reset_failed: string;
  };

  /** Language management messages */
  language: {
    set_title: string;
    set_select: string;
    set_success: string;
    set_failed: string;

    get_current: string;
    get_supported: string;

    names: {
      en: string;
      'zh-CN': string;
      'zh-TW': string;
      ja: string;
      ko: string;
    };
  };

  /** Error messages */
  errors: {
    configNotFound: string;
    configInvalid: string;
    serverNotFound: string;
    tokenNotFound: string;
    tokenInvalid: string;
    apiError: string;
    networkError: string;
    permissionDenied: string;
    fileNotFound: string;
    fileWriteError: string;
    gitNotFound: string;
    gitRemoteNotFound: string;
    invalidUrl: string;
    invalidInput: string;
    operationCancelled: string;
    unknownError: string;
  };

  /** Success messages */
  success: {
    configCreated: string;
    configUpdated: string;
    serverAdded: string;
    serverRemoved: string;
    tokenAdded: string;
    tokenCreated: string;
    tokenRemoved: string;
    languageChanged: string;
    operationCompleted: string;
  };
}

/**
 * Supported locales
 */
export type SupportedLocale = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko';

/**
 * Translation function type
 */
export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;
