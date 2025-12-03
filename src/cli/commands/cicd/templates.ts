/**
 * CI/CD Templates Management
 */

import chalk from 'chalk';

export type Platform = 'gitea' | 'github';
export type ProjectType = 'nodejs' | 'go' | 'python' | 'rust' | 'docker';

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  platforms: Platform[];
  files: string[];
}

export interface TemplateVariables {
  projectName: string;
  owner: string;
  repo: string;
  mainBranch: string;
  devBranch: string;
  nodeVersion?: string;
  goVersion?: string;
  pythonVersion?: string;
  rustVersion?: string;
}

/**
 * 可用模板列表
 */
export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'Node.js 项目 - 包含 CI 检查、Beta 发布、正式发布',
    projectType: 'nodejs',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'publish-beta.yaml', 'publish.yaml'],
  },
  {
    id: 'go',
    name: 'Go',
    description: 'Go 项目 - 包含 CI 检查、构建、发布',
    projectType: 'go',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'release.yaml'],
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Python 项目 - 包含 CI 检查、PyPI 发布',
    projectType: 'python',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'publish.yaml'],
  },
  {
    id: 'rust',
    name: 'Rust',
    description: 'Rust 项目 - 包含 CI 检查、Cargo 发布',
    projectType: 'rust',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'release.yaml'],
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Docker 项目 - 包含构建和推送镜像',
    projectType: 'docker',
    platforms: ['gitea', 'github'],
    files: ['ci.yaml', 'docker-publish.yaml'],
  },
];

/**
 * 获取模板信息
 */
export function getTemplate(id: string): TemplateInfo | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * 获取模板内容
 */
export function getTemplateContent(
  projectType: ProjectType,
  platform: Platform,
  fileName: string,
  variables: TemplateVariables
): string {
  const templateFn = TEMPLATE_CONTENTS[projectType]?.[platform]?.[fileName];
  if (!templateFn) {
    throw new Error(`Template not found: ${projectType}/${platform}/${fileName}`);
  }
  return templateFn(variables);
}

/**
 * 列出模板命令处理
 */
export async function listTemplates(options: { platform?: Platform; json?: boolean }): Promise<void> {
  let templates = TEMPLATES;

  if (options.platform) {
    templates = templates.filter((t) => t.platforms.includes(options.platform!));
  }

  if (options.json) {
    console.log(JSON.stringify(templates, null, 2));
    return;
  }

  console.log(chalk.bold('\n可用的 CI/CD 模板:\n'));

  for (const template of templates) {
    console.log(chalk.cyan(`  ${template.id}`));
    console.log(chalk.white(`    ${template.name} - ${template.description}`));
    console.log(chalk.gray(`    平台: ${template.platforms.join(', ')}`));
    console.log(chalk.gray(`    文件: ${template.files.join(', ')}`));
    console.log();
  }
}

// =============================================================================
// 模板内容定义
// =============================================================================

type TemplateFunction = (vars: TemplateVariables) => string;
type PlatformTemplates = Record<string, TemplateFunction>;
type ProjectTemplates = Record<Platform, PlatformTemplates>;

const TEMPLATE_CONTENTS: Record<ProjectType, ProjectTemplates> = {
  // Node.js 模板
  nodejs: {
    gitea: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${vars.nodeVersion || '20'}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint || true

      - name: Build
        run: npm run build

      - name: Test
        run: npm test || true

  validate-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Validate PR target branch
        run: |
          BASE_BRANCH="\${{ github.base_ref }}"
          HEAD_BRANCH="\${{ github.head_ref }}"

          echo "PR: $HEAD_BRANCH -> $BASE_BRANCH"

          # ${vars.mainBranch} 分支只接受 ${vars.devBranch} 或 hotfix/* 分支的 PR
          if [ "$BASE_BRANCH" = "${vars.mainBranch}" ]; then
            if [[ "$HEAD_BRANCH" != "${vars.devBranch}" && "$HEAD_BRANCH" != hotfix/* ]]; then
              echo "::error::${vars.mainBranch} 分支只接受 ${vars.devBranch} 或 hotfix/* 分支的 PR"
              exit 1
            fi
          fi

          # ${vars.devBranch} 分支只接受 feature/*, bugfix/*, fix/*, feat/* 分支的 PR
          if [ "$BASE_BRANCH" = "${vars.devBranch}" ]; then
            if [[ "$HEAD_BRANCH" != feature/* && "$HEAD_BRANCH" != bugfix/* && "$HEAD_BRANCH" != fix/* && "$HEAD_BRANCH" != feat/* ]]; then
              echo "::error::${vars.devBranch} 分支只接受 feature/*, bugfix/*, fix/*, feat/* 分支的 PR"
              exit 1
            fi
          fi

          echo "✓ PR 分支验证通过"
`,
      'publish-beta.yaml': (vars) => `name: Publish Beta

on:
  push:
    branches:
      - ${vars.devBranch}

jobs:
  publish-beta:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${vars.nodeVersion || '20'}'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure Git
        run: |
          git config --global user.name "Gitea Actions"
          git config --global user.email "actions@gitea.local"

      - name: Bump beta version
        id: version
        run: |
          # 获取当前版本
          CURRENT_VERSION=$(node -p "require('./package.json').version")
          echo "Current version: $CURRENT_VERSION"

          # 解析版本号
          if [[ "$CURRENT_VERSION" == *"-beta."* ]]; then
            # 已经是 beta 版本，递增 beta 号
            BASE_VERSION=$(echo "$CURRENT_VERSION" | sed 's/-beta.*//')
            BETA_NUM=$(echo "$CURRENT_VERSION" | grep -oP '(?<=-beta\\.)\\d+')
            NEW_BETA_NUM=$((BETA_NUM + 1))
            NEW_VERSION="\${BASE_VERSION}-beta.\${NEW_BETA_NUM}"
          else
            # 不是 beta 版本，创建新的 beta.1
            MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
            MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
            PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3 | cut -d- -f1)
            NEW_PATCH=$((PATCH + 1))
            NEW_VERSION="\${MAJOR}.\${MINOR}.\${NEW_PATCH}-beta.1"
          fi

          echo "New version: $NEW_VERSION"
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT

          # 更新 package.json
          npm version "$NEW_VERSION" --no-git-tag-version

      - name: Publish to npm (beta)
        run: npm publish --tag beta --registry https://registry.npmjs.org/
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}

      - name: Commit version bump
        run: |
          git add package.json
          git commit -m "chore: bump version to \${{ steps.version.outputs.version }} [skip ci]" || true
          git push origin ${vars.devBranch} || true

      - name: Create summary
        run: |
          echo "## Beta 版本发布成功 🚀" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**版本号**: \\\`\${{ steps.version.outputs.version }}\\\`" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**安装命令**:" >> $GITHUB_STEP_SUMMARY
          echo "\\\`\\\`\\\`bash" >> $GITHUB_STEP_SUMMARY
          echo "npm install -g ${vars.projectName}@beta" >> $GITHUB_STEP_SUMMARY
          echo "\\\`\\\`\\\`" >> $GITHUB_STEP_SUMMARY
`,
      'publish.yaml': (vars) => `name: Publish Release

on:
  push:
    branches:
      - ${vars.mainBranch}

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${vars.nodeVersion || '20'}'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure Git
        run: |
          git config --global user.name "Gitea Actions"
          git config --global user.email "actions@gitea.local"

      - name: Determine version bump type
        id: bump_type
        run: |
          # 获取最近的 commit message
          COMMIT_MSG=$(git log -1 --pretty=%B)
          echo "Commit message: $COMMIT_MSG"

          # 根据 commit message 前缀确定版本类型
          if [[ "$COMMIT_MSG" == *"breaking"* ]] || [[ "$COMMIT_MSG" == *"BREAKING"* ]]; then
            echo "type=major" >> $GITHUB_OUTPUT
          elif [[ "$COMMIT_MSG" == feat:* ]] || [[ "$COMMIT_MSG" == feat\\(* ]]; then
            echo "type=minor" >> $GITHUB_OUTPUT
          else
            echo "type=patch" >> $GITHUB_OUTPUT
          fi

      - name: Bump version
        id: version
        run: |
          # 获取当前版本
          CURRENT_VERSION=$(node -p "require('./package.json').version")
          echo "Current version: $CURRENT_VERSION"

          # 移除 beta 后缀（如果有）
          BASE_VERSION=$(echo "$CURRENT_VERSION" | sed 's/-beta.*//')

          # 解析版本号
          MAJOR=$(echo "$BASE_VERSION" | cut -d. -f1)
          MINOR=$(echo "$BASE_VERSION" | cut -d. -f2)
          PATCH=$(echo "$BASE_VERSION" | cut -d. -f3)

          # 根据类型递增版本
          BUMP_TYPE="\${{ steps.bump_type.outputs.type }}"
          case "$BUMP_TYPE" in
            major)
              MAJOR=$((MAJOR + 1))
              MINOR=0
              PATCH=0
              ;;
            minor)
              MINOR=$((MINOR + 1))
              PATCH=0
              ;;
            patch)
              # 如果当前是 beta 版本，直接使用 base version
              if [[ "$CURRENT_VERSION" == *"-beta."* ]]; then
                : # 保持 PATCH 不变
              else
                PATCH=$((PATCH + 1))
              fi
              ;;
          esac

          NEW_VERSION="\${MAJOR}.\${MINOR}.\${PATCH}"
          echo "New version: $NEW_VERSION (bump type: $BUMP_TYPE)"
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT

          # 更新 package.json
          npm version "$NEW_VERSION" --no-git-tag-version

      - name: Publish to npm
        run: npm publish --tag latest --registry https://registry.npmjs.org/
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}

      - name: Commit and tag
        run: |
          VERSION="\${{ steps.version.outputs.version }}"
          git add package.json
          git commit -m "chore: release v\${VERSION} [skip ci]" || true
          git tag -a "v\${VERSION}" -m "Release v\${VERSION}"
          git push origin ${vars.mainBranch} --tags || true

      - name: Create Gitea Release
        uses: https://gitea.com/actions/release-action@main
        with:
          title: "v\${{ steps.version.outputs.version }}"
          body: |
            ## 安装

            \`\`\`bash
            npm install -g ${vars.projectName}@\${{ steps.version.outputs.version }}
            \`\`\`

            ## 更新

            \`\`\`bash
            npm update -g ${vars.projectName}
            \`\`\`
          tag_name: "v\${{ steps.version.outputs.version }}"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Create summary
        run: |
          echo "## 正式版本发布成功 🎉" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**版本号**: \\\`v\${{ steps.version.outputs.version }}\\\`" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**安装命令**:" >> $GITHUB_STEP_SUMMARY
          echo "\\\`\\\`\\\`bash" >> $GITHUB_STEP_SUMMARY
          echo "npm install -g ${vars.projectName}@latest" >> $GITHUB_STEP_SUMMARY
          echo "\\\`\\\`\\\`" >> $GITHUB_STEP_SUMMARY
`,
    },
    github: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${vars.nodeVersion || '20'}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint || true

      - name: Build
        run: npm run build

      - name: Test
        run: npm test || true

  validate-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Validate PR target branch
        run: |
          BASE_BRANCH="\${{ github.base_ref }}"
          HEAD_BRANCH="\${{ github.head_ref }}"

          echo "PR: $HEAD_BRANCH -> $BASE_BRANCH"

          # ${vars.mainBranch} 分支只接受 ${vars.devBranch} 或 hotfix/* 分支的 PR
          if [ "$BASE_BRANCH" = "${vars.mainBranch}" ]; then
            if [[ "$HEAD_BRANCH" != "${vars.devBranch}" && "$HEAD_BRANCH" != hotfix/* ]]; then
              echo "::error::${vars.mainBranch} 分支只接受 ${vars.devBranch} 或 hotfix/* 分支的 PR"
              exit 1
            fi
          fi

          # ${vars.devBranch} 分支只接受 feature/*, bugfix/*, fix/*, feat/* 分支的 PR
          if [ "$BASE_BRANCH" = "${vars.devBranch}" ]; then
            if [[ "$HEAD_BRANCH" != feature/* && "$HEAD_BRANCH" != bugfix/* && "$HEAD_BRANCH" != fix/* && "$HEAD_BRANCH" != feat/* ]]; then
              echo "::error::${vars.devBranch} 分支只接受 feature/*, bugfix/*, fix/*, feat/* 分支的 PR"
              exit 1
            fi
          fi

          echo "✓ PR 分支验证通过"
`,
      'publish-beta.yaml': (vars) => `name: Publish Beta

on:
  push:
    branches:
      - ${vars.devBranch}

jobs:
  publish-beta:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${vars.nodeVersion || '20'}'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure Git
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"

      - name: Bump beta version
        id: version
        run: |
          CURRENT_VERSION=$(node -p "require('./package.json').version")
          echo "Current version: $CURRENT_VERSION"

          if [[ "$CURRENT_VERSION" == *"-beta."* ]]; then
            BASE_VERSION=$(echo "$CURRENT_VERSION" | sed 's/-beta.*//')
            BETA_NUM=$(echo "$CURRENT_VERSION" | grep -oP '(?<=-beta\\.)\\d+')
            NEW_BETA_NUM=$((BETA_NUM + 1))
            NEW_VERSION="\${BASE_VERSION}-beta.\${NEW_BETA_NUM}"
          else
            MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
            MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
            PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3 | cut -d- -f1)
            NEW_PATCH=$((PATCH + 1))
            NEW_VERSION="\${MAJOR}.\${MINOR}.\${NEW_PATCH}-beta.1"
          fi

          echo "New version: $NEW_VERSION"
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT
          npm version "$NEW_VERSION" --no-git-tag-version

      - name: Publish to npm (beta)
        run: npm publish --tag beta
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}

      - name: Commit version bump
        run: |
          git add package.json
          git commit -m "chore: bump version to \${{ steps.version.outputs.version }} [skip ci]" || true
          git push origin ${vars.devBranch} || true
`,
      'publish.yaml': (vars) => `name: Publish Release

on:
  push:
    branches:
      - ${vars.mainBranch}

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${vars.nodeVersion || '20'}'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure Git
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"

      - name: Determine version bump type
        id: bump_type
        run: |
          COMMIT_MSG=$(git log -1 --pretty=%B)
          echo "Commit message: $COMMIT_MSG"

          if [[ "$COMMIT_MSG" == *"breaking"* ]] || [[ "$COMMIT_MSG" == *"BREAKING"* ]]; then
            echo "type=major" >> $GITHUB_OUTPUT
          elif [[ "$COMMIT_MSG" == feat:* ]] || [[ "$COMMIT_MSG" == feat\\(* ]]; then
            echo "type=minor" >> $GITHUB_OUTPUT
          else
            echo "type=patch" >> $GITHUB_OUTPUT
          fi

      - name: Bump version
        id: version
        run: |
          CURRENT_VERSION=$(node -p "require('./package.json').version")
          echo "Current version: $CURRENT_VERSION"

          BASE_VERSION=$(echo "$CURRENT_VERSION" | sed 's/-beta.*//')
          MAJOR=$(echo "$BASE_VERSION" | cut -d. -f1)
          MINOR=$(echo "$BASE_VERSION" | cut -d. -f2)
          PATCH=$(echo "$BASE_VERSION" | cut -d. -f3)

          BUMP_TYPE="\${{ steps.bump_type.outputs.type }}"
          case "$BUMP_TYPE" in
            major)
              MAJOR=$((MAJOR + 1))
              MINOR=0
              PATCH=0
              ;;
            minor)
              MINOR=$((MINOR + 1))
              PATCH=0
              ;;
            patch)
              if [[ "$CURRENT_VERSION" != *"-beta."* ]]; then
                PATCH=$((PATCH + 1))
              fi
              ;;
          esac

          NEW_VERSION="\${MAJOR}.\${MINOR}.\${PATCH}"
          echo "New version: $NEW_VERSION (bump type: $BUMP_TYPE)"
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT
          npm version "$NEW_VERSION" --no-git-tag-version

      - name: Publish to npm
        run: npm publish --tag latest
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}

      - name: Commit and tag
        run: |
          VERSION="\${{ steps.version.outputs.version }}"
          git add package.json
          git commit -m "chore: release v\${VERSION} [skip ci]" || true
          git tag -a "v\${VERSION}" -m "Release v\${VERSION}"
          git push origin ${vars.mainBranch} --tags || true

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: "v\${{ steps.version.outputs.version }}"
          name: "v\${{ steps.version.outputs.version }}"
          body: |
            ## 安装

            \`\`\`bash
            npm install -g ${vars.projectName}@\${{ steps.version.outputs.version }}
            \`\`\`

            ## 更新

            \`\`\`bash
            npm update -g ${vars.projectName}
            \`\`\`
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
    },
  },

  // Go 模板
  go: {
    gitea: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '${vars.goVersion || '1.21'}'

      - name: Build
        run: go build -v ./...

      - name: Test
        run: go test -v ./...

      - name: Lint
        uses: golangci/golangci-lint-action@v3
        with:
          version: latest
`,
      'release.yaml': (vars) => `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '${vars.goVersion || '1.21'}'

      - name: Build binaries
        run: |
          GOOS=linux GOARCH=amd64 go build -o dist/${vars.projectName}-linux-amd64 .
          GOOS=darwin GOARCH=amd64 go build -o dist/${vars.projectName}-darwin-amd64 .
          GOOS=darwin GOARCH=arm64 go build -o dist/${vars.projectName}-darwin-arm64 .
          GOOS=windows GOARCH=amd64 go build -o dist/${vars.projectName}-windows-amd64.exe .

      - name: Create Release
        uses: https://gitea.com/actions/release-action@main
        with:
          files: |
            dist/*
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
    },
    github: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '${vars.goVersion || '1.21'}'

      - name: Build
        run: go build -v ./...

      - name: Test
        run: go test -v ./...

      - name: Lint
        uses: golangci/golangci-lint-action@v3
        with:
          version: latest
`,
      'release.yaml': (vars) => `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '${vars.goVersion || '1.21'}'

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v5
        with:
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
    },
  },

  // Python 模板
  python: {
    gitea: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '${vars.pythonVersion || '3.11'}'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest flake8

      - name: Lint
        run: flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: Test
        run: pytest
`,
      'publish.yaml': (vars) => `name: Publish to PyPI

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '${vars.pythonVersion || '3.11'}'

      - name: Install build tools
        run: |
          python -m pip install --upgrade pip
          pip install build twine

      - name: Build package
        run: python -m build

      - name: Publish to PyPI
        run: twine upload dist/*
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: \${{ secrets.PYPI_TOKEN }}
`,
    },
    github: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python \${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest flake8

      - name: Lint
        run: flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: Test
        run: pytest
`,
      'publish.yaml': (vars) => `name: Publish to PyPI

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '${vars.pythonVersion || '3.11'}'

      - name: Install build tools
        run: |
          python -m pip install --upgrade pip
          pip install build twine

      - name: Build package
        run: python -m build

      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          password: \${{ secrets.PYPI_TOKEN }}
`,
    },
  },

  // Rust 模板
  rust: {
    gitea: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy -- -D warnings

      - name: Build
        run: cargo build --verbose

      - name: Test
        run: cargo test --verbose
`,
      'release.yaml': (vars) => `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Build release
        run: cargo build --release

      - name: Create Release
        uses: https://gitea.com/actions/release-action@main
        with:
          files: |
            target/release/${vars.projectName}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
    },
    github: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy -- -D warnings

      - name: Build
        run: cargo build --verbose

      - name: Test
        run: cargo test --verbose
`,
      'release.yaml': (vars) => `name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: windows-latest
            target: x86_64-pc-windows-msvc
    runs-on: \${{ matrix.os }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: \${{ matrix.target }}

      - name: Build
        run: cargo build --release --target \${{ matrix.target }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${vars.projectName}-\${{ matrix.target }}
          path: target/\${{ matrix.target }}/release/${vars.projectName}*

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            **/${vars.projectName}*
`,
    },
  },

  // Docker 模板
  docker: {
    gitea: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build (test)
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: ${vars.projectName}:test
`,
      'docker-publish.yaml': (vars) => `name: Docker Publish

on:
  push:
    branches:
      - ${vars.mainBranch}
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${vars.owner}/${vars.projectName}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
`,
    },
    github: {
      'ci.yaml': (vars) => `name: CI

on:
  pull_request:
    branches:
      - ${vars.mainBranch}
      - ${vars.devBranch}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build (test)
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: ${vars.projectName}:test
`,
      'docker-publish.yaml': (vars) => `name: Docker Publish

on:
  push:
    branches:
      - ${vars.mainBranch}
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/\${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
`,
    },
  },
};
