import { api, isForbidden, unwrapList } from '../client'

export type PortalOverview = {
  total_bookings: number
  active_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  estimated_revenue: string
  vehicle_types_active: number
  total_customers: number
  total_drivers: number
}

export type PortalDriverRow = {
  id: string
  user_id: string | null
  name: string
  owner_name?: string
  phone: string
  account_phone?: string
  driver_phone?: string
  email?: string
  city: string
  status: string
  kyc_status?: string
  onboarding_completed?: boolean
  vehicle_category: string
  vehicle_type?: string
  vehicle_number?: string
  vehicle_body_type?: string
  fuel_type?: string
  rating: string
  total_trips?: number
  wallet_balance?: string
  joined_at?: string | null
  registered_at?: string | null
  registration_status?: 'new' | 'kyc_pending' | 'approved' | 'rejected'
  documents?: Array<{
    type: string
    number: string
    status: string
    expiry: string
  }>
  vehicle_details?: {
    make: string
    model: string
    year: string
    color: string
    plate: string
    insurance: string
    fitness: string
  }
}

export type PortalCustomerRow = {
  id: string
  phone: string
  name: string
  city: string
  bookings_count: number
}

export type PortalAuditLogRow = {
  id: string
  action: string
  actor: string
  detail: string
  created_at: string | null
}

async function tryPortal<T>(path: string, method: 'get' | 'patch' = 'get', body?: unknown): Promise<T | null> {
  try {
    if (method === 'patch') {
      const { data } = await api.patch<T>(path, body)
      return data
    }
    const { data } = await api.get<T>(path)
    return data
  } catch (error) {
    if (isForbidden(error) || (error as { response?: { status?: number } })?.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function fetchPortalOverview(): Promise<PortalOverview | null> {
  return tryPortal<PortalOverview>('/admin/portal/overview/')
}

export async function fetchPortalDrivers(): Promise<PortalDriverRow[]> {
  const raw = await tryPortal<{ results?: PortalDriverRow[] } | PortalDriverRow[]>('/admin/portal/drivers/')
  if (!raw) return []
  return unwrapList<PortalDriverRow>(raw)
}

export async function fetchPortalCustomers(): Promise<PortalCustomerRow[]> {
  const raw = await tryPortal<{ results?: PortalCustomerRow[] } | PortalCustomerRow[]>('/admin/portal/customers/')
  if (!raw) return []
  return unwrapList<PortalCustomerRow>(raw)
}

export async function fetchPortalSettings(): Promise<Record<string, unknown> | null> {
  return tryPortal<Record<string, unknown>>('/admin/portal/settings/')
}

export async function savePortalSettings(payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return tryPortal<Record<string, unknown>>('/admin/portal/settings/', 'patch', payload)
}

export async function fetchPortalAuditLogs(): Promise<PortalAuditLogRow[]> {
  const raw = await tryPortal<{ results?: PortalAuditLogRow[] } | PortalAuditLogRow[]>('/admin/portal/audit-logs/')
  if (!raw) return []
  return unwrapList<PortalAuditLogRow>(raw)
}

export async function fetchDriverLocations(): Promise<unknown[] | null> {
  try {
    const { data } = await api.get('/tracking/driver-locations/')
    return unwrapList<unknown>(data)
  } catch (error) {
    if (isForbidden(error)) return null
    throw error
  }
}

export async function fetchWallets(): Promise<unknown[] | null> {
  try {
    const { data } = await api.get('/wallets/')
    return unwrapList<unknown>(data)
  } catch (error) {
    if (isForbidden(error)) return null
    throw error
  }
}

export async function fetchWalletTransactions(): Promise<unknown[]> {
  try {
    const { data } = await api.get('/wallet-transactions/')
    return unwrapList<unknown>(data)
  } catch {
    return []
  }
}

export async function fetchAuditLogsLegacy(): Promise<unknown[] | null> {
  try {
    const { data } = await api.get('/admin/audit-logs/')
    return unwrapList<unknown>(data)
  } catch (error) {
    if (isForbidden(error)) return null
    throw error
  }
}
