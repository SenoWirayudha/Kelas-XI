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
  const [loginPrefill, setLoginPrefill] = useState(null)

  const closeAuthModal = useCallback(() => {
    setAuthModal(null)
    setLoginPrefill(null)
  }, [])
  const openLogin = useCallback((prefill) => {
    if (prefill) setLoginPrefill(prefill)
    setAuthModal('login')
  }, [])
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
    try { localStorage.removeItem('moodspace_last_user') } catch { /* ignore */ }
    return payload.user
  }, [closeAuthModal])

  const register = useCallback(async (values) => {
    const payload = await registerUser(values)
    setUser(payload.user)
    closeAuthModal()
    try { localStorage.removeItem('moodspace_last_user') } catch { /* ignore */ }
    return payload.user
  }, [closeAuthModal])

  const logout = useCallback(async () => {
    if (user) {
      try {
        localStorage.setItem('moodspace_last_user', JSON.stringify({
          displayName: user.displayName || user.username,
          avatarUrl: user.profile?.avatarUrl || null,
          identifier: user.email || user.username,
        }))
      } catch { /* ignore */ }
    }
    await logoutUser()
    setUser(null)
  }, [user])

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
    loginPrefill,
    openLogin,
    openRegister,
    closeAuthModal,
    setLoginPrefill,
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
    loginPrefill,
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
