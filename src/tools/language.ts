/**
 * Language Management Tools
 *
 * Provides MCP tools for managing UI language preferences:
 * - gitea_mcp_language_set: Change the UI language
 * - gitea_mcp_language_get: Get current and available languages
 */

import { t, i18n, saveLanguagePreference } from '../i18n';
import { SupportedLocale } from '../i18n/types';

/**
 * Language operation result
 */
export interface LanguageResult {
  success: boolean;
  message: string;
  currentLanguage?: string;
  supportedLanguages?: Array<{
    code: SupportedLocale;
    name: string;
  }>;
  error?: string;
}

/**
 * Set the UI language
 * @param locale - Target locale code (e.g., 'en', 'zh-CN')
 * @returns Operation result
 */
export async function setLanguage(locale: SupportedLocale): Promise<LanguageResult> {
  try {
    // Validate locale
    const supported = i18n.getSupportedLocales();
    if (!supported.includes(locale)) {
      return {
        success: false,
        message: t('language.set_failed', {
          error: `Unsupported locale: ${locale}`,
        }),
        error: `Unsupported locale: ${locale}. Supported: ${supported.join(', ')}`,
      };
    }

    // Set locale
    const result = i18n.setLocale(locale);
    if (!result) {
      return {
        success: false,
        message: t('language.set_failed', {
          error: 'Failed to set locale',
        }),
        error: 'Failed to set locale',
      };
    }

    // Save preference to global config
    await saveLanguagePreference(locale);

    const languageName = i18n.getLanguageName(locale);

    return {
      success: true,
      message: t('language.set_success', { language: languageName }),
      currentLanguage: locale,
    };
  } catch (error) {
    return {
      success: false,
      message: t('errors.unknownError'),
      error: String(error),
    };
  }
}

/**
 * Get current and supported languages
 * @returns Language information
 */
export function getLanguageInfo(): LanguageResult {
  try {
    const currentLocale = i18n.getLocale();
    const supportedLocales = i18n.getSupportedLocales();

    const supportedLanguages = supportedLocales.map(locale => ({
      code: locale,
      name: i18n.getLanguageName(locale),
    }));

    const currentLanguageName = i18n.getLanguageName(currentLocale);

    return {
      success: true,
      message: t('language.get_current', { language: currentLanguageName }),
      currentLanguage: currentLocale,
      supportedLanguages,
    };
  } catch (error) {
    return {
      success: false,
      message: t('errors.unknownError'),
      error: String(error),
    };
  }
}

/**
 * Get formatted list of supported languages
 * @returns Formatted string
 */
export function getLanguageList(): string {
  const info = getLanguageInfo();

  if (!info.success || !info.supportedLanguages) {
    return t('errors.unknownError');
  }

  let output = t('language.get_current', {
    language: info.currentLanguage || 'unknown',
  });
  output += '\n\n' + t('language.get_supported') + '\n';

  info.supportedLanguages.forEach(lang => {
    const current = lang.code === info.currentLanguage ? ' *' : '';
    output += `  - ${lang.code}: ${lang.name}${current}\n`;
  });

  return output;
}
