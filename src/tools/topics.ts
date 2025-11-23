import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'topics-tools' });

export interface TopicsToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface TopicsParams {
  owner?: string;
  repo?: string;
}

// List repository topics
export async function listTopics(
  ctx: TopicsToolsContext,
  params: TopicsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo }, 'Listing repository topics');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/topics`,
  });

  return response.data;
}

// Replace all repository topics
export interface ReplaceTopicsParams extends TopicsParams {
  topics: string[];
}

export async function replaceTopics(
  ctx: TopicsToolsContext,
  params: ReplaceTopicsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, topics: params.topics }, 'Replacing repository topics');

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/topics`,
    body: { topics: params.topics },
  });

  return response.data;
}

// Add a topic to repository
export interface AddTopicParams extends TopicsParams {
  topic: string;
}

export async function addTopic(
  ctx: TopicsToolsContext,
  params: AddTopicParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, topic: params.topic }, 'Adding topic to repository');

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/topics/${encodeURIComponent(params.topic)}`,
  });

  return response.data;
}

// Delete a topic from repository
export interface DeleteTopicParams extends TopicsParams {
  topic: string;
}

export async function deleteTopic(
  ctx: TopicsToolsContext,
  params: DeleteTopicParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);

  logger.info({ owner, repo, topic: params.topic }, 'Deleting topic from repository');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/topics/${encodeURIComponent(params.topic)}`,
  });

  return response.data;
}
