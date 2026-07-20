import { api } from '../client'
import type { LoginResponse } from '../types'

export async function loginWithPassword(phone: string, password: string): Promise<LoginResponse> {
  const normalized = phone.replace(/\D/g, '')
  const withCountry = normalized.startsWith('91') ? `+${normalized}` : `+91${normalized}`
  const { data } = await api.post<LoginResponse>('/auth/login/password', {
    phone: withCountry,
    password,
  })
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data
}
