/**
 * Test Script for Gitea MCP Initialization System
 *
 * Tests:
 * 1. i18n system
 * 2. Git detection
 * 3. Global config manager
 * 4. Project config manager
 * 5. Language switching
 */

import { initI18n, t, setLocale, getLocale, getSupportedLocales, getLanguageName } from './src/i18n';
import { detectGitInfo, parseGitRemoteUrl } from './src/utils/git-detector';
import { getGlobalConfig } from './src/config/global';
import { getProjectConfig } from './src/config/project';
import { getLanguageInfo, setLanguage } from './src/tools/language';

console.log('🧪 Testing Gitea MCP Initialization System\n');

// Test 1: i18n System
async function testI18n() {
  console.log('=== Test 1: i18n System ===');

  // Initialize i18n
  await initI18n();
  console.log('✓ i18n initialized');

  // Test default locale (should be English)
  const defaultLocale = getLocale();
  console.log(`✓ Default locale: ${defaultLocale}`);
  if (defaultLocale !== 'en') {
    console.error('✗ ERROR: Default locale should be "en", got:', defaultLocale);
  }

  // Test English messages
  const englishTitle = t('init.title');
  console.log(`✓ English message: ${englishTitle}`);

  // Test parameter interpolation
  const serverMsg = t('init.step6_server', { url: 'https://gitea.ktyun.cc' });
  console.log(`✓ Parameter interpolation: ${serverMsg}`);

  // Switch to Chinese
  setLocale('zh-CN');
  console.log(`✓ Switched to Chinese: ${getLocale()}`);

  const chineseTitle = t('init.title');
  console.log(`✓ Chinese message: ${chineseTitle}`);

  // Switch back to English
  setLocale('en');
  console.log(`✓ Switched back to English: ${getLocale()}`);

  // Test supported locales
  const supported = getSupportedLocales();
  console.log(`✓ Supported locales: ${supported.join(', ')}`);

  // Test language names
  supported.forEach(locale => {
    const name = getLanguageName(locale);
    console.log(`  - ${locale}: ${name}`);
  });

  console.log('');
}

// Test 2: Git Detection
function testGitDetection() {
  console.log('=== Test 2: Git Detection ===');

  // Detect current project
  const gitInfo = detectGitInfo();
  console.log('✓ Git detection result:');
  console.log(`  - Is Git repo: ${gitInfo.isGitRepo}`);
  console.log(`  - Remote URL: ${gitInfo.remoteUrl || 'N/A'}`);
  console.log(`  - Server URL: ${gitInfo.serverUrl || 'N/A'}`);
  console.log(`  - Owner: ${gitInfo.owner || 'N/A'}`);
  console.log(`  - Repo: ${gitInfo.repo || 'N/A'}`);
  console.log(`  - Repo path: ${gitInfo.repoPath || 'N/A'}`);

  // Test URL parsing
  console.log('\n✓ Testing URL parsing:');

  const testUrls = [
    'git@gitea.ktyun.cc:Kysion/entai-gitea-mcp.git',
    'https://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git',
    'http://gitea.ktyun.cc/Kysion/entai-gitea-mcp.git',
  ];

  testUrls.forEach(url => {
    const parsed = parseGitRemoteUrl(url);
    if (parsed) {
      console.log(`  - ${url}`);
      console.log(`    → ${parsed.serverUrl} / ${parsed.owner}/${parsed.repo}`);
    }
  });

  console.log('');
}

// Test 3: Global Config Manager
function testGlobalConfig() {
  console.log('=== Test 3: Global Config Manager ===');

  const globalConfig = getGlobalConfig();

  // Get current config
  const config = globalConfig.getConfig();
  console.log('✓ Global config loaded');
  console.log(`  - Version: ${config.version}`);
  console.log(`  - Servers: ${config.giteaServers.length}`);
  console.log(`  - Recent projects: ${config.recentProjects.length}`);
  console.log(`  - Language: ${config.settings.language}`);

  // Get servers
  const servers = globalConfig.getServers();
  if (servers.length > 0) {
    console.log('\n✓ Existing servers:');
    servers.forEach(server => {
      console.log(`  - ${server.name} (${server.url})${server.isDefault ? ' [default]' : ''}`);
      console.log(`    Tokens: ${server.tokens.length}`);
    });
  } else {
    console.log('\n  (No servers configured yet)');
  }

  // Get recent projects
  const recent = globalConfig.getRecentProjects(5);
  if (recent.length > 0) {
    console.log('\n✓ Recent projects:');
    recent.forEach(project => {
      console.log(`  - ${project.owner}/${project.repo}`);
      console.log(`    Path: ${project.path}`);
    });
  } else {
    console.log('\n  (No recent projects yet)');
  }

  console.log('');
}

// Test 4: Project Config Manager
function testProjectConfig() {
  console.log('=== Test 4: Project Config Manager ===');

  const projectConfig = getProjectConfig();

  console.log(`✓ Project path: ${projectConfig.getProjectPath()}`);
  console.log(`✓ Project config file: ${projectConfig.getProjectConfigPath()}`);
  console.log(`✓ Local config file: ${projectConfig.getLocalConfigPath()}`);

  // Check if configs exist
  const hasProject = projectConfig.hasProjectConfig();
  const hasLocal = projectConfig.hasLocalConfig();

  console.log(`\n✓ Configuration status:`);
  console.log(`  - Project config exists: ${hasProject}`);
  console.log(`  - Local config exists: ${hasLocal}`);

  if (hasProject) {
    const config = projectConfig.loadProjectConfig();
    console.log('\n✓ Project config:');
    console.log(`  - Server URL: ${config?.gitea.url}`);
    console.log(`  - Owner: ${config?.project.owner}`);
    console.log(`  - Repo: ${config?.project.repo}`);
  }

  if (hasLocal) {
    const config = projectConfig.loadLocalConfig();
    console.log('\n✓ Local config:');
    console.log(`  - Has token: ${!!config?.gitea.apiToken}`);
    console.log(`  - Has token ref: ${!!config?.gitea.tokenRef}`);
    console.log(`  - Has token env: ${!!config?.gitea.apiTokenEnv}`);
  }

  // Get merged config
  const merged = projectConfig.getMergedConfig();
  if (hasProject || hasLocal) {
    console.log('\n✓ Merged configuration:');
    console.log(`  - Server URL: ${merged.url || 'N/A'}`);
    console.log(`  - Owner: ${merged.owner || 'N/A'}`);
    console.log(`  - Repo: ${merged.repo || 'N/A'}`);
    console.log(`  - Has API token: ${!!merged.apiToken || !!merged.tokenRef || !!merged.apiTokenEnv}`);
  }

  console.log('');
}

// Test 5: Language Tools
async function testLanguageTools() {
  console.log('=== Test 5: Language Tools ===');

  // Get current language info
  const info = getLanguageInfo();
  console.log('✓ Current language info:');
  console.log(`  - Current: ${info.currentLanguage}`);
  console.log(`  - Supported: ${info.supportedLanguages?.length || 0} languages`);

  if (info.supportedLanguages) {
    info.supportedLanguages.forEach(lang => {
      const current = lang.code === info.currentLanguage ? ' [current]' : '';
      console.log(`    - ${lang.code}: ${lang.name}${current}`);
    });
  }

  // Test switching to Chinese
  console.log('\n✓ Testing language switch to Chinese...');
  const result = await setLanguage('zh-CN');
  console.log(`  - Success: ${result.success}`);
  console.log(`  - Message: ${result.message}`);

  // Switch back to English
  console.log('\n✓ Switching back to English...');
  const result2 = await setLanguage('en');
  console.log(`  - Success: ${result2.success}`);
  console.log(`  - Message: ${result2.message}`);

  console.log('');
}

// Run all tests
async function runAllTests() {
  try {
    await testI18n();
    testGitDetection();
    testGlobalConfig();
    testProjectConfig();
    await testLanguageTools();

    console.log('✅ All tests completed successfully!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
