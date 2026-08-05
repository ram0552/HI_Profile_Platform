const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch normalized social platform profile stats through backend service
 * @param {string} platform - instagram, github, youtube, twitter, linkedin
 * @param {string} handle - username or identifier
 * @returns {Promise<Object>}
 */
export const fetchSocialStats = async (platform, handle) => {
  if (!platform || !handle) return null;
  
  let endpoint = `${API_BASE_URL}/social/${platform}/${encodeURIComponent(handle.trim())}`;
  if (platform === 'instagram') {
    endpoint = `${API_BASE_URL}/social/instagram/${encodeURIComponent(handle.trim())}`;
  }

  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    if (data.success || data.profile) {
      return data.profile || data;
    }
    return null;
  } catch (error) {
    console.error(`[Social API Error] Platform: ${platform}, Handle: ${handle}:`, error);
    return null;
  }
};
