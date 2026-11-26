import { api, unwrapList } from '../client'
import { cachedQuery } from '../../lib/queryCache'
import type { Booking } from '../types'

function normalizeBooking(booking: Booking): Booking {
  const summary = booking.driver_summary
  if (!summary) return booking
  return {
    ...booking,
    driver: booking.driver || summary.driver_id || booking.driver,
    driver_summary: {
      ...summary,
      name: summary.name || summary.driver_name,
      phone: summary.phone || summary.driver_phone,
    },
  }
}

export async function listBookings(params?: Record<string, string | number>): Promise<Booking[]> {
  const key = `GET:/bookings:${JSON.stringify(params ?? {})}`
  return cachedQuery(key, async () => {
    const { data } = await api.get('/bookings/', { params })
    return unwrapList<Booking>(data).map(normalizeBooking)
  })
}

export async function listAllBookings(): Promise<Booking[]> {
  return cachedQuery('GET:/bookings:all-pages', async () => {
    const collected: Booking[] = []
    const seen = new Set<string>()
    const pageSize = 200
    for (let page = 1; page <= 50; page += 1) {
      const { data } = await api.get('/bookings/', { params: { page, page_size: pageSize } })
      const chunk = unwrapList<Booking>(data).map(normalizeBooking)
      for (const booking of chunk) {
        if (seen.has(booking.id)) continue
        seen.add(booking.id)
        collected.push(booking)
      }
      const next =
        data && typeof data === 'object' && !Array.isArray(data)
          ? (data as { next?: string | null }).next
          : null
      if (!next || chunk.length === 0) break
    }
    return collected
  })
}

export async function getBooking(id: string): Promise<Booking> {
  const { data } = await api.get<Booking>(`/bookings/${id}/`)
  return normalizeBooking(data)
}
