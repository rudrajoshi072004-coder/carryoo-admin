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
  display_id?: string
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

async function tryPortal<T>(
  path: string,
  method: 'get' | 'patch' = 'get',
  body?: unknown,
): Promise<{ data: T | null; denied: boolean; unavailable: boolean }> {
  try {
    if (method === 'patch') {
      const { data } = await api.patch<T>(path, body)
      return { data, denied: false, unavailable: false }
    }
    const { data } = await api.get<T>(path)
    return { data, denied: false, unavailable: false }
  } catch (error) {
    if (isForbidden(error)) {
      return { data: null, denied: true, unavailable: false }
    }
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return { data: null, denied: false, unavailable: true }
    }
    throw error
  }
}

export async function fetchPortalOverview(): Promise<PortalOverview | null> {
  const result = await tryPortal<PortalOverview>('/admin/portal/overview/')
  return result.data
}

export type PortalDriversResult = {
  rows: PortalDriverRow[]
  denied: boolean
  unavailable: boolean
}

export async function fetchPortalDrivers(): Promise<PortalDriversResult> {
  const result = await tryPortal<{ results?: PortalDriverRow[] } | PortalDriverRow[]>(
    '/admin/portal/drivers/',
  )
  if (result.denied) {
    return { rows: [], denied: true, unavailable: false }
  }
  if (result.unavailable || !result.data) {
    return { rows: [], denied: false, unavailable: true }
  }
  return { rows: unwrapList<PortalDriverRow>(result.data), denied: false, unavailable: false }
}

export async function fetchPortalCustomers(): Promise<PortalCustomerRow[]> {
  const result = await tryPortal<{ results?: PortalCustomerRow[] } | PortalCustomerRow[]>(
    '/admin/portal/customers/',
  )
  if (!result.data) return []
  return unwrapList<PortalCustomerRow>(result.data)
}

export async function fetchPortalSettings(): Promise<Record<string, unknown> | null> {
  const result = await tryPortal<Record<string, unknown>>('/admin/portal/settings/')
  return result.data
}

export async function savePortalSettings(payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const result = await tryPortal<Record<string, unknown>>('/admin/portal/settings/', 'patch', payload)
  return result.data
}

export async function fetchPortalAuditLogs(): Promise<PortalAuditLogRow[]> {
  const result = await tryPortal<{ results?: PortalAuditLogRow[] } | PortalAuditLogRow[]>(
    '/admin/portal/audit-logs/',
  )
  if (!result.data) return []
  return unwrapList<PortalAuditLogRow>(result.data)
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
