import { api, getApiErrorMessage, isForbidden, unwrapList, unwrapRecord } from '../client'
import { cachedQuery, invalidateCache } from '../../lib/queryCache'
import type { PortalDocumentReviewStatus } from './documentReview'

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
  is_favorite?: boolean
  is_blocked?: boolean
  block_reason?: string
  documents?: Array<{
    id?: string
    type: string
    document_type?: string
    number: string
    status: string
    expiry: string
    file_url?: string | null
    url?: string | null
    rejection_reason?: string
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
  is_flagged?: boolean
  abuse_flags_count?: number
  highest_severity?: 'warning' | 'high' | 'review' | null
  is_blocked?: boolean
  block_reason?: string
}

export type FlaggedCustomerRow = {
  flag_id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_city: string
  customer_status: string
  rule_identifier: string
  rule_label: string
  severity: 'warning' | 'high' | 'review'
  status: 'active' | 'reviewed' | 'resolved' | 'dismissed'
  cancellations_24h: number
  cancellations_7d: number
  total_bookings: number
  customer_cancellations: number
  driver_cancellations: number
  completed_bookings: number
  cancellation_rate: string
  last_cancelled_at: string | null
  created_at: string | null
  reviewed_at: string | null
  reviewed_by_phone: string | null
  admin_notes: string
  recent_history: Array<{
    booking_id: string
    cancelled_at: string | null
    from_state: string
    reason: string
  }>
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
  return cachedQuery('GET:/admin/portal/overview', async () => {
    const result = await tryPortal<PortalOverview>('/admin/portal/overview/')
    return result.data
  })
}

export type PortalDriversResult = {
  rows: PortalDriverRow[]
  denied: boolean
  unavailable: boolean
}

export async function fetchPortalDrivers(): Promise<PortalDriversResult> {
  return cachedQuery('GET:/admin/portal/drivers', async () => {
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
  })
}

export async function fetchPortalCustomers(): Promise<PortalCustomerRow[]> {
  return cachedQuery('GET:/admin/portal/customers', async () => {
    const result = await tryPortal<{ results?: PortalCustomerRow[] } | PortalCustomerRow[]>(
      '/admin/portal/customers/',
    )
    if (!result.data) return []
    return unwrapList<PortalCustomerRow>(result.data)
  })
}

export async function fetchPortalFlaggedCustomers(
  status = 'active',
  filters?: { severity?: string; search?: string },
): Promise<FlaggedCustomerRow[]> {
  const params = new URLSearchParams({ status })
  if (filters?.severity && filters.severity !== 'all') params.set('severity', filters.severity)
  if (filters?.search?.trim()) params.set('search', filters.search.trim())
  const result = await tryPortal<{ results?: FlaggedCustomerRow[] } | FlaggedCustomerRow[]>(
    `/admin/portal/customers/flagged/?${params.toString()}`,
  )
  if (!result.data) return []
  return unwrapList<FlaggedCustomerRow>(result.data)
}

export async function reviewPortalFlaggedCustomer(
  flagId: string,
  action: 'review' | 'dismiss' | 'resolve',
  notes = '',
): Promise<{ success: boolean; data?: unknown }> {
  try {
    const { data } = await api.post(`/admin/portal/customers/flagged/${flagId}/action/`, {
      action,
      notes,
    })
    invalidateCache('GET:/admin/portal/customers')
    return { success: true, data }
  } catch (err) {
    return { success: false, data: err }
  }
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

export type AbuseAdminActionRow = {
  id: string
  action: string
  actor_name: string
  actor_phone: string | null
  customer_id: string | null
  customer_name: string
  customer_phone: string | null
  flag_id: string | null
  reason: string
  created_at: string | null
}

export async function fetchAbuseAdminActions(filters: {
  action?: string
  customer?: string
  flag?: string
  start?: string
  end?: string
  page?: number
}): Promise<{ count: number; page: number; page_size: number; results: AbuseAdminActionRow[] }> {
  const params = new URLSearchParams()
  if (filters.action && filters.action !== 'all') params.set('action', filters.action)
  if (filters.customer?.trim()) params.set('customer', filters.customer.trim())
  if (filters.flag?.trim()) params.set('flag', filters.flag.trim())
  if (filters.start) params.set('start', filters.start)
  if (filters.end) params.set('end', filters.end)
  params.set('page', String(filters.page || 1))
  params.set('page_size', '25')
  const result = await tryPortal<{
    count: number
    page: number
    page_size: number
    results: AbuseAdminActionRow[]
  }>(`/admin/portal/abuse-actions/?${params.toString()}`)
  if (result.denied || result.unavailable || !result.data) {
    throw new Error('Abuse action history is unavailable.')
  }
  return result.data
}

export async function fetchDriverLocations(): Promise<unknown[] | null> {
  return cachedQuery(
    'GET:/tracking/driver-locations',
    async () => {
      try {
        const { data } = await api.get('/tracking/driver-locations/')
        return unwrapList<unknown>(data)
      } catch (error) {
        if (isForbidden(error)) return null
        throw error
      }
    },
    8_000,
  )
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

export async function createPortalDriver(payload: {
  phone: string
  password: string
}): Promise<PortalDriverRow> {
  const { data } = await api.post('/admin/portal/drivers/', payload)
  return unwrapRecord<PortalDriverRow>(data)
}

export async function updatePortalDriver(
  driverId: string,
  payload: { kyc_status?: string; is_online?: boolean; is_favorite?: boolean },
): Promise<PortalDriverRow | null> {
  const result = await tryPortal<PortalDriverRow>(`/admin/portal/drivers/${driverId}/`, 'patch', payload)
  return result.data
}

export type PortalDocumentReviewResult = {
  id: string
  status: string
  rejection_reason?: string
}

/**
 * Persist approve/reject for one driver document.
 * PATCH /admin/portal/drivers/{driverId}/documents/{docId}/
 */
export async function reviewPortalDocument(
  driverId: string,
  documentId: string,
  payload: { status: PortalDocumentReviewStatus; rejection_reason?: string },
): Promise<PortalDocumentReviewResult> {
  if (!driverId.trim() || !documentId.trim()) {
    throw new Error('Driver and document identifiers are required.')
  }
  try {
    const { data } = await api.patch<PortalDocumentReviewResult>(
      `/admin/portal/drivers/${driverId}/documents/${documentId}/`,
      payload,
    )
    invalidateCache('GET:/admin/portal/drivers')
    invalidateCache('view:/documents')
    return unwrapRecord<PortalDocumentReviewResult>(data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export type PortalBlockEvent = {
  id: string
  user_id: string
  action: 'block' | 'unblock'
  reason: string
  actor_id: string | null
  actor_phone: string | null
  created_at: string | null
}

export type PortalBlockStatus = {
  user_id: string
  phone: string
  role: string
  name: string
  is_blocked: boolean
  block_reason: string
  blocked_at: string | null
  blocked_by_phone: string | null
  history: PortalBlockEvent[]
}

export async function fetchPortalUserBlockStatus(userId: string): Promise<PortalBlockStatus> {
  const { data } = await api.get<PortalBlockStatus>(`/admin/portal/users/${userId}/block-status/`)
  return data
}

export type PortalUserBlockRow = Omit<PortalBlockStatus, 'history'>

export async function searchPortalUsers(search: string, blocked?: boolean): Promise<PortalUserBlockRow[]> {
  const { data } = await api.get<{ results: PortalUserBlockRow[]; count?: number }>('/admin/portal/users/', {
    params: {
      search,
      ...(blocked === undefined ? {} : { blocked: blocked ? '1' : '0' }),
    },
  })
  return data.results ?? []
}

async function postUserBlockAction(userId: string, action: 'block' | 'unblock', reason: string) {
  try {
    const { data } = await api.post<PortalBlockStatus>(`/admin/portal/users/${userId}/${action}/`, { reason })
    invalidateCache('GET:/admin/portal/customers')
    invalidateCache('GET:/admin/portal/drivers')
    invalidateCache('GET:/admin/portal/users')
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export function blockPortalUser(userId: string, reason: string) {
  return postUserBlockAction(userId, 'block', reason)
}

export function unblockPortalUser(userId: string, reason: string) {
  return postUserBlockAction(userId, 'unblock', reason)
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
