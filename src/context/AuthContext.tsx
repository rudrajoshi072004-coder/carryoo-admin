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
import { clearSession, getStoredUser, persistSession } from '../api/client'
import { loginWithPassword } from '../api/services/auth'
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
    setUser(getStoredUser())
    setLoading(false)
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    const session = await loginWithPassword(phone, password)
    if (!isAdminRole(session.user.role)) {
      throw new Error(
        'This account is not an admin. Ask your team to run: python manage.py promote_admin YOUR_PHONE',
      )
    }
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
