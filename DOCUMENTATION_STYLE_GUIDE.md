# Documentation Style Refactoring Guide

## Overview

This guide provides systematic instructions for removing AI-generated style elements from the Gitea MCP documentation and converting it to professional technical documentation standards.

## Identified Issues

### 1. Excessive Emoji Usage
**Current**: Nearly every heading and list item contains decorative emojis
- `✨ 功能特性`
- `🎯 设计目标`
- `✅ 推荐做法`
- `❌ 避免的做法`

**Solution**: Remove all decorative emojis. Reserve emoji usage only for:
- Code comments where absolutely necessary
- User-facing UI elements

### 2. Conversational Tone
**Current**: Frequent use of second person and casual language
- `让你能够...` (enables you to...)
- `帮你...` (helps you...)
- `可以让AI助手能够直接操作` (allows AI assistants to directly operate)

**Solution**: Convert to third person or passive voice
- `让你能够X` → `Provides X` or `Enables X`
- `帮你解决Y` → `Solves Y` or `Addresses Y`
- Remove unnecessary friendly phrases

### 3. Redundant Modifiers
**Current**: Overuse of subjective adjectives
- `完整的` (complete)
- `强大的` (powerful)
- `灵活的` (flexible)
- `简单` (simple)
- `快速` (fast)

**Solution**: Remove or replace with objective descriptions
- `完整的配置系统` → `Configuration system`
- `强大的功能` → `Feature` or describe具体功能
- Let features speak for themselves through factual descriptions

### 4. Marketing Language
**Current**: Sales-oriented phrases
- `核心优势` (core advantages)
- `关键区别` (key differences)
- Excessive use of comparison tables with subjective评价

**Solution**: Use objective technical language
- `核心优势` → `Features` or `Characteristics`
- Present facts, not advantages
- Keep comparison tables factual

### 5. Excessive Emphasis
**Current**: Overuse of emphasis markers
- Multiple exclamation marks
- `重要提示!!!` (Important Notice!!!)
- `**注意:**` with bold

**Solution**: Use single, standard emphasis
- One exclamation mark maximum
- Use "Note:" or "Warning:" without decoration
- Reserve bold for truly critical information

## Refactoring Rules

### Rule 1: Headings
**Before**:
```markdown
## ✨ 功能特性
### 🎯  设计目标
```

**After**:
```markdown
## Features
### Design Goals
```

### Rule 2: Lists
**Before**:
```markdown
- ✅ **自动检测** Git 仓库信息
- ✅ **多种认证方式** 创建 Token
```

**After**:
```markdown
- Git repository information auto-detection
- Multiple token creation methods
```

### Rule 3: Sections
**Before**:
```markdown
### 💡 使用技巧

1. **设置默认上下文**: 在开始工作前，使用 `gitea_context_set` 设置默认的 owner 和 repo，后续操作无需重复指定。
```

**After**:
```markdown
### Usage Notes

1. Set default context using `gitea_context_set` to avoid repeating owner and repo parameters in subsequent operations.
```

### Rule 4: Code Comments
**Before**:
```typescript
// ✅ 正确的做法
const result = await gitea_issue_create({ title: "Bug" })

// ❌ 错误的做法
const result = await gitea_issue_create()
```

**After**:
```typescript
// Correct usage
const result = await gitea_issue_create({ title: "Bug" })

// Incorrect - missing required parameter
const result = await gitea_issue_create()
```

### Rule 5: Warnings and Notes
**Before**:
```markdown
> 📖 详细使用说明请参考：[初始化系统文档](./docs/initialization.md)

> **💡 提示**: 标记为 `?` 的参数为可选参数。
```

**After**:
```markdown
See [Initialization Documentation](./docs/initialization.md) for details.

Note: Parameters marked with `?` are optional.
```

## File-by-File Refactoring Checklist

### README.md
Priority: High | Length: 655 lines | Emoji Count: 82

**Sections to refactor**:
- [ ] Title and introduction (lines 1-3)
- [ ] Features section (lines 5-60)
- [ ] Installation instructions (lines 62-74)
- [ ] Quick start guides (lines 76-203)
- [ ] Available tools tables (lines 205-299)
- [ ] Usage examples (lines 302-553)
- [ ] Tips section (lines 555-562)
- [ ] Development section (lines 564-580)
- [ ] Progress table (lines 631-655)

**Key changes**:
- Remove all emoji from headings
- Change `让 AI 助手能够直接操作` to `enabling AI assistants to interact with`
- Simplify feature list - remove `✅` bullets
- Convert `推荐做法` / `避免做法` to simple "Recommended" / "Not Recommended"
- Remove phrases like `完整的`、`强大的`、`灵活的`

### docs/initialization.md
Priority: High | Length: 607 lines | Emoji Count: 65

**Sections to refactor**:
- [ ] Overview and goals (lines 13-24)
- [ ] Core features section (lines 26-88)
- [ ] Three-tier config system (lines 89-121)
- [ ] Git auto-detection (lines 123-147)
- [ ] Token management (lines 149-166)
- [ ] Quick start guides (lines 168-211)
- [ ] Best practices (lines 411-465)
- [ ] Troubleshooting (lines 467-544)

**Key changes**:
- Remove all emoji from step indicators
- Change `让你能够快速、安全地配置` to `provides secure configuration`
- Simplify ASCII art diagrams - remove decorative elements
- Convert conversational Q&A to direct statements
- Remove `✅ DO` / `❌ DON'T` decorations

### docs/context-management.md
Priority: Medium | Length: 528 lines | Emoji Count: 48

**Sections to refactor**:
- [ ] Overview (lines 1-11)
- [ ] Core advantages (lines 13-57)
- [ ] Configuration methods (lines 59-131)
- [ ] Priority rules (lines 181-213)
- [ ] Use cases (lines 215-306)
- [ ] FAQ section (lines 333-442)
- [ ] Best practices (lines 444-516)

**Key changes**:
- Remove `核心优势` heading - integrate into overview
- Simplify comparison examples - reduce redundancy
- Convert Q&A format to direct documentation
- Remove marketing-style advantages list
- Simplify priority explanation - use simple hierarchy

### docs/dynamic-token.md
Priority: Medium | Length: 381 lines | Emoji Count: 28

**Sections to refactor**:
- [ ] Overview (lines 1-11)
- [ ] Usage methods (lines 13-46)
- [ ] Application scenarios (lines 48-106)
- [ ] Working principle (lines 109-140)
- [ ] Best practices (lines 202-253)
- [ ] Security recommendations (lines 304-338)

**Key changes**:
- Remove scenario numbering with emoji
- Simplify working principle - use technical description
- Convert `✅ 推荐做法` / `❌ 避免的做法` to standard lists
- Remove excessive code comment emoji
- Consolidate repetitive examples

### docs/skills-vs-mcp-comparison.md
Priority: Low | Length: 222 lines | Emoji Count: 15

**Sections to refactor**:
- [ ] Scenario comparison (lines 3-87)
- [ ] Key differences table (lines 91-103)
- [ ] Real-world problems (lines 107-191)
- [ ] Conclusion (lines 194-221)

**Key changes**:
- Remove emoji from comparison table
- Simplify architecture diagrams
- Make comparison more objective - less marketing-oriented
- Reduce emphasis on "advantages"

### API_AUDIT_REPORT.md
Priority: Low | Length: 404 lines | Emoji Count: 45

**Sections to refactor**:
- [ ] Executive summary (lines 8-16)
- [ ] Tool sections (lines 19-283)
- [ ] Technical analysis (lines 286-302)

**Key changes**:
- Remove emoji status indicators from tool lists
- Simplify check mark usage
- Keep technical content as-is (already mostly professional)
- Remove decorative elements from code blocks

### CHANGELOG.md
Priority: Low | Length: 257 lines | Emoji Count: 38

**Sections to refactor**:
- [ ] Version entries (lines 19-231)
- [ ] Legend (lines 241-250)

**Key changes**:
- Remove emoji from legend - use standard symbols
- Simplify version entry formatting
- Keep structure similar to [Keep a Changelog](https://keepachangelog.com/)
- Use standard prefixes: Added, Changed, Fixed, etc.

## Before & After Examples

### Example 1: Feature List
**Before**:
```markdown
## ✨ 功能特性

### 🎯 当前版本: v0.8.1

提供 **46 个工具**，涵盖 Gitea 核心功能的完整操作：

- ✅ **配置初始化** (2个工具) 🆕
  - 交互式配置向导，自动检测 Git 仓库信息
  - 多语言支持（中文/英文）
```

**After**:
```markdown
## Features

### Current Version: v0.8.1

Provides 46 tools covering Gitea core functionality:

**Configuration & Initialization** (3 tools)
- Interactive configuration wizard with Git repository auto-detection
- Multi-language support (English/Chinese)
```

### Example 2: Usage Tips
**Before**:
```markdown
### 💡 使用技巧

1. **设置默认上下文**: 在开始工作前，使用 `gitea_context_set` 设置默认的 owner 和 repo，后续操作无需重复指定。

2. **批量操作**: 可以结合 Issue 列表和更新操作，实现批量处理。
```

**After**:
```markdown
### Usage Notes

1. Set default context using `gitea_context_set` to avoid repeating owner and repo parameters in subsequent operations.

2. Combine issue listing and update operations for batch processing.
```

### Example 3: Best Practices
**Before**:
```markdown
## 最佳实践

### ✅ 推荐做法

1. **为固定项目设置环境变量**
   ```bash
   # 日常开发的主项目
   GITEA_DEFAULT_OWNER=kysion
   ```

### ❌ 避免的做法

1. **不要混淆 owner 和 org**
   ```typescript
   // ❌ 错误
   gitea_context_set({ org: "alice" })
   ```
```

**After**:
```markdown
## Best Practices

### Recommended

1. Set environment variables for regular projects:
   ```bash
   # Primary development project
   GITEA_DEFAULT_OWNER=kysion
   ```

### Not Recommended

1. Do not confuse owner and org parameters:
   ```typescript
   // Incorrect - using org for personal account
   gitea_context_set({ org: "alice" })
   ```
```

## Implementation Strategy

### Phase 1: Critical Files (Days 1-2)
1. README.md - main entry point
2. docs/initialization.md - core feature documentation

### Phase 2: Important Files (Days 3-4)
3. docs/context-management.md
4. docs/dynamic-token.md

### Phase 3: Supporting Files (Day 5)
5. docs/skills-vs-mcp-comparison.md
6. API_AUDIT_REPORT.md
7. CHANGELOG.md

## Quality Checklist

After refactoring each file, verify:

- [ ] No decorative emoji remain in headings
- [ ] No emoji in list items (except code comments where necessary)
- [ ] No second-person references (`你`, `让你`, `帮你`)
- [ ] No subjective modifiers (`完整的`, `强大的`, `灵活的`)
- [ ] No marketing language (`核心优势`, `关键区别`)
- [ ] No excessive emphasis (multiple `!`, unnecessary bold)
- [ ] Code examples remain intact and functional
- [ ] Technical accuracy preserved
- [ ] Links and references still valid
- [ ] Consistent formatting throughout

## Tools for Verification

```bash
# Count emoji usage
grep -o '[[:emoji:]]' filename.md | wc -l

# Find second-person references (Chinese)
grep -E '让你|帮你|你可以|你能' filename.md

# Find subjective modifiers
grep -E '完整的|强大的|灵活的|简单的|快速的' filename.md

# Find marketing terms
grep -E '核心优势|关键区别|最佳|完美' filename.md
```

## Final Notes

- Preserve all technical content and accuracy
- Maintain code examples without changes to functionality
- Keep all existing links and cross-references
- Ensure consistent terminology throughout documents
- Test all code examples remain valid after changes
- Update table of contents if heading text changes

## Revision History

- 2025-11-23: Initial style guide created
- Analyzed 7 major documentation files
- Identified 321 total emoji instances to remove
- Created comprehensive refactoring checklist
