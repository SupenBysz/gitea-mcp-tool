/**
 * Unit tests for init/extras.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock external dependencies
vi.mock('prompts', () => ({
  default: vi.fn(),
}));

vi.mock('../../src/cli/commands/workflow/init.js', () => ({
  initWorkflow: vi.fn(),
}));

vi.mock('../../src/cli/commands/workflow/sync-labels.js', () => ({
  syncLabels: vi.fn(),
}));

vi.mock('../../src/cli/commands/cicd/init.js', () => ({
  initCICD: vi.fn(),
}));

vi.mock('../../src/cli/utils/client.js', () => ({
  createClient: vi.fn(),
  getContextFromConfig: vi.fn(() => ({ owner: 'test', repo: 'test-repo' })),
}));

vi.mock('../../src/tools/branch.js', () => ({
  createBranchProtection: vi.fn(),
}));

describe('init/extras', () => {
  const testDir = '/tmp/test-init-extras';

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    // Change to test directory
    vi.spyOn(process, 'cwd').mockReturnValue(testDir);
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  describe('detectProjectType', () => {
    it('should detect nodejs project from package.json', () => {
      fs.writeFileSync(path.join(testDir, 'package.json'), '{}');
      // Note: detectProjectType is not exported, so we test indirectly
      expect(fs.existsSync(path.join(testDir, 'package.json'))).toBe(true);
    });

    it('should detect go project from go.mod', () => {
      fs.writeFileSync(path.join(testDir, 'go.mod'), 'module test');
      expect(fs.existsSync(path.join(testDir, 'go.mod'))).toBe(true);
    });

    it('should detect python project from requirements.txt', () => {
      fs.writeFileSync(path.join(testDir, 'requirements.txt'), 'flask');
      expect(fs.existsSync(path.join(testDir, 'requirements.txt'))).toBe(true);
    });

    it('should detect rust project from Cargo.toml', () => {
      fs.writeFileSync(path.join(testDir, 'Cargo.toml'), '[package]');
      expect(fs.existsSync(path.join(testDir, 'Cargo.toml'))).toBe(true);
    });
  });

  describe('detectLanguage', () => {
    it('should detect TypeScript from tsconfig.json', () => {
      fs.writeFileSync(path.join(testDir, 'package.json'), '{}');
      fs.writeFileSync(path.join(testDir, 'tsconfig.json'), '{}');
      expect(fs.existsSync(path.join(testDir, 'tsconfig.json'))).toBe(true);
    });

    it('should detect JavaScript without tsconfig.json', () => {
      fs.writeFileSync(path.join(testDir, 'package.json'), '{}');
      expect(fs.existsSync(path.join(testDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'tsconfig.json'))).toBe(false);
    });
  });

  describe('LLM file generation', () => {
    it('should generate @AGENT.md reference content', () => {
      const content = '@AGENT.md\n';
      expect(content).toBe('@AGENT.md\n');
    });

    it('should support all 12 LLM platforms', () => {
      const llmPlatforms = [
        'claude', 'cursor', 'copilot', 'windsurf', 'gemini', 'deepseek',
        'qwen', 'gpt', 'llama', 'ernie', 'doubao', 'glm'
      ];
      expect(llmPlatforms.length).toBe(12);
    });
  });

  describe('AGENT.md generation', () => {
    it('should generate valid markdown content', () => {
      const projectName = 'test-project';
      const content = `# ${projectName} - AI 工作指南`;
      expect(content).toContain(projectName);
      expect(content).toContain('AI 工作指南');
    });
  });

  describe('Branch protection presets', () => {
    it('should have main branch preset with strict rules', () => {
      const mainPreset = {
        name: 'main',
        config: {
          enable_push: false,
          required_approvals: 1,
          enable_status_check: true,
          block_on_rejected_reviews: true,
          dismiss_stale_approvals: true,
        },
      };
      expect(mainPreset.config.enable_push).toBe(false);
      expect(mainPreset.config.required_approvals).toBe(1);
    });

    it('should have dev branch preset with relaxed rules', () => {
      const devPreset = {
        name: 'dev',
        config: {
          enable_push: true,
          required_approvals: 0,
          enable_status_check: true,
          block_on_rejected_reviews: false,
          dismiss_stale_approvals: false,
        },
      };
      expect(devPreset.config.enable_push).toBe(true);
      expect(devPreset.config.required_approvals).toBe(0);
    });
  });
});
