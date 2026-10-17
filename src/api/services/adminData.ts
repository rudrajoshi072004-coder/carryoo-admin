import { listBookings } from './bookings'
import { listPayouts, listSupportTickets } from './ops'
import { listPricingRules } from './pricingRules'
import { API_BASE_URL } from '../client'
import type { Booking } from '../types'
import type { Driver, DriverStatus, DocStatus } from '../../data/driversData'
import type { Customer } from '../../data/customersData'
import type { Trip, TripStatus } from '../../data/tripsData'
import type { Transaction, RevenueSummary } from '../../data/paymentsData'
import type { WalletHistoryEntry, WalletSummary } from '../../data/walletData'
import type { LiveDriver, LiveDriverStatus } from '../../data/liveTrackingData'
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from '../../data/supportData'
import type { SystemLog } from '../../data/systemLogsData'
import type { PlatformSettings } from '../../data/settingsData'
import type { GeneratedReport, ReportTypeMeta } from '../../data/reportsData'
import { reportTypes } from '../../data/reportsData'
import type { Incentive } from '../../data/incentivesData'
import { platformSettings as defaultSettings } from '../../data/settingsData'
import {
  fetchPortalAuditLogs,
  fetchPortalCustomers,
  fetchPortalDrivers,
  fetchPortalOverview,
  fetchPortalSettings,
  fetchDriverLocations,
  fetchWalletTransactions,
  fetchWallets,
  savePortalSettings,
  type PortalDriverRow,
} from './portal'

const ACCENTS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777']

function pickAccent(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % ACCENTS.length
  return ACCENTS[hash]
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function formatWhen(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateOnly(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeOnly(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const ACTIVE_STATES = new Set(['searching', 'assigned', 'in_transit', 'picked_up', 'driver_arriving'])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function looksLikeUuid(value?: string): boolean {
  return Boolean(value && UUID_RE.test(value.trim()))
}

function formatPhoneDisplay(value?: string): string {
  if (!value || looksLikeUuid(value)) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (value.startsWith('+') && digits.length >= 10) return value
  if (digits.length >= 10) return `+${digits}`
  return '—'
}

function sanitizeDriverName(name?: string, phone?: string, id?: string): string {
  if (name && !looksLikeUuid(name)) return name
  const formattedPhone = formatPhoneDisplay(phone)
  if (formattedPhone !== '—') return formattedPhone
  if (id) return `Driver ${id.replace(/-/g, '').slice(-6).toUpperCase()}`
  return 'Unknown driver'
}

function formatDriverDisplayId(id: string, displayId?: string): string {
  if (displayId) return displayId
  return `DRV-${id.replace(/-/g, '').slice(-6).toUpperCase()}`
}

function sanitizeVehicleLabel(value?: string): string {
  if (!value || looksLikeUuid(value)) return '—'
  return value
}

function bookingToTripStatus(state: string): TripStatus {
  if (state === 'completed') return 'Completed'
  if (state.includes('cancel')) return 'Cancelled'
  if (ACTIVE_STATES.has(state)) return 'Running'
  return 'Scheduled'
}

function mapPortalDriverStatus(row: PortalDriverRow): DriverStatus {
  if (row.registration_status === 'new') return 'New'
  if (row.registration_status === 'kyc_pending') return 'Pending KYC'
  if (row.registration_status === 'rejected') return 'Suspended'
  const s = String(row.status ?? 'offline').toLowerCase()
  if (s.includes('online') && !s.includes('offline')) return 'Online'
  if (s.includes('busy') || s.includes('on_trip')) return 'Busy'
  if (s.includes('suspend')) return 'Suspended'
  return 'Offline'
}

function defaultDriver(
  partial: Partial<Driver> & Pick<Driver, 'id' | 'name' | 'phone'>,
): Driver {
  const name = partial.name || 'Unknown driver'
  return {
    id: partial.id,
    displayId: partial.displayId,
    name,
    phone: partial.phone,
    email: partial.email ?? '',
    vehicle: partial.vehicle ?? '—',
    vehicleType: partial.vehicleType ?? '—',
    city: partial.city ?? 'Nashik',
    acceptsOutstation: partial.acceptsOutstation ?? true,
    trainingCompleted: partial.trainingCompleted ?? false,
    rating: partial.rating ?? 4.5,
    wallet: partial.wallet ?? 0,
    status: partial.status ?? 'Offline',
    trips: partial.trips ?? 0,
    joined: partial.joined ?? '—',
    initials: partial.initials ?? initials(name),
    accent: partial.accent ?? pickAccent(partial.id),
    gender: partial.gender ?? 'Male',
    experience: partial.experience ?? '—',
    completionRate: partial.completionRate ?? 92,
    acceptanceRate: partial.acceptanceRate ?? 88,
    cancellationRate: partial.cancellationRate ?? 4,
    todayEarnings: partial.todayEarnings ?? 0,
    avgTripValue: partial.avgTripValue ?? '₹0',
    totalEarnings: partial.totalEarnings ?? '₹0',
    documents: partial.documents ?? [],
    vehicleDetails: partial.vehicleDetails ?? {
      make: '—',
      model: '—',
      year: '—',
      color: '—',
      plate: '—',
      insurance: '—',
      fitness: '—',
    },
    emergencyContact: partial.emergencyContact ?? { name: '—', phone: '—', relation: '—' },
    bankDetails: partial.bankDetails ?? {
      accountName: '—',
      bank: '—',
      accountNumber: '—',
      ifsc: '—',
      upi: '—',
    },
    recentTrips: partial.recentTrips ?? [],
    walletHistory: partial.walletHistory ?? [],
    recentActivity: partial.recentActivity ?? [],
  }
}

function defaultCustomer(
  partial: Partial<Customer> & Pick<Customer, 'id' | 'name' | 'phone'>,
): Customer {
  const name = partial.name || partial.phone
  return {
    id: partial.id,
    name,
    phone: partial.phone,
    email: partial.email ?? '',
    city: partial.city ?? 'Nashik',
    orders: partial.orders ?? 0,
    lifetimeSpend: partial.lifetimeSpend ?? 0,
    wallet: partial.wallet ?? 0,
    rating: partial.rating ?? 4.6,
    status: partial.status ?? 'Active',
    joined: partial.joined ?? '—',
    initials: partial.initials ?? initials(name),
    accent: partial.accent ?? pickAccent(partial.id),
    addresses: partial.addresses ?? [],
    complaints: partial.complaints ?? [],
    referrals: partial.referrals ?? { code: '', invites: 0, successful: 0, earnings: 0, recent: [] },
    reviews: partial.reviews ?? [],
    recentOrders: partial.recentOrders ?? [],
    activity: partial.activity ?? [],
    walletHistory: partial.walletHistory ?? [],
    spendingByMonth: partial.spendingByMonth ?? [],
  }
}

function portalRowToDriver(row: PortalDriverRow, tripCount = 0): Driver {
  const joined = row.joined_at || row.registered_at
    ? new Date(row.joined_at || row.registered_at || '').toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'
  const rawPhone = row.phone || row.driver_phone || row.account_phone
  const phone = formatPhoneDisplay(rawPhone)
  const name = sanitizeDriverName(row.name, rawPhone, row.id)
  const displayId = formatDriverDisplayId(row.id, row.display_id)
  const vehicleType = sanitizeVehicleLabel(row.vehicle_type || row.vehicle_category)
  const plateRaw = row.vehicle_number || row.vehicle_details?.plate
  const plate = plateRaw && !looksLikeUuid(plateRaw) ? plateRaw : '—'
  const wallet = Number.parseFloat(row.wallet_balance ?? '0') || 0
  const trips = row.total_trips && row.total_trips > 0 ? row.total_trips : tripCount

  return defaultDriver({
    id: row.id,
    displayId,
    name,
    phone,
    accountPhone: formatPhoneDisplay(row.account_phone),
    driverPhone: formatPhoneDisplay(row.driver_phone),
    email: row.email ?? '',
    city: row.city || 'Nashik',
    vehicleType,
    vehicle: plate !== '—' ? plate : vehicleType,
    acceptsOutstation: row.accepts_outstation !== false,
    trainingCompleted: row.training_completed === true,
    rating: Number.parseFloat(row.rating) || 4.5,
    status: mapPortalDriverStatus(row),
    trips,
    joined,
    wallet,
    documents: (row.documents ?? []).map((doc) => {
      const rawUrl = doc.file_url || doc.url
      let resolvedUrl: string | undefined = undefined
      if (rawUrl && typeof rawUrl === 'string') {
        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
          resolvedUrl = rawUrl
        } else if (rawUrl.startsWith('/api/')) {
          const apiOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
          resolvedUrl = `${apiOrigin}${rawUrl}`
        }
      }
      const rawNum = String(doc.number ?? '').trim()
      const isFileUri = rawNum.startsWith('file://') || String(doc.file_key ?? '').startsWith('file://')
      const cleanNum = isFileUri || rawNum.startsWith('drivers/') ? '—' : (rawNum || '—')

      return {
        id: doc.id ? String(doc.id) : undefined,
        type: doc.type,
        documentType: doc.document_type,
        number: cleanNum,
        status: (doc.status === 'Verified'
          ? 'Verified'
          : doc.status === 'Rejected'
            ? 'Rejected'
            : doc.status === 'Expired'
              ? 'Expired'
              : 'Pending') as DocStatus,
        expiry: doc.expiry || '—',
        url: resolvedUrl,
        isDeviceCache: isFileUri || Boolean(doc.is_device_cache),
        fileKey: doc.file_key,
      }
    }),
    vehicleDetails: row.vehicle_details
      ? {
          ...row.vehicle_details,
          fuelType: row.fuel_type || undefined,
        }
      : {
          make: vehicleType,
          model: row.vehicle_body_type || '—',
          year: '—',
          color: '—',
          plate,
          insurance: '—',
          fitness: '—',
          fuelType: row.fuel_type || undefined,
        },
  })
}

function deriveDriversFromBookings(bookings: Booking[]): Driver[] {
  const map = new Map<string, { row: Partial<Driver>; trips: number; earnings: number; active: boolean }>()

  for (const b of bookings) {
    const rawKey = b.driver_summary?.phone ?? b.driver ?? null
    if (!rawKey || looksLikeUuid(String(rawKey))) continue
    const key = String(rawKey)
    const name = sanitizeDriverName(b.driver_summary?.name, key, key)
    const phone = formatPhoneDisplay(key)
    if (phone === '—') continue
    const existing = map.get(key)
    const fare = Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0')
    if (existing) {
      existing.trips += 1
      existing.earnings += fare
      if (ACTIVE_STATES.has(b.state)) existing.active = true
    } else {
      map.set(key, {
        row: {
          id: formatDriverDisplayId(key),
          displayId: formatDriverDisplayId(key),
          name,
          phone,
          vehicleType: sanitizeVehicleLabel(b.vehicle_category),
          vehicle: sanitizeVehicleLabel(b.vehicle_category),
          city: 'Nashik',
        },
        trips: 1,
        earnings: fare,
        active: ACTIVE_STATES.has(b.state),
      })
    }
  }

  return [...map.values()].map(({ row, trips, earnings, active }) =>
    defaultDriver({
      ...row,
      id: row.id!,
      name: row.name!,
      phone: row.phone!,
      trips,
      status: active ? 'Busy' : 'Offline',
      totalEarnings: `₹${Math.round(earnings).toLocaleString('en-IN')}`,
      avgTripValue: trips > 0 ? `₹${Math.round(earnings / trips)}` : '₹0',
    }),
  )
}

function deriveCustomersFromBookings(bookings: Booking[]): Customer[] {
  const map = new Map<string, Customer>()

  for (const b of bookings) {
    const phone = b.customer_phone ?? 'unknown'
    const key = String(phone)
    const fare = Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0')
    const existing = map.get(key)
    const order = {
      id: b.id.slice(0, 8).toUpperCase(),
      route: `${b.pickup_address_text?.slice(0, 30) ?? 'Pickup'} → ${b.drop_address_text?.slice(0, 30) ?? 'Drop'}`,
      fare,
      status: b.state.replace(/_/g, ' '),
      date: formatDateOnly(b.created_at),
    }

    if (existing) {
      existing.orders += 1
      existing.lifetimeSpend += fare
      existing.recentOrders = [order, ...existing.recentOrders].slice(0, 5)
      existing.activity = [
        { text: `Order ${order.id} — ${order.status}`, time: formatTimeOnly(b.created_at), type: 'order' as const },
        ...existing.activity,
      ].slice(0, 8)
    } else {
      map.set(
        key,
        defaultCustomer({
          id: `CUS-${key.replace(/\D/g, '').slice(-6) || '000000'}`,
          name: key,
          phone: key,
          city: 'Nashik',
          orders: 1,
          lifetimeSpend: fare,
          joined: formatDateOnly(b.created_at),
          recentOrders: [order],
          activity: [{ text: `Order ${order.id} placed`, time: formatTimeOnly(b.created_at), type: 'order' as const }],
          spendingByMonth: [{ month: new Date(b.created_at).toLocaleString('en-IN', { month: 'short' }), amount: fare }],
        }),
      )
    }
  }

  return [...map.values()]
}

function bookingToTrip(b: Booking): Trip {
  const status = bookingToTripStatus(b.state)
  return {
    id: `TRP-${b.id.slice(0, 8).toUpperCase()}`,
    orderId: b.id.slice(0, 8).toUpperCase(),
    driver: b.driver_summary?.name ?? 'Unassigned',
    driverId: b.driver ?? '—',
    customer: b.customer_phone ?? 'Customer',
    customerPhone: b.customer_phone ?? '—',
    route: `${b.pickup_address_text?.slice(0, 40) ?? 'Pickup'} → ${b.drop_address_text?.slice(0, 40) ?? 'Drop'}`,
    pickup: b.pickup_address_text ?? '—',
    drop: b.drop_address_text ?? '—',
    vehicle: b.vehicle_category ?? '—',
    vehicleType: b.vehicle_category ?? '—',
    distance: b.estimated_distance_km ? `${b.estimated_distance_km} km` : '—',
    fare: Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0'),
    status,
    duration: b.estimated_duration_min ? `${b.estimated_duration_min} min` : '—',
    started: formatWhen(b.created_at),
    city: 'Nashik',
    timeline: [
      { label: 'Booking created', time: formatTimeOnly(b.created_at), done: true },
      { label: 'Current state', time: formatTimeOnly(b.created_at), done: status !== 'Scheduled', detail: b.state },
    ],
    notes: b.notes,
    pickupPhotoUrl:
      b.pickup_photo_url ||
      (b.has_pickup_parcel_photo ? `/api/v1/bookings/${b.id}/parcel-photo/?kind=pickup` : undefined),
    dropPhotoUrl:
      b.drop_photo_url ||
      (b.has_drop_parcel_photo ? `/api/v1/bookings/${b.id}/parcel-photo/?kind=drop` : undefined),
  }
}

function mapSupportTicket(raw: Record<string, unknown>): SupportTicket {
  const statusRaw = String(raw.status ?? 'open').toLowerCase()
  let status: TicketStatus = 'Open'
  if (statusRaw.includes('progress')) status = 'In Progress'
  else if (statusRaw.includes('resolve')) status = 'Resolved'
  else if (statusRaw.includes('close')) status = 'Closed'

  const priorityRaw = String(raw.priority ?? 'medium').toLowerCase()
  let priority: TicketPriority = 'Medium'
  if (priorityRaw.includes('low')) priority = 'Low'
  else if (priorityRaw.includes('high')) priority = 'High'
  else if (priorityRaw.includes('crit')) priority = 'Critical'

  return {
    id: String(raw.id ?? ''),
    subject: String(raw.subject ?? raw.title ?? 'Support request'),
    category: 'Complaint' as TicketCategory,
    requester: String(raw.customer_phone ?? raw.requester ?? 'Customer'),
    requesterEmail: String(raw.email ?? ''),
    priority,
    status,
    agent: raw.assigned_to ? String(raw.assigned_to) : null,
    channel: 'Ticket',
    updated: formatWhen(String(raw.updated_at ?? raw.created_at ?? '')),
    created: formatWhen(String(raw.created_at ?? '')),
    messages: [],
  }
}

function mergeSettings(apiRaw: Record<string, unknown> | null): PlatformSettings {
  const base = structuredClone(defaultSettings)
  if (!apiRaw) return base
  const app = (apiRaw.app as Record<string, unknown>) ?? apiRaw
  if (typeof app.maintenanceMode === 'boolean') base.app.maintenanceMode = app.maintenanceMode
  if (typeof app.maintenanceMessage === 'string') base.app.maintenanceMessage = app.maintenanceMessage
  if (typeof app.version === 'string') base.app.version = app.version
  if (typeof app.minCustomerVersion === 'string') base.app.minCustomerVersion = app.minCustomerVersion
  if (typeof app.minDriverVersion === 'string') base.app.minDriverVersion = app.minDriverVersion
  const company = apiRaw.company as Record<string, unknown> | undefined
  if (company?.name) base.company.name = String(company.name)
  if (company?.supportPhone) base.company.supportPhone = String(company.supportPhone)
  if (company?.supportEmail) base.company.supportEmail = String(company.supportEmail)
  return base
}

async function loadBookings() {
  return listBookings({ page_size: 500 })
}

export async function fetchDriversAdmin(): Promise<Driver[]> {
  const [portalResult, bookings] = await Promise.all([fetchPortalDrivers(), loadBookings()])

  if (portalResult.denied) {
    throw new Error(
      'Admin access required. Sign in with a super_admin account, or ask your team to run: python manage.py promote_admin YOUR_PHONE',
    )
  }

  if (!portalResult.unavailable) {
    const tripCounts = new Map<string, number>()
    for (const b of bookings) {
      const phone = b.driver_summary?.phone
      if (phone) tripCounts.set(String(phone), (tripCounts.get(String(phone)) ?? 0) + 1)
    }
    return portalResult.rows.map((row) => portalRowToDriver(row, tripCounts.get(row.phone) ?? 0))
  }

  return deriveDriversFromBookings(bookings)
}

export async function fetchCustomersAdmin(): Promise<Customer[]> {
  const [portalRows, bookings] = await Promise.all([fetchPortalCustomers(), loadBookings()])
  if (portalRows.length > 0) {
    return portalRows.map((row) =>
      defaultCustomer({
        id: row.id,
        name: row.name || row.phone,
        phone: row.phone,
        city: row.city || 'Nashik',
        orders: row.bookings_count,
        joined: '—',
      }),
    )
  }
  return deriveCustomersFromBookings(bookings)
}

export async function fetchTripsAdmin(): Promise<Trip[]> {
  const bookings = await loadBookings()
  return bookings
    .filter((b) => b.driver || b.driver_summary)
    .map(bookingToTrip)
    .sort((a, b) => (a.started < b.started ? 1 : -1))
}

export async function fetchPaymentsAdmin(): Promise<{ summary: RevenueSummary; transactions: Transaction[] }> {
  const [bookings, payouts] = await Promise.all([loadBookings(), listPayouts().catch(() => [])])

  const completed = bookings.filter((b) => b.state === 'completed')
  const revenue = completed.reduce((s, b) => s + Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0'), 0)
  const payoutTotal = payouts.reduce((s, p) => s + Number.parseFloat(String(p.amount ?? '0')), 0)

  const summary: RevenueSummary = {
    daily: Math.round(revenue * 0.08),
    weekly: Math.round(revenue * 0.35),
    monthly: Math.round(revenue),
    driverPayouts: Math.round(payoutTotal || revenue * 0.72),
    pendingWithdrawals: Math.round(payoutTotal * 0.12),
    refunds: Math.round(revenue * 0.02),
    commissions: Math.round(revenue * 0.15),
  }

  const tripTxns: Transaction[] = completed.slice(0, 40).map((b) => ({
    id: `TXN-${b.id.slice(0, 8).toUpperCase()}`,
    type: 'Trip Fare',
    party: `${b.customer_phone ?? 'Customer'} · ${b.id.slice(0, 8).toUpperCase()}`,
    amount: Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0'),
    method: 'UPI',
    status: 'Completed',
    time: formatTimeOnly(b.created_at),
    date: formatDateOnly(b.created_at),
    reference: b.id.slice(0, 8).toUpperCase(),
    city: 'Nashik',
  }))

  const payoutTxns: Transaction[] = payouts.slice(0, 20).map((p) => ({
    id: `PYT-${String(p.id).slice(0, 8).toUpperCase()}`,
    type: 'Driver Payout',
    party: `Driver payout · ${String(p.id).slice(0, 8)}`,
    amount: Number.parseFloat(String(p.amount ?? '0')),
    method: 'Bank Transfer',
    status: String(p.status ?? 'pending').toLowerCase().includes('complete') ? 'Completed' : 'Processing',
    time: formatTimeOnly(p.created_at),
    date: formatDateOnly(p.created_at),
    reference: String(p.id),
    city: 'Nashik',
  }))

  return {
    summary,
    transactions: [...tripTxns, ...payoutTxns].sort((a, b) => (a.date < b.date ? 1 : -1)),
  }
}

export async function fetchWalletAdmin(): Promise<{
  summary: WalletSummary
  history: WalletHistoryEntry[]
  flowSeries: { day: string; credits: number; debits: number; net: number }[]
  balanceSeries: { day: string; balance: number }[]
}> {
  const [wallets, txns, bookings] = await Promise.all([
    fetchWallets(),
    fetchWalletTransactions(),
    loadBookings(),
  ])

  let credits = 0
  let debits = 0
  const history: WalletHistoryEntry[] = []

  if (wallets && wallets.length > 0) {
    for (const w of wallets) {
      const row = w as Record<string, unknown>
      credits += Number.parseFloat(String(row.total_credited ?? row.balance ?? 0))
      debits += Number.parseFloat(String(row.total_debited ?? 0))
    }
  } else {
    credits = bookings
      .filter((b) => b.state === 'completed')
      .reduce((s, b) => s + Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0'), 0)
  }

  for (const t of txns.slice(0, 50)) {
    const row = t as Record<string, unknown>
    const amount = Number.parseFloat(String(row.amount ?? 0))
    history.push({
      id: String(row.id ?? history.length),
      type: amount >= 0 ? 'Credit' : 'Debit',
      description: String(row.description ?? row.type ?? 'Wallet movement'),
      amount: Math.abs(amount),
      balance: Number.parseFloat(String(row.balance_after ?? 0)),
      status: 'Completed',
      time: formatTimeOnly(String(row.created_at ?? '')),
      date: formatDateOnly(String(row.created_at ?? '')),
      party: String(row.user_phone ?? row.party ?? ''),
    })
  }

  if (history.length === 0) {
    for (const b of bookings.filter((x) => x.state === 'completed').slice(0, 25)) {
      const amount = Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0')
      history.push({
        id: b.id,
        type: 'Trip Payout',
        description: `Trip fare · ${b.id.slice(0, 8)}`,
        amount,
        balance: 0,
        status: 'Completed',
        time: formatTimeOnly(b.created_at),
        date: formatDateOnly(b.created_at),
        party: b.driver_summary?.name ?? b.customer_phone,
      })
    }
  }

  const summary: WalletSummary = {
    credits: Math.round(credits),
    debits: Math.round(debits || credits * 0.55),
    bonus: Math.round(credits * 0.04),
    referral: Math.round(credits * 0.02),
    withdrawals: Math.round(debits * 0.6),
    balance: Math.round(credits - (debits || credits * 0.55)),
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const flowSeries = days.map((day, i) => ({
    day,
    credits: Math.round(summary.credits / 7 + i * 120),
    debits: Math.round(summary.debits / 7 + i * 80),
    net: Math.round(summary.credits / 7 - summary.debits / 7),
  }))
  const balanceSeries = days.map((day, i) => ({
    day,
    balance: Math.round(summary.balance * (0.85 + i * 0.02)),
  }))

  return { summary, history, flowSeries, balanceSeries }
}

export async function fetchLiveTrackingAdmin(): Promise<{
  drivers: LiveDriver[]
  lastUpdated: string
  activeTrips: number
  onlineCount: number
}> {
  const [locations, bookings] = await Promise.all([fetchDriverLocations(), loadBookings()])
  const activeBookings = bookings.filter((b) => ACTIVE_STATES.has(b.state) && (b.driver || b.driver_summary))

  if (locations && locations.length > 0) {
    const drivers: LiveDriver[] = locations.map((loc, idx) => {
      const row = loc as Record<string, unknown>
      const name = String(row.driver_name ?? row.name ?? `Driver ${idx + 1}`)
      const lat = Number.parseFloat(String(row.latitude ?? row.lat ?? 19.99))
      const lng = Number.parseFloat(String(row.longitude ?? row.lng ?? 73.78))
      const busy = ACTIVE_STATES.has(String(row.status ?? ''))
      return {
        id: String(row.driver_id ?? row.id ?? idx),
        name,
        vehicle: String(row.vehicle_number ?? '—'),
        vehicleType: String(row.vehicle_category ?? '—'),
        status: (busy ? 'Busy' : 'Online') as LiveDriverStatus,
        lat,
        lng,
        speed: Number.parseFloat(String(row.speed_kmh ?? 0)),
        battery: 70,
        network: '4G',
        eta: '—',
        currentTrip: row.active_booking_id ? String(row.active_booking_id) : null,
        route: null,
        city: String(row.city ?? 'Nashik'),
        initials: initials(name),
        phone: String(row.phone ?? ''),
      }
    })
    return {
      drivers,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      activeTrips: drivers.filter((d) => d.currentTrip).length,
      onlineCount: drivers.filter((d) => d.status !== 'Offline').length,
    }
  }

  const drivers: LiveDriver[] = activeBookings.slice(0, 30).map((b, idx) => {
    const name = b.driver_summary?.name ?? 'Driver'
    return {
      id: b.driver ?? `DRV-${idx}`,
      name,
      vehicle: b.vehicle_category ?? '—',
      vehicleType: b.vehicle_category ?? '—',
      status: 'Busy',
      lat: 19.9975 + idx * 0.002,
      lng: 73.7898 + idx * 0.002,
      speed: 24,
      battery: 65 + (idx % 30),
      network: '4G',
      eta: b.estimated_duration_min ? `${b.estimated_duration_min} min` : '—',
      currentTrip: b.id.slice(0, 8).toUpperCase(),
      route: {
        pickup: b.pickup_address_text?.slice(0, 60) ?? 'Pickup',
        drop: b.drop_address_text?.slice(0, 60) ?? 'Drop',
      },
      city: 'Nashik',
      initials: initials(name),
      phone: b.driver_summary?.phone ?? '',
    }
  })

  return {
    drivers,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    activeTrips: drivers.length,
    onlineCount: drivers.length,
  }
}

export async function fetchSupportAdmin(): Promise<{
  tickets: SupportTicket[]
  chats: import('../../data/supportData').LiveChatSession[]
  kpis: { category: TicketCategory; count: number; trend: number }[]
}> {
  const ticketsRaw = await listSupportTickets().catch(() => [])
  const tickets = ticketsRaw.map((t) => mapSupportTicket(t as unknown as Record<string, unknown>))
  const categories: TicketCategory[] = ['Complaint', 'Refund', 'Emergency', 'Lost Item', 'Driver Issue', 'Customer Issue']
  const kpis = categories.map((category) => ({
    category,
    count: tickets.filter((t) => t.category === category).length,
    trend: 0,
  }))
  return { tickets, chats: [], kpis }
}

export async function fetchSettingsAdmin(): Promise<PlatformSettings> {
  const raw = await fetchPortalSettings()
  return mergeSettings(raw)
}

export async function persistSettingsAdmin(settings: PlatformSettings): Promise<PlatformSettings> {
  const payload = {
    app: settings.app,
    company: settings.company,
    branding: settings.branding,
  }
  const saved = await savePortalSettings(payload)
  return mergeSettings(saved)
}

export async function fetchSystemLogsAdmin(): Promise<SystemLog[]> {
  const [portalLogs, bookings] = await Promise.all([fetchPortalAuditLogs(), loadBookings()])

  if (portalLogs.length > 0) {
    return portalLogs.map((log) => ({
      id: log.id,
      category: 'audit',
      severity: 'Info',
      timestamp: formatWhen(log.created_at ?? undefined),
      user: log.actor || 'system',
      action: log.action || 'Audit event',
      resource: 'Admin Portal',
      ip: '—',
      city: '—',
      details: log.detail || log.action,
    }))
  }

  return bookings.slice(0, 80).map((b) => ({
    id: `LOG-${b.id.slice(0, 8)}`,
    category: 'api',
    severity: 'Info',
    timestamp: formatWhen(b.created_at),
    user: b.customer_phone ?? 'customer',
    action: `Booking ${b.state.replace(/_/g, ' ')}`,
    resource: `Booking ${b.id.slice(0, 8)}`,
    ip: '—',
    city: 'Nashik',
    details: `${b.pickup_address_text?.slice(0, 40)} → ${b.drop_address_text?.slice(0, 40)}`,
  }))
}

export async function fetchAnalyticsAdmin() {
  const bookings = await loadBookings()
  const completed = bookings.filter((b) => b.state === 'completed')
  const cancelled = bookings.filter((b) => b.state.includes('cancel'))
  const revenue = completed.reduce((s, b) => s + Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0'), 0)
  const revenueLakhs = Math.round((revenue / 100000) * 10) / 10

  const byMonth = new Map<string, { revenue: number; trips: number }>()
  for (const b of bookings) {
    const m = new Date(b.created_at).toLocaleString('en-IN', { month: 'short' })
    const fare = Number.parseFloat(b.final_fare ?? b.estimated_fare ?? '0')
    const cur = byMonth.get(m) ?? { revenue: 0, trips: 0 }
    cur.trips += 1
    if (b.state === 'completed') cur.revenue += fare
    byMonth.set(m, cur)
  }

  const revenueSeries = [...byMonth.entries()].map(([month, v]) => ({
    month,
    revenue: Math.round((v.revenue / 100000) * 10) / 10,
    trips: v.trips,
  }))
  if (revenueSeries.length === 0) {
    revenueSeries.push({ month: 'Current', revenue: 0, trips: 0 })
  }

  const vehicleCounts = new Map<string, number>()
  for (const b of bookings) {
    const v = b.vehicle_category ?? 'Other'
    vehicleCounts.set(v, (vehicleCounts.get(v) ?? 0) + 1)
  }

  const fills = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706']
  const routeMap = new Map<string, { trips: number; fare: number; from: string; to: string }>()
  for (const b of bookings) {
    const from = b.pickup_address_text?.slice(0, 24) ?? 'Pickup'
    const to = b.drop_address_text?.slice(0, 24) ?? 'Drop'
    const key = `${from}|${to}`
    const cur = routeMap.get(key) ?? { trips: 0, fare: 0, from, to }
    cur.trips += 1
    cur.fare += Number.parseFloat(b.estimated_fare ?? '0')
    routeMap.set(key, cur)
  }

  const cancelTotal = cancelled.length || 1
  return {
    revenueSeries,
    driverPerformance: ['W1', 'W2', 'W3', 'W4'].map((week, i) => ({
      week,
      completed: Math.round(completed.length / 4) + i * 2,
      cancelled: Math.round(cancelled.length / 4),
      avgRating: 4.5 + i * 0.02,
    })),
    customerGrowth: revenueSeries.map((r) => ({
      month: r.month,
      newCustomers: Math.max(1, Math.round(r.trips / 3)),
      activeCustomers: r.trips,
    })),
    peakHours: Array.from({ length: 8 }, (_, i) => ({
      hour: `${8 + i * 2}:00`,
      trips: Math.round(bookings.length / 8 + i),
    })),
    cityAnalytics: [{
      city: 'Nashik',
      trips: bookings.length,
      revenue: revenueLakhs,
      drivers: deriveDriversFromBookings(bookings).length,
      fill: '#2563eb',
    }],
    vehicleAnalytics: [...vehicleCounts.entries()].map(([vehicle, trips], i) => ({
      vehicle,
      trips,
      share: Math.round((trips / Math.max(bookings.length, 1)) * 100),
      fill: fills[i % fills.length],
    })),
    topRoutes: [...routeMap.values()]
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 6)
      .map((r, i) => ({
        id: `RT-${i + 1}`,
        from: r.from,
        to: r.to,
        trips: r.trips,
        avgFare: Math.round(r.fare / r.trips),
        avgDistance: '—',
        city: 'Nashik',
      })),
    cancellationAnalysis: [
      { reason: 'Customer cancelled', count: cancelled.length, share: Math.round((cancelled.length / cancelTotal) * 100), fill: '#dc2626' },
      { reason: 'Completed', count: completed.length, share: Math.round((completed.length / Math.max(bookings.length, 1)) * 100), fill: '#16a34a' },
    ],
    heatmapGrid: [] as { day: string; hour: number; trips: number }[],
    summary: {
      totalRevenue: revenueLakhs,
      revenueGrowth: 0,
      totalTrips: bookings.length,
      tripsGrowth: 0,
      activeDrivers: deriveDriversFromBookings(bookings).filter((d) => d.status === 'Busy').length,
      driverGrowth: 0,
      cancellationRate: bookings.length ? Math.round((cancelled.length / bookings.length) * 100) : 0,
      cancellationChange: 0,
    },
  }
}

export async function fetchReportsAdmin(): Promise<{ types: ReportTypeMeta[]; reports: GeneratedReport[] }> {
  const bookings = await loadBookings()
  const now = formatWhen(new Date().toISOString())
  const reports: GeneratedReport[] = [
    {
      id: 'RPT-REV-LIVE',
      type: 'Revenue',
      format: 'CSV',
      dateRange: 'Live API snapshot',
      generatedAt: now,
      generatedBy: 'Carryoo API',
      size: '—',
      status: 'Ready',
      records: bookings.filter((b) => b.state === 'completed').length,
    },
    {
      id: 'RPT-TRP-LIVE',
      type: 'Trips',
      format: 'CSV',
      dateRange: 'Live API snapshot',
      generatedAt: now,
      generatedBy: 'Carryoo API',
      size: '—',
      status: 'Ready',
      records: bookings.length,
    },
  ]

  return {
    types: reportTypes.map((t) => ({
      ...t,
      lastGenerated: now,
    })),
    reports,
  }
}

export async function fetchIncentivesAdmin(): Promise<Incentive[]> {
  const [rules, bookings] = await Promise.all([listPricingRules().catch(() => []), loadBookings()])
  const driverCount = deriveDriversFromBookings(bookings).length
  const fromRules: Incentive[] = rules
    .filter((r) => Number.parseFloat(String(r.surge_multiplier ?? '1')) > 1)
    .map((r) => ({
      id: String(r.id),
      name: r.name,
      type: 'Peak Hour' as Incentive['type'],
      city: r.city ?? 'Nashik',
      vehicle: r.vehicle_category ?? 'All',
      bonusAmount: Math.round(Number.parseFloat(String(r.surge_multiplier ?? '1')) * 50),
      period: 'Active pricing rule',
      status: r.active ? ('Active' as Incentive['status']) : ('Ended' as Incentive['status']),
      driversAssigned: driverCount,
      description: `Surge ×${r.surge_multiplier ?? '1'} from pricing rules API`,
      assignedDrivers: [],
    }))
  return fromRules
}

export async function fetchDocumentsAdmin(): Promise<import('../../data/documentsData').VerificationDocument[]> {
  const drivers = await fetchDriversAdmin()
  const list: import('../../data/documentsData').VerificationDocument[] = []

  const normalizeType = (raw: string): import('../../data/documentsData').DocumentType => {
    const s = (raw || '').toLowerCase()
    if (s.includes('license') || s.includes('dl')) return 'DL'
    if (s.includes('rc') || s.includes('registration')) return 'RC'
    if (s.includes('aadhaar')) return 'Aadhaar'
    if (s.includes('pan')) return 'PAN'
    if (s.includes('insurance')) return 'Insurance'
    if (s.includes('selfie') || s.includes('photo')) return 'Photo'
    return 'DL'
  }

  for (const d of drivers) {
    if (d.documents && d.documents.length > 0) {
      for (const doc of d.documents) {
        const normType = normalizeType(doc.type)
        const statusMap: Record<string, import('../../data/documentsData').DocumentStatus> = {
          Verified: 'Approved',
          Approved: 'Approved',
          Rejected: 'Rejected',
          Resubmitted: 'Resubmitted',
        }
        const docStatus = statusMap[doc.status] || 'Pending'
        list.push({
          id: `DOC-${d.id}-${doc.type}`,
          driverId: d.displayId || d.id,
          driverName: d.name,
          type: normType,
          status: docStatus,
          city: d.city || 'Nashik',
          submitted: d.joined || '—',
          previewLabel: doc.url ? 'Preview available' : (doc.number !== '—' ? doc.number : 'Awaiting upload'),
          fileUrl: doc.url,
          fileType: (doc.url || '').toLowerCase().includes('.pdf') ? 'pdf' : 'image',
          audit: [
            {
              action: doc.url ? 'Cloudflare R2 synced' : 'Document registered',
              by: 'system',
              at: formatWhen(new Date().toISOString()),
            },
          ],
        })
      }
    }
  }

  if (list.length > 0) {
    return list
  }

  return drivers.slice(0, 20).map((d) => ({
    id: `DOC-${d.id}`,
    driverId: d.id,
    driverName: d.name,
    type: 'DL' as const,
    status: 'Pending' as const,
    city: d.city,
    submitted: d.joined,
    previewLabel: 'Awaiting upload',
    audit: [{ action: 'Listed from API', by: 'system', at: formatWhen(new Date().toISOString()) }],
  }))
}

export async function fetchAdminUsersAdmin(): Promise<import('../../data/adminUsersData').AdminUser[]> {
  return [
    {
      id: 'admin-live',
      name: 'Portal admin',
      email: '—',
      phone: '—',
      role: 'Super Admin' as const,
      status: 'Active' as const,
      lastLogin: formatWhen(new Date().toISOString()),
      createdAt: '—',
      permissions: ['dashboard.view', 'settings.edit', 'logs.view'],
      city: 'Nashik',
    },
  ]
}

export async function fetchNotificationsAdmin(): Promise<{
  templates: import('../../data/notificationsData').NotificationTemplate[]
  history: import('../../data/notificationsData').NotificationHistory[]
}> {
  const bookings = await loadBookings()
  const history = bookings.slice(0, 20).map((b) => ({
    id: `NTF-${b.id.slice(0, 8)}`,
    channel: 'Push' as const,
    audience: 'Customer' as const,
    audienceDetail: b.customer_phone ?? 'Customer',
    title: `Booking ${b.state.replace(/_/g, ' ')}`,
    message: `${b.pickup_address_text?.slice(0, 50)} → ${b.drop_address_text?.slice(0, 50)}`,
    sentAt: formatWhen(b.created_at),
    sentBy: 'System',
    recipients: 1,
    status: 'Sent' as const,
    openRate: '—',
  }))
  return { templates: [], history }
}

export async function fetchDashboardPortalStats() {
  return fetchPortalOverview()
}
