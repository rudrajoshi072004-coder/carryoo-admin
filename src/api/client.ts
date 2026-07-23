import axios, { type AxiosError } from 'axios'
import type { ApiEnvelope } from './types'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  'https://nashik-flow-backend-production.up.railway.app/api/v1'

const TOKEN_KEY = 'carryoo_admin_access'
const REFRESH_KEY = 'carryoo_admin_refresh'
const USER_KEY = 'carryoo_admin_user'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredUser(): import('./types').AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as import('./types').AuthUser
  } catch {
    return null
  }
}

export function persistSession(access: string, refresh: string, user: import('./types').AuthUser) {
  localStorage.setItem(TOKEN_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiEnvelope<unknown> | unknown
    if (body && typeof body === 'object' && 'success' in body && (body as ApiEnvelope<unknown>).success === true) {
      response.data = (body as ApiEnvelope<unknown>).data
    }
    return response
  },
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retried?: boolean }
    const status = error.response?.status

    if (status === 401 && original && !original._retried) {
      const refresh = getStoredRefreshToken()
      if (refresh) {
        original._retried = true
        try {
          const res = await axios.post<ApiEnvelope<{ access: string; refresh?: string }>>(
            `${API_BASE_URL}/auth/jwt/refresh`,
            { refresh },
            { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } },
          )
          const payload = res.data.data ?? (res.data as unknown as { access: string })
          const access = payload.access
          if (access) {
            localStorage.setItem(TOKEN_KEY, access)
            if (payload.refresh) localStorage.setItem(REFRESH_KEY, payload.refresh)
            original.headers = original.headers ?? {}
            original.headers.Authorization = `Bearer ${access}`
            return api.request(original)
          }
        } catch {
          clearSession()
        }
      }
    }

    throw error
  },
)

export function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === 'object' && Array.isArray((raw as { results?: T[] }).results)) {
    return (raw as { results: T[] }).results
  }
  return []
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Something went wrong'
  }
  const status = error.response?.status
  const data = error.response?.data as Record<string, unknown> | string | undefined

  if (status === 403) {
    if (data && typeof data === 'object') {
      const errors = data.errors as Record<string, unknown> | undefined
      if (typeof errors?.detail === 'string') return errors.detail
      if (typeof data.detail === 'string') return data.detail
    }
    return 'You do not have permission for this action. Sign in with an admin account.'
  }
  if (status === 401) {
    return 'Session expired. Please sign in again.'
  }
  if (typeof data === 'string') return data.slice(0, 300)
  if (data && typeof data === 'object') {
    const errors = data.errors as Record<string, unknown> | undefined
    if (errors?.detail) return String(errors.detail)
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.message === 'string') return data.message
  }
  return error.message || 'Request failed'
}

export function isForbidden(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403
}
