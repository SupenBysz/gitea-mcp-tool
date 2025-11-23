#!/bin/bash

# Pack compiled artifacts for distribution
# Creates a release package without source code

set -e

VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="gitea-mcp-v${VERSION}"
TEMP_DIR="temp_${PACKAGE_NAME}"
RELEASE_DIR="releases"

echo "🎁 Packing Gitea MCP Server v${VERSION}..."

# Create releases directory if it doesn't exist
mkdir -p "${RELEASE_DIR}"

# Clean previous packages
rm -rf "${TEMP_DIR}" "${RELEASE_DIR}/${PACKAGE_NAME}.tar.gz" 2>/dev/null || true

# Create temp directory
mkdir -p "${TEMP_DIR}"

# Copy necessary files
echo "📦 Copying files..."
cp -r dist "${TEMP_DIR}/"
cp package.json "${TEMP_DIR}/"
cp README.md "${TEMP_DIR}/"
cp -r docs "${TEMP_DIR}/" 2>/dev/null || true

# Create minimal package.json for runtime
cat > "${TEMP_DIR}/package.json" <<EOF
{
  "name": "@kysion/gitea-mcp-tool",
  "version": "${VERSION}",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "gitea-mcp": "dist/index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create installation guide
cat > "${TEMP_DIR}/INSTALL.txt" <<EOF
Gitea MCP Server - Quick Installation Guide
============================================

Version: ${VERSION}
Release Date: $(date +%Y-%m-%d)

Prerequisites:
- Node.js 18 or higher

Installation Steps:
-------------------

1. Extract this archive to your desired location:
   tar -xzf ${PACKAGE_NAME}.tar.gz
   cd ${PACKAGE_NAME}

2. Configure your MCP client:

   For Claude Desktop (~/.../Claude/claude_desktop_config.json):
   {
     "mcpServers": {
       "gitea-mcp-tool": {
         "command": "node",
         "args": ["/absolute/path/to/${PACKAGE_NAME}/dist/index.js"],
         "env": {
           "GITEA_BASE_URL": "https://your-gitea-server.com",
           "GITEA_API_TOKEN": "your_token_here"
         }
       }
     }
   }

   For VSCode Cline (.vscode/settings.json):
   {
     "cline.mcpServers": {
       "gitea-mcp-tool": {
         "command": "node",
         "args": ["/absolute/path/to/${PACKAGE_NAME}/dist/index.js"],
         "env": {
           "GITEA_BASE_URL": "https://your-gitea-server.com",
           "GITEA_API_TOKEN": "your_token_here"
         }
       }
     }
   }

3. Restart your MCP client

4. Use gitea_mcp_init tool for interactive configuration (recommended)

For detailed documentation, see README.md

Support: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/issues
EOF

# Create archive
echo "🗜️  Creating archive..."
tar -czf "${RELEASE_DIR}/${PACKAGE_NAME}.tar.gz" -C "${TEMP_DIR}" .

# Calculate size and hash
SIZE=$(du -h "${RELEASE_DIR}/${PACKAGE_NAME}.tar.gz" | cut -f1)
SHA256=$(shasum -a 256 "${RELEASE_DIR}/${PACKAGE_NAME}.tar.gz" | cut -d' ' -f1)

# Clean up temp directory
rm -rf "${TEMP_DIR}"

echo ""
echo "✅ Package created successfully!"
echo ""
echo "📄 File: ${RELEASE_DIR}/${PACKAGE_NAME}.tar.gz"
echo "📊 Size: ${SIZE}"
echo "🔐 SHA256: ${SHA256}"
echo ""
echo "Next steps:"
echo "1. Upload to Gitea Releases: https://gitea.ktyun.cc/Kysion/entai-gitea-mcp/releases"
echo "2. Attach: ${RELEASE_DIR}/${PACKAGE_NAME}.tar.gz"
echo "3. Add SHA256 checksum to release notes"
echo ""
