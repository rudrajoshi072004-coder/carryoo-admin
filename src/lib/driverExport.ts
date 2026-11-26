import { fetchDriverBookingsAdmin } from '../api/services/adminData'
import { listVehicleCategories } from '../api/services/vehicleCategories'
import type { Booking } from '../api/types'
import type { Driver, DriverTrip } from '../data/driversData'
import { customerVehicleLabel } from './customerVehicles'
import { excelText, exportCsv } from './utils'

function prettyState(state: string) {
  return state.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function prettyTripType(value?: string) {
  if (!value) return ''
  if (value === 'within_city') return 'Within city'
  if (value === 'outstation') return 'Outstation'
  return prettyState(value)
}

function formatWhen(iso?: string | null) {
  if (!iso) return ''
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function money(value?: string | number | null) {
  const n = Number.parseFloat(String(value ?? ''))
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

function breakdownText(booking: Booking) {
  const raw = booking.pricing_breakdown
  if (!raw || typeof raw !== 'object') return ''
  return Object.entries(raw)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}

function documentsText(driver: Driver) {
  return driver.documents
    .map((doc) => `${doc.type}: ${doc.number || '—'} (${doc.status}${doc.expiry && doc.expiry !== '—' ? `, expiry ${doc.expiry}` : ''})`)
    .join('; ')
}

function walletText(driver: Driver) {
  return driver.walletHistory
    .map((item) => `${item.time} ${item.label} ${item.amount}`)
    .join('; ')
}

export function bookingToDrawerTrip(booking: Booking): DriverTrip {
  const pickup = booking.pickup_address_text || 'Pickup'
  const drop = booking.drop_address_text || 'Drop'
  const fare = Number.parseFloat(String(booking.final_fare || booking.estimated_fare || '0'))
  const status: DriverTrip['status'] = booking.state === 'completed'
    ? 'Completed'
    : booking.state.includes('cancel')
      ? 'Cancelled'
      : 'In Progress'
  return {
    id: `TRP-${booking.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
    route: `${pickup} → ${drop}`,
    fare: Number.isFinite(fare) ? `₹${Math.round(fare).toLocaleString('en-IN')}` : '₹0',
    distance: booking.estimated_distance_km ? `${booking.estimated_distance_km} km` : '—',
    status,
    date: formatWhen(booking.created_at) || '—',
  }
}

export async function downloadDriverDetailCsv(driver: Driver): Promise<{ trips: number }> {
  const [bookings, categories] = await Promise.all([
    fetchDriverBookingsAdmin(driver),
    listVehicleCategories().catch(() => []),
  ])
  const categoryNames = new Map(categories.map((category) => [category.id, customerVehicleLabel(category.name)]))
  const displayId = driver.displayId ?? `DRV-${driver.id.replace(/-/g, '').slice(-6).toUpperCase()}`
  const profile = [
    excelText(displayId),
    excelText(driver.id),
    driver.name,
    excelText(driver.driverPhone || driver.phone),
    excelText(driver.accountPhone && driver.accountPhone !== (driver.driverPhone || driver.phone) ? driver.accountPhone : ''),
    driver.email,
    driver.gender,
    driver.city,
    excelText(driver.joined),
    driver.status,
    driver.experience,
    driver.rating,
    driver.wallet,
    driver.todayEarnings,
    driver.totalEarnings,
    driver.trips,
    bookings.length,
    driver.completionRate,
    driver.acceptanceRate,
    driver.cancellationRate,
    driver.avgTripValue,
    driver.vehicleType,
    driver.vehicleDetails.make,
    driver.vehicleDetails.model,
    driver.vehicleDetails.year,
    driver.vehicleDetails.color,
    excelText(driver.vehicleDetails.plate),
    driver.vehicleDetails.fuelType ?? '',
    driver.vehicleDetails.insurance,
    driver.vehicleDetails.fitness,
    driver.emergencyContact.name,
    driver.emergencyContact.relation,
    excelText(driver.emergencyContact.phone),
    driver.bankDetails.accountName,
    driver.bankDetails.bank,
    excelText(driver.bankDetails.accountNumber),
    excelText(driver.bankDetails.ifsc),
    excelText(driver.bankDetails.upi),
    documentsText(driver),
    walletText(driver),
  ]

  const emptyTrip = Array.from({ length: 22 }, () => '')
  const tripRows = (bookings.length > 0 ? bookings : [null]).map((booking, index) => {
    if (!booking) {
      return [...profile, ...emptyTrip]
    }
    const vehicleName =
      booking.driver_summary?.vehicle_type ||
      categoryNames.get(booking.vehicle_category ?? '') ||
      driver.vehicleType
    const fare = money(booking.final_fare || booking.estimated_fare)
    return [
      ...profile,
      index + 1,
      excelText(`TRP-${booking.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`),
      excelText(booking.id),
      excelText(formatWhen(booking.created_at)),
      excelText(formatWhen(booking.scheduled_at)),
      booking.pickup_address_text || '',
      booking.drop_address_text || '',
      booking.estimated_distance_km ?? '',
      booking.estimated_duration_min ?? '',
      prettyTripType(booking.trip_type),
      prettyState(booking.booking_type),
      money(booking.estimated_fare),
      money(booking.final_fare),
      fare,
      prettyState(booking.state),
      excelText(booking.customer_phone),
      vehicleName,
      excelText(booking.driver_summary?.vehicle_number || driver.vehicleDetails.plate),
      booking.requires_helper ? 'Yes' : 'No',
      booking.notes ?? '',
      booking.cancellation_reason ?? '',
      breakdownText(booking),
    ]
  })

  exportCsv(
    `carryoo-driver-${displayId}.csv`,
    [
      'Driver ID',
      'Driver UUID',
      'Name',
      'Phone',
      'Login phone',
      'Email',
      'Gender',
      'City',
      'Joined',
      'Status',
      'Experience',
      'Rating',
      'Wallet balance',
      "Today's earnings",
      'Total earnings',
      'Lifetime trips (profile)',
      'Trips in this file',
      'Completion %',
      'Acceptance %',
      'Cancellation %',
      'Avg trip value',
      'Vehicle type',
      'Vehicle make',
      'Vehicle model',
      'Year',
      'Color',
      'Plate',
      'Fuel',
      'Insurance',
      'Fitness',
      'Emergency name',
      'Emergency relation',
      'Emergency phone',
      'Bank account name',
      'Bank',
      'Account number',
      'IFSC',
      'UPI',
      'Documents',
      'Wallet history',
      'Trip #',
      'Trip ID',
      'Booking ID',
      'Trip date',
      'Scheduled at',
      'Pickup',
      'Drop',
      'Distance (km)',
      'Duration (min)',
      'Trip type',
      'Booking type',
      'Estimated fare',
      'Final fare',
      'Fare',
      'Trip status',
      'Customer phone',
      'Trip vehicle',
      'Trip vehicle number',
      'Helper',
      'Notes',
      'Cancellation reason',
      'Pricing breakdown',
    ],
    tripRows,
  )

  return { trips: bookings.length }
}
