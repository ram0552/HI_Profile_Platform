const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Authenticated fetch helper with automatic 401 token refresh retry
 * @param {string} url - Target URL or endpoint path
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @param {string} [providedToken] - Optional access token
 * @returns {Promise<any>} Response JSON data
 */
export const fetchWithAuth = async (url, options = {}, providedToken = null) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  let token = providedToken || localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  try {
    let response = await fetch(fullUrl, { ...options, headers });
    let data = await response.json().catch(() => ({}));

    const isUnauthorized = response.status === 401 || (data && data.success === false && typeof data.message === 'string' && data.message.toLowerCase().includes('not authorized'));

    if (isUnauthorized) {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (storedRefreshToken) {
        console.log('[ApiClient] Access token expired. Attempting token refresh...');
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refreshToken: storedRefreshToken })
          });
          const refreshData = await refreshRes.json();

          if (refreshData.success && refreshData.data?.accessToken) {
            const newToken = refreshData.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            if (refreshData.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshData.data.refreshToken);
            }

            console.log('[ApiClient] Token refreshed successfully. Retrying request...');
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`
            };
            const retryResponse = await fetch(fullUrl, { ...options, headers: retryHeaders });
            return await retryResponse.json();
          }
        } catch (refreshErr) {
          console.error('[ApiClient] Token refresh failed:', refreshErr);
        }
      }

      // If refresh failed or no refresh token is present
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return data;
  } catch (err) {
    console.error('[ApiClient Fetch Error]', err);
    throw err;
  }
};
