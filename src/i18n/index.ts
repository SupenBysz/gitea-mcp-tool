/**
 * i18n Manager
 *
 * Provides internationalization support with:
 * - Multiple language packs (en, zh-CN, etc.)
 * - Dynamic locale switching
 * - Parameter interpolation in messages
 * - Language preference persistence
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { I18nMessages, SupportedLocale, TranslationFunction } from './types';
import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';

/**
 * Available language packs
 */
const locales: Record<SupportedLocale, I18nMessages> = {
  'en': en,
  'zh-CN': zhCN,
  // TODO: Add more languages
  // 'zh-TW': zhTW,
  // 'ja': ja,
  // 'ko': ko,
};

/**
 * Global config path
 */
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.gitea-mcp');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

/**
 * I18n Manager Class
 */
class I18n {
  private currentLocale: SupportedLocale = 'en'; // Default: English
  private messages: I18nMessages = en;

  /**
   * Initialize i18n system
   * - Loads language preference from global config
   * - Falls back to English if preference not found
   */
  async init(): Promise<void> {
    try {
      // Load global config to get saved language preference
      if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
        const configContent = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
        const globalConfig = JSON.parse(configContent);

        const savedLanguage = globalConfig?.settings?.language;
        if (savedLanguage && locales[savedLanguage as SupportedLocale]) {
          this.setLocale(savedLanguage as SupportedLocale);
        }
      }
    } catch (error) {
      // If error reading config, just use default (English)
      console.warn('Failed to load language preference, using default (English)');
    }
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Set locale and switch language pack
   * @param locale - Target locale
   * @returns true if successful
   */
  setLocale(locale: SupportedLocale): boolean {
    if (!locales[locale]) {
      console.error(`Locale "${locale}" not found, keeping current locale: ${this.currentLocale}`);
      return false;
    }

    this.currentLocale = locale;
    this.messages = locales[locale];
    return true;
  }

  /**
   * Save language preference to global config
   * @param locale - Locale to save
   */
  async saveLanguagePreference(locale: SupportedLocale): Promise<void> {
    try {
      // Ensure directory exists
      if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
        fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
      }

      // Load or create global config
      let globalConfig: any = {
        version: '1.0',
        giteaServers: [],
        recentProjects: [],
        settings: {
          language: 'en',
          autoSave: true,
          autoDetectFromGit: true,
        },
      };

      if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
        const content = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
        globalConfig = JSON.parse(content);
      }

      // Update language setting
      if (!globalConfig.settings) {
        globalConfig.settings = {};
      }
      globalConfig.settings.language = locale;

      // Save to file
      fs.writeFileSync(
        GLOBAL_CONFIG_FILE,
        JSON.stringify(globalConfig, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save language preference: ${error}`);
    }
  }

  /**
   * Get list of supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return Object.keys(locales) as SupportedLocale[];
  }

  /**
   * Get localized language name
   * @param locale - Locale to get name for
   * @returns Localized language name
   */
  getLanguageName(locale: SupportedLocale): string {
    return this.messages.language.names[locale] || locale;
  }

  /**
   * Translate a message key with parameter interpolation
   * @param key - Message key in dot notation (e.g., 'init.title')
   * @param params - Parameters for interpolation (e.g., {url: 'https://...'})
   * @returns Translated message with parameters replaced
   */
  t(key: string, params?: Record<string, string | number>): string {
    // Navigate the nested message structure using dot notation
    const keys = key.split('.');
    let message: any = this.messages;

    for (const k of keys) {
      if (message && typeof message === 'object' && k in message) {
        message = message[k];
      } else {
        // Key not found, return the key itself as fallback
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // Ensure we got a string
    if (typeof message !== 'string') {
      console.warn(`Translation key "${key}" does not resolve to a string`);
      return key;
    }

    // Replace parameters in the message
    if (params) {
      return this.interpolate(message, params);
    }

    return message;
  }

  /**
   * Replace parameters in a message string
   * @param message - Message template with {param} placeholders
   * @param params - Parameter values
   * @returns Message with parameters replaced
   */
  private interpolate(message: string, params: Record<string, string | number>): string {
    return message.replace(/\{(\w+)\}/g, (match, key) => {
      if (key in params) {
        return String(params[key]);
      }
      return match; // Keep placeholder if parameter not found
    });
  }
}

/**
 * Singleton instance
 */
export const i18n = new I18n();

/**
 * Helper: Translate function
 */
export const t: TranslationFunction = (key, params) => i18n.t(key, params);

/**
 * Helper: Get current locale
 */
export const getLocale = () => i18n.getLocale();

/**
 * Helper: Set locale
 */
export const setLocale = (locale: SupportedLocale) => i18n.setLocale(locale);

/**
 * Helper: Save language preference
 */
export const saveLanguagePreference = async (locale: SupportedLocale) => {
  await i18n.saveLanguagePreference(locale);
};

/**
 * Helper: Get supported locales
 */
export const getSupportedLocales = () => i18n.getSupportedLocales();

/**
 * Helper: Get language name
 */
export const getLanguageName = (locale: SupportedLocale) => i18n.getLanguageName(locale);

/**
 * Initialize i18n system
 * Should be called at application startup
 */
export const initI18n = async () => {
  await i18n.init();
};
