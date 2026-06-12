import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '../lib/api/auth'
import { getAccessToken, setAccessToken } from '../lib/api/client'
import { AuthContext } from './authState'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authModal, setAuthModal] = useState(null)

  const closeAuthModal = useCallback(() => setAuthModal(null), [])
  const openLogin = useCallback(() => setAuthModal('login'), [])
  const openRegister = useCallback(() => setAuthModal('register'), [])

  const loadCurrentUser = useCallback(async () => {
    const payload = await fetchCurrentUser()
    setUser(payload.user)
    return payload.user
  }, [])

  const restoreSession = useCallback(async () => {
    setIsLoading(true)
    try {
      if (getAccessToken()) {
        await loadCurrentUser()
        return
      }
      const refreshed = await refreshSession()
      setUser(refreshed.user)
    } catch {
      setAccessToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [loadCurrentUser])

  useEffect(() => {
    // Auth bootstrap intentionally restores state after app mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restoreSession()
  }, [restoreSession])

  const login = useCallback(async (credentials) => {
    const payload = await loginUser(credentials)
    setUser(payload.user)
    closeAuthModal()
    return payload.user
  }, [closeAuthModal])

  const register = useCallback(async (values) => {
    const payload = await registerUser(values)
    setUser(payload.user)
    closeAuthModal()
    return payload.user
  }, [closeAuthModal])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  const requireAuth = useCallback((reason = null) => {
    if (user) return true
    setAuthModal(reason || 'login')
    return false
  }, [user])

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    authModal,
    openLogin,
    openRegister,
    closeAuthModal,
    login,
    register,
    logout,
    requireAuth,
    reloadUser: loadCurrentUser,
  }), [
    authModal,
    closeAuthModal,
    isLoading,
    loadCurrentUser,
    login,
    logout,
    openLogin,
    openRegister,
    register,
    requireAuth,
    user,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
