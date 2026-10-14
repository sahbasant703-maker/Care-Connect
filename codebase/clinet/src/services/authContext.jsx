import { createContext, useContext, useState, useEffect, useCallback } from 'react'

/**
 * Authentication context for managing user login state and JWT tokens.
 */
const AuthContext = createContext(null)

/**
 * AuthProvider component that wraps the app and provides auth state.
 *
 * @param {React.ReactNode} children - Child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Initialize auth state from localStorage on mount.
   */
  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('accessToken')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          setUser(JSON.parse(userData))
        } catch {
          // Invalid user data, clear storage
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  /**
   * Login user and store tokens.
   *
   * @param {Object} userData - User data from API
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  const login = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  /**
   * Logout user and clear tokens.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  /**
   * Get current access token.
   *
   * @returns {string|null} Access token or null
   */
  const getAccessToken = useCallback(() => {
    return localStorage.getItem('accessToken')
  }, [])

  /**
   * Get current refresh token.
   *
   * @returns {string|null} Refresh token or null
   */
  const getRefreshToken = useCallback(() => {
    return localStorage.getItem('refreshToken')
  }, [])

  const value = {
    user,
    loading,
    login,
    logout,
    getAccessToken,
    getRefreshToken,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access authentication context.
 *
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}