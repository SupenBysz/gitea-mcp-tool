# Release Process

This document describes the process for creating and publishing new releases.

## Prerequisites

- Maintainer access to the repository
- Local repository up to date with `main` branch
- All changes committed and pushed

## Release Steps

### 1. Update Version

Update version in `package.json`:

```bash
# For patch release (0.8.1 -> 0.8.2)
npm version patch

# For minor release (0.8.1 -> 0.9.0)
npm version minor

# For major release (0.8.1 -> 1.0.0)
npm version major
```

This will automatically:
- Update version in package.json
- Create a git tag
- Commit the change

### 2. Update CHANGELOG

Edit `CHANGELOG.md` and add release notes:

```markdown
## [0.8.2] - 2025-11-23

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Change description
```

Commit the changes:

```bash
git add CHANGELOG.md
git commit -m "docs: Update CHANGELOG for v0.8.2"
```

### 3. Build and Pack

Build the project and create release package:

```bash
# Build project
pnpm build

# Create release package
./pack.sh
```

This creates: `gitea-mcp-v0.8.2.tar.gz`

**Note the SHA256 checksum** displayed by pack.sh for release notes.

### 4. Push Changes and Tag

```bash
git push
git push --tags
```

### 5. Create GitHub/Gitea Release

1. Go to: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/releases/new

2. Select the tag (e.g., `v0.8.2`)

3. Fill in release information:
   - **Title**: `v0.8.2 - Release Name`
   - **Description**: Copy from CHANGELOG.md

4. Add release notes template:

```markdown
## 🎉 What's New

[Brief summary of main changes]

## ✨ Features
- Feature 1
- Feature 2

## 🐛 Bug Fixes
- Fix 1
- Fix 2

## 📦 Installation

### Quick Installation (Recommended)
\`\`\`bash
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
\`\`\`

### Download Package
Download `gitea-mcp-v0.8.2.tar.gz` below and extract:
\`\`\`bash
tar -xzf gitea-mcp-v0.8.2.tar.gz
cd gitea-mcp-v0.8.2
# See INSTALL.txt for configuration
\`\`\`

## 🔐 Verification

**SHA256 Checksum:**
\`\`\`
[paste SHA256 from pack.sh output]
\`\`\`

Verify download:
\`\`\`bash
shasum -a 256 gitea-mcp-v0.8.2.tar.gz
\`\`\`

## 📚 Documentation
- [README](https://gitea.ktyun.cc/Kysion/entai-gitea-mcp)
- [Initialization Guide](./docs/initialization.md)
- [API Documentation](./docs/)

## 🆕 Upgrading from v0.8.1

[Add any breaking changes or upgrade notes]

---

**Full Changelog**: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/compare/v0.8.1...v0.8.2
```

5. **Attach Files**: Upload `gitea-mcp-v0.8.2.tar.gz`

6. Click **Publish Release**

### 6. Verify Installation

Test the quick installation script:

```bash
# In a clean directory
curl -fsSL https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/raw/branch/main/install-quick.sh | bash
```

Verify:
- Script downloads the new release
- Package extracts correctly
- Configuration paths are correct

## Release Checklist

Before publishing a release, ensure:

- [ ] Version updated in package.json
- [ ] CHANGELOG.md updated with release notes
- [ ] All tests passing (`pnpm test`)
- [ ] Project builds successfully (`pnpm build`)
- [ ] Release package created (`./pack.sh`)
- [ ] SHA256 checksum noted
- [ ] Changes pushed to main branch
- [ ] Tag pushed to repository
- [ ] Gitea release created
- [ ] Release package attached
- [ ] Release notes complete with SHA256
- [ ] Quick install script tested

## Rollback Procedure

If a release needs to be rolled back:

1. Delete the tag:
   ```bash
   git tag -d v0.8.2
   git push origin :refs/tags/v0.8.2
   ```

2. Delete the release on Gitea

3. Revert version in package.json if necessary

4. Fix issues and create new release

## Automated Release (Future)

Consider setting up GitHub Actions / Gitea Actions for automated releases:

```yaml
# .gitea/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build
      - run: ./pack.sh
      - name: Create Release
        uses: actions/create-release@v1
        with:
          files: gitea-mcp-*.tar.gz
```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.9.0): New features, backwards compatible
- **PATCH** (0.8.2): Bug fixes, backwards compatible

## Support

For questions about the release process, contact the maintainers or open an issue.
