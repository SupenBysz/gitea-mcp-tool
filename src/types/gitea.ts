/**
 * Gitea API Type Definitions
 *
 * 基于 Gitea API v1.21.5
 * 文档: https://docs.gitea.com/api/1.21/
 */

// ============================================================
// 基础类型
// ============================================================

export interface GiteaUser {
  id: number;
  login: string;
  login_name?: string;
  full_name: string;
  email: string;
  avatar_url: string;
  language?: string;
  is_admin?: boolean;
  last_login?: string;
  created?: string;
  restricted?: boolean;
  active?: boolean;
  prohibit_login?: boolean;
  location?: string;
  website?: string;
  description?: string;
  visibility?: 'public' | 'limited' | 'private';
  followers_count?: number;
  following_count?: number;
  starred_repos_count?: number;
  username?: string;
}

export interface GiteaOrganization {
  id: number;
  name: string;
  full_name: string;
  avatar_url: string;
  description: string;
  website: string;
  location: string;
  visibility: 'public' | 'limited' | 'private';
  repo_admin_change_team_access?: boolean;
  username?: string;
}

export interface GiteaTeam {
  id: number;
  name: string;
  description: string;
  organization: GiteaOrganization;
  permission: 'read' | 'write' | 'admin' | 'owner';
  can_create_org_repo: boolean;
  includes_all_repositories: boolean;
  units?: string[];
  units_map?: Record<string, string>;
}

export interface CreateTeamOptions {
  name: string;
  description?: string;
  permission?: 'read' | 'write' | 'admin';
  can_create_org_repo?: boolean;
  includes_all_repositories?: boolean;
  units?: string[];
}

export interface UpdateTeamOptions {
  name?: string;
  description?: string;
  permission?: 'read' | 'write' | 'admin';
  can_create_org_repo?: boolean;
  includes_all_repositories?: boolean;
  units?: string[];
}

export interface GiteaAccessToken {
  id: number;
  name: string;
  sha1?: string; // Only returned when creating a new token
  token_last_eight: string;
  scopes?: string[];
}

export interface CreateAccessTokenOptions {
  name: string;
  scopes?: string[];
}

export interface GiteaPermission {
  admin: boolean;
  push: boolean;
  pull: boolean;
}

// ============================================================
// 仓库相关
// ============================================================

export interface GiteaRepository {
  id: number;
  owner: GiteaUser;
  name: string;
  full_name: string;
  description: string;
  empty: boolean;
  private: boolean;
  fork: boolean;
  template: boolean;
  parent?: GiteaRepository;
  mirror: boolean;
  size: number;
  language: string;
  languages_url: string;
  html_url: string;
  url: string;
  link: string;
  ssh_url: string;
  clone_url: string;
  original_url: string;
  website: string;
  stars_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  open_pr_counter: number;
  release_counter: number;
  default_branch: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  permissions?: GiteaPermission;
  has_issues: boolean;
  internal_tracker?: {
    enable_time_tracker: boolean;
    allow_only_contributors_to_track_time: boolean;
    enable_issue_dependencies: boolean;
  };
  has_wiki: boolean;
  has_pull_requests: boolean;
  has_projects: boolean;
  has_releases: boolean;
  has_packages: boolean;
  has_actions: boolean;
  ignore_whitespace_conflicts: boolean;
  allow_merge_commits: boolean;
  allow_rebase: boolean;
  allow_rebase_explicit: boolean;
  allow_squash_merge: boolean;
  allow_rebase_update: boolean;
  default_delete_branch_after_merge: boolean;
  default_merge_style: 'merge' | 'rebase' | 'rebase-merge' | 'squash';
  default_allow_maintainer_edit: boolean;
  avatar_url: string;
  internal: boolean;
  mirror_interval: string;
  mirror_updated?: string;
  repo_transfer?: unknown;
}

export interface CreateRepoOptions {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
  default_branch?: string;
  gitignores?: string;
  issue_labels?: string;
  license?: string;
  readme?: string;
  template?: boolean;
  trust_model?: 'default' | 'collaborator' | 'committer' | 'collaboratorcommitter';
}

export interface UpdateRepoOptions {
  name?: string;
  description?: string;
  website?: string;
  private?: boolean;
  template?: boolean;
  has_issues?: boolean;
  has_wiki?: boolean;
  has_pull_requests?: boolean;
  has_projects?: boolean;
  has_releases?: boolean;
  has_packages?: boolean;
  has_actions?: boolean;
  default_branch?: string;
  archived?: boolean;
  allow_merge_commits?: boolean;
  allow_rebase?: boolean;
  allow_rebase_explicit?: boolean;
  allow_squash_merge?: boolean;
  allow_rebase_update?: boolean;
  default_delete_branch_after_merge?: boolean;
  default_merge_style?: 'merge' | 'rebase' | 'rebase-merge' | 'squash';
  default_allow_maintainer_edit?: boolean;
  ignore_whitespace_conflicts?: boolean;
}

// ============================================================
// Issue 相关
// ============================================================

export interface GiteaLabel {
  id: number;
  name: string;
  exclusive: boolean;
  is_archived: boolean;
  color: string;
  description: string;
  url: string;
}

export interface CreateLabelOptions {
  name: string;
  color: string;
  description?: string;
  exclusive?: boolean;
  is_archived?: boolean;
}

export interface UpdateLabelOptions {
  name?: string;
  color?: string;
  description?: string;
  exclusive?: boolean;
  is_archived?: boolean;
}

export interface GiteaMilestone {
  id: number;
  title: string;
  description: string;
  state: 'open' | 'closed';
  open_issues: number;
  closed_issues: number;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
  due_on?: string;
}

export interface GiteaIssue {
  id: number;
  url: string;
  html_url: string;
  number: number;
  user: GiteaUser;
  original_author?: string;
  original_author_id?: number;
  title: string;
  body: string;
  ref?: string;
  labels: GiteaLabel[];
  milestone?: GiteaMilestone;
  assignee?: GiteaUser;
  assignees?: GiteaUser[];
  state: 'open' | 'closed';
  is_locked: boolean;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  due_date?: string;
  pull_request?: {
    merged: boolean;
    merged_at?: string;
  };
  repository?: GiteaRepository;
  pin_order?: number;
}

export interface CreateIssueOptions {
  title: string;
  body?: string;
  assignee?: string;
  assignees?: string[];
  due_date?: string;
  labels?: number[];
  milestone?: number;
  ref?: string;
}

export interface UpdateIssueOptions {
  title?: string;
  body?: string;
  assignee?: string;
  assignees?: string[];
  milestone?: number;
  state?: 'open' | 'closed';
  due_date?: string;
  unset_due_date?: boolean;
}

// ============================================================
// Pull Request 相关
// ============================================================

export interface GiteaPullRequest {
  id: number;
  url: string;
  number: number;
  user: GiteaUser;
  title: string;
  body: string;
  labels: GiteaLabel[];
  milestone?: GiteaMilestone;
  assignee?: GiteaUser;
  assignees?: GiteaUser[];
  state: 'open' | 'closed';
  is_locked: boolean;
  comments: number;
  html_url: string;
  diff_url: string;
  patch_url: string;
  mergeable: boolean;
  merged: boolean;
  merged_at?: string;
  merge_commit_sha?: string;
  merged_by?: GiteaUser;
  allow_maintainer_edit: boolean;
  base: {
    label: string;
    ref: string;
    sha: string;
    repo_id: number;
    repo?: GiteaRepository;
  };
  head: {
    label: string;
    ref: string;
    sha: string;
    repo_id: number;
    repo?: GiteaRepository;
  };
  merge_base: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  pin_order?: number;
}

export interface CreatePullRequestOptions {
  title: string;
  head: string;
  base: string;
  body?: string;
  assignee?: string;
  assignees?: string[];
  labels?: number[];
  milestone?: number;
  due_date?: string;
}

export interface UpdatePullRequestOptions {
  title?: string;
  body?: string;
  assignee?: string;
  assignees?: string[];
  milestone?: number;
  state?: 'open' | 'closed';
  due_date?: string;
  unset_due_date?: boolean;
  allow_maintainer_edit?: boolean;
}

export interface MergePullRequestOptions {
  Do: 'merge' | 'rebase' | 'rebase-merge' | 'squash' | 'manually-merged';
  MergeCommitID?: string;
  MergeMessageField?: string;
  MergeTitleField?: string;
  delete_branch_after_merge?: boolean;
  force_merge?: boolean;
  head_commit_id?: string;
  merge_when_checks_succeed?: boolean;
}

// ============================================================
// Comment 相关
// ============================================================

export interface GiteaComment {
  id: number;
  html_url: string;
  pull_request_url?: string;
  issue_url?: string;
  user: GiteaUser;
  original_author?: string;
  original_author_id?: number;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentOptions {
  body: string;
}

// ============================================================
// Project 相关
// ============================================================

export interface GiteaProject {
  id: number;
  title: string;
  description: string;
  state: 'open' | 'closed';
  repository_id: number;
  creator: GiteaUser;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface GiteaProjectColumn {
  id: number;
  title: string;
  project_id: number;
  sorting: number;
  created_at: string;
  updated_at: string;
}

export interface GiteaProjectCard {
  id: number;
  column_id: number;
  content_id: number;
  content_type: 'issue' | 'pull';
  creator: GiteaUser;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectOptions {
  title: string;
  description?: string;
}

export interface UpdateProjectOptions {
  title?: string;
  description?: string;
  state?: 'open' | 'closed';
}

// ============================================================
// 搜索相关
// ============================================================

export interface SearchRepoOptions {
  q?: string;
  topic?: boolean;
  includeDesc?: boolean;
  uid?: number;
  priority_owner_id?: number;
  team_id?: number;
  starred_by?: number;
  private?: boolean;
  is_private?: boolean;
  template?: boolean;
  archived?: boolean;
  mode?: string;
  exclusive?: boolean;
  sort?: 'alpha' | 'created' | 'updated' | 'size' | 'id';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  ok: boolean;
  data: T[];
}

// ============================================================
// 分页相关
// ============================================================

export interface ListOptions {
  page?: number;
  limit?: number;
}

export interface IssueListOptions extends ListOptions {
  state?: 'open' | 'closed' | 'all';
  labels?: string;
  q?: string;
  type?: 'issues' | 'pulls';
  milestones?: string;
  since?: string;
  before?: string;
  created_by?: string;
  assigned_by?: string;
  mentioned_by?: string;
}

export interface PullRequestListOptions extends ListOptions {
  state?: 'open' | 'closed' | 'all';
  sort?: 'oldest' | 'recentupdate' | 'leastupdate' | 'mostcomment' | 'leastcomment' | 'priority';
  milestone?: number;
  labels?: number[];
}

// ============================================================
// Wiki 相关
// ============================================================

export interface GiteaWikiCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer?: {
    name: string;
    email: string;
    date: string;
  };
}

export interface GiteaWikiPage {
  title: string;
  name: string;
  html_url: string;
  sub_url: string;
  last_commit: GiteaWikiCommit;
}

export interface GiteaWikiPageContent extends GiteaWikiPage {
  content: string;
  content_base64?: string;
  sidebar?: string;
  footer?: string;
}

export interface GiteaWikiRevision {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
}

export interface GiteaWikiCommitList {
  commits: GiteaWikiRevision[];
  count: number;
}

export interface CreateWikiPageOptions {
  title: string;
  content_base64: string;
  message?: string;
}

export interface UpdateWikiPageOptions {
  title?: string;
  content_base64?: string;
  message?: string;
}

export interface WikiListOptions extends ListOptions {
  // Inherits page and limit from ListOptions
}

// ============================================================
// API 响应类型
// ============================================================

export interface GiteaAPIResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface GiteaError {
  message: string;
  url?: string;
}

// ============================================================
// Webhook 相关
// ============================================================

export type WebhookType =
  | 'dingtalk'
  | 'discord'
  | 'gitea'
  | 'gogs'
  | 'msteams'
  | 'slack'
  | 'telegram'
  | 'feishu'
  | 'wechatwork'
  | 'packagist';

export interface GiteaWebhook {
  id: number;
  type: WebhookType;
  active: boolean;
  config: Record<string, string>;
  events: string[];
  authorization_header?: string;
  branch_filter?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookOptions {
  type: WebhookType;
  config: {
    url: string;
    content_type: string;
    secret?: string;
    [key: string]: string | undefined;
  };
  events?: string[];
  active?: boolean;
  branch_filter?: string;
  authorization_header?: string;
}

export interface UpdateWebhookOptions {
  config?: Record<string, string>;
  events?: string[];
  active?: boolean;
  branch_filter?: string;
  authorization_header?: string;
}
