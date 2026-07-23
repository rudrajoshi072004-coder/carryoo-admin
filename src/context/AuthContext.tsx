import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../api/types'
import {
  clearSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  persistSession,
} from '../api/client'
import { fetchMe, loginForAdmin } from '../api/services/auth'
import { isAdminRole } from '../utils/adminRoles'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrateSession() {
      const token = getStoredAccessToken()
      const stored = getStoredUser()
      if (!token || !stored) {
        if (!cancelled) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        const me = await fetchMe()
        if (cancelled) return

        if (!isAdminRole(me.role)) {
          clearSession()
          setUser(null)
          return
        }

        const refresh = getStoredRefreshToken()
        const synced: AuthUser = {
          id: me.id,
          phone: me.phone,
          role: me.role,
          city: me.city,
          name: me.name,
        }
        if (refresh) {
          persistSession(token, refresh, synced)
        }
        setUser(synced)
      } catch {
        if (!cancelled) {
          clearSession()
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void hydrateSession()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    const session = await loginForAdmin(phone, password)
    persistSession(session.access, session.refresh, session.user)
    setUser(session.user)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: isAdminRole(user?.role),
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
