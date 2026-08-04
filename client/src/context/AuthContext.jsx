import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

const API_BASE = 'http://localhost:3001/api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null)
  const [loading, setLoading] = useState(true)

  const saveAccessToken = (token) => {
    setAccessToken(token)
    if (token) {
      localStorage.setItem('accessToken', token)
    } else {
      localStorage.removeItem('accessToken')
    }
  }

  // Refresh access token
  const refreshToken = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken') || ''
      const res = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      })
      const data = await res.json()
      if (data.success && data.data?.accessToken) {
        saveAccessToken(data.data.accessToken)
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken)
        }
        return data.data.accessToken
      } else {
        saveAccessToken(null)
        localStorage.removeItem('refreshToken')
        setUser(null)
        return null
      }
    } catch (err) {
      saveAccessToken(null)
      localStorage.removeItem('refreshToken')
      setUser(null)
      return null
    }
  }, [])

  // Fetch current user details
  const fetchMe = useCallback(async (token = accessToken) => {
    if (!token) {
      setLoading(false)
      return null
    }
    try {
      let res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      })

      if (res.status === 401) {
        // Try refresh
        const newToken = await refreshToken()
        if (newToken) {
          res = await fetch(`${API_BASE}/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
            credentials: 'include'
          })
        } else {
          setUser(null)
          setLoading(false)
          return null
        }
      }

      const data = await res.json()
      if (data.success && data.data) {
        setUser(data.data)
        setLoading(false)
        return data.data
      } else {
        setUser(null)
        setLoading(false)
        return null
      }
    } catch (err) {
      setUser(null)
      setLoading(false)
      return null
    }
  }, [accessToken, refreshToken])

  useEffect(() => {
    // Read tokens from URL if coming back from OAuth
    const params = new URLSearchParams(window.location.search)
    const urlAccess = params.get('accessToken')
    const urlRefresh = params.get('refreshToken')

    if (urlAccess && urlRefresh) {
      saveAccessToken(urlAccess)
      localStorage.setItem('refreshToken', urlRefresh)
      // Clean query params from URL
      window.history.replaceState({}, document.title, window.location.pathname)
      fetchMe(urlAccess)
    } else {
      fetchMe()
    }
  }, [fetchMe])

  const loginUser = (userData, token, rToken) => {
    setUser(userData)
    saveAccessToken(token)
    if (rToken) localStorage.setItem('refreshToken', rToken)
  }

  const logoutUser = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken') || ''
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken ? `Bearer ${accessToken}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      })
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      setUser(null)
      saveAccessToken(null)
      localStorage.removeItem('refreshToken')
    }
  }

  const logoutAllDevices = async () => {
    try {
      await fetch(`${API_BASE}/logout-all`, {
        method: 'POST',
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : ''
        },
        credentials: 'include'
      })
    } catch (e) {
      console.error('Logout all error', e)
    } finally {
      setUser(null)
      saveAccessToken(null)
      localStorage.removeItem('refreshToken')
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      loginUser,
      logoutUser,
      logoutAllDevices,
      fetchMe,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
