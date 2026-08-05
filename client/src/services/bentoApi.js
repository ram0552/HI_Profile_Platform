const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch blocks for authenticated user
 */
export const getUserBlocks = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/profile-blocks`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return response.json();
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
  const response = await fetch(`${API_BASE_URL}/profile-blocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(blockData)
  });
  return response.json();
};

/**
 * Update configuration, layout, or visibility of a ProfileBlock
 */
export const updateBlockApi = async (id, updateData, accessToken) => {
  const response = await fetch(`${API_BASE_URL}/profile-blocks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(updateData)
  });
  return response.json();
};

/**
 * Delete a ProfileBlock by ID
 */
export const deleteBlockApi = async (id, accessToken) => {
  const response = await fetch(`${API_BASE_URL}/profile-blocks/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return response.json();
};

/**
 * Bulk reorder/update layout for user blocks
 */
export const reorderBlocksApi = async (blocks, accessToken) => {
  const response = await fetch(`${API_BASE_URL}/profile-blocks/reorder`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ blocks })
  });
  return response.json();
};
