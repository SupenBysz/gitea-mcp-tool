#!/bin/bash
# 同步 Gitea 仓库到 GitHub
# 使用方法：./sync-to-github.sh

set -e

echo "开始同步到 GitHub..."

# 确保所有更改已提交
if [[ -n $(git status -s) ]]; then
    echo "警告：工作目录有未提交的更改"
    git status -s
    read -p "是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支：$CURRENT_BRANCH"

# 推送到 Gitea（origin）
echo "推送到 Gitea..."
git push origin $CURRENT_BRANCH --tags

# 推送到 GitHub
echo "推送到 GitHub..."
git push github $CURRENT_BRANCH --tags

echo "✅ 同步完成！"
echo ""
echo "GitHub 仓库：https://github.com/SupenBysz/gitea-mcp-tool"
echo ""
echo "如果推送了新标签，GitHub Actions 将自动发布到 npm"
echo "查看发布状态：https://github.com/SupenBysz/gitea-mcp-tool/actions"
