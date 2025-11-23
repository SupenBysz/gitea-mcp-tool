import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'notification-tools' });

export interface NotificationToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// List notifications
export interface ListNotificationsParams {
  all?: boolean;
  status_types?: string[];
  subject_type?: string[];
  since?: string;
  before?: string;
  page?: number;
  limit?: number;
}

export async function listNotifications(
  ctx: NotificationToolsContext,
  params: ListNotificationsParams
): Promise<unknown> {
  logger.info('Listing notifications');

  const queryParams: Record<string, string> = {};
  if (params.all !== undefined) queryParams.all = String(params.all);
  if (params.status_types) queryParams['status-types'] = params.status_types.join(',');
  if (params.subject_type) queryParams['subject-type'] = params.subject_type.join(',');
  if (params.since) queryParams.since = params.since;
  if (params.before) queryParams.before = params.before;
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: '/notifications',
    params: queryParams,
  });

  return response.data;
}

// Mark notifications as read
export interface MarkNotificationsParams {
  last_read_at?: string;
  all?: boolean;
  status_types?: string[];
  to_status?: string;
}

export async function markNotifications(
  ctx: NotificationToolsContext,
  params: MarkNotificationsParams
): Promise<unknown> {
  logger.info('Marking notifications');

  const queryParams: Record<string, string> = {};
  if (params.last_read_at) queryParams.last_read_at = params.last_read_at;
  if (params.all !== undefined) queryParams.all = String(params.all);
  if (params.status_types) queryParams['status-types'] = params.status_types.join(',');
  if (params.to_status) queryParams.to_status = params.to_status;

  const response = await ctx.client.request({
    method: 'PUT',
    path: '/notifications',
    params: queryParams,
  });

  return response.data;
}

// Check new notifications
export async function checkNewNotifications(
  ctx: NotificationToolsContext
): Promise<unknown> {
  logger.info('Checking new notifications');

  const response = await ctx.client.request({
    method: 'GET',
    path: '/notifications/new',
  });

  return response.data;
}

// Get notification thread
export interface GetNotificationThreadParams {
  id: string;
}

export async function getNotificationThread(
  ctx: NotificationToolsContext,
  params: GetNotificationThreadParams
): Promise<unknown> {
  logger.info({ id: params.id }, 'Getting notification thread');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/notifications/threads/${params.id}`,
  });

  return response.data;
}

// Mark notification thread as read
export async function markNotificationThread(
  ctx: NotificationToolsContext,
  params: GetNotificationThreadParams
): Promise<unknown> {
  logger.info({ id: params.id }, 'Marking notification thread as read');

  const response = await ctx.client.request({
    method: 'PATCH',
    path: `/notifications/threads/${params.id}`,
  });

  return response.data;
}

// List repository notifications
export interface ListRepoNotificationsParams {
  owner?: string;
  repo?: string;
  all?: boolean;
  status_types?: string[];
  subject_type?: string[];
  since?: string;
  before?: string;
  page?: number;
  limit?: number;
}

export async function listRepoNotifications(
  ctx: NotificationToolsContext,
  params: ListRepoNotificationsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing repository notifications');

  const queryParams: Record<string, string> = {};
  if (params.all !== undefined) queryParams.all = String(params.all);
  if (params.status_types) queryParams['status-types'] = params.status_types.join(',');
  if (params.subject_type) queryParams['subject-type'] = params.subject_type.join(',');
  if (params.since) queryParams.since = params.since;
  if (params.before) queryParams.before = params.before;
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/notifications`,
    params: queryParams,
  });

  return response.data;
}

// Mark repository notifications
export interface MarkRepoNotificationsParams {
  owner?: string;
  repo?: string;
  last_read_at?: string;
  all?: boolean;
  status_types?: string[];
  to_status?: string;
}

export async function markRepoNotifications(
  ctx: NotificationToolsContext,
  params: MarkRepoNotificationsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Marking repository notifications');

  const queryParams: Record<string, string> = {};
  if (params.last_read_at) queryParams.last_read_at = params.last_read_at;
  if (params.all !== undefined) queryParams.all = String(params.all);
  if (params.status_types) queryParams['status-types'] = params.status_types.join(',');
  if (params.to_status) queryParams.to_status = params.to_status;

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${owner}/${repo}/notifications`,
    params: queryParams,
  });

  return response.data;
}
