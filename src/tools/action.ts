import { GiteaClient } from '../gitea-api-client.js';
import { ContextManager } from '../context-manager.js';
import pino from 'pino';

const logger = pino({ name: 'action-tools' });

export interface ActionToolsContext {
  client: GiteaClient;
  contextManager: ContextManager;
}

// Common parameters
export interface ActionParams {
  owner?: string;
  repo?: string;
}

// ==================== Workflows ====================

export interface ListWorkflowsParams extends ActionParams {
  page?: number;
  limit?: number;
}

export async function listWorkflows(
  ctx: ActionToolsContext,
  params: ListWorkflowsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing workflows');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/workflows`,
    params: queryParams,
  });

  return response.data;
}

export interface GetWorkflowParams extends ActionParams {
  workflow_id: string;
}

export async function getWorkflow(
  ctx: ActionToolsContext,
  params: GetWorkflowParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, workflow_id: params.workflow_id }, 'Getting workflow');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(params.workflow_id)}`,
  });

  return response.data;
}

export async function enableWorkflow(
  ctx: ActionToolsContext,
  params: GetWorkflowParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, workflow_id: params.workflow_id }, 'Enabling workflow');

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(params.workflow_id)}/enable`,
  });

  return response.data;
}

export async function disableWorkflow(
  ctx: ActionToolsContext,
  params: GetWorkflowParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, workflow_id: params.workflow_id }, 'Disabling workflow');

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(params.workflow_id)}/disable`,
  });

  return response.data;
}

export interface DispatchWorkflowParams extends ActionParams {
  workflow_id: string;
  ref: string;
  inputs?: Record<string, string>;
}

export async function dispatchWorkflow(
  ctx: ActionToolsContext,
  params: DispatchWorkflowParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, workflow_id: params.workflow_id, ref: params.ref }, 'Dispatching workflow');

  const body: any = { ref: params.ref };
  if (params.inputs) body.inputs = params.inputs;

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(params.workflow_id)}/dispatches`,
    body,
  });

  return response.data;
}

// ==================== Runs ====================

export interface ListRunsParams extends ActionParams {
  workflow_id?: string;
  actor?: string;
  branch?: string;
  status?: string;
  event?: string;
  page?: number;
  limit?: number;
}

export async function listRuns(
  ctx: ActionToolsContext,
  params: ListRunsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing runs');

  const queryParams: Record<string, string> = {};
  if (params.workflow_id) queryParams.workflow_id = params.workflow_id;
  if (params.actor) queryParams.actor = params.actor;
  if (params.branch) queryParams.branch = params.branch;
  if (params.status) queryParams.status = params.status;
  if (params.event) queryParams.event = params.event;
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/runs`,
    params: queryParams,
  });

  return response.data;
}

export interface GetRunParams extends ActionParams {
  run: string;
}

export async function getRun(
  ctx: ActionToolsContext,
  params: GetRunParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, run: params.run }, 'Getting run');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/runs/${encodeURIComponent(params.run)}`,
  });

  return response.data;
}

export async function deleteRun(
  ctx: ActionToolsContext,
  params: GetRunParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, run: params.run }, 'Deleting run');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/actions/runs/${encodeURIComponent(params.run)}`,
  });

  return response.data;
}

export interface ListRunArtifactsParams extends ActionParams {
  run: string;
  page?: number;
  limit?: number;
}

export async function listRunArtifacts(
  ctx: ActionToolsContext,
  params: ListRunArtifactsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, run: params.run }, 'Listing run artifacts');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/runs/${encodeURIComponent(params.run)}/artifacts`,
    params: queryParams,
  });

  return response.data;
}

export interface ListRunJobsParams extends ActionParams {
  run: string;
  page?: number;
  limit?: number;
}

export async function listRunJobs(
  ctx: ActionToolsContext,
  params: ListRunJobsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, run: params.run }, 'Listing run jobs');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/runs/${encodeURIComponent(params.run)}/jobs`,
    params: queryParams,
  });

  return response.data;
}

// ==================== Jobs ====================

export interface ListJobsParams extends ActionParams {
  page?: number;
  limit?: number;
}

export async function listJobs(
  ctx: ActionToolsContext,
  params: ListJobsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing jobs');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/jobs`,
    params: queryParams,
  });

  return response.data;
}

export interface GetJobParams extends ActionParams {
  job_id: string;
}

export async function getJob(
  ctx: ActionToolsContext,
  params: GetJobParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, job_id: params.job_id }, 'Getting job');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/jobs/${encodeURIComponent(params.job_id)}`,
  });

  return response.data;
}

export async function downloadJobLogs(
  ctx: ActionToolsContext,
  params: GetJobParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, job_id: params.job_id }, 'Downloading job logs');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/jobs/${encodeURIComponent(params.job_id)}/logs`,
  });

  return response.data;
}

// ==================== Artifacts ====================

export interface ListArtifactsParams extends ActionParams {
  page?: number;
  limit?: number;
}

export async function listArtifacts(
  ctx: ActionToolsContext,
  params: ListArtifactsParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing artifacts');

  const queryParams: Record<string, string> = {};
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/artifacts`,
    params: queryParams,
  });

  return response.data;
}

export interface GetArtifactParams extends ActionParams {
  artifact_id: string;
}

export async function getArtifact(
  ctx: ActionToolsContext,
  params: GetArtifactParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, artifact_id: params.artifact_id }, 'Getting artifact');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/artifacts/${encodeURIComponent(params.artifact_id)}`,
  });

  return response.data;
}

export async function downloadArtifact(
  ctx: ActionToolsContext,
  params: GetArtifactParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, artifact_id: params.artifact_id }, 'Downloading artifact');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/artifacts/${encodeURIComponent(params.artifact_id)}/zip`,
  });

  return response.data;
}

export async function deleteArtifact(
  ctx: ActionToolsContext,
  params: GetArtifactParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, artifact_id: params.artifact_id }, 'Deleting artifact');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/actions/artifacts/${encodeURIComponent(params.artifact_id)}`,
  });

  return response.data;
}

// ==================== Secrets ====================

export async function listSecrets(
  ctx: ActionToolsContext,
  params: ActionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing secrets');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/secrets`,
  });

  return response.data;
}

export interface UpdateSecretParams extends ActionParams {
  secretname: string;
  data: string;
}

export async function updateSecret(
  ctx: ActionToolsContext,
  params: UpdateSecretParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, secretname: params.secretname }, 'Updating secret');

  const body = { data: params.data };

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(params.secretname)}`,
    body,
  });

  return response.data;
}

export interface DeleteSecretParams extends ActionParams {
  secretname: string;
}

export async function deleteSecret(
  ctx: ActionToolsContext,
  params: DeleteSecretParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, secretname: params.secretname }, 'Deleting secret');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(params.secretname)}`,
  });

  return response.data;
}

// ==================== Variables ====================

export async function listVariables(
  ctx: ActionToolsContext,
  params: ActionParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo }, 'Listing variables');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/variables`,
  });

  return response.data;
}

export interface GetVariableParams extends ActionParams {
  variablename: string;
}

export async function getVariable(
  ctx: ActionToolsContext,
  params: GetVariableParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, variablename: params.variablename }, 'Getting variable');

  const response = await ctx.client.request({
    method: 'GET',
    path: `/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(params.variablename)}`,
  });

  return response.data;
}

export interface CreateVariableParams extends ActionParams {
  variablename: string;
  value: string;
}

export async function createVariable(
  ctx: ActionToolsContext,
  params: CreateVariableParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, variablename: params.variablename }, 'Creating variable');

  const body = { value: params.value };

  const response = await ctx.client.request({
    method: 'POST',
    path: `/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(params.variablename)}`,
    body,
  });

  return response.data;
}

export interface UpdateVariableParams extends ActionParams {
  variablename: string;
  value: string;
}

export async function updateVariable(
  ctx: ActionToolsContext,
  params: UpdateVariableParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, variablename: params.variablename }, 'Updating variable');

  const body = { value: params.value };

  const response = await ctx.client.request({
    method: 'PUT',
    path: `/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(params.variablename)}`,
    body,
  });

  return response.data;
}

export interface DeleteVariableParams extends ActionParams {
  variablename: string;
}

export async function deleteVariable(
  ctx: ActionToolsContext,
  params: DeleteVariableParams
): Promise<unknown> {
  const owner = ctx.contextManager.resolveOwner(params.owner);
  const repo = ctx.contextManager.resolveRepo(params.repo);
  logger.info({ owner, repo, variablename: params.variablename }, 'Deleting variable');

  const response = await ctx.client.request({
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(params.variablename)}`,
  });

  return response.data;
}
