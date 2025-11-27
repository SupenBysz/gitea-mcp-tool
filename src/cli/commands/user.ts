/**
 * 用户管理命令
 */

import { createClient, createContextManager, ClientOptions } from '../utils/client.js';
import { success, error, outputDetails } from '../utils/output.js';
import { getUser as getUserInfo } from '../../tools/user.js';

/**
 * 获取当前用户信息
 */
export async function userCurrent(options: ClientOptions) {
  try {
    const client = await createClient(options);
    const result = await client.getCurrentUser();

    outputDetails({
      id: result.id,
      username: result.login,
      fullName: result.full_name,
      email: result.email,
      avatar: result.avatar_url,
    }, options);
  } catch (err: any) {
    error(`获取用户信息失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 获取指定用户信息
 */
export async function userGet(username: string, options: ClientOptions) {
  try {
    const client = await createClient(options);
    const contextManager = await createContextManager(client, options);
    const response = await getUserInfo({ client, contextManager }, { username });
    const result = response.user;

    outputDetails({
      id: result.id,
      username: result.login,
      fullName: result.full_name,
      email: result.email,
      avatar: result.avatar_url,
      website: result.website,
      location: result.location,
      description: result.description,
      followers: result.followers_count,
      following: result.following_count,
      starredRepos: result.starred_repos_count,
      created: result.created,
    }, options);
  } catch (err: any) {
    error(`获取用户信息失败: ${err.message}`);
    process.exit(1);
  }
}
