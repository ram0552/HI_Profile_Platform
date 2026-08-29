import { fetchWithAuth } from './apiClient';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch blocks for authenticated user
 */
export const getUserBlocks = async (accessToken) => {
  return fetchWithAuth('/profile-blocks', { method: 'GET' }, accessToken);
};

/**
 * Fetch public profile details and blocks by username
 */
export const getPublicProfileAndBlocks = async (username) => {
  const response = await fetch(`${API_BASE_URL}/profile-blocks/public/${username}`);
  return response.json();
};

/**
 * Create a new ProfileBlock
 */
export const createBlockApi = async (blockData, accessToken) => {
  return fetchWithAuth('/profile-blocks', {
    method: 'POST',
    body: JSON.stringify(blockData)
  }, accessToken);
};

/**
 * Update configuration, layout, or visibility of a ProfileBlock
 */
export const updateBlockApi = async (id, updateData, accessToken) => {
  return fetchWithAuth(`/profile-blocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  }, accessToken);
};

/**
 * Delete a ProfileBlock by ID
 */
export const deleteBlockApi = async (id, accessToken) => {
  return fetchWithAuth(`/profile-blocks/${id}`, {
    method: 'DELETE'
  }, accessToken);
};

/**
 * Bulk reorder/update layout for user blocks
 */
export const reorderBlocksApi = async (blocks, accessToken) => {
  return fetchWithAuth('/profile-blocks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ blocks })
  }, accessToken);
};

/**
 * Trigger Instant Refresh for authenticated user (Max 2/day)
 */
export const refreshBentoProfileApi = async (accessToken) => {
  return fetchWithAuth('/profile-blocks/refresh', {
    method: 'POST'
  }, accessToken);
};

/**
 * Fetch current refresh status & remaining count for authenticated user
 */
export const getRefreshStatusApi = async (accessToken) => {
  return fetchWithAuth('/profile-blocks/refresh-status', { method: 'GET' }, accessToken);
};
