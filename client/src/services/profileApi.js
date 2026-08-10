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
