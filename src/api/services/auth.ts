import { api } from '../client'
import type { LoginResponse } from '../types'

function normalizePhone(phone: string): string {
  const normalized = phone.replace(/\D/g, '')
  return normalized.startsWith('91') ? `+${normalized}` : `+91${normalized}`
}

export async function loginWithPassword(phone: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login/password', {
    phone: normalizePhone(phone),
    password,
  })
  return data
}

/** Admin portal login — backend promotes bootstrap phones and enforces admin role. */
export async function loginForAdmin(phone: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login/admin', {
    phone: normalizePhone(phone),
    password,
  })
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data
}
