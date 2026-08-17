# Implementation Plan: Pure HTTP-Only Cookie Refresh Token Transport

Transition the refresh token transport mechanism exclusively to HTTP-Only cookies across the Hi-Profile application. This eliminates duplicate storage, prevents raw refresh token exposure in API response payloads or URL parameters, and mitigates XSS risks by removing `localStorage` storage and retrieval of refresh tokens on the frontend.

## User Review Required

> [!IMPORTANT]
> **API Payload Contract Update**:
> The `data.refreshToken` field will be removed from JSON response payloads returned by `/api/auth/login` and `/api/auth/refresh`.
> OAuth redirect URLs (`/google/callback` and `/github/callback`) will no longer include the `refreshToken` query parameter.
> All client-side refresh authentication will rely exclusively on the browser automatically transmitting the HTTP-Only `refreshToken` cookie (`credentials: 'include'`).

## Proposed Changes

---

### Backend Components

#### [MODIFY] [authController.js](file:///d:/MERN2/Hi-Profile-main/server/controllers/authController.js)

- **`login`**:
  - Remove `refreshToken` from the returned JSON response `data` object.
  - Continue invoking `setAuthCookies(res, accessToken, refreshToken)` to issue the HTTP-Only `refreshToken` cookie.

- **`refresh`**:
  - Read `incomingRefreshToken` strictly from `req.cookies?.refreshToken`.
  - Validate JWT and MongoDB `tokenHash`.
  - Perform rotation: delete existing MongoDB document, create new MongoDB document with new `tokenHash`.
  - Invoke `setAuthCookies(res, newAccessToken, newRefreshToken)` to set updated HTTP-Only cookies.
  - Remove `refreshToken` from the returned JSON response `data` object.

- **`logout`**:
  - Read `incomingRefreshToken` from `req.cookies?.refreshToken` (or `req.sessionId`).
  - Delete matching `RefreshToken` record from MongoDB.
  - Invoke `clearAuthCookies(res)`.

- **`googleCallback` & `githubCallback`**:
  - Keep calling `setAuthCookies(res, accessToken, refreshToken)`.
  - Update redirect URL to remove `&refreshToken=${refreshToken}` parameter (redirect only with `?accessToken=${accessToken}`).

---

### Frontend Components

#### [MODIFY] [AuthContext.jsx](file:///d:/MERN2/Hi-Profile-main/client/src/context/AuthContext.jsx)

- **`refreshToken`**:
  - Issue `POST` request to `${API_BASE}/refresh` with `credentials: 'include'` and no request body.
  - Update `accessToken` in state upon success.
  - Remove all `localStorage` reads (`getItem('refreshToken')`), writes (`setItem('refreshToken', ...)`), and deletes (`removeItem('refreshToken')`).

- **`loginUser`**:
  - Update function signature to `(userData, token)`.
  - Remove `localStorage.setItem('refreshToken', ...)` logic.

- **`logoutUser`**:
  - Call `POST ${API_BASE}/logout` with `credentials: 'include'` and `Authorization` header.
  - Remove `body: JSON.stringify({ refreshToken })`.
  - Remove `localStorage.removeItem('refreshToken')`.

- **`logoutAllDevices`**:
  - Remove `localStorage.removeItem('refreshToken')`.

- **`useEffect` (OAuth callback handler)**:
  - Read `accessToken` from URL search parameters (`urlAccess`).
  - Remove `urlRefresh` parameter check and `localStorage.setItem('refreshToken', urlRefresh)`.

#### [MODIFY] [Login.jsx](file:///d:/MERN2/Hi-Profile-main/client/src/pages/Login.jsx)

- Update `loginUser` invocation: `loginUser(data.data.user, data.data.accessToken)`.

---

## Verification Plan

### Automated & Manual Verification steps

1. **Login Test**:
   - Trigger login from UI or API test.
   - Inspect response JSON: Verify `data.accessToken` exists, but `data.refreshToken` is absent.
   - Inspect DevTools Cookies: Verify `refreshToken` cookie is set with `HttpOnly` and `SameSite=Lax`.
   - Inspect DevTools LocalStorage: Verify `refreshToken` key does NOT exist.

2. **MongoDB Session Storage & Rotation Test**:
   - Check MongoDB `refreshtokens` collection: Verify a hashed token record exists with `userId`, `tokenHash`, and `sessionId`.
   - Trigger token refresh via `/api/auth/refresh`.
   - Verify response JSON contains `accessToken`.
   - Check MongoDB `refreshtokens` collection: Verify old token record was deleted and a new hashed token record was created (token rotation).

3. **Logout & Session Termination Test**:
   - Trigger Logout from client UI or API.
   - Verify HTTP-Only cookies are cleared.
   - Check MongoDB `refreshtokens` collection: Verify session record was deleted from MongoDB.
