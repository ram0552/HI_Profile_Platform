const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch current user profile and user details
 */
export const getProfileMeApi = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/profile/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return response.json();
};

/**
 * Update current user profile details
 */
export const updateProfileMeApi = async (profileData, accessToken) => {
  const response = await fetch(`${API_BASE_URL}/profile/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(profileData)
  });
  return response.json();
};

/**
 * Change current user password securely
 */
export const changePasswordApi = async ({ currentPassword, newPassword }, accessToken) => {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return response.json();
};

/**
 * Enhance bio using Gemini AI
 */
export const enhanceBioApi = async (bio, accessToken) => {
  const response = await fetch(`${API_BASE_URL}/profile/bio/enhance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ bio })
  });
  return response.json();
};

/**
 * Fetch Bento design customization for a username (Public)
 */
export const getProfileCustomizationApi = async (username) => {
  const cleanUsername = (username || '').toLowerCase().trim().replace(/^@/, '');
  const response = await fetch(`${API_BASE_URL}/profiles/${cleanUsername}/customization`);
  return response.json();
};

/**
 * Update Bento design customization for a profile (Authenticated owner)
 */
export const updateProfileCustomizationApi = async (username, customizationData, accessToken) => {
  const cleanUsername = (username || '').toLowerCase().trim().replace(/^@/, '');
  const response = await fetch(`${API_BASE_URL}/profiles/${cleanUsername}/customization`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(customizationData)
  });
  return response.json();
};

