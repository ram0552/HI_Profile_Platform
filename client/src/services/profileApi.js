import { fetchWithAuth } from './apiClient';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch current user profile and user details
 */
export const getProfileMeApi = async (accessToken) => {
  return fetchWithAuth('/profile/me', { method: 'GET' }, accessToken);
};

/**
 * Update current user profile details
 */
export const updateProfileMeApi = async (profileData, accessToken) => {
  return fetchWithAuth('/profile/me', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }, accessToken);
};

/**
 * Change current user password securely
 */
export const changePasswordApi = async ({ currentPassword, newPassword }, accessToken) => {
  return fetchWithAuth('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  }, accessToken);
};

/**
 * Enhance bio using Gemini AI
 */
export const enhanceBioApi = async (bio, accessToken) => {
  return fetchWithAuth('/profile/bio/enhance', {
    method: 'POST',
    body: JSON.stringify({ bio })
  }, accessToken);
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
  return fetchWithAuth(`/profiles/${cleanUsername}/customization`, {
    method: 'PUT',
    body: JSON.stringify(customizationData)
  }, accessToken);
};
